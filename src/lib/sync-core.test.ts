import assert from "node:assert/strict";
import type { Goal, JournalEntry, Note, Task, Transaction, Workout } from "../types";
import {
  goalToRow,
  journalToRow,
  mergeById,
  noteToRow,
  rowToGoal,
  rowToJournal,
  rowToNote,
  rowToTask,
  rowToTransaction,
  rowToWorkout,
  taskToRow,
  transactionToRow,
  workoutToRow,
} from "./sync-core.ts";

let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
};

const sampleTask: Task = {
  id: "t1",
  title: "阅读文档",
  notes: "第 3 章",
  status: "doing",
  priority: "high",
  scheduledDate: "2026-07-27",
  dueDate: "2026-07-30",
  scheduledPeriod: "morning",
  order: 2,
  goalId: "g1",
  recurrence: "weekly",
  seriesId: "t1",
  createdAt: 1000,
  updatedAt: 2000,
  completedAt: null,
  deleted: false,
};

const sampleJournal: JournalEntry = {
  id: "j1",
  date: "2026-07-27",
  content: "复盘",
  mood: 4,
  createdAt: 1000,
  updatedAt: 2000,
  deleted: false,
};

const sampleGoal: Goal = {
  id: "g1",
  title: "学习",
  color: "#6366f1",
  createdAt: 1000,
  updatedAt: 2000,
  deleted: false,
};

check("task round-trips through row mapping", () => {
  assert.deepEqual(rowToTask(taskToRow(sampleTask, "u1")), sampleTask);
});

check("task row carries user_id + snake_case keys", () => {
  const row = taskToRow(sampleTask, "u1");
  assert.equal(row.user_id, "u1");
  assert.equal(row.scheduled_period, "morning");
  assert.equal(row.order_index, 2);
  assert.equal(row.goal_id, "g1");
});

check("journal round-trips", () => {
  assert.deepEqual(rowToJournal(journalToRow(sampleJournal, "u1")), sampleJournal);
});

check("goal round-trips", () => {
  assert.deepEqual(rowToGoal(goalToRow(sampleGoal, "u1")), sampleGoal);
});

const sampleTxn: Transaction = {
  id: "x1",
  type: "expense",
  amount: 42.5,
  category: "food",
  note: "午饭",
  date: "2026-07-28",
  createdAt: 1000,
  updatedAt: 2000,
  deleted: false,
};

const sampleWorkout: Workout = {
  id: "w1",
  type: "strength",
  durationMin: 45,
  calories: 300,
  sets: 5,
  note: "腿",
  date: "2026-07-28",
  createdAt: 1000,
  updatedAt: 2000,
  deleted: false,
};

const sampleNote: Note = {
  id: "n1",
  title: "买菜",
  body: "西红柿 鸡蛋",
  color: "#fde68a",
  pinned: true,
  createdAt: 1000,
  updatedAt: 2000,
  deleted: false,
};

check("transaction round-trips through row mapping", () => {
  assert.deepEqual(rowToTransaction(transactionToRow(sampleTxn, "u1")), sampleTxn);
});

check("workout round-trips (null calories/sets preserved)", () => {
  assert.deepEqual(rowToWorkout(workoutToRow(sampleWorkout, "u1")), sampleWorkout);
  const noExtras = { ...sampleWorkout, calories: null, sets: null };
  assert.deepEqual(rowToWorkout(workoutToRow(noExtras, "u1")), noExtras);
});

check("note round-trips (pinned bool preserved)", () => {
  assert.deepEqual(rowToNote(noteToRow(sampleNote, "u1")), sampleNote);
});

check("rowToTask backfills missing/nullable fields", () => {
  const task = rowToTask({ id: "x", status: "todo", created_at: 5, updated_at: 6 });
  assert.equal(task.priority, "medium");
  assert.equal(task.scheduledPeriod, null);
  assert.equal(task.order, 0);
  assert.equal(task.completedAt, null);
  assert.equal(task.notes, "");
  assert.equal(task.recurrence, null);
  assert.equal(task.dueDate, null);
  assert.equal(task.seriesId, null);
});

check("task row carries recurrence + due_date + series_id", () => {
  const row = taskToRow(sampleTask, "u1");
  assert.equal(row.recurrence, "weekly");
  assert.equal(row.due_date, "2026-07-30");
  assert.equal(row.series_id, "t1");
});

check("rowToJournal null mood stays null; numeric mood coerced", () => {
  assert.equal(rowToJournal({ id: "a", date: "d", created_at: 1, updated_at: 1 }).mood, null);
  assert.equal(rowToJournal({ id: "b", date: "d", mood: "3", created_at: 1, updated_at: 1 }).mood, 3);
});

check("mergeById keeps newer updatedAt (remote wins when newer)", () => {
  const local = [{ id: "a", updatedAt: 10 }];
  const remote = [{ id: "a", updatedAt: 20 }];
  assert.deepEqual(mergeById(local, remote), [{ id: "a", updatedAt: 20 }]);
});

check("mergeById keeps local when local is newer", () => {
  const local = [{ id: "a", updatedAt: 30 }];
  const remote = [{ id: "a", updatedAt: 20 }];
  assert.deepEqual(mergeById(local, remote), [{ id: "a", updatedAt: 30 }]);
});

check("mergeById unions disjoint ids", () => {
  const merged = mergeById([{ id: "a", updatedAt: 1 }], [{ id: "b", updatedAt: 1 }]);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged.map((item) => item.id).sort(), ["a", "b"]);
});

check("mergeById equal updatedAt keeps local (no strict-greater overwrite)", () => {
  const local = [{ id: "a", updatedAt: 10, tag: "local" }];
  const remote = [{ id: "a", updatedAt: 10, tag: "remote" }];
  assert.equal((mergeById(local, remote)[0] as { tag: string }).tag, "local");
});

check("soft-deleted newer remote overrides live local (deletion propagates)", () => {
  const local = [{ ...sampleTask, updatedAt: 100, deleted: false }];
  const remote = [{ ...sampleTask, updatedAt: 200, deleted: true }];
  assert.equal(mergeById(local, remote)[0].deleted, true);
});

console.log(`\n${passed} passed`);
