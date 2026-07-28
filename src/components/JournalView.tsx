import { useState } from "react";
import clsx from "clsx";
import { useStore } from "../store";
import { today, weekDays, isToday, dayOfMonth } from "../lib/date";
import { useT } from "../i18n";

const MOODS = ["😞", "😐", "🙂", "😀", "🤩"];

export function JournalView() {
  const [date, setDate] = useState(today());
  const journals = useStore((s) => s.journals);
  const upsertJournal = useStore((s) => s.upsertJournal);
  const weekStart = useStore((s) => s.currentWeekStart);
  const { t, tArr } = useT();

  const entry = journals.find((j) => j.date === date && !j.deleted);
  const days = weekDays(weekStart);
  const labels = tArr("weekdayShort");

  return (
    <div className="flex h-full gap-4">
      <div className="flex w-44 shrink-0 flex-col gap-1.5">
        <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("journal")}</h2>
        {days.map((d, i) => {
          const has = journals.find((j) => j.date === d && !j.deleted && j.content.trim());
          return (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={clsx(
                "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition",
                d === date
                  ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/20 dark:text-brand-300"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
              )}
            >
              <span>
                {labels[i]} · {dayOfMonth(d)}
              </span>
              {isToday(d) && <span className="text-[10px] text-brand-500">{t("today")}</span>}
              {has && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("mood")}</span>
          {MOODS.map((m, i) => (
            <button
              key={i}
              onClick={() => upsertJournal(date, { mood: i + 1 })}
              className={clsx(
                "rounded-lg px-1.5 py-0.5 text-lg transition",
                entry?.mood === i + 1 ? "bg-brand-100 scale-110 dark:bg-brand-500/30" : "opacity-50 hover:opacity-100",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea
          value={entry?.content ?? ""}
          onChange={(e) => upsertJournal(date, { content: e.target.value })}
          placeholder={t("journalPlaceholder")}
          className="flex-1 resize-none rounded-lg border border-slate-200 p-3 text-sm leading-relaxed focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
    </div>
  );
}
