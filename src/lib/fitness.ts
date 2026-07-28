import type { Workout, WorkoutType } from "../types";

// Pure, dependency-free fitness helpers (workout-type metadata + weekly rollups
// + streak). No React/store imports so it runs under the Node test runner.

export interface WorkoutMeta {
  type: WorkoutType;
  labelKey: string;
  icon: string;
  color: string;
}

/** Workout types, in display order. */
export const WORKOUT_TYPES: WorkoutMeta[] = [
  { type: "running", labelKey: "woRunning", icon: "🏃", color: "#f97316" },
  { type: "cycling", labelKey: "woCycling", icon: "🚴", color: "#0ea5e9" },
  { type: "strength", labelKey: "woStrength", icon: "🏋️", color: "#ef4444" },
  { type: "yoga", labelKey: "woYoga", icon: "🧘", color: "#8b5cf6" },
  { type: "swimming", labelKey: "woSwimming", icon: "🏊", color: "#06b6d4" },
  { type: "walking", labelKey: "woWalking", icon: "🚶", color: "#10b981" },
  { type: "ball", labelKey: "woBall", icon: "⚽", color: "#f59e0b" },
  { type: "other", labelKey: "woOther", icon: "💪", color: "#64748b" },
];

const META_BY_TYPE = new Map(WORKOUT_TYPES.map((w) => [w.type, w]));

export function workoutMeta(type: WorkoutType): WorkoutMeta {
  return META_BY_TYPE.get(type) ?? WORKOUT_TYPES[WORKOUT_TYPES.length - 1];
}

/** Live (non-deleted) workouts on a given ISO date, newest first. */
export function workoutsForDay(workouts: Workout[], date: string): Workout[] {
  return workouts
    .filter((w) => !w.deleted && w.date === date)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export interface WorkoutTotals {
  sessions: number;
  minutes: number;
  calories: number;
}

/** Aggregate sessions / minutes / calories over a set of ISO dates (a week). */
export function totalsForDates(workouts: Workout[], dates: string[]): WorkoutTotals {
  const set = new Set(dates);
  let sessions = 0;
  let minutes = 0;
  let calories = 0;
  for (const w of workouts) {
    if (w.deleted || !set.has(w.date)) continue;
    sessions += 1;
    minutes += Math.max(0, w.durationMin) || 0;
    calories += Math.max(0, w.calories ?? 0);
  }
  return { sessions, minutes, calories };
}

/** Minutes trained per date, aligned to the given `dates` array. */
export function minutesPerDay(workouts: Workout[], dates: string[]): number[] {
  return dates.map((d) =>
    workouts
      .filter((w) => !w.deleted && w.date === d)
      .reduce((sum, w) => sum + (Math.max(0, w.durationMin) || 0), 0),
  );
}

/**
 * Consecutive days up to and including `todayIso` that have >=1 workout.
 * `subtract(date, n)` returns the ISO date n days before `date` (injected so
 * this stays dependency-free and testable).
 */
export function workoutStreak(
  workouts: Workout[],
  todayIso: string,
  subtract: (date: string, days: number) => string,
): number {
  const trained = new Set(workouts.filter((w) => !w.deleted).map((w) => w.date));
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const d = subtract(todayIso, i);
    if (trained.has(d)) streak += 1;
    else break;
  }
  return streak;
}
