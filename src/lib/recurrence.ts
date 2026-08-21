import type { Recurrence } from "../types";
import { addDays, daysBetween, nextRecurrenceDate } from "./date.ts";

/** Safety cap: never generate more than this many occurrences in one pass. */
export const OCCURRENCE_CAP = 400;

/**
 * Dates strictly after `latest` up to and including `upto`, stepping by the
 * recurrence rule. `latest` is the newest occurrence already materialized for
 * the series (its start date). Returns [] for one-off tasks or when caught up.
 */
export function occurrenceDates(
  latest: string,
  recurrence: Recurrence,
  upto: string,
  cap: number = OCCURRENCE_CAP,
): string[] {
  if (!recurrence) return [];
  const out: string[] = [];
  let cursor = latest;
  while (out.length < cap) {
    const next = nextRecurrenceDate(cursor, recurrence);
    if (!next || next > upto) break;
    out.push(next);
    cursor = next;
  }
  return out;
}

/** A series member as seen by the reconciler (only the fields it needs). */
export interface SeriesMember {
  id: string;
  scheduledDate: string | null;
  status: "todo" | "doing" | "done";
  isHead: boolean;
  /** Deleted single occurrence that still reserves its grid date. */
  skipped?: boolean;
}

export interface ReconcileResult {
  /** Grid dates that need a fresh instance spawned. */
  spawnDates: string[];
  /** Member ids to soft-delete (off-grid or duplicate, and not completed). */
  deleteIds: string[];
}

/**
 * Reconcile a recurring series against its canonical date grid (head's start
 * date, stepping by the rule, through `upto`). Keeps the head and any completed
 * instances; removes off-grid or duplicate *incomplete* instances; reports
 * which grid dates still need an instance. Idempotent: running twice is a no-op.
 */
export function reconcileSeries(
  headStart: string,
  recurrence: Recurrence,
  members: SeriesMember[],
  upto: string,
  cap: number = OCCURRENCE_CAP,
): ReconcileResult {
  // Canonical grid = head start plus every recurrence step up to `upto`.
  const grid = new Set<string>([headStart, ...occurrenceDates(headStart, recurrence, upto, cap)]);

  const filled = new Set<string>();
  const deleteIds: string[] = [];

  // A skipped (single-day-deleted) occurrence keeps reserving its grid date,
  // so the reconciler never respawns a replacement for it.
  for (const m of members) {
    if (m.skipped && m.scheduledDate) filled.add(m.scheduledDate);
  }

  // Done instances and the head claim their dates first (never deleted here).
  const ordered = [...members]
    .filter((m) => !m.skipped)
    .sort(
      (a, b) =>
        Number(b.isHead) - Number(a.isHead) || Number(b.status === "done") - Number(a.status === "done"),
    );
  for (const m of ordered) {
    if (!m.scheduledDate) continue;
    const keep = m.isHead || m.status === "done";
    const onGrid = grid.has(m.scheduledDate);
    const free = !filled.has(m.scheduledDate);
    if (keep) {
      filled.add(m.scheduledDate);
    } else if (onGrid && free) {
      filled.add(m.scheduledDate);
    } else {
      // Incomplete instance that is off-grid or a duplicate for its date.
      deleteIds.push(m.id);
    }
  }

  const spawnDates = [...grid].filter((d) => !filled.has(d)).sort();
  return { spawnDates, deleteIds };
}

/**
 * Deadline for a generated occurrence: shift the head's deadline by the same
 * number of days that separate the occurrence from the head's start, so the
 * task's span is preserved. null when the head has no deadline.
 */
export function dueForOccurrence(
  headStart: string,
  headDue: string | null,
  occurrenceDate: string,
): string | null {
  if (!headDue) return null;
  const span = Math.max(0, daysBetween(headStart, headDue));
  return addDays(occurrenceDate, span);
}
