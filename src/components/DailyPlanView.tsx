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
import { useStore, useFilteredTasks, inboxTasks, tasksForPeriod, unassignedTasksForDay } from "../store";
import { DayPeriod, DAY_PERIODS, Task } from "../types";
import { addDays, formatDay, isToday, today } from "../lib/date";
import { useT, Key } from "../i18n";
import { TaskCard } from "./TaskCard";
import { QuickAdd } from "./QuickAdd";
import { Droppable } from "./Droppable";
import { useStitch, StitchMascot } from "./stitch";

const PERIOD_META: Record<DayPeriod, { key: Key; icon: string; accent: string }> = {
  morning: { key: "morning", icon: "M12 3v2M5 12H3m3.3-5.7L4.9 4.9M12 8a4 4 0 100 8 4 4 0 000-8z", accent: "text-amber-500" },
  afternoon: { key: "afternoon", icon: "M12 3v1M12 20v1M4 12H3m18 0h-1M6 6l-.7-.7m13.4 0L18 6M12 8a4 4 0 100 8 4 4 0 000-8z", accent: "text-orange-500" },
  evening: { key: "evening", icon: "M17 12a5 5 0 01-6.5 4.8A5 5 0 1017 12z", accent: "text-indigo-500" },
};

export function DailyPlanView() {
  const tasks = useFilteredTasks();
  const day = useStore((s) => s.currentDay);
  const setDay = useStore((s) => s.setCurrentDay);
  const scheduleTask = useStore((s) => s.scheduleTask);
  const moveTask = useStore((s) => s.moveTask);
  const { t, lang } = useT();
  const [active, setActive] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const stitch = useStitch();
  const pool = unassignedTasksForDay(tasks, day);
  const inbox = inboxTasks(tasks);

  const onDragStart = (e: DragStartEvent) => setActive((e.active.data.current?.task as Task) ?? null);

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const overId = e.over?.id as string | undefined;
    const task = e.active.data.current?.task as Task | undefined;
    if (!overId || !task) return;
    if (overId.startsWith("period:")) {
      scheduleTask(task.id, day, overId.slice(7) as DayPeriod);
    } else if (overId === "daypool") {
      scheduleTask(task.id, day, null);
    } else if (overId === "inbox") {
      moveTask(task.id, task.status === "done" ? "todo" : task.status, null, inboxTasks(tasks).length);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <button
          onClick={() => setDay(addDays(day, -1))}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ‹ {t("prevDay")}
        </button>
        <button
          onClick={() => setDay(today())}
          className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t("today")}
        </button>
        <button
          onClick={() => setDay(addDays(day, 1))}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t("nextDay")} ›
        </button>
        <span className={clsx("ml-2 font-semibold", isToday(day) ? "text-brand-600 dark:text-brand-300" : "text-slate-600 dark:text-slate-300")}>
          {formatDay(day, lang)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Three period columns */}
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-3">
          {DAY_PERIODS.map((period) => {
            const meta = PERIOD_META[period];
            const list = tasksForPeriod(tasks, day, period);
            return (
              <Droppable
                key={period}
                id={`period:${period}`}
                className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="mb-2 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className={clsx("h-4 w-4", meta.accent)} fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d={meta.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t(meta.key)}</h2>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    {list.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="mt-4 flex flex-col items-center gap-1.5">
                      {stitch && <StitchMascot size={48} className="opacity-80" />}
                      <p className="text-center text-xs text-slate-400">{t("dragToPeriod")}</p>
                    </div>
                  ) : (
                    list.map((task) => <TaskCard key={task.id} task={task} compact showPeriod />)
                  )}
                </div>
              </Droppable>
            );
          })}
        </div>

        {/* Right column: day pool + inbox */}
        <div className="flex w-72 shrink-0 flex-col gap-4">
          <Droppable
            id="daypool"
            className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("dayPool")}</h2>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6zM12 15v5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <QuickAdd status="doing" scheduledDate={day} className="mb-2" />
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {pool.length === 0 ? (
                <p className="mt-3 text-center text-xs text-slate-400">{t("dragToPeriod")}</p>
              ) : (
                pool.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </Droppable>

          <Droppable
            id="inbox"
            className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("inbox")}</h2>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16v12H4zM4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <QuickAdd status="todo" scheduledDate={null} className="mb-2" />
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {inbox.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </Droppable>
        </div>
      </div>
      </div>

      <DragOverlay>{active ? <TaskCard task={active} /> : null}</DragOverlay>
    </DndContext>
  );
}
