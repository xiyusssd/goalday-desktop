import type { StateCreator } from "zustand";
import type {
  AppData,
  DayPeriod,
  JournalEntry,
  Goal,
  Note,
  Priority,
  Recurrence,
  SyncStatus,
  Task,
  TaskStatus,
  Transaction,
  Workout,
  AuthUser,
} from "../types";
import type { Settings } from "../lib/storage";

/** Global task search / filter state (UI only, not persisted). */
export interface TaskFilter {
  query: string;
  priority: Priority | "all";
  goalId: string | "all" | "none";
}

export const EMPTY_FILTER: TaskFilter = { query: "", priority: "all", goalId: "all" };

export interface TaskSlice {
  tasks: Task[];
  /** Task currently open in the detail drawer, or null. UI only. */
  selectedTaskId: string | null;
  /** Global search/filter applied to the planning views. UI only. */
  filter: TaskFilter;
  /** Most recent task deletion, for the undo toast. UI only. */
  lastDeleted: { id: string; at: number } | null;

  addTask: (title: string, status?: TaskStatus, scheduledDate?: string | null, recurrence?: Recurrence) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  moveTask: (id: string, status: TaskStatus, scheduledDate: string | null, order: number) => void;
  /** Place a task on a specific day + optional time-of-day period (used by the daily plan). */
  scheduleTask: (id: string, scheduledDate: string | null, scheduledPeriod: DayPeriod | null) => void;
  toggleDone: (id: string) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
  /** Pre-generate recurring-series instances through `upto` (inclusive). */
  materializeRecurring: (upto: string) => void;
  openTask: (id: string) => void;
  closeTask: () => void;
  setFilter: (patch: Partial<TaskFilter>) => void;
}

export interface JournalSlice {
  journals: JournalEntry[];
  upsertJournal: (date: string, patch: Partial<JournalEntry>) => void;
}

export interface GoalSlice {
  goals: Goal[];
  addGoal: (title: string, color: string) => void;
  deleteGoal: (id: string) => void;
}

export interface FinanceSlice {
  transactions: Transaction[];
  addTransaction: (input: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "deleted">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

export interface FitnessSlice {
  workouts: Workout[];
  addWorkout: (input: Omit<Workout, "id" | "createdAt" | "updatedAt" | "deleted">) => void;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
}

export interface NoteSlice {
  notes: Note[];
  addNote: (input?: Partial<Pick<Note, "title" | "body" | "color">>) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  toggleNotePin: (id: string) => void;
  deleteNote: (id: string) => void;
}

export interface AppSlice {
  settings: Settings;
  currentWeekStart: string;
  currentDay: string;
  user: AuthUser | null;
  syncStatus: SyncStatus;

  setLanguage: (lang: "zh" | "en") => void;
  setSettings: (patch: Partial<Settings>) => void;
  setCurrentWeekStart: (d: string) => void;
  setCurrentDay: (d: string) => void;
  setUser: (u: AuthUser | null) => void;
  setSyncStatus: (s: SyncStatus) => void;
  replaceAll: (data: AppData) => void;
  getData: () => AppData;
}

export type StoreState = TaskSlice &
  JournalSlice &
  GoalSlice &
  FinanceSlice &
  FitnessSlice &
  NoteSlice &
  AppSlice;

/** Shared slice-creator alias: every slice sees the whole store via set/get. */
export type Slice<T> = StateCreator<StoreState, [], [], T>;
