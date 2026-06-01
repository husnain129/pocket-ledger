import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FAB, ProgressBar } from "react-native-paper";

import { TransactionRow } from "@/components/transaction-row";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Screen } from "@/components/ui/screen";
import { SkeletonStack } from "@/components/ui/skeleton";
import { AppTheme, Layout } from "@/constants/theme";
import { formatBalanceLabel } from "@/store/useBudgetStore";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBudgetStore } from "@/store/useBudgetStore";
import {
  getBudgetUsedPercent,
  getSpendWarningLevel,
  getThisWeekSpend,
  getTodaySpend,
} from "@/utils/analytics";

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const activeBudgetPeriod = useBudgetStore(
    (state) => state.activeBudgetPeriod,
  );
  const recentExpenses = useBudgetStore((state) => state.recentExpenses);
  const expenses = useBudgetStore((state) => state.expenses);
  const budgetPeriods = useBudgetStore((state) => state.budgetPeriods);
  const isHydrating = useBudgetStore((state) => state.isHydrating);
  const isReady = useBudgetStore((state) => state.isReady);

  const currency = "PKR";
  const totalBudget = activeBudgetPeriod
    ? activeBudgetPeriod.total_amount + activeBudgetPeriod.additional_income
    : 0;
  const spent = activeBudgetPeriod?.total_expenses ?? 0;
  const balance = activeBudgetPeriod?.current_balance ?? 0;
  const usedPercent = getBudgetUsedPercent(totalBudget, spent);
  const warningLevel = getSpendWarningLevel(usedPercent);
  const todaySpend = getTodaySpend(expenses);
  const weekSpend = getThisWeekSpend(expenses);

  const quickStats = useMemo(
    () => [
      {
        label: "Today",
        value: formatBalanceLabel(todaySpend, currency),
        icon: "calendar-today" as const,
      },
      {
        label: "This week",
        value: formatBalanceLabel(weekSpend, currency),
        icon: "chart-bar" as const,
      },
    ],
    [currency, todaySpend, weekSpend],
  );

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
        <View style={styles.hero}>
          <Text style={[styles.kicker, { color: theme.secondary }]}>
            PocketLedger
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Start with a budget period
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Create your first budget period to start tracking expenses and
            watching your balance update in real time.
          </Text>
        </View>

        <EmptyState
          icon="wallet-plus"
          title="No budget period yet"
          description="Set your first budget and starting date to unlock the dashboard, history, and analytics views."
          actionLabel="Create budget"
          onActionPress={() => router.push("/modals/add-income?mode=budget")}
        />

        <View style={styles.periodList}>
          {budgetPeriods.map((period) => (
            <Pressable
              key={period.id}
              style={[
                styles.periodCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => router.push("/modals/add-income?mode=budget")}
            >
              <Text style={[styles.periodTitle, { color: theme.text }]}>
                {period.label}
              </Text>
              <Text style={[styles.periodMeta, { color: theme.textMuted }]}>
                {period.start_date} to {period.end_date ?? "open"}
              </Text>
            </Pressable>
          ))}
        </View>

        <FAB
          style={styles.fab}
          icon="plus"
          label="Create budget"
          onPress={() => router.push("/modals/add-income?mode=budget")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.kicker, { color: theme.secondary }]}>
          {activeBudgetPeriod.label}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          Remaining balance
        </Text>
        <Text style={[styles.balance, { color: theme.text }]}>
          {formatBalanceLabel(balance, currency)}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Started {activeBudgetPeriod.start_date} •{" "}
          {formatBalanceLabel(totalBudget, currency)} total budget
        </Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
            Budget used
          </Text>
          <Text
            style={[
              styles.progressLabel,
              {
                color:
                  warningLevel === "danger"
                    ? theme.danger
                    : warningLevel === "warning"
                      ? theme.warning
                      : theme.primary,
              },
            ]}
          >
            {usedPercent.toFixed(0)}%
          </Text>
        </View>
        <ProgressBar
          progress={Math.min(1, usedPercent / 100)}
          color={
            warningLevel === "danger"
              ? theme.danger
              : warningLevel === "warning"
                ? theme.warning
                : theme.primary
          }
          style={styles.progressBar}
        />
      </View>

      <View style={styles.metricsRow}>
        {quickStats.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </View>

      <View
        style={[
          styles.warningCard,
          {
            backgroundColor:
              warningLevel === "danger"
                ? `${theme.danger}15`
                : warningLevel === "warning"
                  ? `${theme.warning}18`
                  : theme.primarySoft,
            borderColor:
              warningLevel === "danger"
                ? theme.danger
                : warningLevel === "warning"
                  ? theme.warning
                  : theme.border,
          },
        ]}
      >
        <Text style={[styles.warningTitle, { color: theme.text }]}>
          {warningLevel === "danger"
            ? "Spending is above 90% of your budget."
            : warningLevel === "warning"
              ? "Spending is above 75% of your budget."
              : "Spending is in a healthy range."}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Recent transactions
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/history")}>
          <Text style={[styles.sectionAction, { color: theme.primary }]}>
            View all
          </Text>
        </Pressable>
      </View>

      {latestExpenses.length === 0 ? (
        <EmptyState
          icon="cash-remove"
          title="No expenses yet"
          description="Tap Add Expense to log your first transaction and start tracking your balance."
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

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Budget history
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodList}
      >
        {budgetPeriods.map((period) => (
          <Pressable
            key={period.id}
            style={[
              styles.periodCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => router.push("/(tabs)/history")}
          >
            <Text style={[styles.periodTitle, { color: theme.text }]}>
              {period.label}
            </Text>
            <Text style={[styles.periodMeta, { color: theme.textMuted }]}>
              {formatBalanceLabel(period.current_balance, period.currency)}{" "}
              remaining
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push("/modals/add-expense")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  balance: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressWrap: {
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressBar: {
    borderRadius: 999,
    height: 10,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  warningCard: {
    borderRadius: Layout.radius,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "800",
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
    fontWeight: "800",
  },
  list: {
    gap: 10,
  },
  periodList: {
    gap: 10,
    paddingVertical: 4,
  },
  periodCard: {
    minWidth: 160,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  periodTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  periodMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 20,
  },
});
