import { useEffect, useState } from "react";
import { useStore } from "../store";
import { useT } from "../i18n";

const VISIBLE_MS = 5000;

export function UndoToast() {
  const lastDeleted = useStore((s) => s.lastDeleted);
  const undoDelete = useStore((s) => s.undoDelete);
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  const stamp = lastDeleted?.at;
  useEffect(() => {
    if (!stamp) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [stamp]);

  if (!visible || !lastDeleted) return null;

  return (
    <div className="gd-toast fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-slate-700">
        <span>{t("taskDeleted")}</span>
        <button
          onClick={() => {
            undoDelete();
            setVisible(false);
          }}
          className="font-semibold text-brand-300 hover:text-brand-200"
        >
          {t("undo")}
        </button>
      </div>
    </div>
  );
}
