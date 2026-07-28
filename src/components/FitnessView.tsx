import { useMemo, useState } from "react";
import clsx from "clsx";
import { useStore } from "../store";
import { useT, Key } from "../i18n";
import { today, weekDays, addDays } from "../lib/date";
import type { WorkoutType } from "../types";
import {
  WORKOUT_TYPES,
  workoutMeta,
  workoutsForDay,
  totalsForDates,
  minutesPerDay,
  workoutStreak,
} from "../lib/fitness";
import { StitchMascot } from "./stitch";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{value}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export function FitnessView() {
  const { t, tArr } = useT();
  const workouts = useStore((s) => s.workouts);
  const addWorkout = useStore((s) => s.addWorkout);
  const deleteWorkout = useStore((s) => s.deleteWorkout);
  const weekStart = useStore((s) => s.currentWeekStart);

  const [type, setType] = useState<WorkoutType>("running");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [sets, setSets] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const labels = tArr("weekdayShort");
  const weekTotals = useMemo(() => totalsForDates(workouts, days), [workouts, days]);
  const perDay = useMemo(() => minutesPerDay(workouts, days), [workouts, days]);
  const maxDay = Math.max(1, ...perDay);
  const streak = useMemo(() => workoutStreak(workouts, today(), (d, n) => addDays(d, -n)), [workouts]);
  const todaysWorkouts = useMemo(() => workoutsForDay(workouts, date), [workouts, date]);

  const submit = () => {
    const mins = parseInt(duration, 10);
    if (!mins || mins <= 0) return;
    addWorkout({
      type,
      durationMin: mins,
      calories: calories ? parseInt(calories, 10) : null,
      sets: sets ? parseInt(sets, 10) : null,
      note: note.trim(),
      date,
    });
    setDuration("");
    setCalories("");
    setSets("");
    setNote("");
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* Left: log form */}
      <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("addWorkout")}</h2>
        <div className="grid grid-cols-4 gap-1.5">
          {WORKOUT_TYPES.map((w) => (
            <button
              key={w.type}
              onClick={() => setType(w.type)}
              className={clsx(
                "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-[11px] transition",
                type === w.type
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/20 dark:text-brand-300"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
              )}
            >
              <span className="text-base leading-none">{w.icon}</span>
              {t(w.labelKey as Key)}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          {t("duration")} ({t("minutes")})
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="numeric"
            placeholder="30"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            {t("calories")}
            <input
              value={calories}
              onChange={(e) => setCalories(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="—"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            {t("sets")}
            <input
              value={sets}
              onChange={(e) => setSets(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="—"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
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
          {t("addWorkout")}
        </button>
      </div>

      {/* Right: week stats + today's log */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t("weekSessions")} value={String(weekTotals.sessions)} />
          <StatCard label={`${t("weekMinutes")} (${t("minutes")})`} value={String(weekTotals.minutes)} />
          <StatCard label={t("workoutStreak")} value={String(streak)} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("weekTrend")}</h3>
          <div className="flex h-40 items-end justify-between gap-2">
            {perDay.map((m, i) => (
              <button
                key={i}
                onClick={() => setDate(days[i])}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${m} ${t("minutes")}`}
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={clsx(
                      "w-full rounded-t transition-all",
                      days[i] === date ? "bg-brand-500" : "bg-brand-300",
                    )}
                    style={{ height: `${(m / maxDay) * 100}%`, minHeight: m ? "6px" : "0" }}
                  />
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">{labels[i]}</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{m}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{date}</h3>
          {todaysWorkouts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-sm text-slate-400">
              <StitchMascot size={72} />
              {t("noWorkoutsToday")}
            </div>
          ) : (
            todaysWorkouts.map((w) => {
              const meta = workoutMeta(w.type);
              return (
                <div
                  key={w.id}
                  className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ backgroundColor: `${meta.color}22` }}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t(meta.labelKey as Key)}
                      {w.note && <span className="ml-2 text-xs font-normal text-slate-400">{w.note}</span>}
                    </div>
                    <div className="text-xs text-slate-400">
                      {w.durationMin} {t("minutes")}
                      {w.calories != null && ` · ${w.calories} ${t("calories")}`}
                      {w.sets != null && ` · ${w.sets} ${t("sets")}`}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWorkout(w.id)}
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
