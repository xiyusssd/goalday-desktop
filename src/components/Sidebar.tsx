import clsx from "clsx";
import { useStore, attentionCount } from "../store";
import { today } from "../lib/date";
import { useT, Key } from "../i18n";
import { useStitch, STITCH_NAV_ICONS } from "./stitch";

export type View =
  | "home"
  | "daily"
  | "week"
  | "journal"
  | "money"
  | "fitness"
  | "notes"
  | "stats"
  | "settings";

const NAV: { view: View; key: Key; icon: string }[] = [
  { view: "home", key: "home", icon: "M4 11l8-7 8 7M6 10v9h4v-5h4v5h4v-9" },
  { view: "notes", key: "notesView", icon: "M6 3h9l3 3v15H6zM9 8h6M9 12h6M9 16h4" },
  { view: "daily", key: "daily", icon: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" },
  { view: "week", key: "board", icon: "M4 5h16M4 5v14M4 5l0 0M8 5v14M12 5v14M16 5v14M20 5v14M4 19h16" },
  { view: "journal", key: "journal", icon: "M5 4h11l3 3v13H5zM8 9h8M8 13h8M8 17h5" },
  { view: "money", key: "money", icon: "M3 7h18v10H3zM3 11h18M7 15h2" },
  { view: "fitness", key: "fitness", icon: "M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" },
  { view: "stats", key: "stats", icon: "M4 20V10M10 20V4M16 20v-7M4 20h16" },
  { view: "settings", key: "settings", icon: "M10 4h4l.5 2.5 2-1 2 3.5-2 1.5 0 1 2 1.5-2 3.5-2-1-.5 2.5h-4l-.5-2.5-2 1-2-3.5 2-1.5v-1l-2-1.5 2-3.5 2 1z" },
];

const statusStyle: Record<string, string> = {
  synced: "bg-emerald-400",
  syncing: "bg-amber-400 animate-pulse",
  error: "bg-rose-400",
  offline: "bg-slate-300",
};

export function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const { t } = useT();
  const stitch = useStitch();
  const syncStatus = useStore((s) => s.syncStatus);
  const user = useStore((s) => s.user);
  const tasks = useStore((s) => s.tasks);
  const attention = attentionCount(tasks, today());

  const statusLabel: Key =
    syncStatus === "synced"
      ? "synced"
      : syncStatus === "syncing"
        ? "syncing"
        : syncStatus === "error"
          ? "syncError"
          : "offline";

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-white/80 px-3 py-4 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mb-6 flex items-center gap-2 px-2">
        {stitch ? (
          <img
            src="/cat-logo.png"
            alt="logo"
            className="h-9 w-9 shrink-0 rounded-full bg-white object-contain shadow-sm"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("appName")}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <button
            key={item.view}
            onClick={() => onChange(item.view)}
            className={clsx(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              view === item.view
                ? "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700",
            )}
          >
            {view === item.view && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
            )}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d={stitch ? STITCH_NAV_ICONS[item.view] : item.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t(item.key)}
            {item.view === "daily" && attention > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                {attention}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500">
        <span className={clsx("h-2 w-2 rounded-full", statusStyle[syncStatus])} />
        <span className="truncate">{user ? user.email : t(statusLabel)}</span>
      </div>
    </aside>
  );
}
