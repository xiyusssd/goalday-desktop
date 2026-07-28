import type { Transaction, TxnType } from "../types";

// Pure, dependency-free finance helpers (category metadata + monthly rollups).
// Kept free of React/store so it can be unit-tested under the Node runner.

export interface CategoryMeta {
  key: string;
  kind: TxnType;
  /** i18n key for the label. */
  labelKey: string;
  /** Emoji glyph shown on the chip / row. */
  icon: string;
  color: string;
}

/** Expense categories, in display order. */
export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { key: "food", kind: "expense", labelKey: "catFood", icon: "🍜", color: "#f97316" },
  { key: "transport", kind: "expense", labelKey: "catTransport", icon: "🚌", color: "#0ea5e9" },
  { key: "shopping", kind: "expense", labelKey: "catShopping", icon: "🛍️", color: "#ec4899" },
  { key: "entertainment", kind: "expense", labelKey: "catEntertainment", icon: "🎮", color: "#8b5cf6" },
  { key: "housing", kind: "expense", labelKey: "catHousing", icon: "🏠", color: "#14b8a6" },
  { key: "health", kind: "expense", labelKey: "catHealth", icon: "💊", color: "#ef4444" },
  { key: "education", kind: "expense", labelKey: "catEducation", icon: "📚", color: "#6366f1" },
  { key: "other", kind: "expense", labelKey: "catOther", icon: "📦", color: "#64748b" },
];

/** Income categories, in display order. */
export const INCOME_CATEGORIES: CategoryMeta[] = [
  { key: "salary", kind: "income", labelKey: "catSalary", icon: "💰", color: "#10b981" },
  { key: "bonus", kind: "income", labelKey: "catBonus", icon: "🎁", color: "#f59e0b" },
  { key: "investment", kind: "income", labelKey: "catInvestment", icon: "📈", color: "#3b82f6" },
  { key: "otherIncome", kind: "income", labelKey: "catOtherIncome", icon: "🪙", color: "#64748b" },
];

export const ALL_CATEGORIES: CategoryMeta[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const CATEGORY_BY_KEY = new Map(ALL_CATEGORIES.map((c) => [c.key, c]));

export function categoriesFor(type: TxnType): CategoryMeta[] {
  return type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export function categoryMeta(key: string): CategoryMeta | undefined {
  return CATEGORY_BY_KEY.get(key);
}

/** "YYYY-MM" of an ISO date. */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** Shift a "YYYY-MM" month key by `delta` months. */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
  /** Expense totals per category, largest first. */
  byCategory: CategoryTotal[];
}

/** Live (non-deleted) transactions on a given "YYYY-MM" month, newest date first. */
export function transactionsForMonth(txns: Transaction[], month: string): Transaction[] {
  return txns
    .filter((t) => !t.deleted && monthKey(t.date) === month)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
}

/** Income/expense/balance + expense-by-category breakdown for one month. */
export function summarizeMonth(txns: Transaction[], month: string): MonthSummary {
  const rows = txns.filter((t) => !t.deleted && monthKey(t.date) === month);
  let income = 0;
  let expense = 0;
  const cat = new Map<string, number>();
  for (const t of rows) {
    const amt = Math.abs(t.amount);
    if (t.type === "income") {
      income += amt;
    } else {
      expense += amt;
      cat.set(t.category, (cat.get(t.category) ?? 0) + amt);
    }
  }
  const byCategory = [...cat.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  return { income, expense, balance: income - expense, byCategory };
}
