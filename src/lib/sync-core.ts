import type { Goal, JournalEntry, Note, Task, Transaction, Workout } from "../types";

// Pure mapping between local camelCase objects and snake_case DB rows, plus the
// last-write-wins merge. Kept free of any Supabase import so it can be unit
// tested in isolation; `sync.ts` composes these with the network calls.

export type Row = Record<string, unknown>;

export function taskToRow(task: Task, userId: string): Row {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    notes: task.notes,
    status: task.status,
    priority: task.priority,
    scheduled_date: task.scheduledDate,
    due_date: task.dueDate,
    scheduled_period: task.scheduledPeriod,
    order_index: task.order,
    goal_id: task.goalId,
    recurrence: task.recurrence,
    series_id: task.seriesId,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    completed_at: task.completedAt,
    deleted: task.deleted,
  };
}

export function rowToTask(row: Row): Task {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    notes: (row.notes as string) ?? "",
    status: row.status as Task["status"],
    priority: (row.priority as Task["priority"]) ?? "medium",
    scheduledDate: (row.scheduled_date as string | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    scheduledPeriod: (row.scheduled_period as Task["scheduledPeriod"]) ?? null,
    order: (row.order_index as number) ?? 0,
    goalId: (row.goal_id as string | null) ?? null,
    recurrence: (row.recurrence as Task["recurrence"]) ?? null,
    seriesId: (row.series_id as string | null) ?? null,
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
    completedAt: row.completed_at != null ? Number(row.completed_at) : null,
    deleted: Boolean(row.deleted),
  };
}

export function journalToRow(journal: JournalEntry, userId: string): Row {
  return {
    id: journal.id,
    user_id: userId,
    date: journal.date,
    content: journal.content,
    mood: journal.mood,
    created_at: journal.createdAt,
    updated_at: journal.updatedAt,
    deleted: journal.deleted,
  };
}

export function rowToJournal(row: Row): JournalEntry {
  return {
    id: row.id as string,
    date: row.date as string,
    content: (row.content as string) ?? "",
    mood: row.mood != null ? Number(row.mood) : null,
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
    deleted: Boolean(row.deleted),
  };
}

export function goalToRow(goal: Goal, userId: string): Row {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    color: goal.color,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
    deleted: goal.deleted,
  };
}

export function rowToGoal(row: Row): Goal {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    color: (row.color as string) ?? "#6366f1",
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
    deleted: Boolean(row.deleted),
  };
}

export function transactionToRow(txn: Transaction, userId: string): Row {
  return {
    id: txn.id,
    user_id: userId,
    type: txn.type,
    amount: txn.amount,
    category: txn.category,
    note: txn.note,
    date: txn.date,
    created_at: txn.createdAt,
    updated_at: txn.updatedAt,
    deleted: txn.deleted,
  };
}

export function rowToTransaction(row: Row): Transaction {
  return {
    id: row.id as string,
    type: (row.type as Transaction["type"]) ?? "expense",
    amount: Number(row.amount) || 0,
    category: (row.category as string) ?? "other",
    note: (row.note as string) ?? "",
    date: row.date as string,
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
    deleted: Boolean(row.deleted),
  };
}

export function workoutToRow(workout: Workout, userId: string): Row {
  return {
    id: workout.id,
    user_id: userId,
    type: workout.type,
    duration_min: workout.durationMin,
    calories: workout.calories,
    sets: workout.sets,
    note: workout.note,
    date: workout.date,
    created_at: workout.createdAt,
    updated_at: workout.updatedAt,
    deleted: workout.deleted,
  };
}

export function rowToWorkout(row: Row): Workout {
  return {
    id: row.id as string,
    type: (row.type as Workout["type"]) ?? "other",
    durationMin: Number(row.duration_min) || 0,
    calories: row.calories != null ? Number(row.calories) : null,
    sets: row.sets != null ? Number(row.sets) : null,
    note: (row.note as string) ?? "",
    date: row.date as string,
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
    deleted: Boolean(row.deleted),
  };
}

export function noteToRow(note: Note, userId: string): Row {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    body: note.body,
    color: note.color,
    pinned: note.pinned,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    deleted: note.deleted,
  };
}

export function rowToNote(row: Row): Note {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    body: (row.body as string) ?? "",
    color: (row.color as string) ?? "#fde68a",
    pinned: Boolean(row.pinned),
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
    deleted: Boolean(row.deleted),
  };
}

/** Merge two collections by id, keeping the entry with the newer updatedAt. */
export function mergeById<T extends { id: string; updatedAt: number }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) map.set(item.id, item);
  }
  return [...map.values()];
}
