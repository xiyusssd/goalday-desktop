import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "../types.ts";
import { syncAll } from "./sync.ts";

type Row = Record<string, unknown>;

interface StubOpts {
  /** Rows the fake backend returns per table. */
  remote?: Partial<Record<string, Row[]>>;
  /** Tables whose SELECT should fail. */
  failPull?: string[];
  /** Tables whose UPSERT should fail. */
  failUpsert?: string[];
}

interface StubLog {
  /** user_id each table was filtered by, in call order. */
  pulls: { table: string; column: string; value: unknown }[];
  /** Payload handed to upsert, keyed by table. */
  upserts: Record<string, Row[]>;
}

/**
 * Minimal stand-in for the supabase-js query builder, covering exactly the
 * shape syncAll relies on: `.from(t).select("*").eq(c, v)` and
 * `.from(t).upsert(rows)`, both awaitable.
 */
function stubClient(opts: StubOpts = {}) {
  const log: StubLog = { pulls: [], upserts: {} };
  const client = {
    from(table: string) {
      return {
        select(_cols: string) {
          return {
            eq(column: string, value: unknown) {
              log.pulls.push({ table, column, value });
              if (opts.failPull?.includes(table)) {
                return Promise.resolve({ data: null, error: { message: `pull ${table} failed` } });
              }
              return Promise.resolve({ data: opts.remote?.[table] ?? [], error: null });
            },
          };
        },
        upsert(rows: Row[]) {
          log.upserts[table] = rows;
          if (opts.failUpsert?.includes(table)) {
            return Promise.resolve({ error: { message: `upsert ${table} failed` } });
          }
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return { client, log };
}

const UID = "user-42";

const EMPTY: AppData = {
  tasks: [],
  journals: [],
  goals: [],
  transactions: [],
  workouts: [],
  notes: [],
};

const TABLES = ["tasks", "journals", "goals", "transactions", "workouts", "notes"];

/** One local entry per collection, each id prefixed with its table. */
const LOCAL: AppData = {
  tasks: [
    {
      id: "t1",
      title: "local task",
      notes: "",
      status: "todo",
      priority: "high",
      scheduledDate: "2024-05-01",
      dueDate: null,
      scheduledPeriod: "morning",
      order: 3,
      goalId: "g1",
      recurrence: null,
      seriesId: null,
      createdAt: 100,
      updatedAt: 100,
      completedAt: null,
      deleted: false,
    },
  ],
  journals: [
    { id: "j1", date: "2024-05-01", content: "local journal", mood: 4, createdAt: 100, updatedAt: 100, deleted: false },
  ],
  goals: [{ id: "g1", title: "local goal", color: "#abcdef", createdAt: 100, updatedAt: 100, deleted: false }],
  transactions: [
    {
      id: "x1",
      type: "income",
      amount: 250,
      category: "salary",
      note: "local txn",
      date: "2024-05-01",
      createdAt: 100,
      updatedAt: 100,
      deleted: false,
    },
  ],
  workouts: [
    {
      id: "w1",
      type: "running",
      durationMin: 30,
      calories: 300,
      sets: null,
      note: "local workout",
      date: "2024-05-01",
      createdAt: 100,
      updatedAt: 100,
      deleted: false,
    },
  ],
  notes: [
    {
      id: "n1",
      title: "local note",
      body: "body",
      color: "#fde68a",
      pinned: true,
      createdAt: 100,
      updatedAt: 100,
      deleted: false,
    },
  ],
};

const asClient = (c: unknown) => c as unknown as SupabaseClient;

test("pulls every table exactly once, scoped to the user", async () => {
  const { client, log } = stubClient();
  await syncAll(asClient(client), UID, EMPTY);

  assert.deepEqual(
    log.pulls.map((p) => p.table),
    TABLES,
  );
  for (const pull of log.pulls) {
    assert.equal(pull.column, "user_id");
    assert.equal(pull.value, UID);
  }
});

test("local-only data survives a sync against an empty backend", async () => {
  const { client } = stubClient();
  const merged = await syncAll(asClient(client), UID, LOCAL);

  assert.deepEqual(merged.tasks, LOCAL.tasks);
  assert.deepEqual(merged.journals, LOCAL.journals);
  assert.deepEqual(merged.goals, LOCAL.goals);
  assert.deepEqual(merged.transactions, LOCAL.transactions);
  assert.deepEqual(merged.workouts, LOCAL.workouts);
  assert.deepEqual(merged.notes, LOCAL.notes);
});

/**
 * syncAll is six near-identical blocks, so the realistic defect is a crossed
 * mapper (e.g. notes decoded with rowToWorkout). Each remote row below carries
 * fields unique to its table; a swap would surface as a missing/undefined field.
 */
test("each table is decoded by its own mapper", async () => {
  const { client } = stubClient({
    remote: {
      tasks: [{ id: "rt", title: "remote task", status: "doing", order_index: 7, updated_at: 900 }],
      journals: [{ id: "rj", date: "2024-06-02", content: "remote journal", mood: 2, updated_at: 900 }],
      goals: [{ id: "rg", title: "remote goal", color: "#123456", updated_at: 900 }],
      transactions: [
        { id: "rx", type: "expense", amount: 12.5, category: "food", date: "2024-06-03", updated_at: 900 },
      ],
      workouts: [{ id: "rw", type: "yoga", duration_min: 45, calories: 120, date: "2024-06-04", updated_at: 900 }],
      notes: [{ id: "rn", title: "remote note", body: "remote body", pinned: true, updated_at: 900 }],
    },
  });
  const merged = await syncAll(asClient(client), UID, EMPTY);

  assert.deepEqual(merged.tasks.map((t) => t.id), ["rt"]);
  assert.equal(merged.tasks[0].status, "doing");
  assert.equal(merged.tasks[0].order, 7);

  assert.equal(merged.journals[0].date, "2024-06-02");
  assert.equal(merged.journals[0].mood, 2);

  assert.equal(merged.goals[0].color, "#123456");

  assert.equal(merged.transactions[0].type, "expense");
  assert.equal(merged.transactions[0].amount, 12.5);
  assert.equal(merged.transactions[0].category, "food");

  assert.equal(merged.workouts[0].type, "yoga");
  assert.equal(merged.workouts[0].durationMin, 45);
  assert.equal(merged.workouts[0].calories, 120);

  assert.equal(merged.notes[0].body, "remote body");
  assert.equal(merged.notes[0].pinned, true);
});

test("newer remote row wins over the same local id", async () => {
  const { client } = stubClient({
    remote: { tasks: [{ id: "t1", title: "remote wins", status: "done", updated_at: 500 }] },
  });
  const merged = await syncAll(asClient(client), UID, LOCAL);

  assert.equal(merged.tasks.length, 1);
  assert.equal(merged.tasks[0].title, "remote wins");
});

test("stale remote row loses to the local copy", async () => {
  const { client } = stubClient({
    remote: { tasks: [{ id: "t1", title: "stale remote", status: "done", updated_at: 5 }] },
  });
  const merged = await syncAll(asClient(client), UID, LOCAL);

  assert.equal(merged.tasks.length, 1);
  assert.equal(merged.tasks[0].title, "local task");
});

test("pushes merged rows as snake_case payloads stamped with user_id", async () => {
  const { client, log } = stubClient();
  await syncAll(asClient(client), UID, LOCAL);

  assert.deepEqual(Object.keys(log.upserts).sort(), [...TABLES].sort());
  for (const table of TABLES) {
    assert.equal(log.upserts[table].length, 1, `${table} should push one row`);
    assert.equal(log.upserts[table][0].user_id, UID, `${table} row needs user_id`);
  }
  assert.equal(log.upserts.tasks[0].order_index, 3);
  assert.equal(log.upserts.tasks[0].scheduled_date, "2024-05-01");
  assert.equal(log.upserts.tasks[0].goal_id, "g1");
  assert.equal(log.upserts.workouts[0].duration_min, 30);
  assert.equal(log.upserts.notes[0].pinned, true);
});

test("skips upsert entirely for empty collections", async () => {
  const { client, log } = stubClient();
  await syncAll(asClient(client), UID, { ...EMPTY, goals: LOCAL.goals });

  assert.deepEqual(Object.keys(log.upserts), ["goals"]);
});

const hasMessage = (expected: string) => (err: unknown) =>
  typeof err === "object" && err !== null && (err as { message?: string }).message === expected;

test("a failed pull rejects and never reaches the push phase", async () => {
  const { client, log } = stubClient({ failPull: ["workouts"] });

  await assert.rejects(syncAll(asClient(client), UID, LOCAL), hasMessage("pull workouts failed"));
  assert.deepEqual(log.upserts, {}, "nothing should be pushed after a pull failure");
});

test("a failed upsert rejects", async () => {
  const { client } = stubClient({ failUpsert: ["notes"] });

  await assert.rejects(syncAll(asClient(client), UID, LOCAL), hasMessage("upsert notes failed"));
});