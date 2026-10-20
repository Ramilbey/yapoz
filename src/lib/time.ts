import { TZDate, tz } from "@date-fns/tz";
import { format, addDays } from "date-fns";

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Instant for a wall-clock date + time in a time zone. */
export function zoned(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, 0, 0, timeZone).getTime());
}

export function localDate(d: Date, timeZone: string): string {
  return format(d, "yyyy-MM-dd", { in: tz(timeZone) });
}
export function localTime(d: Date, timeZone: string): string {
  return format(d, "HH:mm", { in: tz(timeZone) });
}
export function localWeekday(d: Date, timeZone: string): Weekday {
  return WEEKDAYS[new TZDate(d.getTime(), timeZone).getDay()];
}
export function fmt(d: Date, timeZone: string, pattern: string): string {
  return format(d, pattern, { in: tz(timeZone) });
}
/** Human label like "Fri 23 Oct, 8:00pm". */
export function human(d: Date, timeZone: string): string {
  return format(d, "EEE d MMM, h:mmaaa", { in: tz(timeZone) });
}
export function todayLocal(timeZone: string, now = new Date()): string {
  return localDate(now, timeZone);
}
export function addLocalDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return format(addDays(new Date(Date.UTC(y, m - 1, d, 12)), n), "yyyy-MM-dd");
}
export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
export function timeOf(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
