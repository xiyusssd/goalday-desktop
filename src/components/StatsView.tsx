import { useStore, activeTasks } from "../store";
import { weekDays, today } from "../lib/date";
import { useT } from "../i18n";
import dayjs from "dayjs";

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

  const all = activeTasks(tasks);
  const done = all.filter((x) => x.status === "done");
  const totalDone = done.length;
  const rate = all.length ? Math.round((totalDone / all.length) * 100) : 0;

  // Per-day completions for the current week.
  const days = weekDays(weekStart);
  const labels = tArr("weekdayShort");
  const perDay = days.map(
    (d) => done.filter((x) => x.completedAt && dayjs(x.completedAt).format("YYYY-MM-DD") === d).length,
  );
  const maxDay = Math.max(1, ...perDay);

  // Streak: consecutive days up to today with >=1 completion.
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = dayjs(today()).subtract(i, "day").format("YYYY-MM-DD");
    const c = done.some((x) => x.completedAt && dayjs(x.completedAt).format("YYYY-MM-DD") === d);
    if (c) streak++;
    else if (i > 0) break;
    else break;
  }

  // By goal.
  const byGoal = goals
    .filter((g) => !g.deleted)
    .map((g) => ({
      goal: g,
      total: all.filter((x) => x.goalId === g.id).length,
      done: done.filter((x) => x.goalId === g.id).length,
    }))
    .filter((x) => x.total > 0);

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
