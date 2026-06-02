import dayjs from "dayjs";
import * as SQLite from "expo-sqlite";

import { RECURRING_RULES, type RecurrenceRule } from "@/constants/categories";

import type {
  AppSnapshot,
  BudgetPeriodRow,
  BudgetPeriodView,
  CategoryRow,
  ExpenseFilters,
  ExpenseRow,
  ExpenseView,
  IncomeEntryRow,
  LoanPaymentRow,
  LoanRow,
  LoanStatus,
  LoanType,
  SettingRow,
} from "./types";

type SqliteLike = Pick<
  SQLite.SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync"
>;

export type BudgetPeriodInput = {
  label: string;
  totalAmount: number;
  startDate: string;
  endDate: string | null;
  currency: string;
};

export type IncomeEntryInput = {
  budgetPeriodId: string;
  amount: number;
  note?: string;
  date: string;
};

export type ExpenseInput = {
  id?: string;
  budgetPeriodId: string;
  amount: number;
  categoryId: string | null;
  subcategoryId: string | null;
  note?: string;
  date: string;
  time: string;
  paymentMethod: string;
  receiptUri?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string | null;
};

export type SettingMap = Record<string, string>;

export function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

function normalizeDate(value?: string) {
  return value
    ? dayjs(value).format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");
}

function normalizeTime(value?: string) {
  return value
    ? dayjs(`1970-01-01T${value}`).format("HH:mm")
    : dayjs().format("HH:mm");
}

function toBool(value: string | number | undefined | null) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function nextRecurringDate(date: string, rule: string | null | undefined) {
  const base = dayjs(date);
  if (!rule) {
    return base.add(1, "month").format("YYYY-MM-DD");
  }

  if (rule === "daily") {
    return base.add(1, "day").format("YYYY-MM-DD");
  }

  if (rule === "weekly") {
    return base.add(1, "week").format("YYYY-MM-DD");
  }

  return base.add(1, "month").format("YYYY-MM-DD");
}

export async function getSettings(db: SqliteLike) {
  const rows = await db.getAllAsync<SettingRow>(
    "SELECT key, value FROM settings ORDER BY key",
  );
  return rows.reduce<SettingMap>((accumulator, row) => {
    accumulator[row.key] = row.value;
    return accumulator;
  }, {});
}

export async function setSetting(db: SqliteLike, key: string, value: string) {
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}

export async function getCategories(db: SqliteLike) {
  return db.getAllAsync<CategoryRow>(
    `SELECT id, name, icon, color, is_default, parent_id
     FROM categories
     ORDER BY parent_id IS NOT NULL, parent_id, name`,
  );
}

export async function getBudgetPeriods(db: SqliteLike) {
  return db.getAllAsync<BudgetPeriodView>(
    `SELECT
      bp.id,
      bp.label,
      bp.total_amount,
      bp.start_date,
      bp.end_date,
      bp.currency,
      bp.created_at,
      COALESCE(income.additional_income, 0) AS additional_income,
      COALESCE(expense.total_expenses, 0) AS total_expenses,
      bp.total_amount + COALESCE(income.additional_income, 0) - COALESCE(expense.total_expenses, 0) AS current_balance
     FROM budget_periods bp
     LEFT JOIN (
       SELECT budget_period_id, SUM(amount) AS additional_income
       FROM income_entries
       GROUP BY budget_period_id
     ) income ON income.budget_period_id = bp.id
     LEFT JOIN (
       SELECT budget_period_id, SUM(amount) AS total_expenses
       FROM expenses
       WHERE is_recurring = 0
       GROUP BY budget_period_id
     ) expense ON expense.budget_period_id = bp.id
     ORDER BY bp.created_at DESC`,
  );
}

export async function getActiveBudgetPeriod(
  db: SqliteLike,
  referenceDate = dayjs().format("YYYY-MM-DD"),
) {
  const active = await db.getFirstAsync<BudgetPeriodView>(
    `SELECT
      bp.id,
      bp.label,
      bp.total_amount,
      bp.start_date,
      bp.end_date,
      bp.currency,
      bp.created_at,
      COALESCE(income.additional_income, 0) AS additional_income,
      COALESCE(expense.total_expenses, 0) AS total_expenses,
      bp.total_amount + COALESCE(income.additional_income, 0) - COALESCE(expense.total_expenses, 0) AS current_balance
     FROM budget_periods bp
     LEFT JOIN (
       SELECT budget_period_id, SUM(amount) AS additional_income
       FROM income_entries
       GROUP BY budget_period_id
     ) income ON income.budget_period_id = bp.id
     LEFT JOIN (
       SELECT budget_period_id, SUM(amount) AS total_expenses
       FROM expenses
       WHERE is_recurring = 0
       GROUP BY budget_period_id
     ) expense ON expense.budget_period_id = bp.id
     WHERE bp.start_date <= ? AND (bp.end_date IS NULL OR bp.end_date >= ?)
     ORDER BY bp.created_at DESC
     LIMIT 1`,
    referenceDate,
    referenceDate,
  );

  if (active) {
    return active;
  }

  return db.getFirstAsync<BudgetPeriodView>(
    `SELECT
      bp.id,
      bp.label,
      bp.total_amount,
      bp.start_date,
      bp.end_date,
      bp.currency,
      bp.created_at,
      COALESCE(income.additional_income, 0) AS additional_income,
      COALESCE(expense.total_expenses, 0) AS total_expenses,
      bp.total_amount + COALESCE(income.additional_income, 0) - COALESCE(expense.total_expenses, 0) AS current_balance
     FROM budget_periods bp
     LEFT JOIN (
       SELECT budget_period_id, SUM(amount) AS additional_income
       FROM income_entries
       GROUP BY budget_period_id
     ) income ON income.budget_period_id = bp.id
     LEFT JOIN (
       SELECT budget_period_id, SUM(amount) AS total_expenses
       FROM expenses
       WHERE is_recurring = 0
       GROUP BY budget_period_id
     ) expense ON expense.budget_period_id = bp.id
     ORDER BY bp.created_at DESC
     LIMIT 1`,
  );
}

export async function createBudgetPeriod(
  db: SqliteLike,
  input: BudgetPeriodInput,
) {
  const id = createId("budget");
  const createdAt = dayjs().toISOString();
  await db.runAsync(
    `INSERT INTO budget_periods (id, label, total_amount, start_date, end_date, currency, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.label,
    input.totalAmount,
    normalizeDate(input.startDate),
    input.endDate ? normalizeDate(input.endDate) : null,
    input.currency,
    createdAt,
  );
  return id;
}

export async function addIncomeEntry(db: SqliteLike, input: IncomeEntryInput) {
  const id = createId("income");
  await db.runAsync(
    `INSERT INTO income_entries (id, budget_period_id, amount, note, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    input.budgetPeriodId,
    input.amount,
    input.note ?? null,
    normalizeDate(input.date),
    dayjs().toISOString(),
  );
  return id;
}

export async function saveExpense(db: SqliteLike, input: ExpenseInput) {
  const id = input.id ?? createId("expense");
  const createdAt = dayjs().toISOString();
  const updatedAt = createdAt;

  if (input.id) {
    await db.runAsync(
      `UPDATE expenses SET
        budget_period_id = ?,
        amount = ?,
        category_id = ?,
        subcategory_id = ?,
        note = ?,
        date = ?,
        time = ?,
        payment_method = ?,
        receipt_uri = ?,
        is_recurring = ?,
        recurrence_rule = ?,
        updated_at = ?
      WHERE id = ?`,
      input.budgetPeriodId,
      input.amount,
      input.categoryId,
      input.subcategoryId,
      input.note ?? null,
      normalizeDate(input.date),
      normalizeTime(input.time),
      input.paymentMethod,
      input.receiptUri ?? null,
      input.isRecurring ? 1 : 0,
      input.recurrenceRule ?? null,
      updatedAt,
      id,
    );
    return id;
  }

  await db.runAsync(
    `INSERT INTO expenses (
      id, budget_period_id, amount, category_id, subcategory_id, note,
      date, time, payment_method, receipt_uri, is_recurring, recurrence_rule,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.budgetPeriodId,
    input.amount,
    input.categoryId,
    input.subcategoryId,
    input.note ?? null,
    normalizeDate(input.date),
    normalizeTime(input.time),
    input.paymentMethod,
    input.receiptUri ?? null,
    input.isRecurring ? 1 : 0,
    input.recurrenceRule ?? null,
    createdAt,
    updatedAt,
  );

  return id;
}

export async function deleteExpense(db: SqliteLike, expenseId: string) {
  await db.runAsync("DELETE FROM expenses WHERE id = ?", expenseId);
}

export async function bulkDeleteExpenses(db: SqliteLike, expenseIds: string[]) {
  if (expenseIds.length === 0) {
    return;
  }

  const placeholders = expenseIds.map(() => "?").join(", ");
  await db.runAsync(
    `DELETE FROM expenses WHERE id IN (${placeholders})`,
    ...expenseIds,
  );
}

function buildExpenseWhere(filters: ExpenseFilters) {
  const clauses: string[] = [
    "e.is_recurring = " +
      (filters.includeRecurringTemplates ? "e.is_recurring" : "0"),
  ];
  const params: Record<string, string | number | null> = {};

  if (filters.budgetPeriodId) {
    clauses.push("e.budget_period_id = $budgetPeriodId");
    params.$budgetPeriodId = filters.budgetPeriodId;
  }

  if (filters.query) {
    clauses.push(
      "(e.note LIKE $query OR c.name LIKE $query OR sc.name LIKE $query OR e.payment_method LIKE $query)",
    );
    params.$query = `%${filters.query}%`;
  }

  if (filters.categoryId) {
    clauses.push("e.category_id = $categoryId");
    params.$categoryId = filters.categoryId;
  }

  if (filters.subcategoryId) {
    clauses.push("e.subcategory_id = $subcategoryId");
    params.$subcategoryId = filters.subcategoryId;
  }

  if (filters.paymentMethod) {
    clauses.push("e.payment_method = $paymentMethod");
    params.$paymentMethod = filters.paymentMethod;
  }

  if (typeof filters.minAmount === "number") {
    clauses.push("e.amount >= $minAmount");
    params.$minAmount = filters.minAmount;
  }

  if (typeof filters.maxAmount === "number") {
    clauses.push("e.amount <= $maxAmount");
    params.$maxAmount = filters.maxAmount;
  }

  if (filters.startDate) {
    clauses.push("e.date >= $startDate");
    params.$startDate = normalizeDate(filters.startDate);
  }

  if (filters.endDate) {
    clauses.push("e.date <= $endDate");
    params.$endDate = normalizeDate(filters.endDate);
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export async function getExpenses(
  db: SqliteLike,
  filters: ExpenseFilters = {},
) {
  const { whereClause, params } = buildExpenseWhere(filters);
  const sortBy = filters.sortBy ?? "date";
  const sortDirection = filters.sortDirection ?? "desc";
  const orderBy =
    sortBy === "amount"
      ? `e.amount ${sortDirection}, e.date DESC, e.time DESC`
      : sortBy === "category"
        ? `COALESCE(c.name, '') ${sortDirection}, e.date DESC, e.time DESC`
        : `e.date ${sortDirection}, e.time ${sortDirection}, e.created_at ${sortDirection}`;

  return db.getAllAsync<ExpenseView>(
    `SELECT
      e.*,
      c.name AS category_name,
      c.color AS category_color,
      c.icon AS category_icon,
      sc.name AS subcategory_name,
      sc.color AS subcategory_color,
      sc.icon AS subcategory_icon,
      bp.label AS budget_label,
      bp.currency AS budget_currency
     FROM expenses e
     LEFT JOIN categories c ON c.id = e.category_id
     LEFT JOIN categories sc ON sc.id = e.subcategory_id
     LEFT JOIN budget_periods bp ON bp.id = e.budget_period_id
     ${whereClause}
     ORDER BY ${orderBy}`,
    params,
  );
}

export async function getRecentExpenses(
  db: SqliteLike,
  budgetPeriodId: string,
  limit = 10,
) {
  return db.getAllAsync<ExpenseView>(
    `SELECT
      e.*,
      c.name AS category_name,
      c.color AS category_color,
      c.icon AS category_icon,
      sc.name AS subcategory_name,
      sc.color AS subcategory_color,
      sc.icon AS subcategory_icon,
      bp.label AS budget_label,
      bp.currency AS budget_currency
     FROM expenses e
     LEFT JOIN categories c ON c.id = e.category_id
     LEFT JOIN categories sc ON sc.id = e.subcategory_id
     LEFT JOIN budget_periods bp ON bp.id = e.budget_period_id
     WHERE e.budget_period_id = ? AND e.is_recurring = 0
     ORDER BY e.date DESC, e.time DESC, e.created_at DESC
     LIMIT ?`,
    budgetPeriodId,
    limit,
  );
}

export async function getBudgetPeriodDetail(
  db: SqliteLike,
  budgetPeriodId: string,
) {
  const period = await db.getFirstAsync<BudgetPeriodView>(
    `SELECT
      bp.id,
      bp.label,
      bp.total_amount,
      bp.start_date,
      bp.end_date,
      bp.currency,
      bp.created_at,
      COALESCE(income.additional_income, 0) AS additional_income,
      COALESCE(expense.total_expenses, 0) AS total_expenses,
      bp.total_amount + COALESCE(income.additional_income, 0) - COALESCE(expense.total_expenses, 0) AS current_balance
     FROM budget_periods bp
     LEFT JOIN (
       SELECT budget_period_id, SUM(amount) AS additional_income
       FROM income_entries
       GROUP BY budget_period_id
     ) income ON income.budget_period_id = bp.id
     LEFT JOIN (
       SELECT budget_period_id, SUM(amount) AS total_expenses
       FROM expenses
       WHERE is_recurring = 0
       GROUP BY budget_period_id
     ) expense ON expense.budget_period_id = bp.id
     WHERE bp.id = ?`,
    budgetPeriodId,
  );

  return period;
}

export async function getIncomeEntries(db: SqliteLike, budgetPeriodId: string) {
  return db.getAllAsync<IncomeEntryRow>(
    `SELECT id, budget_period_id, amount, note, date, created_at
     FROM income_entries
     WHERE budget_period_id = ?
     ORDER BY date DESC, created_at DESC`,
    budgetPeriodId,
  );
}

export async function getSnapshot(db: SqliteLike): Promise<AppSnapshot> {
  const [budgetPeriods, categories, expenses, incomeEntries, settingsArray] =
    await Promise.all([
      getBudgetPeriods(db),
      getCategories(db),
      getExpenses(db, { includeRecurringTemplates: true }),
      db.getAllAsync<IncomeEntryRow>(
        "SELECT id, budget_period_id, amount, note, date, created_at FROM income_entries ORDER BY created_at DESC",
      ),
      db.getAllAsync<SettingRow>(
        "SELECT key, value FROM settings ORDER BY key",
      ),
    ]);

  return {
    budgetPeriods,
    categories,
    expenses,
    incomeEntries,
    settings: settingsArray.reduce<SettingMap>((accumulator, item) => {
      accumulator[item.key] = item.value;
      return accumulator;
    }, {}),
  };
}

export async function importSnapshot(db: SqliteLike, snapshot: AppSnapshot) {
  await db.runAsync("DELETE FROM expenses");
  await db.runAsync("DELETE FROM income_entries");
  await db.runAsync("DELETE FROM budget_periods");
  await db.runAsync("DELETE FROM categories");
  await db.runAsync("DELETE FROM settings");

  for (const category of snapshot.categories) {
    await db.runAsync(
      "INSERT INTO categories (id, name, icon, color, is_default, parent_id) VALUES (?, ?, ?, ?, ?, ?)",
      category.id,
      category.name,
      category.icon,
      category.color,
      category.is_default,
      category.parent_id,
    );
  }

  for (const period of snapshot.budgetPeriods) {
    await db.runAsync(
      `INSERT INTO budget_periods (id, label, total_amount, start_date, end_date, currency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      period.id,
      period.label,
      period.total_amount,
      period.start_date,
      period.end_date,
      period.currency,
      period.created_at,
    );
  }

  for (const incomeEntry of snapshot.incomeEntries) {
    await db.runAsync(
      `INSERT INTO income_entries (id, budget_period_id, amount, note, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      incomeEntry.id,
      incomeEntry.budget_period_id,
      incomeEntry.amount,
      incomeEntry.note,
      incomeEntry.date,
      incomeEntry.created_at,
    );
  }

  for (const expense of snapshot.expenses) {
    await db.runAsync(
      `INSERT INTO expenses (
        id, budget_period_id, amount, category_id, subcategory_id, note,
        date, time, payment_method, receipt_uri, is_recurring, recurrence_rule,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      expense.id,
      expense.budget_period_id,
      expense.amount,
      expense.category_id,
      expense.subcategory_id,
      expense.note,
      expense.date,
      expense.time,
      expense.payment_method,
      expense.receipt_uri,
      expense.is_recurring,
      expense.recurrence_rule,
      expense.created_at,
      expense.updated_at,
    );
  }

  for (const [key, value] of Object.entries(snapshot.settings)) {
    await db.runAsync(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
      key,
      value,
    );
  }
}

export async function syncRecurringExpenses(db: SqliteLike) {
  const templates = await db.getAllAsync<ExpenseRow>(
    `SELECT * FROM expenses WHERE is_recurring = 1 ORDER BY date ASC, time ASC`,
  );

  const today = dayjs().format("YYYY-MM-DD");
  const now = dayjs().toISOString();

  for (const template of templates) {
    let nextDate = template.date;
    while (
      dayjs(nextDate).isBefore(today, "day") ||
      dayjs(nextDate).isSame(today, "day")
    ) {
      await db.runAsync(
        `INSERT INTO expenses (
          id, budget_period_id, amount, category_id, subcategory_id, note,
          date, time, payment_method, receipt_uri, is_recurring, recurrence_rule,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)`,
        createId("expense"),
        template.budget_period_id,
        template.amount,
        template.category_id,
        template.subcategory_id,
        template.note,
        nextDate,
        template.time,
        template.payment_method,
        template.receipt_uri,
        now,
        now,
      );

      nextDate = nextRecurringDate(nextDate, template.recurrence_rule);
      await db.runAsync(
        "UPDATE expenses SET date = ?, updated_at = ? WHERE id = ?",
        nextDate,
        now,
        template.id,
      );
    }
  }
}

export function isRecurringRule(
  value: string | null | undefined,
): value is RecurrenceRule {
  return !!value && RECURRING_RULES.includes(value as RecurrenceRule);
}

export function getTemplateBudgetTotal(
  period: BudgetPeriodView | BudgetPeriodRow | null | undefined,
) {
  if (!period) {
    return 0;
  }

  return period.total_amount;
}

export function getTemplateBalance(
  period: BudgetPeriodView | BudgetPeriodRow | null | undefined,
) {
  if (!period) {
    return 0;
  }

  const additionalIncome =
    "additional_income" in period ? period.additional_income : 0;
  const totalExpenses = "total_expenses" in period ? period.total_expenses : 0;
  return period.total_amount + additionalIncome - totalExpenses;
}

export type LoanInput = {
  type: LoanType;
  personName: string;
  principalAmount: number;
  note?: string;
  date: string;
  dueDate?: string | null;
};

export async function createLoan(db: SqliteLike, input: LoanInput) {
  const id = createId("loan");
  const now = dayjs().toISOString();
  await db.runAsync(
    `INSERT INTO loans (id, type, person_name, principal_amount, remaining_amount, note, date, due_date, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    id,
    input.type,
    input.personName,
    input.principalAmount,
    input.principalAmount,
    input.note ?? null,
    normalizeDate(input.date),
    input.dueDate ? normalizeDate(input.dueDate) : null,
    now,
    now,
  );
  return id;
}

export async function updateLoan(
  db: SqliteLike,
  id: string,
  input: Partial<LoanInput>,
) {
  const now = dayjs().toISOString();
  const dueDateValue =
    input.dueDate !== undefined
      ? input.dueDate
        ? normalizeDate(input.dueDate)
        : null
      : null;
  await db.runAsync(
    `UPDATE loans SET
      person_name = COALESCE(?, person_name),
      note = ?,
      date = COALESCE(?, date),
      due_date = ?,
      updated_at = ?
     WHERE id = ?`,
    input.personName ?? null,
    input.note ?? null,
    input.date ? normalizeDate(input.date) : null,
    dueDateValue,
    now,
    id,
  );
}

export async function deleteLoan(db: SqliteLike, loanId: string) {
  await db.runAsync("DELETE FROM loans WHERE id = ?", loanId);
}

export async function markLoanPaid(db: SqliteLike, loanId: string) {
  const now = dayjs().toISOString();
  await db.runAsync(
    `UPDATE loans SET status = 'paid', remaining_amount = 0, updated_at = ? WHERE id = ?`,
    now,
    loanId,
  );
}

export async function markLoanActive(db: SqliteLike, loanId: string) {
  const now = dayjs().toISOString();
  const loan = await db.getFirstAsync<LoanRow>(
    "SELECT * FROM loans WHERE id = ?",
    loanId,
  );
  if (!loan) return;
  const paid = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM loan_payments WHERE loan_id = ?",
    loanId,
  );
  const remaining = Math.max(0, loan.principal_amount - (paid?.total ?? 0));
  await db.runAsync(
    `UPDATE loans SET status = 'active', remaining_amount = ?, updated_at = ? WHERE id = ?`,
    remaining,
    now,
    loanId,
  );
}

export async function recordLoanPayment(
  db: SqliteLike,
  loanId: string,
  amount: number,
  note?: string,
  date?: string,
  markFullyPaid = false,
) {
  const id = createId("lpay");
  const now = dayjs().toISOString();
  await db.runAsync(
    `INSERT INTO loan_payments (id, loan_id, amount, note, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    loanId,
    amount,
    note ?? null,
    date ? normalizeDate(date) : dayjs().format("YYYY-MM-DD"),
    now,
  );

  if (markFullyPaid) {
    await db.runAsync(
      `UPDATE loans SET remaining_amount = 0, status = 'paid', updated_at = ? WHERE id = ?`,
      now,
      loanId,
    );
  } else {
    await db.runAsync(
      `UPDATE loans SET remaining_amount = MAX(0, remaining_amount - ?), updated_at = ?,
        status = CASE WHEN MAX(0, remaining_amount - ?) = 0 THEN 'paid' ELSE 'active' END
       WHERE id = ?`,
      amount,
      now,
      amount,
      loanId,
    );
  }

  return id;
}

export async function getLoans(
  db: SqliteLike,
  filter?: { type?: LoanType; status?: LoanStatus },
) {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filter?.type) {
    clauses.push("type = ?");
    params.push(filter.type);
  }
  if (filter?.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.getAllAsync<LoanRow>(
    `SELECT * FROM loans ${where} ORDER BY status ASC, date DESC`,
    ...params,
  );
}

export async function getLoanById(db: SqliteLike, loanId: string) {
  return db.getFirstAsync<LoanRow>("SELECT * FROM loans WHERE id = ?", loanId);
}

export async function getLoanPayments(db: SqliteLike, loanId: string) {
  return db.getAllAsync<LoanPaymentRow>(
    `SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY date DESC, created_at DESC`,
    loanId,
  );
}

export function isBudgetWarning(balance: number, total: number) {
  if (total <= 0) {
    return "none";
  }

  const usedPercent = ((total - balance) / total) * 100;
  if (usedPercent >= 90) {
    return "danger";
  }

  if (usedPercent >= 75) {
    return "warning";
  }

  return "none";
}
