import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { Snackbar } from "react-native-paper";

import { TransactionRow } from "@/components/transaction-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { AppTheme, Layout } from "@/constants/theme";
import { formatMoney } from "@/db/queries";
import type { ExpenseView, IncomeEntryRow } from "@/db/types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBudgetStore } from "@/store/useBudgetStore";

type Tab = "expenses" | "income";

function matchesSearch(expense: ExpenseView, query: string) {
  if (!query.trim()) return true;
  const haystack = [
    expense.note,
    expense.category_name,
    expense.subcategory_name,
    expense.payment_method,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function formatDateHeader(dateStr: string): string {
  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return dayjs(dateStr).format("ddd, D MMM");
}

type IncomeRowProps = {
  entry: IncomeEntryRow;
  currency: string;
  onDelete: () => void;
};

function IncomeRow({ entry, currency, onDelete }: IncomeRowProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  return (
    <Swipeable
      renderRightActions={() => (
        <RectButton
          style={[styles.deleteAction, { backgroundColor: theme.danger }]}
          onPress={onDelete}
        >
          <MaterialCommunityIcons name="trash-can" size={24} color="#fff" />
        </RectButton>
      )}
    >
      <View style={[styles.incomeRow, { backgroundColor: theme.surface }]}>
        <View style={[styles.incomeIconWrap, { backgroundColor: "#34c75922" }]}>
          <MaterialCommunityIcons
            name="arrow-down-circle-outline"
            size={22}
            color="#34c759"
          />
        </View>
        <View style={styles.incomeText}>
          <Text style={[styles.incomeTitle, { color: theme.text }]}>
            {entry.note || "Funds added"}
          </Text>
          <Text style={[styles.incomeSub, { color: theme.textMuted }]}>
            {dayjs(entry.date).format("D MMM YYYY")}
          </Text>
        </View>
        <Text style={styles.incomeAmount}>
          +{formatMoney(entry.amount, currency)}
        </Text>
      </View>
    </Swipeable>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const db = useSQLiteContext();

  const expenses = useBudgetStore((state) => state.expenses);
  const incomeEntries = useBudgetStore((state) => state.incomeEntries);
  const categories = useBudgetStore((state) => state.categories);
  const activeBudgetPeriod = useBudgetStore((state) => state.activeBudgetPeriod);
  const removeExpense = useBudgetStore((state) => state.removeExpense);
  const removeIncomeEntry = useBudgetStore((state) => state.removeIncomeEntry);

  const [activeTab, setActiveTab] = useState<Tab>("expenses");
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">("all");
  const [lastDeleted, setLastDeleted] = useState<ExpenseView | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);

  const currency = useBudgetStore((state) => state.currencyLabel());

  const filteredExpenses = useMemo(() => {
    const base = expenses.filter((e) => !e.is_recurring);
    return base
      .filter((e) =>
        selectedCategoryId === "all"
          ? true
          : e.category_id === selectedCategoryId ||
            e.subcategory_id === selectedCategoryId,
      )
      .filter((e) => matchesSearch(e, search))
      .sort((a, b) =>
        `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`),
      );
  }, [expenses, search, selectedCategoryId]);

  const groupedExpenses = useMemo(() => {
    const map = new Map<string, ExpenseView[]>();
    for (const e of filteredExpenses) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [filteredExpenses]);

  const sortedIncome = useMemo(
    () => [...incomeEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [incomeEntries],
  );

  const groupedIncome = useMemo(() => {
    const map = new Map<string, IncomeEntryRow[]>();
    for (const e of sortedIncome) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [sortedIncome]);

  const totalIncome = useMemo(
    () => incomeEntries.reduce((sum, e) => sum + e.amount, 0),
    [incomeEntries],
  );

  async function performDelete(expense: ExpenseView) {
    setLastDeleted(expense);
    setUndoVisible(true);
    await removeExpense({} as never, expense.id);
  }

  async function handleUndo() {
    if (!lastDeleted || !activeBudgetPeriod) return;
    await useBudgetStore.getState().addExpense({
      budgetPeriodId: lastDeleted.budget_period_id,
      amount: lastDeleted.amount,
      categoryId: lastDeleted.category_id,
      subcategoryId: lastDeleted.subcategory_id,
      note: lastDeleted.note ?? undefined,
      date: lastDeleted.date,
      time: lastDeleted.time,
      paymentMethod: lastDeleted.payment_method,
      receiptUri: lastDeleted.receipt_uri,
      isRecurring: Boolean(lastDeleted.is_recurring),
      recurrenceRule: lastDeleted.recurrence_rule,
    });
    setUndoVisible(false);
    setLastDeleted(null);
  }

  const categoryOptions = [
    { id: "all", name: "All" },
    ...categories
      .filter((c) => !c.parent_id)
      .map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Wallet</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {activeTab === "expenses"
            ? `${filteredExpenses.length} transactions`
            : `${incomeEntries.length} fund additions · ${formatMoney(totalIncome, currency)} total`}
        </Text>
      </View>

      {/* Expenses / Income toggle */}
      <View style={[styles.tabToggle, { backgroundColor: theme.background }]}>
        {(["expenses", "income"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabToggleBtn,
              activeTab === tab && { backgroundColor: theme.text },
            ]}
          >
            <MaterialCommunityIcons
              name={tab === "expenses" ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
              size={16}
              color={activeTab === tab ? theme.background : theme.textMuted}
            />
            <Text
              style={[
                styles.tabToggleLabel,
                { color: activeTab === tab ? theme.background : theme.textMuted },
              ]}
            >
              {tab === "expenses" ? "Expenses" : "Income"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search — expenses only */}
      {activeTab === "expenses" && (
        <>
          <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search transactions..."
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={theme.textMuted}
                />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {categoryOptions.map((option) => {
              const isSelected = selectedCategoryId === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedCategoryId(option.id)}
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: theme.text }
                      : {
                          backgroundColor: theme.surface,
                          shadowColor: "rgba(0,0,0,0.08)",
                          shadowOffset: { width: 0, height: 1 },
                          shadowRadius: 4,
                          shadowOpacity: 1,
                          elevation: 2,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? theme.background : theme.textMuted },
                    ]}
                  >
                    {option.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Expense list */}
      {activeTab === "expenses" && (
        filteredExpenses.length === 0 ? (
          <EmptyState
            icon="history"
            title="No transactions found"
            description="Try a different filter, or add a new expense from the + button."
            actionLabel="Add expense"
            onActionPress={() => router.push("/modals/add-expense")}
          />
        ) : (
          <View style={styles.list}>
            {groupedExpenses.map(([date, items]) => (
              <View key={date}>
                <Text style={[styles.dateHeader, { color: theme.textMuted }]}>
                  {formatDateHeader(date)}
                </Text>
                <View style={styles.dateGroup}>
                  {items.map((expense) => (
                    <Swipeable
                      key={expense.id}
                      renderRightActions={() => (
                        <RectButton
                          style={[styles.deleteAction, { backgroundColor: theme.danger }]}
                          onPress={() => performDelete(expense)}
                        >
                          <MaterialCommunityIcons name="trash-can" size={24} color="#fff" />
                        </RectButton>
                      )}
                    >
                      <TransactionRow
                        expense={expense}
                        currency={currency}
                        onPress={() =>
                          router.push(`/modals/add-expense?expenseId=${expense.id}`)
                        }
                      />
                    </Swipeable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )
      )}

      {/* Income list */}
      {activeTab === "income" && (
        incomeEntries.length === 0 ? (
          <EmptyState
            icon="cash-plus"
            title="No funds added yet"
            description="Tap 'Add Funds' on the home screen to record extra income."
            actionLabel="Add funds"
            onActionPress={() => router.push("/modals/add-income")}
          />
        ) : (
          <View style={styles.list}>
            {groupedIncome.map(([date, items]) => (
              <View key={date}>
                <Text style={[styles.dateHeader, { color: theme.textMuted }]}>
                  {formatDateHeader(date)}
                </Text>
                <View style={styles.dateGroup}>
                  {items.map((entry) => (
                    <IncomeRow
                      key={entry.id}
                      entry={entry}
                      currency={currency}
                      onDelete={() => removeIncomeEntry(db, entry.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )
      )}

      <Snackbar
        visible={undoVisible}
        onDismiss={() => setUndoVisible(false)}
        action={{ label: "Undo", onPress: handleUndo }}
      >
        Expense deleted.
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
  },
  tabToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabToggleLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    gap: 16,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  dateGroup: {
    gap: 10,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    borderRadius: 16,
    marginVertical: 4,
  },
  incomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 1,
    elevation: 3,
  },
  incomeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  incomeText: {
    flex: 1,
    gap: 4,
  },
  incomeTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  incomeSub: {
    fontSize: 12,
  },
  incomeAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#34c759",
  },
});
