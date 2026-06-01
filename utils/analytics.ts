import dayjs from "dayjs";

import type { CategoryRow, ExpenseView } from "@/db/types";

export function sumExpenses(expenses: ExpenseView[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function sumExpensesForDate(expenses: ExpenseView[], date: string) {
  return sumExpenses(expenses.filter((expense) => expense.date === date));
}

export function sumExpensesForRange(
  expenses: ExpenseView[],
  startDate: string,
  endDate: string,
) {
  return sumExpenses(
    expenses.filter(
      (expense) => expense.date >= startDate && expense.date <= endDate,
    ),
  );
}

export function getTodaySpend(expenses: ExpenseView[]) {
  return sumExpensesForDate(expenses, dayjs().format("YYYY-MM-DD"));
}

export function getThisWeekSpend(expenses: ExpenseView[]) {
  const startOfWeek = dayjs().startOf("week").format("YYYY-MM-DD");
  const endOfWeek = dayjs().endOf("week").format("YYYY-MM-DD");
  return sumExpensesForRange(expenses, startOfWeek, endOfWeek);
}

export function getBudgetUsedPercent(totalBudget: number, spent: number) {
  if (totalBudget <= 0) {
    return 0;
  }

  return Math.min(100, (spent / totalBudget) * 100);
}

export function getDailySeries(
  expenses: ExpenseView[],
  startDate: string,
  endDate: string,
) {
  const series: Array<{ label: string; value: number; date: string }> = [];
  let cursor = dayjs(startDate);

  while (cursor.isSame(endDate, "day") || cursor.isBefore(endDate, "day")) {
    const date = cursor.format("YYYY-MM-DD");
    series.push({
      label: cursor.format("D MMM"),
      value: sumExpensesForDate(expenses, date),
      date,
    });
    cursor = cursor.add(1, "day");
  }

  return series;
}

export function getCategorySeries(
  expenses: ExpenseView[],
  categories: CategoryRow[],
) {
  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    const key =
      expense.subcategory_name ?? expense.category_name ?? "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + expense.amount);
  }

  const palette = categories.reduce<Record<string, string>>(
    (accumulator, category) => {
      accumulator[category.name] = category.color;
      return accumulator;
    },
    {},
  );

  return [...byCategory.entries()].map(([label, value]) => ({
    label,
    value,
    color: palette[label] ?? "#64748b",
    text: `${label} ${value.toFixed(2)}`,
  }));
}

export function getWeeklyComparison(expenses: ExpenseView[], weekCount = 4) {
  const groups: Array<{ label: string; value: number }> = [];
  let cursor = dayjs()
    .startOf("week")
    .subtract(weekCount - 1, "week");

  while (groups.length < weekCount) {
    const weekStart = cursor.startOf("week");
    const weekEnd = cursor.endOf("week");
    groups.push({
      label: weekStart.format("D MMM"),
      value: sumExpensesForRange(
        expenses,
        weekStart.format("YYYY-MM-DD"),
        weekEnd.format("YYYY-MM-DD"),
      ),
    });
    cursor = cursor.add(1, "week");
  }

  return groups;
}

export function groupExpensesByDayLabel(expenses: ExpenseView[]) {
  const buckets = new Map<string, number>();

  for (const expense of expenses) {
    const label = dayjs(expense.date).format("ddd");
    buckets.set(label, (buckets.get(label) ?? 0) + expense.amount);
  }

  return [...buckets.entries()].map(([label, value]) => ({ label, value }));
}

export function getSpendWarningLevel(spentPercent: number) {
  if (spentPercent >= 90) {
    return "danger";
  }

  if (spentPercent >= 75) {
    return "warning";
  }

  return "normal";
}
