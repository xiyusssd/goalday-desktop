import assert from "node:assert/strict";
import { summarizeMonth, transactionsForMonth, monthKey, addMonths, categoriesFor, categoryMeta } from "./finance.ts";
import type { Transaction } from "../types";

let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
};

const txn = (over: Partial<Transaction>): Transaction => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  type: over.type ?? "expense",
  amount: over.amount ?? 0,
  category: over.category ?? "food",
  note: over.note ?? "",
  date: over.date ?? "2026-07-10",
  createdAt: over.createdAt ?? 1,
  updatedAt: over.updatedAt ?? 1,
  deleted: over.deleted ?? false,
});

check("monthKey slices YYYY-MM", () => {
  assert.equal(monthKey("2026-07-28"), "2026-07");
});

check("addMonths rolls the year over", () => {
  assert.equal(addMonths("2026-12", 1), "2027-01");
  assert.equal(addMonths("2026-01", -1), "2025-12");
  assert.equal(addMonths("2026-07", 3), "2026-10");
});

check("categoriesFor returns the right kind", () => {
  assert.ok(categoriesFor("expense").every((c) => c.kind === "expense"));
  assert.ok(categoriesFor("income").every((c) => c.kind === "income"));
});

check("categoryMeta resolves a known key", () => {
  assert.equal(categoryMeta("salary")?.kind, "income");
  assert.equal(categoryMeta("nope"), undefined);
});

check("summarizeMonth totals income/expense/balance", () => {
  const rows = [
    txn({ type: "income", amount: 1000, category: "salary", date: "2026-07-01" }),
    txn({ type: "expense", amount: 200, category: "food", date: "2026-07-05" }),
    txn({ type: "expense", amount: 50, category: "food", date: "2026-07-06" }),
    txn({ type: "expense", amount: 300, category: "shopping", date: "2026-07-07" }),
    txn({ type: "expense", amount: 999, category: "food", date: "2026-08-01" }), // other month
  ];
  const s = summarizeMonth(rows, "2026-07");
  assert.equal(s.income, 1000);
  assert.equal(s.expense, 550);
  assert.equal(s.balance, 450);
  // expense-by-category, largest first: food 250, shopping 300 -> shopping first
  assert.deepEqual(s.byCategory, [
    { category: "shopping", total: 300 },
    { category: "food", total: 250 },
  ]);
});

check("summarizeMonth ignores soft-deleted rows", () => {
  const rows = [
    txn({ type: "expense", amount: 100, date: "2026-07-01" }),
    txn({ type: "expense", amount: 100, date: "2026-07-02", deleted: true }),
  ];
  assert.equal(summarizeMonth(rows, "2026-07").expense, 100);
});

check("transactionsForMonth sorts newest date first + filters month", () => {
  const rows = [
    txn({ id: "a", date: "2026-07-01" }),
    txn({ id: "b", date: "2026-07-20" }),
    txn({ id: "c", date: "2026-08-01" }),
  ];
  const out = transactionsForMonth(rows, "2026-07").map((t) => t.id);
  assert.deepEqual(out, ["b", "a"]);
});

console.log(`\n${passed} passed`);
