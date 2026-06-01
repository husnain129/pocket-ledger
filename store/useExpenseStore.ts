import { useBudgetStore } from "@/store/useBudgetStore";

export function useExpenseStore<T>(
  selector: (state: ReturnType<typeof useBudgetStore.getState>) => T,
) {
  return useBudgetStore(selector);
}

export function useExpenses() {
  return useBudgetStore((state) => state.expenses);
}

export function useRecentExpenses() {
  return useBudgetStore((state) => state.recentExpenses);
}

export function useExpenseFilters() {
  return useBudgetStore((state) => state.filters);
}
