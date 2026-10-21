// Booking engine for any business: tables by headcount ("party"), one service at a time per
// staff member or station ("appointment"), and whole days ("day": rooms, rentals, tours).
import { db, t } from "@/db";
import { and, asc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { openWindows, hoursForDate, type HoursData } from "./hours";
import { localTime, zoned, human, minutesOf, addLocalDays } from "./time";
import { shortCode } from "./crypto";

type Ws = { id: string; timezone: string; name: string };
export type BookingType = typeof t.bookingTypes.$inferSelect;

export async function loadHours(workspaceId: string): Promise<HoursData> {
  const [row] = await db.select().from(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), eq(t.kbItems.kind, "hours"), eq(t.kbItems.active, true))).limit(1);
  return (row?.data ?? { weekly: {}, exceptions: [], lastOrdersMinutesBeforeClose: 0 }) as unknown as HoursData;
}

export async function bookingTypesOf(workspaceId: string) {
  return db.select().from(t.bookingTypes).where(and(eq(t.bookingTypes.workspaceId, workspaceId), eq(t.bookingTypes.active, true))).orderBy(asc(t.bookingTypes.sort));
}

/** Find a booking type by key, id or (fuzzy) name; a single active type is the default. */
export async function resolveBookingType(workspaceId: string, ref?: string | null): Promise<BookingType | null> {
  const types = await bookingTypesOf(workspaceId);
  if (!types.length) return null;
  if (!ref) return types.length === 1 ? types[0] : null;
  const r = ref.trim().toLowerCase();
  return (
    types.find((x) => x.key === r || x.id === ref) ??
    types.find((x) => x.name.toLowerCase() === r) ??
    types.find((x) => x.name.toLowerCase().includes(r) || r.includes(x.key) || r.includes(x.name.toLowerCase())) ??
    (types.length === 1 ? types[0] : null)
  );
}

/** A service can carry its own duration (e.g. "Colour, 120 min"). */
export async function resolveService(workspaceId: string, name?: string | null) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const services = await db.select().from(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), eq(t.kbItems.kind, "service"), eq(t.kbItems.active, true)));
  return services.find((s) => s.title.toLowerCase() === n) ?? services.find((s) => s.title.toLowerCase().includes(n) || n.includes(s.title.toLowerCase())) ?? null;
}

async function bookingsBetween(type: BookingType, from: Date, to: Date) {
  return db
    .select({ startsAt: t.bookings.startsAt, endsAt: t.bookings.endsAt, qty: t.bookings.partySize })
    .from(t.bookings)
    .where(and(eq(t.bookings.bookingTypeId, type.id), eq(t.bookings.status, "confirmed"), ne(t.bookings.kind, "demo_replay"), lt(t.bookings.startsAt, to), gte(t.bookings.endsAt, from)));
}

export type Slot = { time: string; left: number; start: Date };

/** Bookable start times on a date. Party: seats left; appointment: staff/stations free. */
export async function availableSlots(ws: Ws, type: BookingType, date: string, qty: number, durationMinutes?: number | null, now = new Date()) {
  const hours = await loadHours(ws.id);
  const day = hoursForDate(hours, date, ws.timezone);
  const windows = openWindows(hours, date, ws.timezone);
  if (!windows.length) return { slots: [] as Slot[], closed: true, note: day.note };
  const duration = (durationMinutes ?? type.durationMinutes) * 60_000;
  const step = Math.max(5, type.slotMinutes) * 60_000;
  const existing = await bookingsBetween(type, windows[0].start, new Date(windows[windows.length - 1].end.getTime() + duration));
  const usedAt = (instant: number) =>
    existing.reduce((sum, e) => (e.startsAt.getTime() <= instant && e.endsAt.getTime() > instant ? sum + (type.unit === "party" ? e.qty : 1) : sum), 0);
  const need = type.unit === "party" ? qty : 1;
  const slots: Slot[] = [];
  for (const w of windows) {
    const lastStart = w.end.getTime() - duration;
    for (let s = w.start.getTime(); s <= lastStart; s += step) {
      if (s < now.getTime() + type.leadMinutes * 60_000) continue;
      let worst = 0;
      for (let k = s; k < s + duration; k += Math.min(step, 15 * 60_000)) worst = Math.max(worst, usedAt(k));
      const left = type.capacity - worst;
      if (left >= need) slots.push({ time: localTime(new Date(s), ws.timezone), left, start: new Date(s) });
    }
  }
  return { slots, closed: false, note: day.note };
}

/** Whole-day availability for "day" types (rooms, rentals, tours), across the nights requested. */
export async function dayAvailability(ws: Ws, type: BookingType, date: string, qty: number, nights: number) {
  const out: { date: string; left: number; closed: boolean }[] = [];
  for (let i = 0; i < Math.max(1, nights); i++) {
    const d = addLocalDays(date, i);
    const start = zoned(d, "00:00", ws.timezone);
    const end = zoned(addLocalDays(d, 1), "00:00", ws.timezone);
    const used = (await bookingsBetween(type, start, end)).filter((b) => b.startsAt < end && b.endsAt > start).reduce((s, b) => s + b.qty, 0);
    // Whole-day bookings (rooms, rentals, tours) don't follow shop opening hours.
    out.push({ date: d, left: type.capacity - used, closed: false });
  }
  return { days: out, available: out.every((d) => d.left >= qty && !d.closed) };
}

function limitError(type: BookingType, qty: number) {
  if (qty < 1) return "Quantity must be at least 1.";
  if (type.unit !== "appointment" && qty > type.maxPerBooking) return `${type.name} takes up to ${type.maxPerBooking} per booking; larger requests go to the team (escalate as large_group).`;
  return null;
}

export async function checkSlots(ws: Ws, input: { type: BookingType; date: string; qty: number; time?: string | null; durationMinutes?: number | null; nights?: number | null }) {
  const { type, date, qty } = input;
  const err = limitError(type, qty);
  if (err) return { ok: false, reason: err, date, bookingType: type.name };
  if (type.unit === "day") {
    const r = await dayAvailability(ws, type, date, qty, input.nights ?? 1);
    return { ok: true, bookingType: type.name, unit: "day", date, nights: input.nights ?? 1, quantity: qty, available: r.available, days: r.days };
  }
  const { slots, closed, note } = await availableSlots(ws, type, date, qty, input.durationMinutes);
  if (closed) {
    const next: string[] = [];
    for (let i = 1; i <= 10 && next.length < 2; i++) {
      const d = addLocalDays(date, i);
      if ((await availableSlots(ws, type, d, qty, input.durationMinutes)).slots.length) next.push(d);
    }
    return { ok: true, bookingType: type.name, date, closed: true, note, availableTimes: [], nextOpenDates: next };
  }
  const times = slots.map((s) => s.time);
  const result: Record<string, unknown> = { ok: true, bookingType: type.name, unit: type.unit, date, closed: false, note, quantity: qty, durationMinutes: input.durationMinutes ?? type.durationMinutes, availableTimes: times };
  if (input.time) {
    const want = minutesOf(input.time);
    result.requestedTime = input.time;
    result.requestedAvailable = times.includes(input.time);
    if (!result.requestedAvailable) {
      result.nearestAlternatives = [...slots].sort((a, b) => Math.abs(minutesOf(a.time) - want) - Math.abs(minutesOf(b.time) - want)).slice(0, 3).map((s) => s.time).sort();
    }
  }
  return result;
}

export async function createBooking(
  ws: Ws,
  input: {
    type: BookingType;
    customerName: string;
    date: string;
    time?: string | null;
    qty: number;
    nights?: number | null;
    service?: { id: string; title: string; durationMinutes: number | null } | null;
    phone?: string | null;
    notes?: string | null;
    threadId?: string | null;
    customerId?: string | null;
    channel?: "telegram" | "whatsapp" | "instagram" | "simulator" | null;
  },
) {
  const { type } = input;
  const err = limitError(type, input.qty);
  if (err) return { ok: false as const, reason: err };
  const clean = ws.id.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const prefix = clean.length >= 2 ? clean[0] + clean[clean.length - 1] : "JW";
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${type.id + ":" + input.date}))`);
    let startsAt: Date;
    let endsAt: Date;
    if (type.unit === "day") {
      const nights = Math.max(1, input.nights ?? 1);
      const r = await dayAvailability(ws, type, input.date, input.qty, nights);
      if (!r.available) return { ok: false as const, reason: `Not available for ${nights} day(s) from ${input.date}.`, days: r.days };
      startsAt = zoned(input.date, "00:00", ws.timezone);
      endsAt = zoned(addLocalDays(input.date, nights), "00:00", ws.timezone);
    } else {
      if (!input.time) return { ok: false as const, reason: "A time is needed for this booking." };
      const duration = input.service?.durationMinutes ?? type.durationMinutes;
      const { slots, closed, note } = await availableSlots(ws, type, input.date, input.qty, duration);
      if (closed) return { ok: false as const, reason: `Closed on ${input.date}${note ? ` (${note})` : ""}.` };
      const slot = slots.find((s) => s.time === input.time);
      if (!slot) {
        const want = minutesOf(input.time);
        const alt = [...slots].sort((a, b) => Math.abs(minutesOf(a.time) - want) - Math.abs(minutesOf(b.time) - want)).slice(0, 3).map((s) => s.time).sort();
        return { ok: false as const, reason: `${input.time} isn't available.`, alternatives: alt };
      }
      startsAt = zoned(input.date, input.time, ws.timezone);
      endsAt = new Date(startsAt.getTime() + duration * 60_000);
    }
    const [row] = await tx
      .insert(t.bookings)
      .values({
        workspaceId: ws.id, threadId: input.threadId ?? null, customerId: input.customerId ?? null, customerName: input.customerName,
        phone: input.phone ?? null, partySize: type.unit === "appointment" ? 1 : input.qty, startsAt, endsAt, notes: input.notes ?? null,
        refCode: shortCode(prefix), channel: input.channel ?? null, bookingTypeId: type.id, kind: type.key,
        serviceItemId: input.service?.id ?? null, serviceName: input.service?.title ?? null,
      })
      .returning();
    return {
      ok: true as const, refCode: row.refCode, bookingType: type.name, when: type.unit === "day" ? `${human(startsAt, ws.timezone).split(",")[0]} for ${Math.max(1, input.nights ?? 1)} day(s)` : human(startsAt, ws.timezone),
      date: input.date, time: input.time ?? null, quantity: row.partySize, service: row.serviceName, name: row.customerName, bookingId: row.id,
    };
  });
}
