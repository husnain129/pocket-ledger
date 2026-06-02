import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

import {
  createLoan,
  deleteLoan,
  getLoanById,
  getLoanPayments,
  getLoans,
  LoanInput,
  markLoanActive,
  markLoanPaid,
  recordLoanPayment,
  updateLoan,
} from "@/db/queries";
import type { LoanPaymentRow, LoanRow, LoanStatus, LoanType } from "@/db/types";

type LoanStore = {
  loans: LoanRow[];
  isLoading: boolean;
  activeFilter: "all" | LoanType;

  hydrate: (db: SQLiteDatabase) => Promise<void>;
  refresh: (db: SQLiteDatabase) => Promise<void>;
  setFilter: (filter: "all" | LoanType) => void;

  addLoan: (db: SQLiteDatabase, input: LoanInput) => Promise<string>;
  editLoan: (
    db: SQLiteDatabase,
    id: string,
    input: Partial<LoanInput>,
  ) => Promise<void>;
  removeLoan: (db: SQLiteDatabase, id: string) => Promise<void>;
  setPaid: (db: SQLiteDatabase, id: string) => Promise<void>;
  setActive: (db: SQLiteDatabase, id: string) => Promise<void>;
  addPayment: (
    db: SQLiteDatabase,
    loanId: string,
    amount: number,
    note?: string,
    date?: string,
    markFullyPaid?: boolean,
  ) => Promise<void>;

  getLoanWithPayments: (
    db: SQLiteDatabase,
    loanId: string,
  ) => Promise<{ loan: LoanRow | null; payments: LoanPaymentRow[] }>;

  totalOwedToMe: () => number;
  totalIOwe: () => number;
};

export const useLoanStore = create<LoanStore>((set, get) => ({
  loans: [],
  isLoading: false,
  activeFilter: "all",

  hydrate: async (db) => {
    set({ isLoading: true });
    try {
      const loans = await getLoans(db);
      set({ loans, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  refresh: async (db) => {
    const loans = await getLoans(db);
    set({ loans });
  },

  setFilter: (filter) => set({ activeFilter: filter }),

  addLoan: async (db, input) => {
    const id = await createLoan(db, input);
    await get().refresh(db);
    return id;
  },

  editLoan: async (db, id, input) => {
    await updateLoan(db, id, input);
    await get().refresh(db);
  },

  removeLoan: async (db, id) => {
    await deleteLoan(db, id);
    await get().refresh(db);
  },

  setPaid: async (db, id) => {
    await markLoanPaid(db, id);
    await get().refresh(db);
  },

  setActive: async (db, id) => {
    await markLoanActive(db, id);
    await get().refresh(db);
  },

  addPayment: async (db, loanId, amount, note, date, markFullyPaid) => {
    await recordLoanPayment(db, loanId, amount, note, date, markFullyPaid);
    await get().refresh(db);
  },

  getLoanWithPayments: async (db, loanId) => {
    const [loan, payments] = await Promise.all([
      getLoanById(db, loanId),
      getLoanPayments(db, loanId),
    ]);
    return { loan: loan ?? null, payments };
  },

  totalOwedToMe: () =>
    get()
      .loans.filter((l) => l.type === "given" && l.status === "active")
      .reduce((sum, l) => sum + l.remaining_amount, 0),

  totalIOwe: () =>
    get()
      .loans.filter((l) => l.type === "taken" && l.status === "active")
      .reduce((sum, l) => sum + l.remaining_amount, 0),
}));
