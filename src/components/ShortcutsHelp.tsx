import { useT, Key } from "../i18n";

const ROWS: { keys: string[]; label: Key }[] = [
  { keys: ["1"], label: "home" },
  { keys: ["2"], label: "scGoDaily" },
  { keys: ["3"], label: "scGoWeek" },
  { keys: ["4"], label: "scGoJournal" },
  { keys: ["5"], label: "scGoMoney" },
  { keys: ["6"], label: "scGoFitness" },
  { keys: ["7"], label: "scGoNotes" },
  { keys: ["8"], label: "scGoStats" },
  { keys: ["9"], label: "scGoSettings" },
  { keys: ["n"], label: "scNewTask" },
  { keys: ["/"], label: "scSearch" },
  { keys: ["?"], label: "scHelp" },
  { keys: ["Esc"], label: "scClose" },
];

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
      <div
        className="relative w-80 rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("shortcuts")}</h2>
        <div className="flex flex-col gap-1.5">
          {ROWS.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">{t(row.label)}</span>
              <span className="flex gap-1">
                {row.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
