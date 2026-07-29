import { useMemo } from "react";
import type { DayPeriod, Priority, Task, TaskStatus } from "../types";
import { useStore } from "./store";
import { type TaskFilter } from "./types";

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
