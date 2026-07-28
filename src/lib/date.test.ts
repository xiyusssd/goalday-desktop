import assert from "node:assert/strict";
import { nextRecurrenceDate, daysBetween } from "./date.ts";

let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
};

check("null recurrence yields null", () => {
  assert.equal(nextRecurrenceDate("2026-07-27", null), null);
});

check("daily adds one day", () => {
  assert.equal(nextRecurrenceDate("2026-07-27", "daily"), "2026-07-28");
});

check("daily rolls over month end", () => {
  assert.equal(nextRecurrenceDate("2026-07-31", "daily"), "2026-08-01");
});

check("weekly adds seven days", () => {
  assert.equal(nextRecurrenceDate("2026-07-27", "weekly"), "2026-08-03");
});

check("monthly adds one month", () => {
  assert.equal(nextRecurrenceDate("2026-07-27", "monthly"), "2026-08-27");
});

check("monthly clamps short months (Jan 31 -> Feb)", () => {
  // dayjs clamps to the last valid day of the target month.
  assert.equal(nextRecurrenceDate("2026-01-31", "monthly"), "2026-02-28");
});

check("daysBetween counts forward days", () => {
  assert.equal(daysBetween("2026-07-27", "2026-07-30"), 3);
});

check("daysBetween is negative when b precedes a", () => {
  assert.equal(daysBetween("2026-07-30", "2026-07-27"), -3);
});

console.log(`\n${passed} passed`);
