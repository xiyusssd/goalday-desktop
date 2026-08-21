import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useStore } from "./store";
import { addDays, today } from "./lib/date";
import { SyncProvider } from "./lib/SyncProvider";
import { Sidebar, View } from "./components/Sidebar";
import { HomeView } from "./components/HomeView";
import { DailyPlanView } from "./components/DailyPlanView";
import { WeekBoard } from "./components/WeekBoard";
import { TaskDrawer } from "./components/TaskDrawer";
import { DeleteTaskDialog } from "./components/DeleteTaskDialog";

// Less-frequently opened views are code-split so they stay out of the entry chunk.
const JournalView = lazy(() => import("./components/JournalView").then((m) => ({ default: m.JournalView })));
const StatsView = lazy(() => import("./components/StatsView").then((m) => ({ default: m.StatsView })));
const SettingsView = lazy(() => import("./components/SettingsView").then((m) => ({ default: m.SettingsView })));
const MoneyView = lazy(() => import("./components/MoneyView").then((m) => ({ default: m.MoneyView })));
const FitnessView = lazy(() => import("./components/FitnessView").then((m) => ({ default: m.FitnessView })));
const NotesView = lazy(() => import("./components/NotesView").then((m) => ({ default: m.NotesView })));
import { FilterBar } from "./components/FilterBar";
import { ShortcutsHelp } from "./components/ShortcutsHelp";
import { UndoToast } from "./components/UndoToast";
import { useTheme } from "./lib/useTheme";
import { useHotkeys } from "./lib/useHotkeys";
import { useT, Key } from "./i18n";

const FILTERABLE: View[] = ["daily", "week"];

const TITLES: Record<View, Key> = {
  home: "home",
  daily: "daily",
  week: "board",
  journal: "journal",
  money: "money",
  fitness: "fitness",
  notes: "notesView",
  stats: "stats",
  settings: "settings",
};

function CurrentView({ view }: { view: View }) {
  switch (view) {
    case "home":
      return <HomeView />;
    case "daily":
      return <DailyPlanView />;
    case "week":
      return <WeekBoard />;
    case "journal":
      return <JournalView />;
    case "money":
      return <MoneyView />;
    case "fitness":
      return <FitnessView />;
    case "notes":
      return <NotesView />;
    case "stats":
      return <StatsView />;
    case "settings":
      return <SettingsView />;
  }
}

export function App() {
  const [view, setView] = useState<View>("home");
  const [helpOpen, setHelpOpen] = useState(false);
  const { t } = useT();
  useTheme();

  const toggleHelp = useCallback(() => setHelpOpen((v) => !v), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  useHotkeys({ setView, toggleHelp, closeHelp });

  // Fill recurring-series instances for the current week on launch.
  const materializeRecurring = useStore((s) => s.materializeRecurring);
  const currentWeekStart = useStore((s) => s.currentWeekStart);
  useEffect(() => {
    materializeRecurring(addDays(currentWeekStart, 6));
  }, [materializeRecurring, currentWeekStart]);

  // Day-rollover refresh: if the app stays open past midnight, re-render the
  // date-sensitive views (today/overdue) and top up recurring instances.
  const [, forceTick] = useState(0);
  useEffect(() => {
    let last = today();
    const timer = setInterval(() => {
      const now = today();
      if (now !== last) {
        last = now;
        materializeRecurring(addDays(currentWeekStart, 6));
        forceTick((n) => n + 1);
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [materializeRecurring, currentWeekStart]);

  return (
    <SyncProvider>
      <div className="flex h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <Sidebar view={view} onChange={setView} />
        <main className="flex min-w-0 flex-1 flex-col p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold">{t(TITLES[view])}</h1>
            {FILTERABLE.includes(view) && <FilterBar />}
          </div>
          <div className="min-h-0 flex-1">
            <Suspense fallback={<div className="p-4 text-sm text-slate-400">…</div>}>
              <CurrentView view={view} />
            </Suspense>
          </div>
        </main>
      </div>
      <TaskDrawer />
      <DeleteTaskDialog />
      <UndoToast />
      {helpOpen && <ShortcutsHelp onClose={closeHelp} />}
    </SyncProvider>
  );
}
