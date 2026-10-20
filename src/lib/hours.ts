import { localDate, localWeekday, minutesOf, zoned, addLocalDays, localTime, timeOf } from "./time";

export type HoursData = {
  weekly: Record<string, [string, string][]>;
  lastOrdersMinutesBeforeClose: number;
  exceptions: { date: string; hours: [string, string][]; note: string }[];
};

export type DayHours = { date: string; weekday: string; intervals: { open: string; close: string }[]; closed: boolean; note: string | null };

export function hoursForDate(h: HoursData, date: string, timeZone: string): DayHours {
  const weekday = localWeekday(zoned(date, "12:00", timeZone), timeZone);
  const ex = h.exceptions.find((e) => e.date === date);
  const raw = ex ? ex.hours : h.weekly[weekday] ?? [];
  const intervals = raw.map(([open, close]) => ({ open, close }));
  return { date, weekday, intervals, closed: intervals.length === 0, note: ex?.note ?? null };
}

/** [openInstant, closeInstant] pairs for a date; closes after midnight roll into the next day. */
export function openWindows(h: HoursData, date: string, timeZone: string): { start: Date; end: Date }[] {
  return hoursForDate(h, date, timeZone).intervals.map(({ open, close }) => {
    const start = zoned(date, open, timeZone);
    const closeDate = minutesOf(close) <= minutesOf(open) ? addLocalDays(date, 1) : date;
    return { start, end: zoned(closeDate, close, timeZone) };
  });
}

export function openStatus(h: HoursData, now: Date, timeZone: string) {
  for (const date of [addLocalDays(localDate(now, timeZone), -1), localDate(now, timeZone)]) {
    for (const w of openWindows(h, date, timeZone)) {
      if (now >= w.start && now < w.end) {
        const lastOrders = new Date(w.end.getTime() - h.lastOrdersMinutesBeforeClose * 60_000);
        return { open: true, closesAt: localTime(w.end, timeZone), lastOrdersAt: localTime(lastOrders, timeZone) };
      }
    }
  }
  return { open: false, closesAt: null, lastOrdersAt: null };
}

export function describeDay(d: DayHours): string {
  if (d.closed) return `closed${d.note ? ` (${d.note})` : ""}`;
  const pretty = (t: string) => {
    const m = minutesOf(t);
    const h = Math.floor(m / 60) % 24;
    const mm = m % 60;
    const ap = h >= 12 ? "pm" : "am";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${ap}`;
  };
  return d.intervals.map((i) => `${pretty(i.open)}–${pretty(i.close)}`).join(", ") + (d.note ? ` (${d.note})` : "");
}

export { timeOf };
