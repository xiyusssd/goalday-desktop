// Pure completion-stats helpers. Dep-free (no dayjs) so the hot render path
// avoids per-task dayjs parsing/formatting and the module stays Node-testable.

/** Convert an epoch-ms timestamp to a local `YYYY-MM-DD` date string. */
export function msToIsoDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Completable {
  completedAt: number | null;
}

/**
 * Number of completed tasks per local date, built in one pass. Used for both
 * the weekly bar chart (counts) and streak (via `.has`), replacing repeated
 * `dayjs(...).format()` scans.
 */
export function completionCountByDate(tasks: Completable[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (t.completedAt) {
      const iso = msToIsoDate(t.completedAt);
      counts.set(iso, (counts.get(iso) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Consecutive days up to `todayIso` (inclusive) with >=1 completion. Stops at
 * the first day with no completion; bounded by the number of distinct dates.
 */
export function completionStreak(
  dateIndex: { has(key: string): boolean },
  todayIso: string,
): number {
  const cursor = new Date(`${todayIso}T00:00:00`);
  let streak = 0;
  while (dateIndex.has(msToIsoDate(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
