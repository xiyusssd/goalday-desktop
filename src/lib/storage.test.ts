import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { Task } from "../types.ts";

// storage.ts touches localStorage on every call, so install a shim BEFORE
// importing it. Writes can be made to fail on demand to exercise the
// quota-exceeded path.
class MemStorage {
  private m = new Map<string, string>();
  /** When true, every setItem throws the way a full browser store would. */
  failWrites = false;
  getItem(k: string): string | null {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    if (this.failWrites) throw new Error("QuotaExceededError");
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
}

const store = new MemStorage();
(globalThis as unknown as { localStorage: MemStorage }).localStorage = store;

const { loadData, saveData, saveDataDebounced, flushData, loadSettings, saveSettings, DEFAULT_SETTINGS } =
  await import("./storage.ts");

const KEY = "goalday.data.v1";
const CORRUPT_KEY = "goalday.data.corrupt";
const SETTINGS_KEY = "goalday.settings.v1";

// The failure paths log on purpose; keep the test output readable.
console.error = () => {};

// storage.ts holds module-level debounce state; drain it between tests so a
// pending payload from one case cannot leak into the next.
beforeEach(() => {
  store.failWrites = false;
  flushData();
  store.clear();
});

function task(over: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "write tests",
    notes: "",
    status: "todo",
    priority: "medium",
    scheduledDate: null,
    dueDate: null,
    scheduledPeriod: null,
    order: 0,
    goalId: null,
    recurrence: null,
    skipped: false,
    seriesId: null,
    createdAt: 1,
    updatedAt: 1,
    completedAt: null,
    deleted: false,
    ...over,
  };
}

function dataWith(tasks: Task[]) {
  return { tasks, journals: [], goals: [], transactions: [], workouts: [], notes: [] };
}

test("loadData returns six empty arrays on a fresh install", () => {
  assert.deepEqual(loadData(), {
    tasks: [],
    journals: [],
    goals: [],
    transactions: [],
    workouts: [],
    notes: [],
  });
});

test("loadData upgrades a legacy 3-key blob to the 6-key shape", () => {
  // Exactly what an install predating transactions/workouts/notes holds.
  store.setItem(
    KEY,
    JSON.stringify({
      tasks: [{ id: "old", title: "legacy", status: "todo", order: 0 }],
      journals: [{ id: "j1", date: "2026-01-01", content: "hi", mood: null }],
      goals: [],
    }),
  );

  const data = loadData();

  assert.deepEqual(data.transactions, [], "transactions backfilled");
  assert.deepEqual(data.workouts, [], "workouts backfilled");
  assert.deepEqual(data.notes, [], "notes backfilled");
  assert.equal(data.journals.length, 1, "existing journals preserved");
  // Fields added after v1 must materialize as null rather than stay undefined,
  // so downstream `=== null` checks keep working.
  const t = data.tasks[0];
  assert.equal(t.scheduledPeriod, null);
  assert.equal(t.recurrence, null);
  assert.equal(t.dueDate, null);
  assert.equal(t.seriesId, null);
  assert.equal(t.title, "legacy", "original fields untouched");
});

test("loadData quarantines an unreadable blob instead of dropping it", () => {
  store.setItem(KEY, "{not json");

  const data = loadData();

  assert.deepEqual(data.tasks, [], "falls back to empty data");
  assert.equal(store.getItem(CORRUPT_KEY), "{not json", "raw text kept for recovery");
});

test("saveData round-trips through loadData", () => {
  const written = dataWith([task({ id: "a", scheduledDate: "2026-07-29" })]);

  assert.equal(saveData(written), true, "reports success");
  assert.deepEqual(loadData().tasks, written.tasks);
});

test("saveDataDebounced defers the write until flushData, keeping only the last payload", () => {
  saveDataDebounced(dataWith([task({ id: "first" })]));
  saveDataDebounced(dataWith([task({ id: "second" })]));

  assert.equal(store.getItem(KEY), null, "nothing written while the burst is coalescing");

  flushData();

  const tasks = loadData().tasks;
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, "second", "last write wins");
});

test("flushData is a no-op when nothing is pending", () => {
  flushData();
  assert.equal(store.getItem(KEY), null);
});

test("a failed write keeps the payload queued so the next flush retries it", () => {
  store.failWrites = true;
  saveDataDebounced(dataWith([task({ id: "kept" })]));
  flushData();

  assert.equal(store.getItem(KEY), null, "write failed, nothing stored");

  // Storage recovers (user freed space); the edit must still be there.
  store.failWrites = false;
  flushData();

  assert.equal(loadData().tasks[0]?.id, "kept", "queued edit was not lost");
});

test("loadSettings fills defaults around a partial stored object", () => {
  store.setItem(SETTINGS_KEY, JSON.stringify({ language: "en", theme: "dark" }));

  const s = loadSettings();

  assert.equal(s.language, "en", "stored value wins");
  assert.equal(s.theme, "dark");
  assert.equal(s.palette, DEFAULT_SETTINGS.palette, "missing key falls back to default");
  assert.equal(s.supabaseUrl, "");
});

test("loadSettings falls back to defaults on unreadable settings", () => {
  store.setItem(SETTINGS_KEY, "{{{");
  assert.deepEqual(loadSettings(), DEFAULT_SETTINGS);
});

test("saveSettings swallows write failures instead of aborting the caller", () => {
  store.failWrites = true;
  // Called synchronously from store actions, so a throw would abort the action.
  assert.doesNotThrow(() => saveSettings({ ...DEFAULT_SETTINGS, language: "en" }));
});