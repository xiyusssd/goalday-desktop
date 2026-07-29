import { test } from "node:test";
import assert from "node:assert/strict";
import { msToIsoDate, completionCountByDate, completionStreak } from "./stats.ts";

// A local-midnight timestamp for a given ISO date, so tests are TZ-agnostic.
function at(iso: string, hour = 12): number {
  return new Date(`${iso}T${String(hour).padStart(2, "0")}:00:00`).getTime();
}

test("msToIsoDate formats a timestamp as local YYYY-MM-DD", () => {
  assert.equal(msToIsoDate(at("2026-07-29", 9)), "2026-07-29");
  assert.equal(msToIsoDate(at("2026-01-05", 23)), "2026-01-05");
});

test("completionCountByDate counts completions per date, ignoring null", () => {
  const counts = completionCountByDate([
    { completedAt: at("2026-07-29") },
    { completedAt: at("2026-07-29") },
    { completedAt: at("2026-07-28") },
    { completedAt: null },
  ]);
  assert.equal(counts.get("2026-07-29"), 2);
  assert.equal(counts.get("2026-07-28"), 1);
  assert.equal(counts.size, 2);
});

test("completionStreak counts consecutive days ending today", () => {
  const index = completionCountByDate([
    { completedAt: at("2026-07-29") },
    { completedAt: at("2026-07-28") },
    { completedAt: at("2026-07-27") },
  ]);
  assert.equal(completionStreak(index, "2026-07-29"), 3);
});

test("completionStreak is 0 when today has no completion", () => {
  const index = completionCountByDate([{ completedAt: at("2026-07-28") }]);
  assert.equal(completionStreak(index, "2026-07-29"), 0);
});

test("completionStreak stops at the first gap", () => {
  const index = completionCountByDate([
    { completedAt: at("2026-07-29") },
    { completedAt: at("2026-07-28") },
    // gap on 07-27
    { completedAt: at("2026-07-26") },
  ]);
  assert.equal(completionStreak(index, "2026-07-29"), 2);
});

test("completionStreak crosses a month boundary correctly", () => {
  const index = completionCountByDate([
    { completedAt: at("2026-08-01") },
    { completedAt: at("2026-07-31") },
    { completedAt: at("2026-07-30") },
  ]);
  assert.equal(completionStreak(index, "2026-08-01"), 3);
});
