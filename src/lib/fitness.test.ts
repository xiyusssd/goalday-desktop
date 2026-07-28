import assert from "node:assert/strict";
import { totalsForDates, minutesPerDay, workoutStreak, workoutMeta } from "./fitness.ts";
import { addDays } from "./date.ts";
import type { Workout } from "../types";

let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
};

const wo = (over: Partial<Workout>): Workout => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  type: over.type ?? "running",
  durationMin: over.durationMin ?? 30,
  calories: over.calories ?? null,
  sets: over.sets ?? null,
  note: over.note ?? "",
  date: over.date ?? "2026-07-28",
  createdAt: over.createdAt ?? 1,
  updatedAt: over.updatedAt ?? 1,
  deleted: over.deleted ?? false,
});

const sub = (date: string, n: number) => addDays(date, -n);

check("workoutMeta falls back to 'other' for unknown", () => {
  assert.equal(workoutMeta("running").type, "running");
});

check("totalsForDates aggregates sessions/minutes/calories in-window", () => {
  const days = ["2026-07-27", "2026-07-28"];
  const rows = [
    wo({ date: "2026-07-27", durationMin: 20, calories: 200 }),
    wo({ date: "2026-07-28", durationMin: 40, calories: 400 }),
    wo({ date: "2026-07-29", durationMin: 99, calories: 999 }), // out of window
  ];
  assert.deepEqual(totalsForDates(rows, days), { sessions: 2, minutes: 60, calories: 600 });
});

check("totalsForDates skips soft-deleted", () => {
  const days = ["2026-07-28"];
  const rows = [wo({ date: "2026-07-28", durationMin: 30, deleted: true })];
  assert.deepEqual(totalsForDates(rows, days), { sessions: 0, minutes: 0, calories: 0 });
});

check("minutesPerDay aligns to the dates array", () => {
  const days = ["2026-07-27", "2026-07-28", "2026-07-29"];
  const rows = [
    wo({ date: "2026-07-27", durationMin: 15 }),
    wo({ date: "2026-07-27", durationMin: 15 }),
    wo({ date: "2026-07-29", durationMin: 45 }),
  ];
  assert.deepEqual(minutesPerDay(rows, days), [30, 0, 45]);
});

check("workoutStreak counts consecutive days up to today", () => {
  const rows = [
    wo({ date: "2026-07-28" }),
    wo({ date: "2026-07-27" }),
    wo({ date: "2026-07-26" }),
    // gap on 07-25
    wo({ date: "2026-07-24" }),
  ];
  assert.equal(workoutStreak(rows, "2026-07-28", sub), 3);
});

check("workoutStreak is 0 when today has no workout", () => {
  const rows = [wo({ date: "2026-07-27" })];
  assert.equal(workoutStreak(rows, "2026-07-28", sub), 0);
});

console.log(`\n${passed} passed`);
