import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";
import weekday from "dayjs/plugin/weekday.js";
import "dayjs/locale/zh-cn.js";

dayjs.extend(isoWeek);
dayjs.extend(weekday);

export type Lang = "zh" | "en";

export const ISO = "YYYY-MM-DD";

export function today(): string {
  return dayjs().format(ISO);
}

/** Monday of the week containing `date`. */
export function weekStart(date: string | Date = new Date()): string {
  return dayjs(date).isoWeekday(1).format(ISO);
}

/** The 7 ISO date strings (Mon..Sun) for the week containing `date`. */
export function weekDays(date: string | Date = new Date()): string[] {
  const start = dayjs(date).isoWeekday(1);
  return Array.from({ length: 7 }, (_, i) => start.add(i, "day").format(ISO));
}

export function addWeeks(date: string, delta: number): string {
  return dayjs(date).add(delta, "week").format(ISO);
}

export function addDays(date: string, delta: number): string {
  return dayjs(date).add(delta, "day").format(ISO);
}

/** e.g. "Mon, Jul 27" — a compact single-day header. */
/** Human-readable single day, localized: zh "7月27日 周一" / en "Mon, Jul 27". */
export function formatDay(date: string, lang: Lang = "en"): string {
  if (lang === "zh") return dayjs(date).locale("zh-cn").format("M月D日 ddd");
  return dayjs(date).locale("en").format("ddd, MMM D");
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function isToday(date: string): boolean {
  return date === today();
}

/** Short weekday label index 0..6 (Mon..Sun) for i18n lookups. */
export function weekdayIndex(date: string): number {
  return dayjs(date).isoWeekday() - 1;
}

export function dayOfMonth(date: string): number {
  return dayjs(date).date();
}

/** Whole days from `a` to `b` (b - a); negative if b is before a. */
export function daysBetween(a: string, b: string): number {
  return dayjs(b).diff(dayjs(a), "day");
}

/** Next scheduled date for a recurrence rule, or null for one-off. */
export function nextRecurrenceDate(
  date: string,
  recurrence: "daily" | "weekly" | "monthly" | null,
): string | null {
  if (!recurrence) return null;
  const unit = recurrence === "daily" ? "day" : recurrence === "weekly" ? "week" : "month";
  return dayjs(date).add(1, unit).format(ISO);
}

export function formatRange(startDate: string): string {
  const start = dayjs(startDate);
  const end = start.add(6, "day");
  if (start.month() === end.month()) {
    return `${start.format("MMM D")} – ${end.format("D, YYYY")}`;
  }
  return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
}
