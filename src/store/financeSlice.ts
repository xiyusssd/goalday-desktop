import { nanoid } from "nanoid";
import type { Transaction } from "../types.ts";
import { initialData } from "./initial.ts";
import { persist } from "./persist.ts";
import type { Slice, FinanceSlice } from "./types.ts";

export const createFinanceSlice: Slice<FinanceSlice> = (set, get) => ({
  transactions: initialData.transactions,

  addTransaction: (input) => {
    const now = Date.now();
    const txn: Transaction = {
      id: nanoid(),
      ...input,
      amount: Math.abs(input.amount) || 0,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    set((s) => ({ transactions: [...s.transactions, txn] }));
    persist(get());
  },
  updateTransaction: (id, patch) => {
    set((s) => ({
      transactions: s.transactions.map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
  deleteTransaction: (id) => {
    set((s) => ({
      transactions: s.transactions.map((x) =>
        x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
});
