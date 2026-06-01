import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { Button, Chip, Snackbar, TextInput } from "react-native-paper";

import { TransactionRow } from "@/components/transaction-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { AppTheme, Layout } from "@/constants/theme";
import type { ExpenseView } from "@/db/types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBudgetStore } from "@/store/useBudgetStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function matchesSearch(expense: ExpenseView, query: string) {
  if (!query.trim()) {
    return true;
  }

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

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const expenses = useBudgetStore((state) => state.expenses);
  const categories = useBudgetStore((state) => state.categories);
  const activeBudgetPeriod = useBudgetStore(
    (state) => state.activeBudgetPeriod,
  );
  const settings = useBudgetStore((state) => state.settings);
  const removeExpense = useBudgetStore((state) => state.removeExpense);
  const removeManyExpenses = useBudgetStore(
    (state) => state.removeManyExpenses,
  );
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    "all",
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | "all"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastDeleted, setLastDeleted] = useState<ExpenseView | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);

  const currency = activeBudgetPeriod?.currency ?? settings.currency ?? "USD";

  const filteredExpenses = useMemo(() => {
    const base = expenses.filter((expense) => !expense.is_recurring);
    return base
      .filter((expense) =>
        selectedCategoryId === "all"
          ? true
          : expense.category_id === selectedCategoryId ||
            expense.subcategory_id === selectedCategoryId,
      )
      .filter((expense) =>
        selectedPaymentMethod === "all"
          ? true
          : expense.payment_method === selectedPaymentMethod,
      )
      .filter((expense) => matchesSearch(expense, search))
      .sort((left, right) => {
        if (sortBy === "amount") {
          return right.amount - left.amount;
        }

        if (sortBy === "category") {
          return (left.category_name ?? "").localeCompare(
            right.category_name ?? "",
          );
        }

        return `${right.date}T${right.time}`.localeCompare(
          `${left.date}T${left.time}`,
        );
      });
  }, [expenses, search, selectedCategoryId, selectedPaymentMethod, sortBy]);

  async function performDelete(expense: ExpenseView) {
    setLastDeleted(expense);
    setUndoVisible(true);
    await removeExpense({} as never, expense.id);
  }

  function toggleSelection(expenseId: string) {
    setSelectedIds((current) =>
      current.includes(expenseId)
        ? current.filter((id) => id !== expenseId)
        : [...current, expenseId],
    );
  }

  async function handleUndo() {
    if (!lastDeleted || !activeBudgetPeriod) {
      return;
    }

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
      .filter((category) => !category.parent_id)
      .map((category) => ({ id: category.id, name: category.name })),
  ];
  const paymentOptions = [
    "all",
    ...new Set(expenses.map((expense) => expense.payment_method)),
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Transaction history
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {filteredExpenses.length} transactions matching your filters
        </Text>
      </View>

      <TextInput
        label="Search note or category"
        value={search}
        onChangeText={setSearch}
        mode="outlined"
        left={<TextInput.Icon icon="magnify" />}
        dense
      />

      <View style={styles.filterBlock}>
        <Text style={[styles.filterLabel, { color: theme.textMuted }]}>
          Categories
        </Text>
        <View style={styles.chipsRow}>
          {categoryOptions.map((option) => (
            <Chip
              key={option.id}
              selected={selectedCategoryId === option.id}
              onPress={() => setSelectedCategoryId(option.id)}
            >
              {option.name}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.filterBlock}>
        <Text style={[styles.filterLabel, { color: theme.textMuted }]}>
          Payment method
        </Text>
        <View style={styles.chipsRow}>
          {paymentOptions.map((option) => (
            <Chip
              key={option}
              selected={selectedPaymentMethod === option}
              onPress={() => setSelectedPaymentMethod(option)}
            >
              {option === "all" ? "All" : option}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.sortRow}>
        {(["date", "amount", "category"] as const).map((item) => (
          <Button
            key={item}
            mode={sortBy === item ? "contained" : "outlined"}
            onPress={() => setSortBy(item)}
          >
            Sort by {item}
          </Button>
        ))}
      </View>

      {selectedIds.length > 0 ? (
        <View style={styles.bulkBar}>
          <Text style={{ color: theme.text }}>
            {selectedIds.length} selected
          </Text>
          <Button
            mode="contained"
            buttonColor={theme.danger}
            onPress={() => removeManyExpenses({} as never, selectedIds)}
          >
            Delete selected
          </Button>
        </View>
      ) : null}

      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon="history"
          title="No transactions found"
          description="Try a different filter, or add a new expense from the quick add tab."
          actionLabel="Add expense"
          onActionPress={() => router.push("/modals/add-expense")}
        />
      ) : (
        <View style={styles.list}>
          {filteredExpenses.map((expense) => (
            <Swipeable
              key={expense.id}
              renderRightActions={() => (
                <RectButton
                  style={[
                    styles.deleteAction,
                    { backgroundColor: theme.danger },
                  ]}
                  onPress={() => performDelete(expense)}
                >
                  <MaterialCommunityIcons
                    name="trash-can"
                    size={24}
                    color="#fff"
                  />
                </RectButton>
              )}
            >
              <TransactionRow
                expense={expense}
                currency={currency}
                selected={selectedIds.includes(expense.id)}
                onPress={() =>
                  selectedIds.length > 0
                    ? toggleSelection(expense.id)
                    : router.push(`/modals/add-expense?expenseId=${expense.id}`)
                }
                onLongPress={() => toggleSelection(expense.id)}
              />
            </Swipeable>
          ))}
        </View>
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
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  filterBlock: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  list: {
    gap: 10,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    borderRadius: Layout.radiusSmall,
    marginVertical: 4,
  },
});
