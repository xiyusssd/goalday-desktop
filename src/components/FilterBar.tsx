import { useStore } from "../store";
import { Priority } from "../types";
import { useT } from "../i18n";

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

export function FilterBar() {
  const filter = useStore((s) => s.filter);
  const setFilter = useStore((s) => s.setFilter);
  const goals = useStore((s) => s.goals);
  const { t } = useT();

  const activeGoals = goals.filter((goal) => !goal.deleted);
  const priorities: Priority[] = ["high", "medium", "low"];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        <input
          data-search
          value={filter.query}
          onChange={(event) => setFilter({ query: event.target.value })}
          placeholder={t("search")}
          className="w-48 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <select
        value={filter.priority}
        onChange={(event) => setFilter({ priority: event.target.value as Priority | "all" })}
        className={selectClass}
      >
        <option value="all">{t("priority")}: {t("all")}</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {t(priority)}
          </option>
        ))}
      </select>

      <select
        value={filter.goalId}
        onChange={(event) => setFilter({ goalId: event.target.value })}
        className={selectClass}
      >
        <option value="all">{t("goals")}: {t("all")}</option>
        <option value="none">{t("noGoal")}</option>
        {activeGoals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </select>
    </div>
  );
}
