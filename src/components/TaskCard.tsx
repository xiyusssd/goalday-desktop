import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Task } from "../types";
import { useStore, isOverdue, isDueToday } from "../store";
import { today, formatDay } from "../lib/date";
import { useT } from "../i18n";
import { useStitch, PawMark } from "./stitch";

const priorityDot: Record<Task["priority"], string> = {
  high: "bg-rose-500",
  medium: "bg-amber-400",
  low: "bg-slate-300",
};

interface Props {
  task: Task;
  compact?: boolean;
  /** Show the period as a badge (used on the daily plan); click unassigns it. */
  showPeriod?: boolean;
}

const periodLabel: Record<NonNullable<Task["scheduledPeriod"]>, { zh: string; en: string }> = {
  morning: { zh: "早", en: "AM" },
  afternoon: { zh: "午", en: "PM" },
  evening: { zh: "晚", en: "Eve" },
};

export function TaskCard({ task, compact, showPeriod }: Props) {
  const toggleDone = useStore((s) => s.toggleDone);
  const openDeleteDialog = useStore((s) => s.openDeleteDialog);
  const scheduleTask = useStore((s) => s.scheduleTask);
  const openTask = useStore((s) => s.openTask);
  const goal = useStore((s) => s.goals.find((g) => g.id === task.goalId && !g.deleted));
  const { t, lang } = useT();
  const stitch = useStitch();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const done = task.status === "done";
  const todayIso = today();
  const overdue = isOverdue(task, todayIso);
  const dueToday = !overdue && isDueToday(task, todayIso);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative rounded-lg border bg-white text-sm shadow-sm transition dark:bg-slate-800",
        "hover:shadow",
        !overdue && !dueToday && "border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500",
        overdue && "border-slate-200 border-l-4 border-l-rose-500 dark:border-slate-700",
        dueToday && "border-slate-200 border-l-4 border-l-amber-400 dark:border-slate-700",
        isDragging && "opacity-40",
        compact ? "px-1.5 py-1.5" : "px-2.5 py-2",
      )}
    >
      <div className={clsx("flex items-start", compact ? "gap-1.5" : "gap-2")}>
        <button
          onClick={() => toggleDone(task.id)}
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition",
            done ? "border-brand-500 bg-brand-500" : "border-slate-300 hover:border-brand-400 dark:border-slate-600",
          )}
          aria-label="toggle done"
        >
          {done &&
            (stitch ? (
              <PawMark className="h-full w-full p-[1px] text-white" />
            ) : (
              <svg viewBox="0 0 12 12" className="h-full w-full text-white">
                <path
                  d="M3 6.5l2 2 4-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
        </button>

        <div
          {...listeners}
          {...attributes}
          onClick={() => openTask(task.id)}
          className="min-w-0 flex-1 cursor-grab active:cursor-grabbing"
        >
          <div
            className={clsx(
              "break-words leading-snug dark:text-slate-100",
              compact && "text-xs",
              done && "text-slate-400 line-through dark:text-slate-500",
            )}
          >
            {task.title}
          </div>
          {(goal || task.priority !== "medium" || overdue || dueToday || task.recurrence || task.seriesId || (showPeriod && task.scheduledPeriod)) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={clsx("h-1.5 w-1.5 rounded-full", priorityDot[task.priority])} />
              {(task.recurrence || task.seriesId) && (
                <svg viewBox="0 0 20 20" className="h-3 w-3 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" aria-label={t("repeat")}>
                  <path d="M4 9a6 6 0 0110-4.5L16 6M16 11a6 6 0 01-10 4.5L4 14" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3v3h-3M4 17v-3h3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {overdue && (
                <span className="rounded bg-rose-100 px-1 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                  {t("overdue")}
                </span>
              )}
              {dueToday && (
                <span className="rounded bg-amber-100 px-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  {t("dueToday")}
                </span>
              )}
              {task.dueDate && !overdue && !dueToday && (
                <span className="rounded bg-slate-100 px-1 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  {t("due")} {formatDay(task.dueDate, lang)}
                </span>
              )}
              {showPeriod && task.scheduledPeriod && (
                <button
                  onClick={() => scheduleTask(task.id, task.scheduledDate, null)}
                  className="rounded bg-brand-100 px-1 text-[10px] font-semibold text-brand-700 hover:bg-brand-200"
                >
                  {periodLabel[task.scheduledPeriod][lang]}
                </button>
              )}
              {goal && (
                <span
                  className="truncate rounded px-1 text-[10px] font-medium"
                  style={{ backgroundColor: `${goal.color}22`, color: goal.color }}
                >
                  {goal.title}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => openDeleteDialog(task.id)}
          className={clsx(
            "text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-rose-500",
            compact ? "absolute right-1 top-1" : "shrink-0",
          )}
          aria-label="delete"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M6 7h8l-.7 9.1a1 1 0 01-1 .9H7.7a1 1 0 01-1-.9L6 7zm2.5-3h3l.5 1H14a1 1 0 110 2H6a1 1 0 110-2h2l.5-1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
