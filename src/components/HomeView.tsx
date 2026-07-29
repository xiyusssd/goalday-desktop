import dayjs from "dayjs";
import { useMemo } from "react";
import clsx from "clsx";
import { useStore, activeTasks, tasksForDay, isOverdue, dayCompletion } from "../store";
import { today, formatDay } from "../lib/date";
import { completionCountByDate, completionStreak } from "../lib/stats";
import { useT, Key } from "../i18n";
import { ProgressRing } from "./ProgressRing";
import { useStitch, StitchMascot, PawMark } from "./stitch";

/** Time-of-day greeting + an encouraging slogan, keyed by the current hour. */
function timeGreeting(): { greet: Key; slogan: Key } {
  const h = dayjs().hour();
  if (h < 5) return { greet: "greetingNight", slogan: "sloganNight" };
  if (h < 9) return { greet: "greetingEarly", slogan: "sloganEarly" };
  if (h < 11) return { greet: "greetingMorning", slogan: "sloganMorning" };
  if (h < 13) return { greet: "greetingNoon", slogan: "sloganNoon" };
  if (h < 18) return { greet: "greetingAfternoon", slogan: "sloganAfternoon" };
  if (h < 23) return { greet: "greetingEvening", slogan: "sloganEvening" };
  return { greet: "greetingNight", slogan: "sloganNight" };
}

function Section({ title, count, icon, tint, children }: {
  title: string;
  count?: number;
  icon?: string;
  tint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center gap-2">
        {icon && (
          <span className={clsx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", tint)}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-slate-100 px-2 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function TaskRow({ id, title, meta, done, onToggle, onOpen }: {
  id: string;
  title: string;
  meta?: string;
  done: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const stitch = useStitch();
  return (
    <div key={id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50">
      <button
        onClick={onToggle}
        className={`h-4 w-4 shrink-0 rounded-full border-2 transition ${done ? "border-brand-500 bg-brand-500" : "border-slate-300 hover:border-brand-400 dark:border-slate-600"}`}
        aria-label="toggle done"
      >
        {done &&
          (stitch ? (
            <PawMark className="h-full w-full p-[1px] text-white" />
          ) : (
            <svg viewBox="0 0 12 12" className="h-full w-full text-white">
              <path d="M3 6.5l2 2 4-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className={`text-sm ${done ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}>
          {title}
        </span>
      </button>
      {meta && <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{meta}</span>}
    </div>
  );
}

export function HomeView() {
  const tasks = useStore((s) => s.tasks);
  const goals = useStore((s) => s.goals);
  const toggleDone = useStore((s) => s.toggleDone);
  const openTask = useStore((s) => s.openTask);
  const { t, lang } = useT();
  const stitch = useStitch();

  const greeting = timeGreeting();
  const todayIso = today();

  // Derived task stats: recompute only when tasks/goals/day change, not on
  // every language/theme re-render.
  const { progress, todays, overdue, doing, totalDone, rate, streak, byGoal } = useMemo(() => {
    const all = activeTasks(tasks);
    const totalDone = all.filter((x) => x.status === "done").length;
    // "进行中就是今天的,不写明天的": doing tasks actionable now —
    // unscheduled or scheduled today/earlier, never future instances.
    const doing = all
      .filter((x) => x.status === "doing" && (x.scheduledDate === null || x.scheduledDate <= todayIso))
      .sort((a, b) => a.order - b.order);
    const byGoal = goals
      .filter((g) => !g.deleted)
      .map((g) => ({
        goal: g,
        total: all.filter((x) => x.goalId === g.id).length,
        done: all.filter((x) => x.goalId === g.id && x.status === "done").length,
      }))
      .filter((x) => x.total > 0);
    return {
      progress: dayCompletion(tasks, todayIso),
      todays: tasksForDay(tasks, todayIso),
      overdue: all.filter((x) => isOverdue(x, todayIso)),
      doing,
      totalDone,
      rate: all.length ? Math.round((totalDone / all.length) * 100) : 0,
      streak: completionStreak(completionCountByDate(all), todayIso),
      byGoal,
    };
  }, [tasks, goals, todayIso]);

  const stats: { label: Key; value: string; icon: string; tint: string }[] = [
    { label: "completionRate", value: `${rate}%`, tint: "text-brand-500 bg-brand-50 dark:bg-brand-500/15", icon: "M12 3a9 9 0 109 9M12 3v9l6.5 6.5" },
    { label: "streak", value: String(streak), tint: "text-orange-500 bg-orange-50 dark:bg-orange-500/15", icon: "M12 3c1 3-1 4-1 6a3 3 0 006 0c0-1 0-2-1-3 2 1 3 3 3 6a6 6 0 11-12 0c0-3 3-5 5-9z" },
    { label: "totalDone", value: String(totalDone), tint: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/15", icon: "M5 13l4 4L19 7" },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pb-2">
      {/* Hero: greeting + big today ring */}
      <section className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm dark:border-slate-700 dark:from-brand-500/10 dark:to-slate-800">
        {stitch && (
          <svg viewBox="0 0 400 60" className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full text-brand-200 dark:text-brand-500/30" preserveAspectRatio="none" fill="currentColor">
            <path d="M0 30c40-20 80-20 120 0s80 20 120 0 80-20 120 0 40 15 40 15V60H0z" />
          </svg>
        )}
        <div className="relative">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t(greeting.greet)}</div>
          <div className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-300">{t(greeting.slogan)}</div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDay(todayIso, lang)}</div>
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {progress.total === 0
              ? t("noTodayTasks")
              : progress.done === progress.total
                ? t("allDoneToday")
                : `${progress.done} / ${progress.total}`}
          </div>
        </div>
        <div className="relative flex items-center gap-4">
          {stitch && <StitchMascot size={88} className="hidden sm:inline-block" />}
          <ProgressRing rate={progress.rate} done={progress.done} total={progress.total} label={t("todayPlan")} size={150} />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <span className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", s.tint)}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t(s.label)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Section
          title={t("todayTasks")}
          count={todays.length}
          tint="text-brand-500 bg-brand-50 dark:bg-brand-500/15"
          icon="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z"
        >
          {todays.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-3">
              {stitch && <StitchMascot size={64} className="opacity-90" />}
              <p className="text-sm text-slate-400">{t("noTodayTasks")}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {todays.map((x) => (
                <TaskRow
                  key={x.id}
                  id={x.id}
                  title={x.title}
                  done={x.status === "done"}
                  onToggle={() => toggleDone(x.id)}
                  onOpen={() => openTask(x.id)}
                />
              ))}
            </div>
          )}
        </Section>

        <Section
          title={t("overdueTasks")}
          count={overdue.length}
          tint="text-rose-500 bg-rose-50 dark:bg-rose-500/15"
          icon="M12 8v5M12 16.5v.5M10.3 4l-6 10a2 2 0 001.7 3h12a2 2 0 001.7-3l-6-10a2 2 0 00-3.4 0z"
        >
          {overdue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-3">
              {stitch && <StitchMascot size={64} className="opacity-90" />}
              <p className="text-sm text-slate-400">{t("noOverdue")}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {overdue.map((x) => (
                <TaskRow
                  key={x.id}
                  id={x.id}
                  title={x.title}
                  meta={x.dueDate ?? x.scheduledDate ? formatDay((x.dueDate ?? x.scheduledDate) as string, lang) : undefined}
                  done={x.status === "done"}
                  onToggle={() => toggleDone(x.id)}
                  onOpen={() => openTask(x.id)}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section
        title={t("doing")}
        count={doing.length}
        tint="text-brand-500 bg-brand-50 dark:bg-brand-500/15"
        icon="M4 5h4v14H4zM10 5h4v14h-4zM16 5h4v14h-4z"
      >
        {doing.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-3">
            {stitch && <StitchMascot size={64} className="opacity-90" />}
            <p className="text-sm text-slate-400">{t("noTasks")}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {doing.map((x) => (
              <TaskRow
                key={x.id}
                id={x.id}
                title={x.title}
                meta={x.scheduledDate && x.scheduledDate < todayIso ? formatDay(x.scheduledDate, lang) : undefined}
                done={false}
                onToggle={() => toggleDone(x.id)}
                onOpen={() => openTask(x.id)}
              />
            ))}
          </div>
        )}
      </Section>

      {byGoal.length > 0 && (
        <Section
          title={t("goalProgress")}
          tint="text-violet-500 bg-violet-50 dark:bg-violet-500/15"
          icon="M12 3a9 9 0 100 18 9 9 0 000-18zM12 7a5 5 0 100 10 5 5 0 000-10zM12 11a1 1 0 100 2 1 1 0 000-2z"
        >
          <div className="flex flex-col gap-3">
            {byGoal.map(({ goal, total, done }) => (
              <div key={goal.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium" style={{ color: goal.color }}>{goal.title}</span>
                  <span className="text-slate-400">{done}/{total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="h-full rounded-full" style={{ width: `${(done / total) * 100}%`, backgroundColor: goal.color }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
