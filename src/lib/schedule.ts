// Appointment times: who can take a booking when. A person's bookable windows are the opening hours, cut down to their
// own hours (null = the opening hours), minus the bookings that still hold their time (and the buffer after each).
// "Holds its time" is computed live, like stock holds: confirmed or done, or pending with the payment timer still
// running. Nothing here knows about orders' money, receipts or stock; lib/appointments does the booking itself.
import { and, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";
import { db, t } from "@/db";
import type { AppointmentSettings, StaffSchedule } from "@/db/schema";
import { openWindows, type HoursData } from "./hours";
import { addLocalDays, human, localDate, zoned } from "./time";

type Ws = typeof t.workspaces.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Exec = typeof db | Tx;

export const APPOINTMENT_DEFAULTS: AppointmentSettings = {
  slotMinutes: 30, assignment: "anyone", bookingDays: 30, minNoticeMinutes: 120, changeCutoffHours: 24, reminderMinutes: 60, bufferMinutes: 0, meetBase: "https://meet.jit.si", whatsappTemplate: null,
};

export const appointmentSettings = (ws: Pick<Ws, "settings">): AppointmentSettings => ({ ...APPOINTMENT_DEFAULTS, ...ws.settings.appointments });

/** Until the owner says otherwise: salons, clinics and gyms see people in person; tutors and coaches meet online. Unknown: in person (no stray meeting links). */
export function guessInPerson(businessType: string | null | undefined): boolean {
  const b = (businessType ?? "").toLowerCase();
  if (/online|virtual|remote/.test(b)) return false;
  if (/salon|spa\b|clinic|barber|studio|gym|fitness|massage|beauty|dental|dentist|nail|lash|brow|wax|hair|physio|yoga|pilates|tattoo|groom|vet|optic|repair|workshop/.test(b)) return true;
  if (/tutor|coach|consult|lesson|therap|counsel|mentor/.test(b)) return false;
  return true;
}

/** How long a service takes: its own duration, else one slot. */
export function serviceMinutes(item: { data: Record<string, unknown> | null }, s: AppointmentSettings): number {
  const d = Number(item.data?.durationMinutes);
  return Number.isFinite(d) && d > 0 ? Math.min(Math.round(d), 24 * 60) : s.slotMinutes;
}

/** The booking still holds its time (SQL, over orders). */
export const TAKEN = sql`(${t.orders.status} in ('confirmed', 'ready', 'completed') or (${t.orders.status} = 'pending' and (${t.orders.holdExpiresAt} is null or ${t.orders.holdExpiresAt} > now())))`;
export const isTaken = (o: { status: string; holdExpiresAt: Date | null }, now = new Date()) =>
  o.status === "confirmed" || o.status === "ready" || o.status === "completed" || (o.status === "pending" && (!o.holdExpiresAt || o.holdExpiresAt > now));

/** "Fri 6 Nov, 3:00pm". */
export const when = (ws: Pick<Ws, "timezone">, d: Date) => human(d, ws.timezone);
const clock = (ws: Pick<Ws, "timezone">, d: Date) => human(d, ws.timezone).split(", ")[1];

/** Two bookings for one person at once queue here, inside the transaction that saves or moves one. */
export async function lockStaff(tx: Tx, staffId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`staff:${staffId}`}))`);
}

export class SlotTaken extends Error {
  constructor(message = "That time was just taken by another booking.") {
    super(message);
  }
}

export async function loadHours(x: Exec, workspaceId: string): Promise<HoursData | null> {
  const [h] = await x.select({ data: t.kbItems.data }).from(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), eq(t.kbItems.kind, "hours"), eq(t.kbItems.active, true))).limit(1);
  return (h?.data as unknown as HoursData | undefined) ?? null;
}

export type Person = { userId: string; name: string; schedule: StaffSchedule | null; serviceIds: string[] };

/** Everyone switched on to take appointments, and, given a service, only those who do it. */
export async function bookableStaff(x: Exec, ws: Pick<Ws, "id" | "settings">, itemId?: string | null): Promise<Person[]> {
  const rows = await x
    .select({ userId: t.staff.userId, name: t.users.name, schedule: t.staff.schedule, serviceIds: t.staff.serviceIds })
    .from(t.staff)
    .innerJoin(t.users, and(eq(t.users.id, t.staff.userId), eq(t.users.workspaceId, ws.id)))
    .where(and(eq(t.staff.workspaceId, ws.id), eq(t.staff.takesAppointments, true)))
    .orderBy(t.users.name);
  if (!itemId || appointmentSettings(ws).assignment === "anyone") return rows;
  return rows.filter((r) => r.serviceIds.includes(itemId));
}

type Interval = { start: Date; end: Date };

/** When a person can be booked on a date: opening hours ∩ their own hours. No opening hours on file: their hours alone. */
export function staffWindows(hours: HoursData | null, schedule: StaffSchedule | null, date: string, timeZone: string): Interval[] {
  const open = hours ? openWindows(hours, date, timeZone) : null;
  const own = schedule ? openWindows({ ...schedule, lastOrdersMinutesBeforeClose: 0 }, date, timeZone) : null;
  if (!own) return open ?? [];
  if (!open) return own;
  const out: Interval[] = [];
  for (const a of open) for (const b of own) {
    const start = a.start > b.start ? a.start : b.start;
    const end = a.end < b.end ? a.end : b.end;
    if (start < end) out.push({ start, end });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type Busy = { staffId: string; orderId: string; start: Date; end: Date };

/** Bookings that hold their time for these people, overlapping [from, to). */
export async function busyBetween(x: Exec, workspaceId: string, staffIds: string[], from: Date, to: Date, excludeOrder?: string | null): Promise<Busy[]> {
  if (!staffIds.length) return [];
  const rows = await x
    .select({ staffId: t.appointments.staffId, orderId: t.appointments.orderId, start: t.appointments.startsAt, end: t.appointments.endsAt })
    .from(t.appointments)
    .innerJoin(t.orders, eq(t.orders.id, t.appointments.orderId))
    .where(and(eq(t.appointments.workspaceId, workspaceId), inArray(t.appointments.staffId, staffIds), lt(t.appointments.startsAt, to), gt(t.appointments.endsAt, from), TAKEN, excludeOrder ? ne(t.appointments.orderId, excludeOrder) : undefined));
  return rows.filter((r): r is Busy => Boolean(r.staffId));
}

const MIN = 60_000;

/** [start, start + minutes) sits inside a window and keeps `buffer` minutes clear of every other booking. */
function fits(start: Date, minutes: number, buffer: number, windows: Interval[], busy: Busy[]): boolean {
  const s = start.getTime();
  const e = s + minutes * MIN;
  if (!windows.some((w) => s >= w.start.getTime() && e <= w.end.getTime())) return false;
  return !busy.some((b) => s < b.end.getTime() + buffer * MIN && b.start.getTime() < e + buffer * MIN);
}

/** Whether this person already has a booking that clashes with [start, end) (plus the buffer). */
export async function slotTaken(x: Exec, ws: Pick<Ws, "id" | "settings">, staffId: string, start: Date, end: Date, excludeOrder?: string | null): Promise<boolean> {
  const buffer = appointmentSettings(ws).bufferMinutes;
  const busy = await busyBetween(x, ws.id, [staffId], new Date(start.getTime() - buffer * MIN), new Date(end.getTime() + buffer * MIN), excludeOrder);
  return busy.length > 0;
}

export type Offer = { start: Date; end: Date; staffId: string; staffName: string };

type Board = { people: Person[]; hours: HoursData | null; busy: Busy[]; windows: Map<string, Interval[]> };

/** Everything needed to test times between two dates, loaded once. */
async function board(x: Exec, ws: Ws, people: Person[], fromDate: string, toDate: string, excludeOrder?: string | null): Promise<Board> {
  const hours = await loadHours(x, ws.id);
  const from = zoned(addLocalDays(fromDate, -1), "00:00", ws.timezone);
  const to = zoned(addLocalDays(toDate, 2), "00:00", ws.timezone);
  const busy = await busyBetween(x, ws.id, people.map((p) => p.userId), from, to, excludeOrder);
  return { people, hours, busy, windows: new Map() };
}

function windowsOf(b: Board, ws: Ws, p: Person, date: string): Interval[] {
  const key = `${p.userId}|${date}`;
  let w = b.windows.get(key);
  if (!w) {
    // A window that started the day before (open past midnight) still counts.
    w = [...staffWindows(b.hours, p.schedule, addLocalDays(date, -1), ws.timezone), ...staffWindows(b.hours, p.schedule, date, ws.timezone)];
    b.windows.set(key, w);
  }
  return w;
}

const fitsFor = (b: Board, ws: Ws, p: Person, start: Date, minutes: number) =>
  fits(start, minutes, appointmentSettings(ws).bufferMinutes, windowsOf(b, ws, p, localDate(start, ws.timezone)), b.busy.filter((x) => x.staffId === p.userId));

/** Of the people free at `start`, the one with the fewest bookings that day (then by name). */
function pick(b: Board, ws: Ws, people: Person[], start: Date): Person | null {
  const day = localDate(start, ws.timezone);
  const load = (p: Person) => b.busy.filter((x) => x.staffId === p.userId && localDate(x.start, ws.timezone) === day).length;
  return [...people].sort((a, c) => load(a) - load(c) || a.name.localeCompare(c.name))[0] ?? null;
}

const earliestStart = (ws: Ws, now: Date) => new Date(now.getTime() + appointmentSettings(ws).minNoticeMinutes * MIN);
const lastDate = (ws: Ws, now: Date) => addLocalDays(localDate(now, ws.timezone), appointmentSettings(ws).bookingDays);

/**
 * Free start times on the grid, earliest first: one offer per time, with the free person who has the fewest bookings that
 * day. `date` keeps to that day; otherwise it looks ahead through the booking window until it has `limit`.
 */
export async function freeTimes(x: Exec, ws: Ws, o: { itemId: string; minutes: number; staffId?: string | null; date?: string | null; after?: Date | null; limit?: number; excludeOrder?: string | null; now?: Date }): Promise<Offer[]> {
  const now = o.now ?? new Date();
  const s = appointmentSettings(ws);
  let people = await bookableStaff(x, ws, o.itemId);
  if (o.staffId) people = people.filter((p) => p.userId === o.staffId);
  if (!people.length) return [];
  const from = new Date(Math.max(earliestStart(ws, now).getTime(), o.after?.getTime() ?? 0));
  const first = o.date ?? localDate(from, ws.timezone);
  const last = o.date ?? lastDate(ws, now);
  if (first > last || first > lastDate(ws, now)) return [];
  const b = await board(x, ws, people, first, last, o.excludeOrder);
  const limit = o.limit ?? 6;
  const out: Offer[] = [];
  for (let date = first; date <= last && out.length < limit; date = addLocalDays(date, 1)) {
    const midnight = zoned(date, "00:00", ws.timezone).getTime();
    const next = zoned(addLocalDays(date, 1), "00:00", ws.timezone).getTime();
    const starts = new Set<number>();
    for (const p of people) {
      for (const w of windowsOf(b, ws, p, date)) {
        const lo = Math.max(w.start.getTime(), from.getTime(), midnight);
        for (let k = Math.ceil((lo - midnight) / (s.slotMinutes * MIN)); ; k++) {
          const at = midnight + k * s.slotMinutes * MIN;
          if (at >= next || at + o.minutes * MIN > w.end.getTime()) break;
          starts.add(at);
        }
      }
    }
    for (const at of [...starts].sort((a, c) => a - c)) {
      const start = new Date(at);
      const p = pick(b, ws, people.filter((q) => fitsFor(b, ws, q, start, o.minutes)), start);
      if (p) out.push({ start, end: new Date(at + o.minutes * MIN), staffId: p.userId, staffName: p.name });
      if (out.length >= limit) break;
    }
  }
  return out;
}

export type TimeCheck =
  | { ok: true; start: Date; end: Date; staffId: string; staffName: string }
  | {
      ok: false;
      /** In words the assistant can pass on. Never another customer's details. */
      problem: string;
      /** The person is busy but free a little later: "delay N minutes, or pick another time?" */
      delay: { minutes: number; start: Date; staffId: string; staffName: string } | null;
      /** Others who do this service and are free at that exact time (when a specific person was asked for). */
      otherStaff: { staffId: string; staffName: string }[];
      nextTimes: Offer[];
      /** Nobody takes bookings for this service: a person has to arrange it. */
      noStaff?: boolean;
    };

const MAX_DELAY = 60;

/**
 * Can this exact time be booked? With a person asked for, only them; otherwise the free qualified person with the fewest
 * bookings that day. When it can't, says why, and what's nearest: a short delay, others free then, the next free times.
 */
export async function checkTime(x: Exec, ws: Ws, o: { itemId: string; minutes: number; start: Date; staffId?: string | null; excludeOrder?: string | null; now?: Date }): Promise<TimeCheck> {
  const now = o.now ?? new Date();
  const all = await bookableStaff(x, ws, o.itemId);
  const asked = o.staffId ? all.find((p) => p.userId === o.staffId) ?? null : null;
  const next = (after: Date | null, staffId = o.staffId) => freeTimes(x, ws, { itemId: o.itemId, minutes: o.minutes, staffId, after, limit: 4, excludeOrder: o.excludeOrder, now });
  const no = (problem: string, extra: Partial<Extract<TimeCheck, { ok: false }>> = {}): Extract<TimeCheck, { ok: false }> => ({ ok: false, problem, delay: null, otherStaff: [], nextTimes: [], ...extra });
  if (!all.length) return no("Nobody takes bookings for this service yet.", { noStaff: true });
  if (o.staffId && !asked) return no("That person doesn't do this service.", { otherStaff: all.map((p) => ({ staffId: p.userId, staffName: p.name })), nextTimes: await next(o.start, null) });
  if (o.start <= now) return no("That time has already passed.", { nextTimes: await next(null) });
  const s = appointmentSettings(ws);
  if (o.start < earliestStart(ws, now)) return no(`We need at least ${notice(s.minNoticeMinutes)} notice for a booking.`, { nextTimes: await next(null) });
  const date = localDate(o.start, ws.timezone);
  if (date > lastDate(ws, now)) return no(`We take bookings up to ${s.bookingDays} days ahead.`, { nextTimes: await next(null) });

  const people = asked ? [asked] : all;
  const b = await board(x, ws, all, date, date, o.excludeOrder);
  const free = people.filter((p) => fitsFor(b, ws, p, o.start, o.minutes));
  const chosen = pick(b, ws, free, o.start);
  if (chosen) return { ok: true, start: o.start, end: new Date(o.start.getTime() + o.minutes * MIN), staffId: chosen.userId, staffName: chosen.name };

  // Working then (the whole booking sits inside their hours), but another booking is in the way.
  const end = new Date(o.start.getTime() + o.minutes * MIN);
  const working = people.filter((p) => windowsOf(b, ws, p, date).some((w) => o.start >= w.start && end <= w.end));
  let delay: Extract<TimeCheck, { ok: false }>["delay"] = null;
  for (const p of working) {
    const mine = b.busy.filter((x) => x.staffId === p.userId);
    const tries = mine.map((x) => new Date(x.end.getTime() + s.bufferMinutes * MIN)).filter((d) => d > o.start && d.getTime() - o.start.getTime() <= MAX_DELAY * MIN).sort((a, c) => a.getTime() - c.getTime());
    const at = tries.find((d) => fitsFor(b, ws, p, d, o.minutes));
    const minutes = at ? Math.round((at.getTime() - o.start.getTime()) / MIN) : 0;
    if (at && (!delay || minutes < delay.minutes)) delay = { minutes, start: at, staffId: p.userId, staffName: p.name };
  }
  const otherStaff = asked ? all.filter((p) => p.userId !== asked.userId && fitsFor(b, ws, p, o.start, o.minutes)).map((p) => ({ staffId: p.userId, staffName: p.name })) : [];
  // Opening hours alone, to tell "closed" from "open, but nobody's own hours cover it".
  const businessOpen = Boolean(b.hours && [...openWindows(b.hours, addLocalDays(date, -1), ws.timezone), ...openWindows(b.hours, date, ws.timezone)].some((w) => o.start >= w.start && end <= w.end));
  const who = asked ? asked.name : "Nobody";
  const problem = !working.length
    ? asked ? `${asked.name} isn't working at ${clock(ws, o.start)} on that day (a ${o.minutes}-minute booking has to finish within their hours).` : businessOpen ? `The business is open then, but nobody who does this is working at ${clock(ws, o.start)}: their own hours (Calendar → Team availability) don't cover a ${o.minutes}-minute booking from that time.` : `We don't take bookings at that time (outside opening hours: a ${o.minutes}-minute booking has to finish by closing).`
    : delay
      ? `${asked ? `${asked.name} is` : "Everyone is"} busy at ${clock(ws, o.start)}: the appointment before runs until ${clock(ws, new Date(delay.start.getTime() - s.bufferMinutes * MIN))}. ${delay.staffName} is free from ${clock(ws, delay.start)}, ${delay.minutes} minutes later.`
      : `${who === "Nobody" ? "Nobody is" : `${who} is`} free at ${clock(ws, o.start)} for a booking that long.`;
  return no(problem, { delay, otherStaff, nextTimes: await next(o.start) });
}

const notice = (m: number) => (m % 60 === 0 ? `${m / 60} hour${m === 60 ? "" : "s"}` : `${m} minutes`);

/** What a booking is, for messages and pages: the service line, who, when, and the room or place. */
export type BookingFacts = { orderId: string; appointmentId: string; service: string; staffId: string | null; staffName: string | null; startsAt: Date; endsAt: Date; meetLink: string | null; inPerson: boolean; attendance: string | null };

export async function bookingFacts(x: Exec, orderIds: string[]): Promise<BookingFacts[]> {
  if (!orderIds.length) return [];
  const rows = await x
    .select({ a: t.appointments, staffName: t.users.name, inPerson: t.kbItems.inPerson })
    .from(t.appointments)
    .leftJoin(t.users, eq(t.users.id, t.appointments.staffId))
    .leftJoin(t.kbItems, eq(t.kbItems.id, t.appointments.itemId))
    .where(inArray(t.appointments.orderId, orderIds));
  const lines = await x.select({ orderId: t.orderItems.orderId, name: t.orderItems.name }).from(t.orderItems).where(inArray(t.orderItems.orderId, orderIds));
  return rows.map((r) => ({
    orderId: r.a.orderId, appointmentId: r.a.id, service: lines.find((l) => l.orderId === r.a.orderId)?.name ?? "Appointment", staffId: r.a.staffId, staffName: r.staffName ?? null,
    startsAt: r.a.startsAt, endsAt: r.a.endsAt, meetLink: r.a.meetLink, inPerson: r.a.meetLink ? false : Boolean(r.inPerson ?? true), attendance: r.a.attendance,
  }));
}
