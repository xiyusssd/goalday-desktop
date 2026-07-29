import { useMemo } from "react";
import { useStore, activeTasks } from "../store";
import { weekDays, today } from "../lib/date";
import { completionCountByDate, completionStreak } from "../lib/stats";
import { useT } from "../i18n";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">{value}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-slate-500">{sub}</div>}
    </div>
  );
}

export function StatsView() {
  const tasks = useStore((s) => s.tasks);
  const goals = useStore((s) => s.goals);
  const weekStart = useStore((s) => s.currentWeekStart);
  const { t, tArr } = useT();

  const labels = tArr("weekdayShort");

  const { rate, totalDone, streak, perDay, maxDay, byGoal } = useMemo(() => {
    const all = activeTasks(tasks);
    const done = all.filter((x) => x.status === "done");
    const totalDone = done.length;
    const byDate = completionCountByDate(done);

    // Per-day completions for the current week.
    const perDay = weekDays(weekStart).map((d) => byDate.get(d) ?? 0);

    const byGoal = goals
      .filter((g) => !g.deleted)
      .map((g) => ({
        goal: g,
        total: all.filter((x) => x.goalId === g.id).length,
        done: done.filter((x) => x.goalId === g.id).length,
      }))
      .filter((x) => x.total > 0);

    return {
      totalDone,
      rate: all.length ? Math.round((totalDone / all.length) * 100) : 0,
      streak: completionStreak(byDate, today()),
      perDay,
      maxDay: Math.max(1, ...perDay),
      byGoal,
    };
  }, [tasks, goals, weekStart]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t("completionRate")} value={`${rate}%`} />
        <StatCard label={t("totalDone")} value={String(totalDone)} />
        <StatCard label={t("streak")} value={String(streak)} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("weeklyReview")}</h3>
        <div className="flex h-40 items-end justify-between gap-2">
          {perDay.map((c, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-brand-400 transition-all"
                  style={{ height: `${(c / maxDay) * 100}%`, minHeight: c ? "6px" : "0" }}
                  title={`${c}`}
                />
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{labels[i]}</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {byGoal.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("byGoal")}</h3>
          <div className="flex flex-col gap-3">
            {byGoal.map(({ goal, total, done: d }) => (
              <div key={goal.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium" style={{ color: goal.color }}>
                    {goal.title}
                  </span>
                  <span className="text-slate-400">
                    {d}/{total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(d / total) * 100}%`, backgroundColor: goal.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
