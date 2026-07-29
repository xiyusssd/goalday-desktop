import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// The store reads localStorage at module load (initial.ts), so install a shim
// BEFORE importing it. Dynamic import runs after this top-level statement.
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
}
(globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();

const { useStore, activeTasks, tasksForDay, EMPTY_FILTER } = await import("./index.ts");

const DAY = "2026-07-29";

beforeEach(() => {
  useStore.setState({
    tasks: [],
    journals: [],
    goals: [],
    transactions: [],
    workouts: [],
    notes: [],
    filter: { ...EMPTY_FILTER },
    selectedTaskId: null,
    lastDeleted: null,
    currentDay: DAY,
    currentWeekStart: "2026-07-27",
  });
});

test("addTask assigns incremental order among siblings and ignores empty titles", () => {
  const s = useStore.getState();
  s.addTask("first", "todo", null);
  s.addTask("second", "todo", null);
  s.addTask("   ", "todo", null); // blank -> ignored
  const tasks = useStore.getState().tasks;
  assert.equal(tasks.length, 2);
  assert.deepEqual(tasks.map((t) => t.title), ["first", "second"]);
  assert.deepEqual(tasks.map((t) => t.order), [0, 1]);
});

test("toggleDone flips status and completedAt", () => {
  useStore.getState().addTask("task", "todo", DAY);
  const id = useStore.getState().tasks[0].id;
  useStore.getState().toggleDone(id);
  let t = useStore.getState().tasks[0];
  assert.equal(t.status, "done");
  assert.ok(t.completedAt);
  useStore.getState().toggleDone(id);
  t = useStore.getState().tasks[0];
  assert.equal(t.status, "todo");
  assert.equal(t.completedAt, null);
});

test("deleteTask soft-deletes and undoDelete restores", () => {
  useStore.getState().addTask("gone", "todo", null);
  const id = useStore.getState().tasks[0].id;
  useStore.getState().deleteTask(id);
  assert.equal(useStore.getState().tasks[0].deleted, true);
  assert.equal(activeTasks(useStore.getState().tasks).length, 0);
  assert.equal(useStore.getState().lastDeleted?.id, id);
  useStore.getState().undoDelete();
  assert.equal(useStore.getState().tasks[0].deleted, false);
  assert.equal(useStore.getState().lastDeleted, null);
});

test("deleteGoal soft-deletes the goal and clears goalId on its tasks (cross-slice)", () => {
  const s = useStore.getState();
  s.addGoal("Health", "#22c55e");
  const goalId = useStore.getState().goals[0].id;
  s.addTask("run", "todo", DAY);
  const taskId = useStore.getState().tasks[0].id;
  s.updateTask(taskId, { goalId });
  assert.equal(useStore.getState().tasks[0].goalId, goalId);

  useStore.getState().deleteGoal(goalId);
  assert.equal(useStore.getState().goals[0].deleted, true);
  assert.equal(useStore.getState().tasks[0].goalId, null);
});

test("addNote returns an id and toggleNotePin flips pinned", () => {
  const id = useStore.getState().addNote({ title: "idea" });
  assert.ok(id);
  assert.equal(useStore.getState().notes[0].pinned, false);
  useStore.getState().toggleNotePin(id);
  assert.equal(useStore.getState().notes[0].pinned, true);
});

test("finance slice: addTransaction stores absolute amount", () => {
  useStore.getState().addTransaction({
    type: "expense",
    amount: -12.5,
    category: "food",
    note: "",
    date: DAY,
  });
  assert.equal(useStore.getState().transactions[0].amount, 12.5);
});

test("materializeRecurring spawns daily instances up to upto, head keeps recurrence", () => {
  useStore.getState().addTask("habit", "doing", "2026-07-29", "daily");
  useStore.getState().materializeRecurring("2026-08-01");
  const active = activeTasks(useStore.getState().tasks);
  const dates = active.map((t) => t.scheduledDate).sort();
  assert.deepEqual(dates, ["2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01"]);
  // Head keeps the recurrence rule; spawned instances do not.
  const head = active.find((t) => t.recurrence === "daily");
  assert.ok(head);
  assert.equal(head.seriesId, head.id);
  const instances = active.filter((t) => t.id !== head.id);
  assert.ok(instances.every((t) => t.recurrence === null && t.seriesId === head.id));
});

test("materializeRecurring treats a head dueDate as the series end", () => {
  useStore.getState().addTask("habit", "doing", "2026-07-29", "daily");
  const headId = useStore.getState().tasks[0].id;
  useStore.getState().updateTask(headId, { dueDate: "2026-07-30" });
  useStore.getState().materializeRecurring("2026-08-05");
  const dates = activeTasks(useStore.getState().tasks)
    .map((t) => t.scheduledDate)
    .sort();
  assert.deepEqual(dates, ["2026-07-29", "2026-07-30"]);
});

test("replaceAll swaps every persisted array", () => {
  useStore.getState().addTask("old", "todo", DAY);
  useStore.getState().replaceAll({
    tasks: [
      {
        id: "x1",
        title: "imported",
        notes: "",
        status: "todo",
        priority: "medium",
        scheduledDate: DAY,
        dueDate: null,
        scheduledPeriod: null,
        order: 0,
        goalId: null,
        createdAt: 1,
        updatedAt: 1,
        completedAt: null,
        recurrence: null,
        seriesId: null,
        deleted: false,
      },
    ],
    journals: [],
    goals: [],
    transactions: [],
    workouts: [],
    notes: [],
  });
  const tasks = useStore.getState().tasks;
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, "imported");
  assert.equal(tasksForDay(tasks, DAY).length, 1);
});
