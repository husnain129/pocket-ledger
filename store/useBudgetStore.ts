import dayjs from "dayjs";
import { create } from "zustand";

import {
  addIncomeEntry,
  bulkDeleteExpenses,
  createBudgetPeriod,
  deleteExpense,
  formatMoney,
  getActiveBudgetPeriod,
  getBudgetPeriods,
  getCategories,
  getExpenses,
  getIncomeEntries,
  getSettings,
  getSnapshot,
  importSnapshot,
  isBudgetWarning,
  saveExpense,
  setSetting,
  syncRecurringExpenses,
  type BudgetPeriodInput,
  type ExpenseInput,
  type SettingMap,
} from "@/db/queries";
import { initializeDatabase } from "@/db/schema";
import type {
  BudgetPeriodView,
  CategoryRow,
  ExpenseFilters,
  ExpenseView,
  IncomeEntryRow,
} from "@/db/types";

type SqliteDb = Parameters<typeof getSettings>[0];

type BudgetStore = {
  isHydrating: boolean;
  isReady: boolean;
  isLocked: boolean;
  budgetPeriods: BudgetPeriodView[];
  activeBudgetPeriod: BudgetPeriodView | null;
  categories: CategoryRow[];
  settings: SettingMap;
  incomeEntries: IncomeEntryRow[];
  expenses: ExpenseView[];
  recentExpenses: ExpenseView[];
  filters: ExpenseFilters;
  lastRefreshAt: string | null;
  hydrate: (db: SqliteDb) => Promise<void>;
  refresh: (db: SqliteDb) => Promise<void>;
  setLocked: (locked: boolean) => void;
  setFilters: (filters: ExpenseFilters) => void;
  createBudgetPeriod: (
    db: SqliteDb,
    input: BudgetPeriodInput,
  ) => Promise<string>;
  addIncomeEntry: (
    db: SqliteDb,
    input: Parameters<typeof addIncomeEntry>[1],
  ) => Promise<string>;
  addExpense: (db: SqliteDb, input: ExpenseInput) => Promise<string>;
  updateExpense: (db: SqliteDb, input: ExpenseInput) => Promise<string>;
  removeExpense: (db: SqliteDb, expenseId: string) => Promise<void>;
  removeManyExpenses: (db: SqliteDb, expenseIds: string[]) => Promise<void>;
  updateSetting: (db: SqliteDb, key: string, value: string) => Promise<void>;
  exportSnapshot: (db: SqliteDb) => Promise<ReturnType<typeof getSnapshot>>;
  restoreSnapshot: (
    db: SqliteDb,
    snapshot: Awaited<ReturnType<typeof getSnapshot>>,
  ) => Promise<void>;
  resetAllData: (db: SqliteDb) => Promise<void>;
  isBudgetWarning: () => "none" | "warning" | "danger";
  currencyLabel: () => string;
};

function sortRecent(expenses: ExpenseView[]) {
  return [...expenses]
    .sort((left, right) => {
      const leftDate = `${left.date}T${left.time}`;
      const rightDate = `${right.date}T${right.time}`;
      return dayjs(rightDate).valueOf() - dayjs(leftDate).valueOf();
    })
    .slice(0, 10);
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  isHydrating: false,
  isReady: false,
  isLocked: false,
  budgetPeriods: [],
  activeBudgetPeriod: null,
  categories: [],
  settings: {},
  incomeEntries: [],
  expenses: [],
  recentExpenses: [],
  filters: {
    sortBy: "date",
    sortDirection: "desc",
    includeRecurringTemplates: false,
  },
  lastRefreshAt: null,
  hydrate: async (db) => {
    set({ isHydrating: true });
    await syncRecurringExpenses(db);

    const [settings, budgetPeriods, categories, activeBudgetPeriod, expenses] =
      await Promise.all([
        getSettings(db),
        getBudgetPeriods(db),
        getCategories(db),
        getActiveBudgetPeriod(db),
        getExpenses(db, { includeRecurringTemplates: false }),
      ]);

    const incomeEntries = activeBudgetPeriod
      ? await getIncomeEntries(db, activeBudgetPeriod.id)
      : [];

    set({
      isHydrating: false,
      isReady: true,
      isLocked: settings.app_lock_enabled === "true",
      budgetPeriods,
      activeBudgetPeriod: activeBudgetPeriod ?? null,
      categories,
      settings,
      expenses,
      incomeEntries,
      recentExpenses: sortRecent(
        expenses.filter((expense) => !expense.is_recurring),
      ),
      lastRefreshAt: dayjs().toISOString(),
    });
  },
  refresh: async (db) => {
    await syncRecurringExpenses(db);
    const [
      settings,
      budgetPeriods,
      categories,
      activeBudgetPeriod,
      expenses,
      incomeEntries,
    ] = await Promise.all([
      getSettings(db),
      getBudgetPeriods(db),
      getCategories(db),
      getActiveBudgetPeriod(db),
      getExpenses(db, { includeRecurringTemplates: false }),
      getActiveBudgetPeriod(db).then((period) =>
        period ? getIncomeEntries(db, period.id) : [],
      ),
    ]);

    set({
      budgetPeriods,
      activeBudgetPeriod: activeBudgetPeriod ?? null,
      categories,
      settings,
      expenses,
      incomeEntries,
      recentExpenses: sortRecent(
        expenses.filter((expense) => !expense.is_recurring),
      ),
      isLocked: settings.app_lock_enabled === "true" ? get().isLocked : false,
      lastRefreshAt: dayjs().toISOString(),
    });
  },
  setLocked: (locked) => set({ isLocked: locked }),
  setFilters: (filters) => set({ filters }),
  createBudgetPeriod: async (db, input) => {
    const id = await createBudgetPeriod(db, input);
    await get().refresh(db);
    return id;
  },
  addIncomeEntry: async (db, input) => {
    const id = await addIncomeEntry(db, input);
    await get().refresh(db);
    return id;
  },
  addExpense: async (db, input) => {
    const id = await saveExpense(db, input);
    await get().refresh(db);
    return id;
  },
  updateExpense: async (db, input) => {
    const id = await saveExpense(db, input);
    await get().refresh(db);
    return id;
  },
  removeExpense: async (db, expenseId) => {
    await deleteExpense(db, expenseId);
    await get().refresh(db);
  },
  removeManyExpenses: async (db, expenseIds) => {
    await bulkDeleteExpenses(db, expenseIds);
    await get().refresh(db);
  },
  updateSetting: async (db, key, value) => {
    await setSetting(db, key, value);
    await get().refresh(db);
  },
  exportSnapshot: async (db) => getSnapshot(db),
  restoreSnapshot: async (db, snapshot) => {
    await importSnapshot(db, snapshot);
    await get().refresh(db);
  },
  resetAllData: async (db) => {
    await db.runAsync("DELETE FROM expenses");
    await db.runAsync("DELETE FROM income_entries");
    await db.runAsync("DELETE FROM budget_periods");
    await db.runAsync("DELETE FROM categories");
    await db.runAsync("DELETE FROM settings");
    await initializeDatabase(db);
    await get().hydrate(db);
  },
  isBudgetWarning: () => {
    const state = get();
    if (!state.activeBudgetPeriod) {
      return "none";
    }

    return isBudgetWarning(
      state.activeBudgetPeriod.current_balance,
      state.activeBudgetPeriod.total_amount +
        state.activeBudgetPeriod.additional_income,
    );
  },
  currencyLabel: () =>
    get().activeBudgetPeriod?.currency ?? get().settings.currency ?? "USD",
}));

export function useBudgetPeriods() {
  return useBudgetStore((state) => state.budgetPeriods);
}

export function useActiveBudgetPeriod() {
  return useBudgetStore((state) => state.activeBudgetPeriod);
}

export function useAppSettings() {
  return useBudgetStore((state) => state.settings);
}

export function formatBalanceLabel(amount: number, currency: string) {
  return formatMoney(amount, currency);
}
