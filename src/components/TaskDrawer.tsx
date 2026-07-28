import { useEffect, useState } from "react";
import clsx from "clsx";
import { useStore } from "../store";
import { Priority, Recurrence, DayPeriod } from "../types";
import { useT, Key } from "../i18n";

interface Draft {
  title: string;
  notes: string;
  priority: Priority;
  scheduledDate: string | null;
  dueDate: string | null;
  scheduledPeriod: DayPeriod | null;
  recurrence: Recurrence;
  goalId: string | null;
}

const PRIORITIES: { value: Priority; key: Key; dot: string }[] = [
  { value: "low", key: "low", dot: "bg-slate-400" },
  { value: "medium", key: "medium", dot: "bg-amber-400" },
  { value: "high", key: "high", dot: "bg-rose-500" },
];

const RECUR_OPTIONS: { value: Recurrence; key: Key }[] = [
  { value: null, key: "none" },
  { value: "daily", key: "repeatDaily" },
  { value: "weekly", key: "repeatWeekly" },
  { value: "monthly", key: "repeatMonthly" },
];

const PERIOD_OPTIONS: { value: DayPeriod | null; key: Key }[] = [
  { value: null, key: "unassignedPeriod" },
  { value: "morning", key: "morning" },
  { value: "afternoon", key: "afternoon" },
  { value: "evening", key: "evening" },
];

export function TaskDrawer() {
  const selectedId = useStore((s) => s.selectedTaskId);
  const task = useStore((s) => s.tasks.find((item) => item.id === s.selectedTaskId));
  const goals = useStore((s) => s.goals);
  const updateTask = useStore((s) => s.updateTask);
  const scheduleTask = useStore((s) => s.scheduleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const closeTask = useStore((s) => s.closeTask);
  const { t } = useT();

  // Buffer edits as a draft; nothing is written to the store until "Save".
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (task) {
      setDraft({
        title: task.title,
        notes: task.notes,
        priority: task.priority,
        scheduledDate: task.scheduledDate,
        dueDate: task.dueDate,
        scheduledPeriod: task.scheduledPeriod,
        recurrence: task.recurrence,
        goalId: task.goalId,
      });
    } else {
      setDraft(null);
    }
    // Re-sync the draft whenever a different task opens.
  }, [selectedId, task]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTask();
    };
    if (selectedId) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, closeTask]);

  if (!selectedId || !task || !draft) return null;

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const dirty =
    draft.title !== task.title ||
    draft.notes !== task.notes ||
    draft.priority !== task.priority ||
    draft.scheduledDate !== task.scheduledDate ||
    draft.dueDate !== task.dueDate ||
    draft.scheduledPeriod !== task.scheduledPeriod ||
    draft.recurrence !== task.recurrence ||
    draft.goalId !== task.goalId;

  const save = () => {
    // Non-date fields in one write. scheduledDate goes through scheduleTask
    // (it also fixes status + triggers timeline re-materialize).
    updateTask(task.id, {
      title: draft.title.trim() || task.title,
      notes: draft.notes,
      priority: draft.priority,
      recurrence: draft.recurrence,
      dueDate: draft.dueDate,
      goalId: draft.goalId,
    });
    if (draft.scheduledDate !== task.scheduledDate || draft.scheduledPeriod !== task.scheduledPeriod) {
      scheduleTask(task.id, draft.scheduledDate, draft.scheduledPeriod);
    }
    closeTask();
  };

  const activeGoals = goals.filter((goal) => !goal.deleted);

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="gd-backdrop absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={closeTask}
      />
      <aside className="gd-drawer absolute right-0 top-0 flex h-full w-96 max-w-[90vw] flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {t("editTask")}
            {dirty && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">{t("unsaved")}</span>}
          </h2>
          <button
            onClick={closeTask}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label={t("delete")}
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("taskTitle")}</label>
          <input
            value={draft.title}
            onChange={(event) => set({ title: event.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("startDate")}</label>
            <input
              type="date"
              value={draft.scheduledDate ?? ""}
              onChange={(event) => set({ scheduledDate: event.target.value || null })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("dueDate")}</label>
            <input
              type="date"
              value={draft.dueDate ?? ""}
              min={draft.scheduledDate ?? undefined}
              onChange={(event) => set({ dueDate: event.target.value || null })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {draft.scheduledDate && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("period")}</label>
            <div className="flex flex-wrap gap-1.5">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => set({ scheduledPeriod: option.value })}
                  className={clsx(
                    "rounded-lg border px-3 py-1.5 text-sm transition",
                    draft.scheduledPeriod === option.value
                      ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
                  )}
                >
                  {t(option.key)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("priority")}</label>
          <div className="flex gap-2">
            {PRIORITIES.map((option) => (
              <button
                key={option.value}
                onClick={() => set({ priority: option.value })}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition",
                  draft.priority === option.value
                    ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
                )}
              >
                <span className={clsx("h-2 w-2 rounded-full", option.dot)} />
                {t(option.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("repeat")}</label>
          <div className="flex flex-wrap gap-1.5">
            {RECUR_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => set({ recurrence: option.value })}
                className={clsx(
                  "rounded-lg border px-3 py-1.5 text-sm transition",
                  draft.recurrence === option.value
                    ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
                )}
              >
                {t(option.key)}
              </button>
            ))}
          </div>
          {draft.recurrence && (
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{t("repeatHint")}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("goals")}</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => set({ goalId: null })}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs transition",
                draft.goalId === null
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
              )}
            >
              {t("noGoal")}
            </button>
            {activeGoals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => set({ goalId: goal.id })}
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs transition",
                  draft.goalId === goal.id ? "border-transparent text-white" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
                )}
                style={draft.goalId === goal.id ? { backgroundColor: goal.color } : undefined}
              >
                {goal.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{t("notes")}</label>
          <textarea
            value={draft.notes}
            onChange={(event) => set({ notes: event.target.value })}
            placeholder={t("notesPlaceholder")}
            className="min-h-32 flex-1 resize-none rounded-lg border border-slate-200 p-3 text-sm leading-relaxed focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
          <button
            onClick={save}
            disabled={!dirty}
            className={clsx(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition",
              dirty ? "bg-brand-600 hover:bg-brand-700" : "cursor-default bg-slate-300 dark:bg-slate-600",
            )}
          >
            {t("saveTask")}
          </button>
          <button
            onClick={() => {
              deleteTask(task.id);
              closeTask();
            }}
            className="rounded-lg border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:hover:bg-rose-500/10"
          >
            {t("delete")}
          </button>
        </div>
      </aside>
    </div>
  );
}
