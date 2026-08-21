import { useEffect, useState } from "react";
import { useStore } from "../store";
import { useT } from "../i18n";

/**
 * Delete-scope chooser. Recurring series show two options (whole task vs this
 * day); plain tasks and series heads show a single delete action. Every task
 * can also be cleared as "missed" with a reason logged into the day's journal.
 */
export function DeleteTaskDialog() {
  const pendingDeleteId = useStore((s) => s.pendingDeleteId);
  const task = useStore((s) => s.tasks.find((x) => x.id === s.pendingDeleteId));
  const deleteTask = useStore((s) => s.deleteTask);
  const deleteTaskSeries = useStore((s) => s.deleteTaskSeries);
  const skipTaskDay = useStore((s) => s.skipTaskDay);
  const missTask = useStore((s) => s.missTask);
  const closeDeleteDialog = useStore((s) => s.closeDeleteDialog);
  const { t } = useT();

  const [stage, setStage] = useState<"choose" | "reason">("choose");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!pendingDeleteId) return;
    setStage("choose");
    setReason("");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDeleteDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDeleteId, closeDeleteDialog]);

  if (!pendingDeleteId || !task) return null;

  const isHead = task.recurrence !== null;
  const isInstance = !isHead && task.seriesId !== null;

  const act = (fn: () => void) => () => {
    fn();
    closeDeleteDialog();
  };

  const confirmMiss = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    missTask(task.id, `${t("missedLinePrefix")} ${task.title} — ${trimmed}`);
    closeDeleteDialog();
  };

  const dangerBtn =
    "w-full rounded-lg bg-rose-500 px-4 py-2 text-left text-sm font-medium text-white transition hover:bg-rose-600";
  const optionBtn =
    "w-full rounded-lg border border-slate-200 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700";
  const hint = "mt-1 text-xs text-slate-400 dark:text-slate-500";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="gd-backdrop absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={closeDeleteDialog}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="gd-dialog w-80 max-w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {stage === "reason" ? t("missedOption") : t("deleteTitle")}
          </h2>
          <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
            {task.title}
          </p>

          {stage === "choose" ? (
            <div className="mt-4 flex flex-col gap-3">
              {(isHead || isInstance) && (
                <div>
                  <button onClick={act(() => deleteTaskSeries(task.id))} className={dangerBtn}>
                    {t("deleteSeries")}
                  </button>
                  <p className={hint}>{t("deleteSeriesHint")}</p>
                </div>
              )}

              {isInstance && (
                <div>
                  <button onClick={act(() => skipTaskDay(task.id))} className={optionBtn}>
                    {t("deleteThisDay")}
                  </button>
                  <p className={hint}>{t("deleteThisDayHint")}</p>
                </div>
              )}

              {!isHead && !isInstance && (
                <button onClick={act(() => deleteTask(task.id))} className={dangerBtn}>
                  {t("delete")}
                </button>
              )}

              {!isHead && (
                <div>
                  <button onClick={() => setStage("reason")} className={optionBtn}>
                    {t("missedOption")}
                  </button>
                  <p className={hint}>{t("missedHint")}</p>
                </div>
              )}

              <button
                onClick={closeDeleteDialog}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                {t("cancel")}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <textarea
                autoFocus
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("missedReasonPlaceholder")}
                className="min-h-24 resize-none rounded-lg border border-slate-200 p-3 text-sm leading-relaxed focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                onClick={confirmMiss}
                disabled={!reason.trim()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-default disabled:bg-slate-300 dark:disabled:bg-slate-600"
              >
                {t("missedConfirm")}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setStage("choose")}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {t("back")}
                </button>
                <button
                  onClick={closeDeleteDialog}
                  className="flex-1 rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}