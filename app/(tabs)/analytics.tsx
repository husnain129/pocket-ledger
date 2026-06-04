import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import { router } from "expo-router";
import { shareAsync } from "expo-sharing";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, SegmentedButtons, TextInput } from "react-native-paper";

import {
  SpendingBarChart,
  SpendingDonutChart,
  SpendingLineChart,
} from "@/components/charts/spending-charts";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Screen } from "@/components/ui/screen";
import { Tag } from "@/components/ui/tag";
import { AppTheme, Layout } from "@/constants/theme";
import { formatMoney } from "@/db/queries";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBudgetStore } from "@/store/useBudgetStore";
import {
  getBudgetUsedPercent,
  getCategorySeries,
  getDailySeries,
  getSpendWarningLevel,
  getWeeklyComparison,
  sumExpenses,
} from "@/utils/analytics";

type RangePreset = "week" | "month" | "custom";

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const expenses = useBudgetStore((state) => state.expenses).filter(
    (expense) => !expense.is_recurring,
  );
  const categories = useBudgetStore((state) => state.categories);
  const activeBudgetPeriod = useBudgetStore(
    (state) => state.activeBudgetPeriod,
  );
  const [rangePreset, setRangePreset] = useState<RangePreset>("month");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    "all",
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const currency = useBudgetStore((state) => state.currencyLabel());

  const filteredExpenses = useMemo(() => {
    const periodFiltered = expenses.filter((expense) => {
      if (rangePreset === "week") {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        return expense.date >= weekStart.toISOString().slice(0, 10);
      }

      if (rangePreset === "month") {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - 1);
        return expense.date >= monthStart.toISOString().slice(0, 10);
      }

      return expense.date >= startDate && expense.date <= endDate;
    });

    return periodFiltered.filter((expense) =>
      selectedCategoryId === "all"
        ? true
        : expense.category_id === selectedCategoryId ||
          expense.subcategory_id === selectedCategoryId,
    );
  }, [endDate, expenses, rangePreset, selectedCategoryId, startDate]);

  const totalSpent = sumExpenses(filteredExpenses);
  const totalBudget = activeBudgetPeriod
    ? activeBudgetPeriod.total_amount + activeBudgetPeriod.additional_income
    : 0;
  const usedPercent = getBudgetUsedPercent(totalBudget, totalSpent);
  const warningLevel = getSpendWarningLevel(usedPercent);

  const lineSeries = useMemo(() => {
    if (rangePreset === "custom") {
      return getDailySeries(filteredExpenses, startDate, endDate);
    }

    const end = new Date().toISOString().slice(0, 10);
    const start = new Date();
    start.setDate(start.getDate() - (rangePreset === "week" ? 7 : 30));
    return getDailySeries(
      filteredExpenses,
      start.toISOString().slice(0, 10),
      end,
    );
  }, [endDate, filteredExpenses, rangePreset, startDate]);

  const categorySeries = useMemo(
    () => getCategorySeries(filteredExpenses, categories),
    [categories, filteredExpenses],
  );
  const weeklySeries = useMemo(
    () => getWeeklyComparison(filteredExpenses),
    [filteredExpenses],
  );

  async function exportCsv() {
    const header =
      "date,time,category,subcategory,amount,payment_method,note\n";
    const rows = filteredExpenses
      .map(
        (expense) =>
          `${expense.date},${expense.time},${expense.category_name ?? ""},${expense.subcategory_name ?? ""},${expense.amount},${expense.payment_method},${(expense.note ?? "").replaceAll(",", " ")}`,
      )
      .join("\n");

    const file = new File(Paths.cache, `pocketledger-report-${Date.now()}.csv`);
    file.write(header + rows);

    const canShare = await shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Share Expense Manager CSV report",
    }).catch(() => null);
    if (canShare === undefined) {
      return;
    }
  }

  async function exportPdf() {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 28px; color: #0f172a; }
            h1 { margin-bottom: 0; }
            .muted { color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; border-bottom: 1px solid #e2e8f0; padding: 10px 6px; font-size: 12px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Expense Manager report</h1>
          <p class="muted">Total spent: ${formatMoney(totalSpent, currency)} • Used ${usedPercent.toFixed(0)}%</p>
          <table>
            <thead>
              <tr><th>Date</th><th>Category</th><th>Payment</th><th>Amount</th><th>Note</th></tr>
            </thead>
            <tbody>
              ${filteredExpenses
                .map(
                  (expense) => `
                    <tr>
                      <td>${expense.date}</td>
                      <td>${expense.subcategory_name ?? expense.category_name ?? "Uncategorized"}</td>
                      <td>${expense.payment_method}</td>
                      <td>${formatMoney(expense.amount, currency)}</td>
                      <td>${expense.note ?? ""}</td>
                    </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, {
      UTI: ".pdf",
      mimeType: "application/pdf",
      dialogTitle: "Share Expense Manager PDF report",
    });
  }

  if (filteredExpenses.length === 0) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Turn transaction history into trends and exports.
          </Text>
        </View>
        <EmptyState
          icon="chart-line"
          title="Nothing to chart yet"
          description="Add a few expenses first, then return here to see trends, category mix, and weekly comparisons."
          actionLabel="Add expense"
          onActionPress={() => router.push("/modals/add-expense")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Spending by time, category, and week. All calculations are local.
        </Text>
      </View>

      <SegmentedButtons
        value={rangePreset}
        onValueChange={(value) => setRangePreset(value as RangePreset)}
        buttons={[
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "custom", label: "Custom" },
        ]}
      />

      {rangePreset === "custom" ? (
        <View style={styles.customRange}>
          <TextInput
            label="Start date"
            value={startDate}
            onChangeText={setStartDate}
            mode="outlined"
            dense
          />
          <TextInput
            label="End date"
            value={endDate}
            onChangeText={setEndDate}
            mode="outlined"
            dense
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          Category filter
        </Text>
        <View style={styles.tagRow}>
          <Tag
            label="All"
            selected={selectedCategoryId === "all"}
            onPress={() => setSelectedCategoryId("all")}
          />
          {categories
            .filter((category) => !category.parent_id)
            .map((category) => (
              <Tag
                key={category.id}
                label={category.name}
                selected={selectedCategoryId === category.id}
                onPress={() => setSelectedCategoryId(category.id)}
              />
            ))}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          label="Total spent"
          value={formatMoney(totalSpent, currency)}
          icon="cash"
          tone={
            warningLevel === "danger"
              ? "danger"
              : warningLevel === "warning"
                ? "warning"
                : "primary"
          }
        />
        <MetricCard
          label="Budget used"
          value={`${usedPercent.toFixed(0)}%`}
          icon="chart-line"
          tone={
            warningLevel === "danger"
              ? "danger"
              : warningLevel === "warning"
                ? "warning"
                : "success"
          }
        />
      </View>

      <SpendingLineChart
        data={lineSeries.map((point) => ({
          label: point.label,
          value: point.value,
        }))}
      />
      <SpendingDonutChart data={categorySeries} />
      <SpendingBarChart data={weeklySeries} />

      <View style={styles.exportRow}>
        <Button
          mode="outlined"
          onPress={exportCsv}
          icon="file-delimited-outline"
        >
          CSV
        </Button>
        <Button mode="contained" onPress={exportPdf} icon="file-pdf-box">
          PDF
        </Button>
      </View>

      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.summaryTitle, { color: theme.text }]}>
          Range summary
        </Text>
        <Text style={[styles.summaryBody, { color: theme.textMuted }]}>
          Showing {filteredExpenses.length} expenses. The current mix is
          centered on {categorySeries[0]?.label ?? "uncategorized"}.
        </Text>
      </View>
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
  customRange: {
    gap: 10,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  exportRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: Layout.radius,
    padding: 16,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  summaryBody: {
    fontSize: 13,
    lineHeight: 19,
  },
});
