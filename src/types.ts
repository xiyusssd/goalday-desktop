// Core domain types for GoalDay.

export type TaskStatus = "todo" | "doing" | "done";

export type Priority = "low" | "medium" | "high";

/** Time-of-day bucket on the daily plan. */
export type DayPeriod = "morning" | "afternoon" | "evening";

export const DAY_PERIODS: DayPeriod[] = ["morning", "afternoon", "evening"];

/** How a scheduled task repeats. Instances are pre-generated across days. `null` = one-off. */
export type Recurrence = "daily" | "weekly" | "monthly" | null;

export const RECURRENCES: Exclude<Recurrence, null>[] = ["daily", "weekly", "monthly"];

/** A single actionable item. */
export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: Priority;
  /** ISO date (YYYY-MM-DD) the task starts / sits on the week board, or null if unscheduled. */
  scheduledDate: string | null;
  /** ISO deadline (YYYY-MM-DD). May differ from scheduledDate so a task can span days. null = no deadline. */
  dueDate: string | null;
  /** Time-of-day bucket on the daily plan (morning/afternoon/evening), or null if unassigned. */
  scheduledPeriod: DayPeriod | null;
  /** Sort order within its column/day. */
  order: number;
  /** Optional goal this task contributes to. */
  goalId: string | null;
  /** Recurrence rule on the series head; generated instances carry null. */
  recurrence: Recurrence;
  /** Groups a recurring series. The head's id; null for non-recurring tasks. */
  seriesId: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  /** Soft-delete marker so deletions can sync across devices. */
  deleted: boolean;
}

/** A daily journal / review entry, keyed by date. */
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood: number | null; // 1..5
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

/** A higher-level goal that tasks roll up to. */
export interface Goal {
  id: string;
  title: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

/** Whether a ledger entry adds to or subtracts from the balance. */
export type TxnType = "expense" | "income";

/** A single money-tracking entry (记账). */
export interface Transaction {
  id: string;
  type: TxnType;
  /** Positive amount in the user's currency; sign is derived from `type`. */
  amount: number;
  /** Category key (see lib/finance CATEGORIES). */
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

/** Kind of exercise for a workout log entry. */
export type WorkoutType =
  | "running"
  | "cycling"
  | "strength"
  | "yoga"
  | "swimming"
  | "walking"
  | "ball"
  | "other";

/** A single fitness / workout log entry (健身). */
export interface Workout {
  id: string;
  type: WorkoutType;
  /** Duration in minutes. */
  durationMin: number;
  /** Calories burned, or null if not tracked. */
  calories: number | null;
  /** Number of sets (for strength) or null. */
  sets: number | null;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

/** A free-form sticky note (备忘录). */
export interface Note {
  id: string;
  title: string;
  body: string;
  /** Accent color for the card. */
  color: string;
  /** Pinned notes float to the top. */
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

/** Everything we persist locally and sync to the cloud. */
export interface AppData {
  tasks: Task[];
  journals: JournalEntry[];
  goals: Goal[];
  transactions: Transaction[];
  workouts: Workout[];
  notes: Note[];
}

export const EMPTY_DATA: AppData = {
  tasks: [],
  journals: [],
  goals: [],
  transactions: [],
  workouts: [],
  notes: [],
};

export type SyncStatus = "offline" | "syncing" | "synced" | "error";

export interface AuthUser {
  id: string;
  email: string;
}
