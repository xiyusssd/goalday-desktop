import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "../types";
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

/**
 * Full two-way sync: pull remote, merge (last-write-wins), push merged back.
 * Returns the merged dataset the caller should adopt locally.
 */
export async function syncAll(
  supabase: SupabaseClient,
  userId: string,
  local: AppData,
): Promise<AppData> {
  const [tasksRes, journalsRes, goalsRes, txnsRes, workoutsRes, notesRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("journals").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId),
    supabase.from("workouts").select("*").eq("user_id", userId),
    supabase.from("notes").select("*").eq("user_id", userId),
  ]);

  if (tasksRes.error) throw tasksRes.error;
  if (journalsRes.error) throw journalsRes.error;
  if (goalsRes.error) throw goalsRes.error;
  if (txnsRes.error) throw txnsRes.error;
  if (workoutsRes.error) throw workoutsRes.error;
  if (notesRes.error) throw notesRes.error;

  const remoteTasks = (tasksRes.data ?? []).map(rowToTask);
  const remoteJournals = (journalsRes.data ?? []).map(rowToJournal);
  const remoteGoals = (goalsRes.data ?? []).map(rowToGoal);
  const remoteTxns = (txnsRes.data ?? []).map(rowToTransaction);
  const remoteWorkouts = (workoutsRes.data ?? []).map(rowToWorkout);
  const remoteNotes = (notesRes.data ?? []).map(rowToNote);

  const merged: AppData = {
    tasks: mergeById(local.tasks, remoteTasks),
    journals: mergeById(local.journals, remoteJournals),
    goals: mergeById(local.goals, remoteGoals),
    transactions: mergeById(local.transactions, remoteTxns),
    workouts: mergeById(local.workouts, remoteWorkouts),
    notes: mergeById(local.notes, remoteNotes),
  };

  // Push the full merged set upward (idempotent upsert by primary key).
  const upserts: PromiseLike<{ error: unknown }>[] = [];
  if (merged.tasks.length) {
    upserts.push(
      supabase.from("tasks").upsert(merged.tasks.map((task) => taskToRow(task, userId))),
    );
  }
  if (merged.journals.length) {
    upserts.push(
      supabase.from("journals").upsert(merged.journals.map((journal) => journalToRow(journal, userId))),
    );
  }
  if (merged.goals.length) {
    upserts.push(
      supabase.from("goals").upsert(merged.goals.map((goal) => goalToRow(goal, userId))),
    );
  }
  if (merged.transactions.length) {
    upserts.push(
      supabase.from("transactions").upsert(merged.transactions.map((t) => transactionToRow(t, userId))),
    );
  }
  if (merged.workouts.length) {
    upserts.push(
      supabase.from("workouts").upsert(merged.workouts.map((w) => workoutToRow(w, userId))),
    );
  }
  if (merged.notes.length) {
    upserts.push(
      supabase.from("notes").upsert(merged.notes.map((n) => noteToRow(n, userId))),
    );
  }
  const results = await Promise.all(upserts);
  for (const result of results) if (result.error) throw result.error;

  return merged;
}
