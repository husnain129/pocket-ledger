import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FAB } from "react-native-paper";

import { TransactionRow } from "@/components/transaction-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { SkeletonStack } from "@/components/ui/skeleton";
import { AppTheme, Layout } from "@/constants/theme";
import { formatBalanceLabel } from "@/store/useBudgetStore";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBudgetStore } from "@/store/useBudgetStore";

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const activeBudgetPeriod = useBudgetStore(
    (state) => state.activeBudgetPeriod,
  );
  const recentExpenses = useBudgetStore((state) => state.recentExpenses);
  const budgetPeriods = useBudgetStore((state) => state.budgetPeriods);
  const isHydrating = useBudgetStore((state) => state.isHydrating);
  const isReady = useBudgetStore((state) => state.isReady);

  const currency = useBudgetStore((state) => state.currencyLabel());
  const balance = activeBudgetPeriod?.current_balance ?? 0;

  const today = dayjs();
  const dayLabel = today.format("dddd");
  const dateLabel = today.format("D MMMM YYYY");

  const latestExpenses = recentExpenses.slice(0, 10);

  if (isHydrating || !isReady) {
    return (
      <Screen>
        <SkeletonStack />
      </Screen>
    );
  }

  if (!activeBudgetPeriod) {
    return (
      <Screen>
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.dayText, { color: theme.textMuted }]}>
              {dayLabel}
            </Text>
            <Text style={[styles.dateText, { color: theme.text }]}>
              {dateLabel}
            </Text>
          </View>
          <Pressable
            style={[styles.bellButton, { backgroundColor: theme.surface }]}
            onPress={() => router.push("/(tabs)/loans")}
          >
            <MaterialCommunityIcons name="handshake" size={20} color={theme.text} />
          </Pressable>
        </View>

        <EmptyState
          icon="wallet-plus"
          title="No budget period yet"
          description="Set your first budget and starting date to unlock the dashboard, history, and analytics views."
          actionLabel="Create budget"
          onActionPress={() => router.push("/modals/add-income?mode=budget")}
        />

        <FAB
          style={[styles.fab, { backgroundColor: theme.primary }]}
          icon="plus"
          color="#ffffff"
          label="Create budget"
          onPress={() => router.push("/modals/add-income?mode=budget")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.dayText, { color: theme.textMuted }]}>
            {dayLabel}
          </Text>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {dateLabel}
          </Text>
        </View>
        <Pressable
          style={[styles.bellButton, { backgroundColor: theme.surface }]}
          onPress={() => router.push("/(tabs)/loans")}
        >
          <MaterialCommunityIcons name="handshake" size={20} color={theme.text} />
        </Pressable>
      </View>

      {/* Dark balance card */}
      <View style={[styles.balanceCard, { backgroundColor: colorScheme === "dark" ? "#252540" : "#1c1c2e" }]}>
        <View style={styles.balanceCardTop}>
          <Text style={styles.balanceLabelText}>Total Balance</Text>
          <Pressable
            style={styles.addFundsBtn}
            onPress={() => router.push("/modals/add-income")}
          >
            <MaterialCommunityIcons name="plus" size={14} color="#1c1c2e" />
            <Text style={styles.addFundsBtnText}>Add Funds</Text>
          </Pressable>
        </View>
        <Text style={styles.balanceAmount}>
          {formatBalanceLabel(balance, currency)}
        </Text>
        <View style={styles.balanceCardBottom}>
          <Text style={styles.balanceCardInfo}>
            {activeBudgetPeriod.label}
          </Text>
          <MaterialCommunityIcons
            name="credit-card-outline"
            size={20}
            color="#e53935"
          />
        </View>
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Recent Transactions
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/history")}>
          <Text style={[styles.sectionAction, { color: theme.secondary }]}>
            View all
          </Text>
        </Pressable>
      </View>

      {/* Transaction list */}
      {latestExpenses.length === 0 ? (
        <EmptyState
          icon="cash-remove"
          title="No expenses yet"
          description="Tap the + button to log your first transaction."
          actionLabel="Add expense"
          onActionPress={() => router.push("/modals/add-expense")}
        />
      ) : (
        <View style={styles.list}>
          {latestExpenses.map((expense) => (
            <TransactionRow
              key={expense.id}
              expense={expense}
              currency={currency}
              onPress={() =>
                router.push(`/modals/add-expense?expenseId=${expense.id}`)
              }
            />
          ))}
        </View>
      )}

    </Screen>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 1,
    elevation: 2,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  balanceCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabelText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
  },
  addFundsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  addFundsBtnText: {
    color: "#1c1c2e",
    fontSize: 12,
    fontWeight: "700",
  },
  balanceDotsText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 18,
    letterSpacing: 2,
  },
  balanceAmount: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    marginVertical: 4,
  },
  balanceCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceCardInfo: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "700",
  },
  list: {
    gap: 10,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 20,
  },
});
