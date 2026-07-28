import { useMemo, useState } from "react";
import clsx from "clsx";
import { useStore } from "../store";
import { useT, Key } from "../i18n";
import { today } from "../lib/date";
import type { TxnType } from "../types";
import {
  categoriesFor,
  categoryMeta,
  monthKey,
  addMonths,
  summarizeMonth,
  transactionsForMonth,
} from "../lib/finance";
import { StitchMascot } from "./stitch";

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "income" | "expense" | "balance" }) {
  const color =
    tone === "income"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "expense"
        ? "text-rose-600 dark:text-rose-400"
        : "text-brand-600 dark:text-brand-400";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className={clsx("text-2xl font-bold", color)}>{value}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export function MoneyView() {
  const { t } = useT();
  const transactions = useStore((s) => s.transactions);
  const addTransaction = useStore((s) => s.addTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const [month, setMonth] = useState(monthKey(today()));
  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());

  const cats = categoriesFor(type);
  const summary = useMemo(() => summarizeMonth(transactions, month), [transactions, month]);
  const rows = useMemo(() => transactionsForMonth(transactions, month), [transactions, month]);
  const maxCat = Math.max(1, ...summary.byCategory.map((c) => c.total));

  const switchType = (next: TxnType) => {
    setType(next);
    setCategory(categoriesFor(next)[0].key);
  };

  const submit = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    addTransaction({ type, amount: value, category, note: note.trim(), date });
    setAmount("");
    setNote("");
    // Jump the visible month to where the entry landed.
    setMonth(monthKey(date));
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* Left: entry form */}
      <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("addExpense")}</h2>
        <div className="flex gap-2">
          {(["expense", "income"] as TxnType[]).map((tp) => (
            <button
              key={tp}
              onClick={() => switchType(tp)}
              className={clsx(
                "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                type === tp
                  ? tp === "expense"
                    ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-500/50 dark:bg-rose-500/20 dark:text-rose-300"
                    : "border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
              )}
            >
              {t(tp as Key)}
            </button>
          ))}
        </div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          inputMode="decimal"
          placeholder={t("amountPlaceholder")}
          className="rounded-lg border border-slate-200 px-3 py-2 text-lg font-semibold focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <div className="grid grid-cols-4 gap-1.5">
          {cats.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={clsx(
                "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-[11px] transition",
                category === c.key
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/20 dark:text-brand-300"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
              )}
            >
              <span className="text-base leading-none">{c.icon}</span>
              {t(c.labelKey as Key)}
            </button>
          ))}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("notePlaceholder")}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          onClick={submit}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("addExpense")}
        </button>
      </div>

      {/* Right: month summary + list */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonth(addMonths(month, -1))}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
            aria-label={t("prevMonth")}
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{month}</span>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
            aria-label={t("nextMonth")}
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label={t("monthlyExpense")} value={fmt(summary.expense)} tone="expense" />
          <SummaryCard label={t("monthlyIncome")} value={fmt(summary.income)} tone="income" />
          <SummaryCard label={t("monthlyBalance")} value={fmt(summary.balance)} tone="balance" />
        </div>

        {summary.byCategory.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("spendByCategory")}</h3>
            <div className="flex flex-col gap-2.5">
              {summary.byCategory.map(({ category: cat, total }) => {
                const meta = categoryMeta(cat);
                const pct = summary.expense ? Math.round((total / summary.expense) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {meta?.icon} {t((meta?.labelKey ?? "catOther") as Key)}
                      </span>
                      <span className="text-slate-400">{fmt(total)} · {pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(total / maxCat) * 100}%`, backgroundColor: meta?.color ?? "#64748b" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-sm text-slate-400">
              <StitchMascot size={72} />
              {t("noTransactions")}
            </div>
          ) : (
            rows.map((txn) => {
              const meta = categoryMeta(txn.category);
              return (
                <div
                  key={txn.id}
                  className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ backgroundColor: `${meta?.color ?? "#64748b"}22` }}
                  >
                    {meta?.icon ?? "📦"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t((meta?.labelKey ?? "catOther") as Key)}
                      {txn.note && <span className="ml-2 text-xs font-normal text-slate-400">{txn.note}</span>}
                    </div>
                    <div className="text-xs text-slate-400">{txn.date}</div>
                  </div>
                  <span
                    className={clsx(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      txn.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200",
                    )}
                  >
                    {txn.type === "income" ? "+" : "-"}
                    {fmt(txn.amount)}
                  </span>
                  <button
                    onClick={() => deleteTransaction(txn.id)}
                    className="shrink-0 text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                    aria-label={t("delete")}
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                      <path d="M6 7h8l-.7 9.1a1 1 0 01-1 .9H7.7a1 1 0 01-1-.9L6 7zm2.5-3h3l.5 1H14a1 1 0 110 2H6a1 1 0 110-2h2l.5-1z" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
