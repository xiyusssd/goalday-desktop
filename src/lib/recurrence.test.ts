import assert from "node:assert/strict";
import { occurrenceDates, dueForOccurrence, reconcileSeries } from "./recurrence.ts";
import type { SeriesMember } from "./recurrence.ts";

const head = (date: string): SeriesMember => ({ id: "H", scheduledDate: date, status: "doing", isHead: true });
const inst = (id: string, date: string, status: SeriesMember["status"] = "doing"): SeriesMember => ({ id, scheduledDate: date, status, isHead: false });

let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
};

check("one-off yields no occurrences", () => {
  assert.deepEqual(occurrenceDates("2026-07-27", null, "2026-08-30"), []);
});

check("daily fills every day after latest up to upto", () => {
  assert.deepEqual(occurrenceDates("2026-07-27", "daily", "2026-07-30"), [
    "2026-07-28",
    "2026-07-29",
    "2026-07-30",
  ]);
});

check("excludes latest itself, includes upto boundary", () => {
  const dates = occurrenceDates("2026-07-27", "daily", "2026-07-28");
  assert.deepEqual(dates, ["2026-07-28"]);
});

check("caught up (upto == latest) yields nothing", () => {
  assert.deepEqual(occurrenceDates("2026-07-27", "daily", "2026-07-27"), []);
});

check("weekly steps by 7 days", () => {
  assert.deepEqual(occurrenceDates("2026-07-27", "weekly", "2026-08-17"), [
    "2026-08-03",
    "2026-08-10",
    "2026-08-17",
  ]);
});

check("monthly steps by month", () => {
  assert.deepEqual(occurrenceDates("2026-07-27", "monthly", "2026-10-01"), [
    "2026-08-27",
    "2026-09-27",
  ]);
});

check("cap limits the number generated", () => {
  assert.equal(occurrenceDates("2026-07-27", "daily", "2027-07-27", 5).length, 5);
});

check("dueForOccurrence: null head due stays null", () => {
  assert.equal(dueForOccurrence("2026-07-27", null, "2026-08-03"), null);
});

check("dueForOccurrence preserves the head's span", () => {
  // head spans 3 days (27 -> 30); occurrence on Aug 3 -> due Aug 6.
  assert.equal(dueForOccurrence("2026-07-27", "2026-07-30", "2026-08-03"), "2026-08-06");
});

check("dueForOccurrence same-day span stays same day", () => {
  assert.equal(dueForOccurrence("2026-07-27", "2026-07-27", "2026-08-03"), "2026-08-03");
});

check("reconcile: fresh head spawns the missing grid days", () => {
  const r = reconcileSeries("2026-07-27", "daily", [head("2026-07-27")], "2026-07-30");
  assert.deepEqual(r.spawnDates, ["2026-07-28", "2026-07-29", "2026-07-30"]);
  assert.deepEqual(r.deleteIds, []);
});

check("reconcile: skipped member reserves its date so nothing respawns", () => {
  const members = [
    head("2026-07-27"),
    inst("a", "2026-07-28"),
    { id: "skip", scheduledDate: "2026-07-29", status: "doing", isHead: false, skipped: true },
  ];
  const r = reconcileSeries("2026-07-27", "daily", members, "2026-07-30");
  assert.deepEqual(r.spawnDates, ["2026-07-30"]);
  assert.deepEqual(r.deleteIds, []);
});

check("reconcile: idempotent when grid already filled", () => {
  const members = [head("2026-07-27"), inst("a", "2026-07-28"), inst("b", "2026-07-29"), inst("c", "2026-07-30")];
  const r = reconcileSeries("2026-07-27", "daily", members, "2026-07-30");
  assert.deepEqual(r.spawnDates, []);
  assert.deepEqual(r.deleteIds, []);
});

check("reconcile: deletes duplicate instance on the same day", () => {
  const members = [head("2026-07-27"), inst("a", "2026-07-28"), inst("dup", "2026-07-28")];
  const r = reconcileSeries("2026-07-27", "daily", members, "2026-07-28");
  assert.deepEqual(r.deleteIds, ["dup"]);
  assert.deepEqual(r.spawnDates, []);
});

check("reconcile: deletes off-grid incomplete instance (head moved)", () => {
  // Head moved to 07-29; an old instance on 07-28 is now off-grid.
  const members = [head("2026-07-29"), inst("old", "2026-07-28")];
  const r = reconcileSeries("2026-07-29", "daily", members, "2026-07-30");
  assert.deepEqual(r.deleteIds, ["old"]);
  assert.deepEqual(r.spawnDates, ["2026-07-30"]);
});

check("reconcile: keeps a completed instance even if off-grid", () => {
  const members = [head("2026-07-29"), inst("doneOld", "2026-07-28", "done")];
  const r = reconcileSeries("2026-07-29", "daily", members, "2026-07-29");
  assert.deepEqual(r.deleteIds, []);
  assert.deepEqual(r.spawnDates, []);
});

// End-date semantics: the store clamps upto to the series end (head.dueDate),
// so reconcile is called with effectiveUpto = min(window, end). These lock in
// that the grid stops at the end and stray past-end instances are reclaimed.
check("reconcile: series-end clamp stops the grid at the end date", () => {
  // Series 07-28..08-06; window asks through 08-20, store clamps to 08-06.
  const effectiveUpto = "2026-08-06"; // min("2026-08-20", "2026-08-06")
  const r = reconcileSeries("2026-07-28", "daily", [head("2026-07-28")], effectiveUpto);
  assert.equal(r.spawnDates[0], "2026-07-29");
  assert.equal(r.spawnDates.at(-1), "2026-08-06");
  assert.equal(r.spawnDates.length, 9); // 07-29 .. 08-06 inclusive
});

check("reconcile: incomplete instance past the series end is deleted", () => {
  // Grid ends 08-06; a leftover instance on 08-10 is off-grid -> reclaimed.
  const members = [head("2026-07-28"), inst("stale", "2026-08-10")];
  const r = reconcileSeries("2026-07-28", "daily", members, "2026-08-06");
  assert.ok(r.deleteIds.includes("stale"));
});

check("reconcile: completed instance past the series end is kept", () => {
  const members = [head("2026-07-28"), inst("doneLate", "2026-08-10", "done")];
  const r = reconcileSeries("2026-07-28", "daily", members, "2026-08-06");
  assert.deepEqual(r.deleteIds, []);
});

console.log(`\n${passed} passed`);
