export type BudgetPeriodRow = {
  id: string;
  label: string;
  total_amount: number;
  start_date: string;
  end_date: string | null;
  currency: string;
  created_at: string;
};

export type IncomeEntryRow = {
  id: string;
  budget_period_id: string;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: number;
  parent_id: string | null;
};

export type ExpenseRow = {
  id: string;
  budget_period_id: string;
  amount: number;
  category_id: string | null;
  subcategory_id: string | null;
  note: string | null;
  date: string;
  time: string;
  payment_method: string;
  receipt_uri: string | null;
  is_recurring: number;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
};

export type SettingRow = {
  key: string;
  value: string;
};

export type BudgetPeriodView = BudgetPeriodRow & {
  additional_income: number;
  total_expenses: number;
  current_balance: number;
};

export type ExpenseView = ExpenseRow & {
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  subcategory_name: string | null;
  subcategory_color: string | null;
  subcategory_icon: string | null;
  budget_label: string | null;
  budget_currency: string | null;
};

export type ExpenseFilters = {
  budgetPeriodId?: string;
  query?: string;
  categoryId?: string;
  subcategoryId?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: "date" | "amount" | "category";
  sortDirection?: "asc" | "desc";
  includeRecurringTemplates?: boolean;
};

export type AppSnapshot = {
  budgetPeriods: BudgetPeriodView[];
  categories: CategoryRow[];
  settings: Record<string, string>;
  expenses: ExpenseView[];
  incomeEntries: IncomeEntryRow[];
};
