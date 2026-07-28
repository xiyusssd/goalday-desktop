import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import clsx from "clsx";
import { useStore, useFilteredTasks, inboxTasks, tasksForDay } from "../store";
import { Task } from "../types";
import { weekDays, addWeeks, isToday, dayOfMonth, today } from "../lib/date";
import { useT } from "../i18n";
import { TaskCard } from "./TaskCard";
import { QuickAdd } from "./QuickAdd";
import { Droppable } from "./Droppable";
import { useStitch, StitchMascot } from "./stitch";

export function WeekBoard() {
  const tasks = useFilteredTasks();
  const weekStart = useStore((s) => s.currentWeekStart);
  const setWeekStart = useStore((s) => s.setCurrentWeekStart);
  const moveTask = useStore((s) => s.moveTask);
  const { t, tArr } = useT();
  const stitch = useStitch();
  const [active, setActive] = useState<Task | null>(null);

  const days = weekDays(weekStart);
  const labels = tArr("weekdayShort");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragStart = (e: DragStartEvent) => setActive((e.active.data.current?.task as Task) ?? null);

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const overId = e.over?.id as string | undefined;
    const task = e.active.data.current?.task as Task | undefined;
    if (!overId || !task) return;

    if (overId === "inbox") {
      const order = inboxTasks(tasks).length;
      moveTask(task.id, task.status === "done" ? "todo" : task.status, null, order);
      return;
    }
    if (overId.startsWith("day:")) {
      const date = overId.slice(4);
      const order = tasksForDay(tasks, date).length;
      const status = task.status === "done" ? "done" : "doing";
      moveTask(task.id, status, date, order);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4">
        {/* Week grid */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, -1))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ‹ {t("prevWeek")}
            </button>
            <button
              onClick={() => setWeekStart(today())}
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t("thisWeek")}
            </button>
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t("nextWeek")} ›
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-7 gap-2">
            {days.map((date, i) => {
              const dayTasks = tasksForDay(tasks, date);
              const highlight = isToday(date);
              return (
                <Droppable
                  key={date}
                  id={`day:${date}`}
                  className={clsx(
                    "flex min-h-0 flex-col rounded-xl border p-1.5",
                    highlight
                      ? "border-brand-300 bg-brand-50/40 dark:border-brand-500/50 dark:bg-brand-500/10"
                      : "border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-800/50",
                  )}
                >
                  <div className="mb-1 flex items-baseline justify-between px-1">
                    <span
                      className={clsx(
                        "text-xs font-semibold",
                        highlight ? "text-brand-600 dark:text-brand-300" : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {labels[i]}
                    </span>
                    <span
                      className={clsx(
                        "text-sm font-bold",
                        highlight ? "text-brand-600 dark:text-brand-300" : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {dayOfMonth(date)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                    {dayTasks.map((task) => (
                      <TaskCard key={task.id} task={task} compact />
                    ))}
                  </div>
                  <QuickAdd status="doing" scheduledDate={date} className="mt-1.5 text-xs" />
                </Droppable>
              );
            })}
          </div>
        </div>

        {/* Inbox */}
        <Droppable
          id="inbox"
          className="flex w-64 shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("inbox")}</h2>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-400" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16v12H4zM4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <QuickAdd status="todo" scheduledDate={null} className="mb-2" />
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {inboxTasks(tasks).length === 0 ? (
              <div className="mt-4 flex flex-col items-center gap-2">
                {stitch && <StitchMascot size={56} className="opacity-80" />}
                <p className="text-center text-xs text-slate-400">{t("emptyBoardHint")}</p>
              </div>
            ) : (
              inboxTasks(tasks).map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </Droppable>
      </div>

      <DragOverlay>{active ? <TaskCard task={active} /> : null}</DragOverlay>
    </DndContext>
  );
}
