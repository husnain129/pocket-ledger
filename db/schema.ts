import * as SQLite from "expo-sqlite";

import { DEFAULT_CATEGORY_SEEDS } from "@/constants/categories";

export const DATABASE_NAME = "pocketledger.db";
export const DATABASE_VERSION = 2;

type SeedDatabase = Pick<
  SQLite.SQLiteDatabase,
  "getFirstAsync" | "getAllAsync" | "runAsync" | "execAsync"
>;

export async function initializeDatabase(db: SeedDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS budget_periods (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      total_amount REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      currency TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS income_entries (
      id TEXT PRIMARY KEY NOT NULL,
      budget_period_id TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (budget_period_id) REFERENCES budget_periods(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      budget_period_id TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id TEXT,
      subcategory_id TEXT,
      note TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      receipt_uri TEXT,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurrence_rule TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (budget_period_id) REFERENCES budget_periods(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_budget_periods_dates ON budget_periods(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_income_entries_budget_date ON income_entries(budget_period_id, date);
    CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id, name);
    CREATE INDEX IF NOT EXISTS idx_expenses_budget_date ON expenses(budget_period_id, date, time);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id, subcategory_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_filters ON expenses(payment_method, is_recurring, amount);
    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('given', 'taken')),
      person_name TEXT NOT NULL,
      principal_amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paid')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS loan_payments (
      id TEXT PRIMARY KEY NOT NULL,
      loan_id TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_loans_type_status ON loans(type, status);
    CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id, date);
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion < DATABASE_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }

  const categoryCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM categories",
  );
  if ((categoryCount?.count ?? 0) === 0) {
    for (const category of DEFAULT_CATEGORY_SEEDS) {
      await db.runAsync(
        "INSERT INTO categories (id, name, icon, color, is_default, parent_id) VALUES (?, ?, ?, ?, 1, ?)",
        category.id,
        category.name,
        category.icon,
        category.color,
        category.parentId ?? null,
      );
    }
  }

  const settingsCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM settings",
  );
  if ((settingsCount?.count ?? 0) === 0) {
    const defaults: Array<[string, string]> = [
      ["currency", "USD"],
      ["theme", "system"],
      ["app_lock_enabled", "false"],
      ["daily_summary_enabled", "false"],
      ["daily_summary_time", "19:00"],
      ["weekly_digest_enabled", "false"],
      ["weekly_digest_day", "1"],
      ["weekly_digest_time", "19:00"],
    ];

    for (const [key, value] of defaults) {
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        key,
        value,
      );
    }
  }
}
