import { useState } from "react";
import clsx from "clsx";
import { TaskStatus } from "../types";
import { useStore } from "../store";
import { useT } from "../i18n";

interface Props {
  status?: TaskStatus;
  scheduledDate?: string | null;
  className?: string;
}

export function QuickAdd({ status = "todo", scheduledDate = null, className }: Props) {
  const [value, setValue] = useState("");
  const [habit, setHabit] = useState(false);
  const addTask = useStore((s) => s.addTask);
  const { t } = useT();

  // A daily habit only makes sense on a dated task (needs a start date to repeat).
  const canHabit = scheduledDate !== null;

  const submit = () => {
    if (!value.trim()) return;
    addTask(value, status, scheduledDate, habit && canHabit ? "daily" : null);
    setValue("");
  };

  const input = (
    <input
      data-quickadd
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") setValue("");
      }}
      placeholder={t("newTaskPlaceholder")}
      className={clsx(
        "w-full rounded-lg border border-dashed border-slate-300 bg-transparent px-2.5 py-1.5 text-sm dark:border-slate-600 dark:text-slate-100",
        "placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none dark:focus:bg-slate-900",
        !canHabit && className,
      )}
    />
  );

  if (!canHabit) return input;

  return (
    <div className={clsx("flex items-center gap-1.5", className)}>
      <div className="flex-1">{input}</div>
      <button
        type="button"
        onClick={() => setHabit((v) => !v)}
        title={t("dailyHabit")}
        aria-pressed={habit}
        aria-label={t("dailyHabit")}
        className={clsx(
          "shrink-0 rounded-lg border p-1.5 transition",
          habit
            ? "border-brand-400 bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"
            : "border-slate-300 text-slate-400 hover:text-slate-600 dark:border-slate-600 dark:hover:text-slate-200",
        )}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 9a6 6 0 0110-4.5L16 6M16 11a6 6 0 01-10 4.5L4 14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 3v3h-3M4 17v-3h3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
