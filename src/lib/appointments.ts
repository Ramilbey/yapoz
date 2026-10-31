// Bookings made in chat. A booking is an order (kind "appointment") with one line, the service, so approval, payment
// receipts, the payment timer and expiry work exactly as for orders; its time, person and meeting room live in
// "appointments". lib/schedule says which times are free; this file books, moves, cancels, reminds and records attendance.
import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { db, t } from "@/db";
import type { Attendance } from "@/db/schema";
import type { AppointmentView, StaffView } from "./appointment-types";
import { queueBookingSync } from "./google-calendar";
import { formatMoney } from "./money";
import { placeLine, placeOrder, recentBooking, StockProblem, type OrderItemRow, type OrderRow } from "./orders";
import { handOver, resolveCards } from "./receipts";
import { appointmentSettings, bookableStaff, bookingFacts, checkTime, isTaken, lockStaff, serviceMinutes, SlotTaken, slotTaken, when, type BookingFacts, type TimeCheck } from "./schedule";
import { releaseForOrder } from "./stock";
import { addLocalDays, localDate, zoned } from "./time";
import { log } from "./log";

type Ws = typeof t.workspaces.$inferSelect;
type Failed = Extract<TimeCheck, { ok: false }>;

/** A meeting room nobody can guess: `${meetBase}/<12 random letters and digits>`. */
export function meetLink(base: string): string {
  const id = randomBytes(12).toString("base64url").replace(/[-_]/g, "").slice(0, 12).padEnd(12, "x");
  return `${base.replace(/\/+$/, "")}/${id}`;
}

export type BookInput = {
  itemId: string;
  variantId: string;
  /** The line as the customer and staff read it: "Haircut, Long hair". */
  name: string;
  /** The person the customer asked for; otherwise the free one with the fewest bookings that day. */
  staffId?: string | null;
  start: Date;
  customerName: string;
  phone?: string | null;
  notes?: string | null;
  threadId?: string | null;
  customerId?: string | null;
  channel?: "telegram" | "whatsapp" | "simulator" | null;
  isDemo?: boolean;
};

export type Booked = { ok: true; order: OrderRow; items: OrderItemRow[]; facts: BookingFacts; duplicate: boolean };

/**
 * Book a service for a time: checks the time (hours, notice, window, clashes), then saves it through placeOrder, which
 * takes the person's lock so two customers can't both get the same time. Returns what to tell the customer instead when
 * it can't be booked. The price is the catalog's.
 */
export async function bookAppointment(ws: Ws, input: BookInput): Promise<Booked | ({ ok: false } & Pick<Failed, "problem" | "delay" | "otherStaff" | "nextTimes" | "noStaff">)> {
  const [row] = await db
    .select({ item: t.kbItems, v: t.kbVariants })
    .from(t.kbVariants)
    .innerJoin(t.kbItems, eq(t.kbItems.id, t.kbVariants.itemId))
    .where(and(eq(t.kbVariants.id, input.variantId), eq(t.kbItems.id, input.itemId), eq(t.kbItems.workspaceId, ws.id)));
  const fail = (problem: string, rest: Partial<Failed> = {}) => ({ ok: false as const, problem, delay: null, otherStaff: [], nextTimes: [], ...rest });
  if (!row || row.item.kind !== "service" || !row.item.active) return fail("That isn't a service we book.");
  if (!row.item.available) return fail(`${row.item.title} isn't available right now${row.item.availabilityNote ? `: ${row.item.availabilityNote}` : ""}.`);
  const s = appointmentSettings(ws);
  const minutes = serviceMinutes(row.item, s);
  // The customer said it again: the booking they already have, not a second one (the first one now fills that time).
  if (input.threadId) {
    const dup = await recentBooking(db, input.threadId, { variantId: input.variantId, startsAt: input.start, staffId: input.staffId });
    if (dup) {
      const [facts] = await bookingFacts(db, [dup.id]);
      return { ok: true, order: dup, items: await db.select().from(t.orderItems).where(eq(t.orderItems.orderId, dup.id)), facts, duplicate: true };
    }
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const check = await checkTime(db, ws, { itemId: input.itemId, minutes, start: input.start, staffId: input.staffId });
    if (!check.ok) return { ...check, ok: false };
    try {
      const r = await placeOrder(ws, {
        lines: [{ itemId: input.itemId, variantId: input.variantId, name: input.name, quantity: 1, unitPriceMinor: row.v.priceMinor, note: null }],
        customerName: input.customerName, phone: input.phone ?? null, fulfilment: "pickup", wanted: when(ws, check.start), wantedDate: localDate(check.start, ws.timezone), notes: input.notes ?? null,
        threadId: input.threadId ?? null, customerId: input.customerId ?? null, channel: input.channel ?? null, isDemo: input.isDemo,
        appointment: { staffId: check.staffId, itemId: input.itemId, variantId: input.variantId, startsAt: check.start, endsAt: check.end, meetLink: row.item.inPerson ? null : meetLink(s.meetBase), staffAsked: Boolean(input.staffId) },
      });
      const [facts] = await bookingFacts(db, [r.order.id]);
      return { ...r, facts };
    } catch (e) {
      // Someone else took that person at that time a moment ago: with nobody asked for, another free person may do.
      if (e instanceof SlotTaken && !input.staffId && attempt === 0) continue;
      if (e instanceof SlotTaken) return fail("That time was just taken by another booking.", { nextTimes: (await checkTime(db, ws, { itemId: input.itemId, minutes, start: input.start, staffId: input.staffId }) as Failed).nextTimes ?? [] });
      if (e instanceof StockProblem) return fail(e.problems.join(" "));
      throw e;
    }
  }
  return fail("That time was just taken by another booking.");
}

/** The customer's upcoming bookings in this chat that they could still change: pending or confirmed, not started. */
export async function chatBookings(threadId: string) {
  const rows = await db
    .select({ o: t.orders, a: t.appointments })
    .from(t.orders)
    .innerJoin(t.appointments, eq(t.appointments.orderId, t.orders.id))
    .where(and(eq(t.orders.threadId, threadId), eq(t.orders.kind, "appointment"), inArray(t.orders.status, ["pending", "confirmed"]), gte(t.appointments.startsAt, sql`now()`)))
    .orderBy(asc(t.appointments.startsAt));
  return rows.filter((r) => isTaken(r.o));
}

/** Paid, as far as anyone knows: staff marked it, or a receipt that wasn't turned down is on it. */
async function hasPayment(order: OrderRow) {
  if (order.paid || order.firmedBy === "receipt") return true;
  const [r] = await db.select({ id: t.orderReceipts.id }).from(t.orderReceipts).where(and(eq(t.orderReceipts.orderId, order.id), isNull(t.orderReceipts.rejectedAt), ne(t.orderReceipts.verdict, "unreadable"))).limit(1);
  return Boolean(r);
}

export type Change =
  | { ok: true; action: "cancelled"; order: OrderRow; paid: boolean }
  | { ok: true; action: "rescheduled"; order: OrderRow; facts: BookingFacts; from: Date; reconfirm: boolean }
  /** Too close to the start: staff decide (a Needs-you card was made). */
  | { ok: false; tooLate: true; problem: string }
  | ({ ok: false; tooLate?: false } & Pick<Failed, "problem" | "delay" | "otherStaff" | "nextTimes">);

/**
 * The customer cancels or moves their booking in chat, up to changeCutoffHours before it starts. A moved booking that
 * was confirmed goes back to Pending for staff to approve the new time; any payment stays (no timer). A cancelled booking
 * that was paid makes a Needs-you card about the refund.
 */
export async function changeAppointment(ws: Ws, o: { threadId: string; orderId: string; action: "cancel" | "reschedule"; start?: Date | null; staffId?: string | null; customerName?: string; isDemo?: boolean }): Promise<Change> {
  const [found] = await db.select({ o: t.orders, a: t.appointments }).from(t.orders).innerJoin(t.appointments, eq(t.appointments.orderId, t.orders.id)).where(and(eq(t.orders.id, o.orderId), eq(t.orders.workspaceId, ws.id), eq(t.orders.threadId, o.threadId)));
  const no = (problem: string): Change => ({ ok: false, problem, delay: null, otherStaff: [], nextTimes: [] });
  if (!found || !["pending", "confirmed"].includes(found.o.status) || !isTaken(found.o)) return no("That booking isn't active any more.");
  const s = appointmentSettings(ws);
  const hoursLeft = (found.a.startsAt.getTime() - Date.now()) / 3600_000;
  if (hoursLeft < s.changeCutoffHours) {
    const what = o.action === "cancel" ? "cancel" : `move to ${o.start ? when(ws, o.start) : "another time"}`;
    await handOver(ws.id, o.threadId, { category: "appointment_change", priority: "high", reason: `Wants to ${o.action === "cancel" ? "cancel" : "reschedule"} less than ${s.changeCutoffHours} h before`, summary: `${o.customerName || found.o.customerName} wants to ${what} booking ${found.o.refCode} (${when(ws, found.a.startsAt)}). That's inside your ${s.changeCutoffHours}-hour cutoff, so it's your call.`, isDemo: o.isDemo });
    return { ok: false, tooLate: true, problem: `Changes in chat are possible up to ${s.changeCutoffHours} hours before the booking; it's closer than that, so the team decides.` };
  }

  if (o.action === "cancel") {
    const r = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(t.orders).where(eq(t.orders.id, found.o.id)).for("update");
      if (!order || !["pending", "confirmed"].includes(order.status)) return null;
      const items = await tx.select({ variantId: t.orderItems.variantId, quantity: t.orderItems.quantity }).from(t.orderItems).where(eq(t.orderItems.orderId, order.id));
      await releaseForOrder(tx, order, items);
      const [done] = await tx
        .update(t.orders)
        .set({ status: "cancelled", cancelledAt: new Date(), cancelReason: "Cancelled by the customer in chat", holdExpiresAt: null, stockTaken: false, handledBy: null, receiptRequest: order.receiptRequest && !order.receiptRequest.fulfilledAt ? null : order.receiptRequest })
        .where(eq(t.orders.id, order.id))
        .returning();
      await tx.insert(t.events).values({ workspaceId: ws.id, type: "appointment.cancelled", props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, by: "customer", startsAt: found.a.startsAt.toISOString(), wasConfirmed: order.status === "confirmed" }, isDemo: order.isDemo });
      return done;
    });
    if (!r) return no("That booking isn't active any more.");
    await queueBookingSync(r);
    await resolveCards(ws.id, { orderId: r.id }, null);
    const paid = await hasPayment(r);
    if (paid) await handOver(ws.id, o.threadId, { category: "refund", priority: "normal", reason: "Paid booking cancelled by the customer", summary: `${r.customerName} cancelled booking ${r.refCode} (${when(ws, found.a.startsAt)}), which was paid (${formatMoney(r.totalMinor, r.currency)}). Arrange the refund or a credit with them.`, isDemo: o.isDemo });
    return { ok: true, action: "cancelled", order: r, paid };
  }

  if (!o.start) return no("Which day and time would they like instead?");
  const [item] = found.a.itemId ? await db.select().from(t.kbItems).where(eq(t.kbItems.id, found.a.itemId)) : [];
  if (!item) return no("That service isn't offered any more: the team will help.");
  const minutes = Math.round((found.a.endsAt.getTime() - found.a.startsAt.getTime()) / 60_000) || serviceMinutes(item, s);
  // Same person if they're free, unless the customer asked for someone else; otherwise whoever is free.
  let check = await checkTime(db, ws, { itemId: item.id, minutes, start: o.start, staffId: o.staffId ?? found.a.staffId, excludeOrder: found.o.id });
  if (!check.ok && !o.staffId && found.a.staffId) {
    const anyone = await checkTime(db, ws, { itemId: item.id, minutes, start: o.start, excludeOrder: found.o.id });
    if (anyone.ok) check = anyone;
  }
  if (!check.ok) return { ...check, ok: false };
  const ok = check;
  const moved = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(t.orders).where(eq(t.orders.id, found.o.id)).for("update");
    if (!order || !["pending", "confirmed"].includes(order.status)) return "gone" as const;
    await lockStaff(tx, ok.staffId);
    if (await slotTaken(tx, ws, ok.staffId, ok.start, ok.end, order.id)) return "taken" as const;
    await tx.update(t.appointments).set({ startsAt: ok.start, endsAt: ok.end, staffId: ok.staffId, remindedAt: null }).where(eq(t.appointments.orderId, order.id));
    const note = `Rescheduled by the customer from ${when(ws, found.a.startsAt)}.`;
    const reconfirm = order.status === "confirmed";
    const [updated] = await tx
      .update(t.orders)
      .set({
        wanted: when(ws, ok.start), wantedDate: localDate(ok.start, ws.timezone), notes: [order.notes, note].filter(Boolean).join(" ").slice(0, 500),
        // Back to staff for the new time. A payment it had stays: no timer.
        ...(reconfirm ? { status: "pending" as const, confirmedAt: null, holdExpiresAt: null } : {}),
      })
      .where(eq(t.orders.id, order.id))
      .returning();
    await tx.insert(t.events).values({ workspaceId: ws.id, type: "appointment.rescheduled", props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, by: "customer", from: found.a.startsAt.toISOString(), to: ok.start.toISOString(), staffId: ok.staffId, reconfirm }, isDemo: order.isDemo });
    return { order: updated, reconfirm };
  });
  if (moved === "gone") return no("That booking isn't active any more.");
  if (moved === "taken") return no("That time was just taken by another booking.");
  await queueBookingSync(moved.order);
  const [facts] = await bookingFacts(db, [moved.order.id]);
  return { ok: true, action: "rescheduled", order: moved.order, facts, from: found.a.startsAt, reconfirm: moved.reconfirm };
}

/** The reminder the customer gets before a confirmed booking. Fixed wording. */
export const reminderMessage = (ws: Ws, order: Pick<OrderRow, "refCode">, b: BookingFacts) =>
  `Reminder: your booking ${order.refCode} is coming up ⏰\n${b.service}${b.staffName ? ` with ${b.staffName}` : ""}\n${when(ws, b.startsAt)}\n${placeLine(ws, b)}\nReply here if you can't make it.`;

/**
 * Reminders for confirmed bookings starting within each business's reminderMinutes. Each booking is claimed with one
 * conditional update on reminded_at, so however many sweeps run at once, a customer gets exactly one. Run it from the
 * same places as expireDueOrders.
 */
export async function sendDueReminders(workspaceId?: string): Promise<number> {
  const due = await db
    .select({ a: t.appointments, o: t.orders, ws: t.workspaces })
    .from(t.appointments)
    .innerJoin(t.orders, eq(t.orders.id, t.appointments.orderId))
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.appointments.workspaceId))
    .where(and(inArray(t.orders.status, ["confirmed", "ready"]), isNull(t.appointments.remindedAt), gte(t.appointments.startsAt, sql`now()`), lt(t.appointments.startsAt, sql`now() + interval '7 days'`), workspaceId ? eq(t.appointments.workspaceId, workspaceId) : undefined))
    .limit(200);
  let sent = 0;
  for (const r of due) {
    const s = appointmentSettings(r.ws);
    if (!s.reminderMinutes || r.a.startsAt.getTime() - Date.now() > s.reminderMinutes * 60_000) continue;
    const [claimed] = await db.update(t.appointments).set({ remindedAt: new Date() }).where(and(eq(t.appointments.id, r.a.id), isNull(t.appointments.remindedAt))).returning({ id: t.appointments.id });
    if (!claimed) continue;
    const [b] = await bookingFacts(db, [r.o.id]);
    const tpl = s.whatsappTemplate?.name ? { name: s.whatsappTemplate.name, lang: s.whatsappTemplate.lang, params: [b.service, when(r.ws, b.startsAt), b.meetLink ?? (r.ws.settings.business?.address?.trim() || r.ws.name)] } : null;
    const { notifyCustomer } = await import("./notify");
    await notifyCustomer(r.o, "reminder", reminderMessage(r.ws, r.o, b), null, tpl).catch((e) => log.error("appointments.reminder_failed", { workspaceId: r.o.workspaceId, orderId: r.o.id, err: e }));
    sent++;
  }
  return sent;
}

/**
 * After the appointment, staff mark the customer present, late or no-show. That completes the order (once) and is logged;
 * marking again only changes the attendance.
 */
export async function markAttendance(o: { workspaceId: string; appointmentId: string; attendance: Attendance; userId: string }): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  return db.transaction(async (tx) => {
    const [a] = await tx.select().from(t.appointments).where(and(eq(t.appointments.id, o.appointmentId), eq(t.appointments.workspaceId, o.workspaceId)));
    if (!a) return { ok: false as const, status: 404, error: "Booking not found." };
    const [order] = await tx.select().from(t.orders).where(eq(t.orders.id, a.orderId)).for("update");
    if (!["confirmed", "ready", "completed"].includes(order.status)) return { ok: false as const, status: 409, error: order.status === "pending" ? "Confirm the booking first." : `This booking is ${order.status === "cancelled" ? "cancelled" : order.status}.` };
    if (a.startsAt > new Date()) return { ok: false as const, status: 409, error: "The appointment hasn't started yet." };
    await tx.update(t.appointments).set({ attendance: o.attendance, attendanceBy: o.userId, attendanceAt: new Date() }).where(eq(t.appointments.id, a.id));
    if (order.status !== "completed") await tx.update(t.orders).set({ status: "completed", completedAt: new Date(), handledBy: o.userId }).where(eq(t.orders.id, order.id));
    await tx.insert(t.events).values({ workspaceId: o.workspaceId, type: "appointment.attended", props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, attendance: o.attendance, by: o.userId, previous: a.attendance }, isDemo: order.isDemo });
    return { ok: true as const };
  });
}

/** Every login in the business, with their appointment settings (defaults when they never had any). */
export async function staffViews(workspaceId: string): Promise<StaffView[]> {
  const rows = await db.select({ u: t.users, s: t.staff }).from(t.users).leftJoin(t.staff, eq(t.staff.userId, t.users.id)).where(eq(t.users.workspaceId, workspaceId)).orderBy(asc(t.users.name));
  return rows.map(({ u, s }) => ({ userId: u.id, name: u.name, email: u.email, role: u.role, takesAppointments: s?.takesAppointments ?? false, schedule: s?.schedule ?? null, serviceIds: s?.serviceIds ?? [] }));
}

/** The calendar between two local dates (inclusive): every booking in range, any status. */
export async function calendar(ws: Ws, from: string, to: string): Promise<AppointmentView[]> {
  const start = zoned(from, "00:00", ws.timezone);
  const end = zoned(addLocalDays(to, 1), "00:00", ws.timezone);
  const rows = await db
    .select({ a: t.appointments, o: t.orders, staffName: t.users.name })
    .from(t.appointments)
    .innerJoin(t.orders, eq(t.orders.id, t.appointments.orderId))
    .leftJoin(t.users, eq(t.users.id, t.appointments.staffId))
    .where(and(eq(t.appointments.workspaceId, ws.id), lt(t.appointments.startsAt, end), gte(t.appointments.endsAt, start)))
    .orderBy(asc(t.appointments.startsAt));
  const facts = await bookingFacts(db, rows.map((r) => r.o.id));
  const markers = [...new Set(rows.map((r) => r.a.attendanceBy).filter((x): x is string => Boolean(x)))];
  const names = markers.length ? await db.select({ id: t.users.id, name: t.users.name }).from(t.users).where(inArray(t.users.id, markers)) : [];
  const now = new Date();
  return rows.map(({ a, o, staffName }) => {
    const f = facts.find((x) => x.orderId === o.id);
    return {
      id: a.id, orderId: o.id, refCode: o.refCode, status: o.status, taken: isTaken(o, now), staffId: a.staffId, staffName: staffName ?? null, itemId: a.itemId, service: f?.service ?? "Appointment",
      startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), meetLink: a.meetLink, inPerson: f?.inPerson ?? !a.meetLink, attendance: a.attendance,
      attendanceByName: names.find((n) => n.id === a.attendanceBy)?.name ?? null, attendanceAt: a.attendanceAt?.toISOString() ?? null, remindedAt: a.remindedAt?.toISOString() ?? null,
      customerName: o.customerName, phone: o.phone, threadId: o.threadId, totalMinor: o.totalMinor, currency: o.currency, paid: o.paid, holdExpiresAt: o.holdExpiresAt?.toISOString() ?? null,
    };
  });
}

/** For the assistant's context: who can be booked, and (with specific assignment) for what. */
export async function teamLines(ws: Ws, services: { id: string; title: string }[]): Promise<string[]> {
  const people = await bookableStaff(db, ws);
  const specific = appointmentSettings(ws).assignment === "specific";
  return people.map((p) => (specific ? `${p.name}: ${services.filter((s) => p.serviceIds.includes(s.id)).map((s) => s.title).join(", ") || "no services yet"}` : p.name));
}

