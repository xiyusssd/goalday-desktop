import { create } from "zustand";
import { useMemo } from "react";
import { nanoid } from "nanoid";
import {
  AppData,
  DayPeriod,
  Goal,
  JournalEntry,
  Note,
  Priority,
  Recurrence,
  SyncStatus,
  Task,
  TaskStatus,
  Transaction,
  Workout,
  AuthUser,
} from "./types";
import { loadData, saveData, loadSettings, saveSettings, Settings } from "./lib/storage";
import { today, addDays } from "./lib/date";
import { reconcileSeries } from "./lib/recurrence";

/** Global task search / filter state (UI only, not persisted). */
export interface TaskFilter {
  query: string;
  priority: Priority | "all";
  goalId: string | "all" | "none";
}

export const EMPTY_FILTER: TaskFilter = { query: "", priority: "all", goalId: "all" };

interface StoreState {
  tasks: Task[];
  journals: JournalEntry[];
  goals: Goal[];
  transactions: Transaction[];
  workouts: Workout[];
  notes: Note[];
  settings: Settings;
  currentWeekStart: string;
  currentDay: string;
  user: AuthUser | null;
  syncStatus: SyncStatus;
  /** Task currently open in the detail drawer, or null. UI only. */
  selectedTaskId: string | null;
  /** Global search/filter applied to the planning views. UI only. */
  filter: TaskFilter;
  /** Most recent task deletion, for the undo toast. UI only. */
  lastDeleted: { id: string; at: number } | null;

  // task actions
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

  // journal actions
  upsertJournal: (date: string, patch: Partial<JournalEntry>) => void;

  // goal actions
  addGoal: (title: string, color: string) => void;
  deleteGoal: (id: string) => void;

  // transaction actions (记账)
  addTransaction: (input: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "deleted">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // workout actions (健身)
  addWorkout: (input: Omit<Workout, "id" | "createdAt" | "updatedAt" | "deleted">) => void;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;

  // note actions (备忘录)
  addNote: (input?: Partial<Pick<Note, "title" | "body" | "color">>) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  toggleNotePin: (id: string) => void;
  deleteNote: (id: string) => void;

  // UI state
  openTask: (id: string) => void;
  closeTask: () => void;
  setFilter: (patch: Partial<TaskFilter>) => void;

  // settings / sync
  setLanguage: (lang: "zh" | "en") => void;
  setSettings: (patch: Partial<Settings>) => void;
  setCurrentWeekStart: (d: string) => void;
  setCurrentDay: (d: string) => void;
  setUser: (u: AuthUser | null) => void;
  setSyncStatus: (s: SyncStatus) => void;
  replaceAll: (data: AppData) => void;
  getData: () => AppData;
}

const initialData = loadData();
const initialSettings = loadSettings();

function persist(state: StoreState) {
  saveData({
    tasks: state.tasks,
    journals: state.journals,
    goals: state.goals,
    transactions: state.transactions,
    workouts: state.workouts,
    notes: state.notes,
  });
}

export const useStore = create<StoreState>((set, get) => ({
  tasks: initialData.tasks,
  journals: initialData.journals,
  goals: initialData.goals,
  transactions: initialData.transactions,
  workouts: initialData.workouts,
  notes: initialData.notes,
  settings: initialSettings,
  currentWeekStart: today(),
  currentDay: today(),
  user: null,
  syncStatus: initialSettings.supabaseUrl ? "offline" : "offline",
  selectedTaskId: null,
  filter: { ...EMPTY_FILTER },
  lastDeleted: null,

  addTask: (title, status = "todo", scheduledDate = null, recurrence = null) => {
    const now = Date.now();
    const trimmed = title.trim();
    if (!trimmed) return;
    const siblings = get().tasks.filter(
      (x) => !x.deleted && x.status === status && x.scheduledDate === scheduledDate,
    );
    const task: Task = {
      id: nanoid(),
      title: trimmed,
      notes: "",
      status,
      priority: "medium",
      scheduledDate,
      dueDate: null,
      scheduledPeriod: null,
      order: siblings.length,
      goalId: null,
      createdAt: now,
      updatedAt: now,
      completedAt: status === "done" ? now : null,
      recurrence: scheduledDate ? recurrence : null,
      seriesId: null,
      deleted: false,
    };
    set((s) => ({ tasks: [...s.tasks, task] }));
    persist(get());
    // A recurring habit added here should immediately fill the visible week.
    if (task.recurrence) get().materializeRecurring(addDays(get().currentWeekStart, 6));
  },

  updateTask: (id, patch) => {
    set((s) => ({
      tasks: s.tasks.map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
    // Turning recurrence on (or changing dates) should immediately fill the
    // visible range so instances show without waiting for navigation.
    if ("recurrence" in patch || "dueDate" in patch) {
      get().materializeRecurring(addDays(get().currentWeekStart, 6));
    }
  },

  moveTask: (id, status, scheduledDate, order) => {
    const now = Date.now();
    set((s) => ({
      tasks: s.tasks.map((x) =>
        x.id === id
          ? {
              ...x,
              status,
              scheduledDate,
              // Leaving the calendar (back to inbox) also drops the period.
              scheduledPeriod: scheduledDate === null ? null : x.scheduledPeriod,
              order,
              completedAt:
                status === "done" ? x.completedAt ?? now : status === "todo" ? null : x.completedAt,
              updatedAt: now,
            }
          : x,
      ),
    }));
    persist(get());
    const moved = get().tasks.find((x) => x.id === id);
    if (moved?.recurrence) get().materializeRecurring(addDays(get().currentWeekStart, 6));
  },

  scheduleTask: (id, scheduledDate, scheduledPeriod) => {
    const now = Date.now();
    set((s) => ({
      tasks: s.tasks.map((x) => {
        if (x.id !== id) return x;
        const status: TaskStatus =
          x.status === "done" ? "done" : scheduledDate === null ? "todo" : "doing";
        return {
          ...x,
          scheduledDate,
          scheduledPeriod: scheduledDate === null ? null : scheduledPeriod,
          status,
          completedAt: status === "done" ? x.completedAt : status === "todo" ? null : x.completedAt,
          updatedAt: now,
        };
      }),
    }));
    persist(get());
    // If a recurring series head was rescheduled, refill the visible week.
    const moved = get().tasks.find((x) => x.id === id);
    if (moved?.recurrence) get().materializeRecurring(addDays(get().currentWeekStart, 6));
  },

  toggleDone: (id) => {
    const now = Date.now();
    set((s) => ({
      tasks: s.tasks.map((x) => {
        if (x.id !== id) return x;
        const done = x.status === "done";
        return {
          ...x,
          status: done ? "todo" : "done",
          completedAt: done ? null : now,
          updatedAt: now,
        };
      }),
    }));
    persist(get());
  },

  deleteTask: (id) => {
    set((s) => ({
      tasks: s.tasks.map((x) =>
        x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x,
      ),
      lastDeleted: { id, at: Date.now() },
    }));
    persist(get());
  },

  undoDelete: () => {
    const pending = get().lastDeleted;
    if (!pending) return;
    set((s) => ({
      tasks: s.tasks.map((x) =>
        x.id === pending.id ? { ...x, deleted: false, updatedAt: Date.now() } : x,
      ),
      lastDeleted: null,
    }));
    persist(get());
  },

  materializeRecurring: (upto) => {
    const now = Date.now();
    const current = get().tasks;
    const heads = current.filter(
      (x) => !x.deleted && x.recurrence !== null && x.scheduledDate !== null,
    );
    if (heads.length === 0) return;

    const patched = new Map<string, Task>();
    const deleteIds = new Set<string>();
    const spawned: Task[] = [];

    for (const head of heads) {
      const seriesId = head.seriesId ?? head.id;
      if (head.seriesId === null) {
        patched.set(head.id, { ...head, seriesId, updatedAt: now });
      }
      const members = current
        .filter((x) => (x.seriesId ?? x.id) === seriesId && !x.deleted)
        .map((x) => ({ id: x.id, scheduledDate: x.scheduledDate, status: x.status, isHead: x.id === head.id }));

      // A recurring task's dueDate is the SERIES END: never generate past it.
      const effectiveUpto =
        head.dueDate && head.dueDate < upto ? head.dueDate : upto;

      // Global cleanup: drop any instance past the series end, regardless of the
      // currently-visible window, so stale future instances never linger.
      if (head.dueDate) {
        for (const x of current) {
          if (
            (x.seriesId ?? x.id) === seriesId &&
            !x.deleted &&
            x.id !== head.id &&
            x.status !== "done" &&
            x.scheduledDate !== null &&
            x.scheduledDate > head.dueDate
          ) {
            deleteIds.add(x.id);
          }
        }
      }

      const { spawnDates, deleteIds: toDelete } = reconcileSeries(
        head.scheduledDate as string,
        head.recurrence,
        members,
        effectiveUpto,
      );
      toDelete.forEach((id) => deleteIds.add(id));
      spawnDates.forEach((date, i) => {
        // The head's own date is already covered by the head task itself.
        if (date === head.scheduledDate) return;
        spawned.push({
          ...head,
          id: nanoid(),
          status: "doing",
          scheduledDate: date,
          // Instances carry no deadline; dueDate on the head marks series end.
          dueDate: null,
          order: head.order + i + 1,
          recurrence: null,
          seriesId,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
          deleted: false,
        });
      });
    }

    if (patched.size === 0 && deleteIds.size === 0 && spawned.length === 0) return;
    set((s) => ({
      tasks: [
        ...s.tasks.map((x) => {
          if (deleteIds.has(x.id)) return { ...x, deleted: true, updatedAt: now };
          return patched.get(x.id) ?? x;
        }),
        ...spawned,
      ],
    }));
    persist(get());
  },

  upsertJournal: (date, patch) => {
    const now = Date.now();
    const existing = get().journals.find((j) => j.date === date && !j.deleted);
    if (existing) {
      set((s) => ({
        journals: s.journals.map((j) =>
          j.id === existing.id ? { ...j, ...patch, updatedAt: now } : j,
        ),
      }));
    } else {
      const entry: JournalEntry = {
        id: nanoid(),
        date,
        content: "",
        mood: null,
        createdAt: now,
        updatedAt: now,
        deleted: false,
        ...patch,
      };
      set((s) => ({ journals: [...s.journals, entry] }));
    }
    persist(get());
  },

  addGoal: (title, color) => {
    const now = Date.now();
    const goal: Goal = {
      id: nanoid(),
      title: title.trim(),
      color,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    set((s) => ({ goals: [...s.goals, goal] }));
    persist(get());
  },

  deleteGoal: (id) => {
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, deleted: true, updatedAt: Date.now() } : g,
      ),
      tasks: s.tasks.map((x) => (x.goalId === id ? { ...x, goalId: null } : x)),
    }));
    persist(get());
  },

  addTransaction: (input) => {
    const now = Date.now();
    const txn: Transaction = {
      id: nanoid(),
      ...input,
      amount: Math.abs(input.amount) || 0,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    set((s) => ({ transactions: [...s.transactions, txn] }));
    persist(get());
  },
  updateTransaction: (id, patch) => {
    set((s) => ({
      transactions: s.transactions.map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
  deleteTransaction: (id) => {
    set((s) => ({
      transactions: s.transactions.map((x) =>
        x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },

  addWorkout: (input) => {
    const now = Date.now();
    const workout: Workout = {
      id: nanoid(),
      ...input,
      durationMin: Math.max(0, input.durationMin) || 0,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    set((s) => ({ workouts: [...s.workouts, workout] }));
    persist(get());
  },
  updateWorkout: (id, patch) => {
    set((s) => ({
      workouts: s.workouts.map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
  deleteWorkout: (id) => {
    set((s) => ({
      workouts: s.workouts.map((x) =>
        x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },

  addNote: (input) => {
    const now = Date.now();
    const note: Note = {
      id: nanoid(),
      title: input?.title ?? "",
      body: input?.body ?? "",
      color: input?.color ?? "#fde68a",
      pinned: false,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    set((s) => ({ notes: [...s.notes, note] }));
    persist(get());
    return note.id;
  },
  updateNote: (id, patch) => {
    set((s) => ({
      notes: s.notes.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }));
    persist(get());
  },
  toggleNotePin: (id) => {
    set((s) => ({
      notes: s.notes.map((x) =>
        x.id === id ? { ...x, pinned: !x.pinned, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },
  deleteNote: (id) => {
    set((s) => ({
      notes: s.notes.map((x) =>
        x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x,
      ),
    }));
    persist(get());
  },

  openTask: (id) => set({ selectedTaskId: id }),
  closeTask: () => set({ selectedTaskId: null }),
  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),

  setLanguage: (lang) => {
    const next = { ...get().settings, language: lang };
    set({ settings: next });
    saveSettings(next);
  },

  setSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    saveSettings(next);
  },

  setCurrentWeekStart: (d) => {
    set({ currentWeekStart: d });
    get().materializeRecurring(addDays(d, 6));
  },
  setCurrentDay: (d) => {
    set({ currentDay: d });
    get().materializeRecurring(d);
  },
  setUser: (u) => set({ user: u }),
  setSyncStatus: (s) => set({ syncStatus: s }),

  replaceAll: (data) => {
    set({
      tasks: data.tasks,
      journals: data.journals,
      goals: data.goals,
      transactions: data.transactions,
      workouts: data.workouts,
      notes: data.notes,
    });
    persist(get());
  },

  getData: () => {
    const s = get();
    return {
      tasks: s.tasks,
      journals: s.journals,
      goals: s.goals,
      transactions: s.transactions,
      workouts: s.workouts,
      notes: s.notes,
    };
  },
}));

// ---- selectors (pure helpers) ----

export function activeTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.deleted);
}

export function tasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return activeTasks(tasks)
    .filter((t) => t.status === status)
    .sort((a, b) => a.order - b.order);
}

/** Unscheduled todo/doing tasks — the inbox. */
export function inboxTasks(tasks: Task[]): Task[] {
  return activeTasks(tasks)
    .filter((t) => t.scheduledDate === null && t.status !== "done")
    .sort((a, b) => a.order - b.order);
}

export function tasksForDay(tasks: Task[], date: string): Task[] {
  return activeTasks(tasks)
    .filter((t) => t.scheduledDate === date)
    .sort((a, b) => a.order - b.order);
}

/** Tasks on `date` with no period assigned yet — the day's pool. */
export function unassignedTasksForDay(tasks: Task[], date: string): Task[] {
  return activeTasks(tasks)
    .filter((t) => t.scheduledDate === date && t.scheduledPeriod === null)
    .sort((a, b) => a.order - b.order);
}

/** Tasks on `date` in a given period (morning/afternoon/evening). */
export function tasksForPeriod(tasks: Task[], date: string, period: DayPeriod): Task[] {
  return activeTasks(tasks)
    .filter((t) => t.scheduledDate === date && t.scheduledPeriod === period)
    .sort((a, b) => a.order - b.order);
}

export const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** The date that governs overdue/due status: the deadline if set, else the start date. */
export function effectiveDeadline(task: Task): string | null {
  return task.dueDate ?? task.scheduledDate;
}

/** Deadline before `todayIso`, still not done — genuinely overdue. */
export function isOverdue(task: Task, todayIso: string): boolean {
  const deadline = effectiveDeadline(task);
  return (
    !task.deleted &&
    task.status !== "done" &&
    deadline !== null &&
    deadline < todayIso
  );
}

/** Deadline is today and not done yet — due today. */
export function isDueToday(task: Task, todayIso: string): boolean {
  return (
    !task.deleted &&
    task.status !== "done" &&
    effectiveDeadline(task) === todayIso
  );
}

/** Count of tasks needing attention (overdue + due today). Drives the red badge. */
export function attentionCount(tasks: Task[], todayIso: string): number {
  return activeTasks(tasks).filter(
    (task) => isOverdue(task, todayIso) || isDueToday(task, todayIso),
  ).length;
}

/** Completion rate (0..1) among tasks scheduled on `date`; 0 when none. */
export function dayCompletion(tasks: Task[], date: string): { done: number; total: number; rate: number } {
  const scheduled = activeTasks(tasks).filter((task) => task.scheduledDate === date);
  const done = scheduled.filter((task) => task.status === "done").length;
  const total = scheduled.length;
  return { done, total, rate: total ? done / total : 0 };
}

/** Whether a task passes the current search/filter. Pure. */
export function matchesFilter(task: Task, filter: TaskFilter): boolean {
  const query = filter.query.trim().toLowerCase();
  if (query && !task.title.toLowerCase().includes(query)) return false;
  if (filter.priority !== "all" && task.priority !== filter.priority) return false;
  if (filter.goalId === "none") {
    if (task.goalId !== null) return false;
  } else if (filter.goalId !== "all" && task.goalId !== filter.goalId) {
    return false;
  }
  return true;
}

/**
 * Tasks passing the global filter. Planning views use this in place of the raw
 * `tasks` array; when the filter is empty it returns the tasks unchanged.
 */
export function useFilteredTasks(): Task[] {
  const tasks = useStore((s) => s.tasks);
  const filter = useStore((s) => s.filter);
  return useMemo(() => {
    const active =
      filter.query === "" && filter.priority === "all" && filter.goalId === "all";
    return active ? tasks : tasks.filter((task) => matchesFilter(task, filter));
  }, [tasks, filter]);
}
