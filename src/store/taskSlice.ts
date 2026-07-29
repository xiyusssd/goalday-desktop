import { nanoid } from "nanoid";
import type { Task, TaskStatus } from "../types";
import { addDays } from "../lib/date";
import { reconcileSeries } from "../lib/recurrence";
import { initialData } from "./initial";
import { persist } from "./persist";
import { EMPTY_FILTER, type Slice, type TaskSlice } from "./types";

export const createTaskSlice: Slice<TaskSlice> = (set, get) => ({
  tasks: initialData.tasks,
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

  openTask: (id) => set({ selectedTaskId: id }),
  closeTask: () => set({ selectedTaskId: null }),
  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),
});
