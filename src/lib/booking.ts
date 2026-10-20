import { db, t } from "@/db";
import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import type { WorkspaceSettings } from "@/db/schema";
import { openWindows, hoursForDate, type HoursData } from "./hours";
import { localTime, zoned, human, minutesOf, addLocalDays } from "./time";
import { shortCode } from "./crypto";

type Ws = { id: string; timezone: string; settings: WorkspaceSettings };

export async function loadHours(workspaceId: string): Promise<HoursData> {
  const [row] = await db.select().from(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), eq(t.kbItems.kind, "hours"), eq(t.kbItems.active, true))).limit(1);
  return (row?.data ?? { weekly: {}, exceptions: [], lastOrdersMinutesBeforeClose: 30 }) as unknown as HoursData;
}

async function bookingsBetween(workspaceId: string, from: Date, to: Date) {
  return db
    .select({ startsAt: t.bookings.startsAt, endsAt: t.bookings.endsAt, partySize: t.bookings.partySize })
    .from(t.bookings)
    .where(and(eq(t.bookings.workspaceId, workspaceId), eq(t.bookings.status, "confirmed"), ne(t.bookings.kind, "demo_replay"), lt(t.bookings.startsAt, to), gte(t.bookings.endsAt, from)));
}

export type Slot = { time: string; seatsLeft: number; start: Date };

/** All bookable start times on a date for a party, with remaining seats. */
export async function availableSlots(ws: Ws, date: string, partySize: number, now = new Date()): Promise<{ slots: Slot[]; closed: boolean; note: string | null }> {
  const b = ws.settings.booking;
  const hours = await loadHours(ws.id);
  const day = hoursForDate(hours, date, ws.timezone);
  const windows = openWindows(hours, date, ws.timezone);
  if (!windows.length) return { slots: [], closed: true, note: day.note };
  const dayStart = windows[0].start;
  const dayEnd = windows[windows.length - 1].end;
  const existing = await bookingsBetween(ws.id, dayStart, new Date(dayEnd.getTime() + b.durationMinutes * 60_000));
  const step = b.slotMinutes * 60_000;
  const occupiedAt = (instant: number) =>
    existing.reduce((sum, e) => (e.startsAt.getTime() <= instant && e.endsAt.getTime() > instant ? sum + e.partySize : sum), 0);
  const slots: Slot[] = [];
  for (const w of windows) {
    const lastStart = w.end.getTime() - b.durationMinutes * 60_000;
    for (let s = w.start.getTime(); s <= lastStart; s += step) {
      if (s < now.getTime() + b.leadMinutes * 60_000) continue;
      let worst = 0;
      for (let k = s; k < s + b.durationMinutes * 60_000; k += step) worst = Math.max(worst, occupiedAt(k));
      const left = b.seatsPerSlot - worst;
      if (left >= partySize) slots.push({ time: localTime(new Date(s), ws.timezone), seatsLeft: left, start: new Date(s) });
    }
  }
  return { slots, closed: false, note: day.note };
}

export async function checkSlots(ws: Ws, date: string, partySize: number, time?: string | null) {
  const b = ws.settings.booking;
  if (partySize > b.maxPartySize) {
    return { ok: false, reason: `Parties over ${b.maxPartySize} are arranged by the events team (escalate as large_group).`, date };
  }
  const { slots, closed, note } = await availableSlots(ws, date, partySize);
  if (closed) {
    const next: string[] = [];
    for (let i = 1; i <= 7 && next.length < 2; i++) {
      const d = addLocalDays(date, i);
      const r = await availableSlots(ws, d, partySize);
      if (r.slots.length) next.push(d);
    }
    return { ok: true, date, closed: true, note, availableTimes: [], nextOpenDates: next };
  }
  const times = slots.map((s) => s.time);
  const result: Record<string, unknown> = { ok: true, date, closed: false, note, partySize, availableTimes: times };
  if (time) {
    const want = minutesOf(time);
    result.requestedTime = time;
    result.requestedAvailable = times.includes(time);
    if (!result.requestedAvailable) {
      result.nearestAlternatives = [...slots].sort((a, b) => Math.abs(minutesOf(a.time) - want) - Math.abs(minutesOf(b.time) - want)).slice(0, 3).map((s) => s.time).sort();
    }
  }
  return result;
}

export async function createBooking(
  ws: Ws,
  input: { customerName: string; date: string; time: string; partySize: number; phone?: string | null; notes?: string | null; threadId?: string | null; customerId?: string | null; channel?: "telegram" | "whatsapp" | "instagram" | "simulator" | null },
) {
  const b = ws.settings.booking;
  if (input.partySize < 1) return { ok: false as const, reason: "Party size must be at least 1." };
  if (input.partySize > b.maxPartySize) return { ok: false as const, reason: `Parties over ${b.maxPartySize} go to the events team (escalate as large_group).` };
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ws.id + ":" + input.date}))`);
    const { slots, closed, note } = await availableSlots(ws, input.date, input.partySize);
    if (closed) return { ok: false as const, reason: `Closed on ${input.date}${note ? ` (${note})` : ""}.` };
    const slot = slots.find((s) => s.time === input.time);
    if (!slot) {
      const want = minutesOf(input.time);
      const alt = [...slots].sort((a, b2) => Math.abs(minutesOf(a.time) - want) - Math.abs(minutesOf(b2.time) - want)).slice(0, 3).map((s) => s.time).sort();
      return { ok: false as const, reason: `${input.time} isn't available for ${input.partySize}.`, alternatives: alt };
    }
    const startsAt = zoned(input.date, input.time, ws.timezone);
    const [row] = await tx
      .insert(t.bookings)
      .values({
        workspaceId: ws.id, threadId: input.threadId ?? null, customerId: input.customerId ?? null, customerName: input.customerName,
        phone: input.phone ?? null, partySize: input.partySize, startsAt, endsAt: new Date(startsAt.getTime() + b.durationMinutes * 60_000),
        notes: input.notes ?? null, refCode: shortCode("F7"), channel: input.channel ?? null,
      })
      .returning();
    return { ok: true as const, refCode: row.refCode, when: human(startsAt, ws.timezone), date: input.date, time: input.time, partySize: row.partySize, name: row.customerName, holdMinutes: 15, bookingId: row.id };
  });
}
