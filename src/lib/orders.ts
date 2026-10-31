// Orders taken in chat. The agent's create_order tool saves one as "pending"; nothing is promised to the customer
// until staff confirm it. Prices always come from the catalog (never from the model). Placing an order holds its stock
// (lib/stock); confirming consumes the hold, rejecting, cancelling or expiring releases it, and every step is logged.
import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { db, t } from "@/db";
import type { ReceiptRequest } from "@/db/schema";
import { shortCode } from "./crypto";
import { queueBookingSync } from "./google-calendar";
import { formatMoney } from "./money";
import { paidSoFar, paymentLines, paymentsOf, receiptRequired, receiptsFor, resolveCards, type ReceiptSummary } from "./receipts";
import { availability, availKey, businessDate, checkLowStock, consumeForOrder, firmHolds, holdActive, holdForOrder, releaseForOrder, restartHold, stockSettings, type Avail } from "./stock";
import { bookingFacts, lockStaff, SlotTaken, slotTaken, when, type BookingFacts } from "./schedule";
import { human } from "./time";
import type { OrderAppointment } from "./appointment-types";
import { log } from "./log";

type Ws = typeof t.workspaces.$inferSelect;
export type OrderRow = typeof t.orders.$inferSelect;
export type OrderItemRow = typeof t.orderItems.$inferSelect;

export type OrderLine = { itemId: string; variantId: string; name: string; quantity: number; unitPriceMinor: number; note: string | null };
export type OrderInput = {
  lines: OrderLine[];
  customerName: string;
  phone?: string | null;
  fulfilment: "pickup" | "delivery";
  address?: string | null;
  wanted?: string | null;
  /** The business day it's for (daily stock is held against that day). Default: today. */
  wantedDate?: string | null;
  notes?: string | null;
  threadId?: string | null;
  customerId?: string | null;
  channel?: "telegram" | "whatsapp" | "simulator" | null;
  isDemo?: boolean;
  /** A booking (kind "appointment"): its one line is the service; the time is taken for this person inside the same transaction. */
  appointment?: { staffId: string; itemId: string; variantId: string; startsAt: Date; endsAt: Date; meetLink: string | null; /** The customer asked for this person (a repeat must match them too). */ staffAsked: boolean };
};

export const MAX_LINES = 20;
export const MAX_QTY = 50;
const DUPLICATE_WINDOW_MS = 15 * 60_000;

export const lineTotal = (l: Pick<OrderLine, "quantity" | "unitPriceMinor">) => l.quantity * l.unitPriceMinor;

/** Same items, quantities, notes and pickup/delivery as a still-pending order in this chat: the customer repeated themselves. */
const signature = (fulfilment: string, lines: { variantId: string | null; quantity: number; note: string | null }[]) =>
  `${fulfilment}|${lines.map((l) => `${l.variantId}:${l.quantity}:${(l.note ?? "").trim().toLowerCase()}`).sort().join(",")}`;

/**
 * A booking this chat placed in the last 15 minutes for the same option and start time (and person, if they asked for one),
 * still pending: the customer repeated themselves.
 */
export async function recentBooking(x: typeof db | Tx, threadId: string, a: { variantId: string; startsAt: Date; staffId?: string | null }) {
  const [row] = await x
    .select({ o: t.orders })
    .from(t.orders)
    .innerJoin(t.appointments, eq(t.appointments.orderId, t.orders.id))
    .where(and(eq(t.orders.threadId, threadId), eq(t.orders.kind, "appointment"), eq(t.orders.status, "pending"), gt(t.orders.createdAt, new Date(Date.now() - DUPLICATE_WINDOW_MS)), eq(t.appointments.variantId, a.variantId), eq(t.appointments.startsAt, a.startsAt), a.staffId ? eq(t.appointments.staffId, a.staffId) : undefined))
    .limit(1);
  return row?.o ?? null;
}

/** Not enough stock left when the order was saved (someone else got there first). Nothing was saved. */
export class StockProblem extends Error {
  constructor(public problems: string[]) {
    super(problems.join(" "));
  }
}

export async function placeOrder(ws: Ws, input: OrderInput): Promise<{ ok: true; order: OrderRow; items: OrderItemRow[]; duplicate: boolean }> {
  const total = input.lines.reduce((s, l) => s + lineTotal(l), 0);
  const date = input.wantedDate ?? businessDate(ws);
  // With payments on, the stock is held for holdMinutes while the customer pays.
  const minutes = receiptRequired(ws) ? stockSettings(ws).holdMinutes : null;
  const appt = input.appointment;
  for (let attempt = 0; attempt < 6; attempt++) {
    const done = await db.transaction(async (tx) => {
      // Two replies running at once for the same chat (the customer sent two messages quickly) queue here, so the
      // second one sees the first one's order and doesn't place it again.
      if (input.threadId) {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`order:${input.threadId}`}))`);
        if (appt) {
          const dup = await recentBooking(tx, input.threadId, { variantId: appt.variantId, startsAt: appt.startsAt, staffId: appt.staffAsked ? appt.staffId : null });
          if (dup) return { order: dup, items: await tx.select().from(t.orderItems).where(eq(t.orderItems.orderId, dup.id)), duplicate: true, held: [] as string[] };
        }
        const recent = await tx
          .select()
          .from(t.orders)
          .where(and(eq(t.orders.threadId, input.threadId), eq(t.orders.kind, appt ? "appointment" : "order"), eq(t.orders.status, "pending"), gt(t.orders.createdAt, new Date(Date.now() - DUPLICATE_WINDOW_MS))));
        for (const o of appt ? [] : recent) {
          const items = await tx.select().from(t.orderItems).where(eq(t.orderItems.orderId, o.id));
          if (signature(o.fulfilment, items) === signature(input.fulfilment, input.lines)) return { order: o, items, duplicate: true, held: [] as string[] };
        }
      }
      // Two customers after the last one queue on the variant row lock: the second sees the first one's hold.
      const held = await holdForOrder(tx, ws, { lines: input.lines, date });
      if (held.problems.length) throw new StockProblem(held.problems);
      // Two customers after the same person and time queue on the staff lock: the second sees the first one's booking.
      if (appt) {
        await lockStaff(tx, appt.staffId);
        if (await slotTaken(tx, ws, appt.staffId, appt.startsAt, appt.endsAt)) throw new SlotTaken();
      }
      const [order] = await tx
        .insert(t.orders)
        .values({
          workspaceId: ws.id, threadId: input.threadId ?? null, customerId: input.customerId ?? null, refCode: shortCode(appt ? "APT" : "ORD"), kind: appt ? "appointment" : "order",
          customerName: input.customerName.slice(0, 80), phone: input.phone?.slice(0, 40) ?? null, fulfilment: input.fulfilment,
          address: input.fulfilment === "delivery" ? input.address?.slice(0, 300) ?? null : null,
          wanted: input.wanted?.slice(0, 120) ?? null, wantedDate: input.wantedDate ?? null, notes: input.notes?.slice(0, 500) ?? null,
          holdExpiresAt: minutes ? sql`now() + make_interval(mins => ${minutes})` : null,
          totalMinor: total, currency: ws.currency, channel: input.channel ?? null, isDemo: Boolean(input.isDemo),
        })
        .onConflictDoNothing()
        .returning();
      if (!order) return null;
      const items = await tx
        .insert(t.orderItems)
        .values(input.lines.map((l) => ({ workspaceId: ws.id, orderId: order.id, itemId: l.itemId, variantId: l.variantId, name: l.name, quantity: l.quantity, unitPriceMinor: l.unitPriceMinor, note: l.note })))
        .returning();
      if (held.holds.length) await tx.insert(t.stockHolds).values(held.holds.map((h) => ({ workspaceId: ws.id, orderId: order.id, variantId: h.variantId, date: h.date, qty: h.qty, expiresAt: order.holdExpiresAt, isDemo: order.isDemo })));
      await tx.insert(t.events).values({ workspaceId: ws.id, type: "order.created", props: { orderId: order.id, refCode: order.refCode, totalMinor: total, items: items.length, channel: input.channel ?? null, threadId: input.threadId ?? null, kind: order.kind }, isDemo: Boolean(input.isDemo) });
      if (appt) {
        await tx.insert(t.appointments).values({ workspaceId: ws.id, orderId: order.id, staffId: appt.staffId, itemId: appt.itemId, variantId: appt.variantId, startsAt: appt.startsAt, endsAt: appt.endsAt, meetLink: appt.meetLink, isDemo: order.isDemo });
        await tx.insert(t.events).values({ workspaceId: ws.id, type: "appointment.booked", props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, staffId: appt.staffId, startsAt: appt.startsAt.toISOString(), service: input.lines[0]?.name ?? null, online: Boolean(appt.meetLink) }, isDemo: order.isDemo });
      }
      if (held.holds.length) {
        await tx.insert(t.events).values({ workspaceId: ws.id, type: "stock.held", props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, lines: held.holds.length, date: held.holds.some((h) => h.date) ? date : null, expiresAt: order.holdExpiresAt?.toISOString() ?? null }, isDemo: order.isDemo });
      }
      return { order, items, duplicate: false, held: held.holds.map((h) => h.variantId) };
    });
    if (done) {
      if (done.held?.length) await checkLowStock(ws.id, done.held).catch((e) => log.error("stock.low_stock_check_failed", { workspaceId: ws.id, err: e }));
      return { ok: true, order: done.order, items: done.items, duplicate: done.duplicate };
    }
  }
  throw new Error("Couldn't pick a reference code for the order, try again.");
}

export type OrderAction = "confirm" | "ready" | "complete" | "reject" | "cancel" | "paid" | "unpaid" | "keep_reserved";
export type NotifyKind = "confirmed" | "ready" | "rejected" | "cancelled";
export type Transition =
  | { ok: true; order: OrderRow; items: OrderItemRow[]; /** Tell the customer in chat. */ notify: NotifyKind | null }
  | { ok: false; status: number; error: string };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Stock changed: bump the items so the agent's cached knowledge refreshes. */
async function touchItems(tx: Tx, items: OrderItemRow[], now: Date) {
  const ids = [...new Set(items.map((i) => i.itemId).filter((x): x is string => Boolean(x)))];
  if (ids.length) await tx.update(t.kbItems).set({ updatedAt: now }).where(inArray(t.kbItems.id, ids));
}

const EVENT: Record<OrderAction, string> = {
  confirm: "order.confirmed", ready: "order.ready", complete: "order.completed", reject: "order.rejected", cancel: "order.cancelled", paid: "order.paid", unpaid: "order.unpaid",
  keep_reserved: "order.kept_reserved",
};

/** A repeated click arrives after the first one went through: say who did it, instead of a bare error. */
async function already(tx: Tx, order: OrderRow, what: string): Promise<Transition> {
  const [u] = order.handledBy ? await tx.select({ name: t.users.name }).from(t.users).where(eq(t.users.id, order.handledBy)) : [];
  return { ok: false, status: 409, error: `This order is already ${what}${u ? ` (by ${u.name})` : ""}. Nothing was changed.` };
}

/**
 * Move an order along. Workspace-scoped and row-locked, so a double click or two staff at once can't apply the same step
 * twice: the hold is consumed exactly once on confirm (refused if short) and released exactly once on reject/cancel.
 */
export async function transitionOrder(o: { workspaceId: string; orderId: string; action: OrderAction; userId: string; reason?: string | null }): Promise<Transition> {
  const r = await db.transaction(async (tx): Promise<Transition> => {
    const [order] = await tx.select().from(t.orders).where(and(eq(t.orders.id, o.orderId), eq(t.orders.workspaceId, o.workspaceId))).for("update");
    if (!order) return { ok: false, status: 404, error: "Order not found." };
    const items = await tx.select().from(t.orderItems).where(eq(t.orderItems.orderId, order.id));
    const now = new Date();
    const fail = (status: number, error: string): Transition => ({ ok: false, status, error });
    const byVariant = new Map<string, number>();
    for (const i of items) if (i.variantId) byVariant.set(i.variantId, (byVariant.get(i.variantId) ?? 0) + i.quantity);
    const [wsRow] = await tx.select().from(t.workspaces).where(eq(t.workspaces.id, o.workspaceId));
    let stockMoved = false;
    let set: Partial<typeof t.orders.$inferInsert> = {};
    let notify: NotifyKind | null = null;
    const reason = o.reason?.trim().slice(0, 200) || null;

    switch (o.action) {
      case "confirm": {
        if (order.status !== "pending") return order.status === "cancelled" ? fail(409, "This order was rejected or cancelled, so it can't be confirmed.") : order.status === "expired" ? fail(409, "This order expired: no payment arrived in time, and its stock went back.") : already(tx, order, order.status);
        // Payments on in Settings: the customer has to have sent a receipt that staff haven't turned down. What it shows is the owner's call.
        if (order.receiptRequest && !order.receiptRequest.fulfilledAt) return fail(409, "You asked the customer for another receipt and it hasn't arrived yet.");
        if (wsRow && receiptRequired(wsRow)) {
          const [r] = await tx.select({ n: sql<number>`count(*)::int` }).from(t.orderReceipts).where(and(eq(t.orderReceipts.orderId, order.id), isNull(t.orderReceipts.rejectedAt)));
          if (!r?.n) return fail(409, "No payment receipt yet. Ask the customer to send one in chat before you confirm.");
        }
        // A booking: the time must still be this customer's (another booking may have taken it after the payment window ran out).
        if (order.kind === "appointment") {
          const [a] = await tx.select().from(t.appointments).where(eq(t.appointments.orderId, order.id));
          if (!a) return fail(409, "This booking has no time on record. Reject it and ask the customer to book again.");
          if (a.startsAt <= now) return fail(409, "This booking's time has already passed. Reject it, or ask the customer to pick another time.");
          if (a.staffId) {
            await lockStaff(tx, a.staffId);
            if (await slotTaken(tx, wsRow, a.staffId, a.startsAt, a.endsAt, order.id)) return fail(409, "That time is no longer free: the same person has another booking then. Reject this one, or ask the customer to pick another time.");
          }
        }
        const used = await consumeForOrder(tx, wsRow, order, items);
        if (used.problem) return fail(409, used.problem);
        stockMoved = used.moved;
        if (used.moved) await touchItems(tx, items, now);
        set = { status: "confirmed", confirmedAt: now, stockTaken: true, holdExpiresAt: null, handledBy: o.userId };
        notify = "confirmed";
        break;
      }
      case "ready":
        if (order.kind === "appointment") return fail(409, "Bookings don't have a ready step: mark attendance on the Calendar after the appointment.");
        if (order.status !== "confirmed") return order.status === "pending" ? fail(409, "Confirm the order first.") : order.status === "ready" ? already(tx, order, "marked ready") : fail(409, `This order is already ${order.status}.`);
        set = { status: "ready", readyAt: now, handledBy: o.userId };
        notify = "ready";
        break;
      case "complete":
        if (order.status !== "confirmed" && order.status !== "ready") return order.status === "pending" ? fail(409, "Confirm the order first.") : order.status === "completed" ? already(tx, order, "completed") : fail(409, `This order is already ${order.status}.`);
        set = { status: "completed", completedAt: now, handledBy: o.userId };
        break;
      case "reject":
      case "cancel": {
        if (order.status === "cancelled") return already(tx, order, order.confirmedAt ? "cancelled" : "rejected");
        if (order.status === "completed") return fail(409, "This order is already completed.");
        if (order.status === "expired") return fail(409, "This order already expired, and its stock went back.");
        // Reject is for an order nobody confirmed; once confirmed, it's a cancellation.
        if (o.action === "reject" && order.status !== "pending") return fail(409, "This order is already confirmed: cancel it instead.");
        stockMoved = await releaseForOrder(tx, order, items);
        if (stockMoved) await touchItems(tx, items, now);
        set = { status: "cancelled", cancelledAt: now, cancelReason: reason, stockTaken: false, holdExpiresAt: null, handledBy: o.userId, receiptRequest: order.receiptRequest && !order.receiptRequest.fulfilledAt ? null : order.receiptRequest };
        notify = order.status === "pending" ? "rejected" : "cancelled";
        break;
      }
      case "paid":
      case "unpaid":
        if (order.status === "cancelled" || order.status === "expired") return fail(409, `This order was ${order.status === "expired" ? "expired" : "rejected or cancelled"}.`);
        if (order.paid === (o.action === "paid")) return already(tx, order, o.action === "paid" ? "marked paid" : "marked unpaid");
        set = { paid: o.action === "paid", handledBy: o.userId };
        break;
      case "keep_reserved": {
        // Staff are happy to wait for this customer: the timer stops and the stock stays until they confirm or reject.
        if (order.status !== "pending") return fail(409, order.status === "expired" ? "This order already expired, and its stock went back." : `This order is already ${order.status}.`);
        if (order.firmedBy) return already(tx, order, order.firmedBy === "receipt" ? "reserved (the receipt passed the checks)" : "kept reserved");
        if (!order.holdExpiresAt) return fail(409, "This order isn't on a timer: its stock stays reserved until you confirm or reject it.");
        const firm = await firmHolds(tx, wsRow, order, "staff");
        if (!firm.ok) return fail(409, `${firm.error} Reject the order or restock first.`);
        const [kept] = await tx.update(t.orders).set({ handledBy: o.userId }).where(eq(t.orders.id, order.id)).returning();
        // firmHolds logs order.kept_reserved itself.
        return { ok: true, order: kept, items, notify: null };
      }
    }
    const action = o.action === "cancel" && order.status === "pending" ? "reject" : o.action;
    const [updated] = await tx.update(t.orders).set(set).where(eq(t.orders.id, order.id)).returning();
    await tx.insert(t.events).values({
      workspaceId: o.workspaceId, type: EVENT[action],
      props: { orderId: order.id, refCode: order.refCode, by: o.userId, threadId: order.threadId, ...(reason && (action === "cancel" || action === "reject") ? { reason } : {}), ...(action === "confirm" && stockMoved ? { stock: "deducted" } : {}), ...((action === "cancel" || action === "reject") && stockMoved ? { stock: "returned" } : {}) },
      isDemo: order.isDemo,
    });
    if (stockMoved && (action === "cancel" || action === "reject")) await tx.insert(t.events).values({ workspaceId: o.workspaceId, type: "stock.released", props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, why: action, by: o.userId }, isDemo: order.isDemo });
    return { ok: true, order: updated, items, notify };
  });
  if (r.ok && (o.action === "confirm" || o.action === "cancel" || o.action === "reject")) {
    await queueBookingSync(r.order);
    // Decided: a receipt card about this order (its expiry warning included) has nothing left to ask.
    await resolveCards(o.workspaceId, { orderId: o.orderId }, o.userId);
    await checkLowStock(o.workspaceId, r.items.map((i) => i.variantId).filter((x): x is string => Boolean(x))).catch((e) => log.error("stock.low_stock_check_failed", { workspaceId: o.workspaceId, orderId: o.orderId, err: e }));
  }
  return r;
}

/**
 * Staff turn the customer's receipt down and ask for another. "replace": the receipt was wrong, so earlier ones stop
 * counting and the full total is expected; "top_up": the customer paid too little and sends a receipt for the rest.
 * The order then waits for that receipt, and the assistant is told what to expect.
 */
export async function requestReceipt(o: { workspaceId: string; orderId: string; userId: string; reason: string; kind: ReceiptRequest["kind"]; dryRun?: boolean }) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(t.orders).where(and(eq(t.orders.id, o.orderId), eq(t.orders.workspaceId, o.workspaceId))).for("update");
    if (!order) return { ok: false as const, status: 404, error: "Order not found." };
    if (order.status === "cancelled" || order.status === "completed" || order.status === "expired") return { ok: false as const, status: 409, error: `This order is ${order.status === "cancelled" ? "rejected or cancelled" : order.status}.` };
    const [ws] = await tx.select().from(t.workspaces).where(eq(t.workspaces.id, o.workspaceId));
    const receipts = await tx.select({ id: t.orderReceipts.id, reading: t.orderReceipts.reading, rejectedAt: t.orderReceipts.rejectedAt }).from(t.orderReceipts).where(eq(t.orderReceipts.orderId, order.id));
    const paid = paidSoFar(receipts, order.currency);
    const expectedMinor = o.kind === "top_up" ? order.totalMinor - paid : order.totalMinor;
    if (o.kind === "top_up" && expectedMinor <= 0) return { ok: false as const, status: 400, error: "The receipts already cover the order total, so there's nothing left to pay. Ask for a replacement instead." };
    const request: ReceiptRequest = { reason: o.reason.trim().slice(0, 300), kind: o.kind, expectedMinor, requestedAt: new Date().toISOString(), requestedBy: o.userId, fulfilledAt: null };
    const message = receiptRequestMessage(ws, order, request);
    if (o.dryRun) return { ok: true as const, order, message, request };
    const now = new Date();
    // A pending order on the payment timer gets a fresh window for the new receipt.
    if (order.status === "pending" && receiptRequired(ws)) {
      const fresh = await restartHold(tx, ws, order);
      if (!fresh.ok) return { ok: false as const, status: 409, error: `${fresh.error} Reject the order instead.` };
    }
    if (o.kind === "replace") await tx.update(t.orderReceipts).set({ rejectedAt: now, rejectedReason: request.reason }).where(and(eq(t.orderReceipts.orderId, order.id), isNull(t.orderReceipts.rejectedAt)));
    const [updated] = await tx.update(t.orders).set({ receiptRequest: request, paid: false, handledBy: o.userId }).where(eq(t.orders.id, order.id)).returning();
    await tx.insert(t.events).values({ workspaceId: o.workspaceId, type: "receipt.requested", props: { orderId: order.id, refCode: order.refCode, by: o.userId, threadId: order.threadId, reason: request.reason, kind: o.kind, expectedMinor }, isDemo: order.isDemo });
    return { ok: true as const, order: updated, message, request };
  });
}

/** What the customer reads when staff ask for another receipt. Plain template: the amount and accounts are never the AI's. */
export function receiptRequestMessage(ws: Ws, order: OrderRow, r: ReceiptRequest): string {
  const amount = formatMoney(r.expectedMinor, order.currency);
  const p = paymentsOf(ws);
  const accounts = p ? `\n${paymentLines(p).join("\n")}` : "";
  const ask = r.kind === "top_up"
    ? `Please transfer the remaining ${amount}${accounts ? " to:" : ""}${accounts}\nthen send the receipt for it here.`
    : `Please send a new payment receipt showing ${amount}${accounts ? " paid to:" : ""}${accounts}`;
  const timer = order.status === "pending" && receiptRequired(ws) ? `\nWe'll keep your ${noun(order)} for another ${stockSettings(ws).holdMinutes} minutes for it.` : "";
  return `About your ${noun(order)} ${order.refCode}: we couldn't accept the payment receipt yet. ${r.reason.replace(/\.?$/, ".")}\n${ask}${timer}\nThe team confirms your ${noun(order)} once it checks out.`;
}

/** "booking" or "order", for messages the customer reads. */
export const noun = (o: { kind: string }) => (o.kind === "appointment" ? "booking" : "order");

/** Where a booking happens: its meeting link, or the business address for in-person services. */
export const placeLine = (ws: Ws, b: Pick<BookingFacts, "meetLink">) => (b.meetLink ? `Join online: ${b.meetLink}` : `Where: ${ws.settings.business?.address?.trim() || ws.name}`);

/** What the customer is told when staff act on their booking. Fixed wording: the time, place and money are never the AI's. */
export function bookingMessage(ws: Ws, kind: NotifyKind, order: OrderRow, b: BookingFacts): string {
  const at = when(ws, b.startsAt);
  const who = b.staffName ? ` with ${b.staffName}` : "";
  const reason = order.cancelReason ? `: ${order.cancelReason}` : "";
  if (kind === "confirmed") return `Your booking ${order.refCode} is confirmed ✅\n${b.service}${who}\n${at}\n${placeLine(ws, b)}\nTotal ${formatMoney(order.totalMinor, order.currency)}. Reply here if you need to change it.`;
  if (kind === "rejected") return `Sorry, we can't accept your booking ${order.refCode} (${at})${reason}. The time isn't reserved for you. Reply here and we'll find another time.`;
  return `Sorry, we've had to cancel your booking ${order.refCode} (${at})${reason}. Reply here and we'll find another time.`;
}

/** The customer's message for a staff action, loading the booking's facts when it is one. */
export async function messageFor(ws: Ws, kind: NotifyKind, order: OrderRow, items: OrderItemRow[]): Promise<string> {
  if (order.kind === "appointment") {
    const [b] = await bookingFacts(db, [order.id]);
    if (b) return bookingMessage(ws, kind, order, b);
  }
  return orderMessage(ws, kind, order, items);
}

/** What the customer is told when staff act on their order. */
export function orderMessage(ws: Ws, kind: NotifyKind, order: OrderRow, items: OrderItemRow[]): string {
  const money = (m: number) => formatMoney(m, order.currency);
  const lines = items.map((i) => `• ${i.quantity} × ${i.name}${i.note ? ` (${i.note})` : ""}`).join("\n");
  const delivery = order.fulfilment === "delivery";
  if (kind === "confirmed") {
    return `Your order ${order.refCode} is confirmed ✅\n${lines}\nTotal ${money(order.totalMinor)}${delivery ? " plus delivery" : ""}. ${delivery ? "We'll let you know when it's on its way." : "We'll let you know when it's ready for pickup."}`;
  }
  if (kind === "ready") return delivery ? `Your order ${order.refCode} is on its way 🛵` : `Your order ${order.refCode} is ready for pickup at ${ws.name}!`;
  if (kind === "rejected") return `Sorry, we can't accept your order ${order.refCode}${order.cancelReason ? `: ${order.cancelReason}` : ""}. Nothing will be prepared. Reply here and we'll sort something out.`;
  return `Sorry, we've had to cancel your order ${order.refCode}${order.cancelReason ? `: ${order.cancelReason}` : ""}. Reply here and we'll sort something out.`;
}

export type Attention = { level: "block" | "warn" | "info"; text: string };
export type NotificationView = OrderRow["notifications"][number] & { deliveredAt: string | null; readAt: string | null };
export type HoldView = Pick<typeof t.stockHolds.$inferSelect, "variantId" | "qty" | "status" | "date" | "expiresAt">;
export type OrderWithItems = OrderRow & {
  items: OrderItemRow[];
  holds: HoldView[];
  handledByName: string | null;
  receipts: ReceiptSummary[];
  /** Why this order needs a look, most serious first, in words staff can act on. */
  attention: Attention[];
  recommendation: string | null;
  notificationsView: NotificationView[];
  /** Bookings (kind "appointment"): when, with whom, and the meeting room. null for ordinary orders. */
  appointment: OrderAppointment | null;
};

/**
 * Plain rules over the order, its receipts, live stock and past notifications: what stands between this order and a safe
 * "Confirm". Each line names the number or fact behind it ("Paid RM 75, RM 10 short of the RM 85 total"), never a guess.
 */
export function explainOrder(o: OrderRow, items: OrderItemRow[], receipts: ReceiptSummary[], stock: { holds: HoldView[]; avail: Map<string, Avail>; date: string }, opts: { receiptRequired: boolean; now: Date; timezone: string; holdMinutes: number }): { attention: Attention[]; recommendation: string | null } {
  const out: Attention[] = [];
  const add = (level: Attention["level"], text: string) => out.push({ level, text });
  const live = receipts.filter((r) => !r.rejectedAt);
  const last = live[0];
  const money = (m: number) => formatMoney(m, o.currency);
  const hours = (iso: Date) => Math.max(0, Math.round((opts.now.getTime() - iso.getTime()) / 3600_000));

  if (o.status === "pending" || o.status === "confirmed" || o.status === "ready") {
    const req = o.receiptRequest;
    if (req && !req.fulfilledAt) add("block", `Waiting for ${req.kind === "top_up" ? `a receipt for the remaining ${money(req.expectedMinor)}` : `a new receipt for ${money(req.expectedMinor)}`}: you asked because “${req.reason}”.`);
    else if (opts.receiptRequired && !live.length && o.status === "pending") {
      const h = hours(o.createdAt);
      add("block", `No payment receipt yet${h >= 1 ? ` (ordered ${h} h ago)` : ""}. You can't confirm until one arrives.`);
    }
    if (last) {
      if (last.verdict === "unreadable") add("warn", "The latest receipt couldn't be read. The customer was asked to send a clearer one.");
      for (const c of last.checks) if (c.level === "fail") add("block", c.message);
      for (const c of last.checks) if (c.level === "warn" && c.code !== "reference") add("warn", c.message);
      if (!last.reading && last.verdict === "review") add("warn", last.model ? "The AI couldn't read this receipt. Open it and check it yourself." : "No AI could read the receipt (providers unavailable). Open it and check it yourself.");
    }
  }
  if (o.status === "pending") {
    const need = new Map<string, number>();
    for (const i of items) if (i.variantId) need.set(i.variantId, (need.get(i.variantId) ?? 0) + i.quantity);
    const date = o.wantedDate ?? stock.date;
    const clock = (d: Date) => human(d, opts.timezone).split(", ")[1];
    const active = stock.holds.filter((h) => h.status === "firm" || (h.status === "held" && (!h.expiresAt || h.expiresAt > opts.now)));
    const lapsed = o.holdExpiresAt && o.holdExpiresAt <= opts.now;
    if (o.firmedBy) add("info", o.firmedBy === "receipt" ? `The receipt passed the checks, so the payment timer stopped${active.length ? " and the stock stays reserved" : ""}.` : `Kept reserved by staff: the payment timer stopped${active.length ? " and the stock stays reserved" : ""}.`);
    else if (o.holdExpiresAt && !lapsed) {
      const mins = Math.max(1, Math.ceil((o.holdExpiresAt.getTime() - opts.now.getTime()) / 60_000));
      add("warn", `${o.kind === "appointment" ? "The time is" : "Stock"} held for ${mins} more minute${mins === 1 ? "" : "s"} (until ${clock(o.holdExpiresAt)}). It goes back unless a receipt passes the checks or you press Keep reserved.`);
    } else if (lapsed) add("block", `The ${opts.holdMinutes}-minute payment window ran out at ${clock(o.holdExpiresAt!)}: this ${noun(o)} is about to expire and its ${o.kind === "appointment" ? "time" : "stock"} is no longer held.`);
    for (const [vid, n] of need) {
      const name = items.find((i) => i.variantId === vid)?.name ?? "an item";
      const a = stock.avail.get(availKey(vid, date));
      if (!a) add("block", `${name} was removed from your catalog.`);
      else if (!a.on) add("block", `${name} is switched off in Knowledge${a.mode === "daily" && o.wantedDate ? ` for ${o.wantedDate}` : ""}.`);
      else if (active.some((h) => h.variantId === vid)) continue;
      else if (a.left !== null && a.left < n) {
        const fix = a.mode === "daily" ? "raise that day's quantity" : "restock it";
        add("block", a.left <= 0 ? `${name} is sold out${a.mode === "daily" ? ` for ${a.date}` : ""}: confirming will fail until you ${fix}.` : `Only ${a.left} left of ${name} (ordered ${n}): confirming will fail until you ${fix}.`);
      }
    }
    if (o.fulfilment === "delivery" && o.kind !== "appointment") add("info", "The total covers the items only: agree the delivery fee with the customer.");
  }
  if (o.status === "expired") add("info", `Expired${o.expiredAt ? ` at ${human(o.expiredAt, opts.timezone)}` : ""}: no receipt passed the checks within ${opts.holdMinutes} minutes, so its stock went back and the customer was told.`);
  const lastN = o.notifications[o.notifications.length - 1];
  if (lastN?.status === "failed") add("warn", `The customer wasn't told the order was ${lastN.kind.replace("_", " ")}: ${lastN.error ?? "the message didn't go through"}. Retry or message them yourself.`);
  else if (lastN?.status === "no_chat") add("info", `There's no chat to tell the customer the order was ${lastN.kind.replace("_", " ")}. Contact them another way.`);

  const blocks = out.filter((a) => a.level === "block");
  let recommendation: string | null = null;
  if (o.status === "pending") {
    const short = last?.checks.find((c) => c.code === "amount" && c.level === "fail");
    const wrongPayee = last?.checks.find((c) => c.code === "payee" && c.level === "fail");
    const dup = last?.checks.find((c) => c.code === "duplicate");
    if (o.receiptRequest && !o.receiptRequest.fulfilledAt) recommendation = "Wait for the customer's new receipt.";
    else if (dup) recommendation = "Ask for another receipt: this one was already used for a different order.";
    else if (short) recommendation = "Ask the customer to pay the difference (Ask for another receipt → Pay the difference).";
    else if (wrongPayee) recommendation = "Ask for another receipt: the money went to an account that isn't yours.";
    else if (last?.verdict === "unreadable") recommendation = "Wait for a clearer receipt, or ask for one.";
    else if (blocks.length) recommendation = "Sort out the items marked ✗ before confirming, or reject the order.";
    else if (o.holdExpiresAt && !o.firmedBy && last && last.verdict !== "consistent") recommendation = "Check the receipt, then confirm or press Keep reserved before the timer runs out.";
    else if (last?.verdict === "consistent") recommendation = "Ready to confirm: the receipt matches the total and your account, and stock is there.";
    else if (!opts.receiptRequired) recommendation = "Ready to confirm once you're happy with it: stock is there.";
    else recommendation = "Check the receipt against your bank statement, then confirm.";
  }
  const rank = { block: 0, warn: 1, info: 2 };
  return { attention: out.sort((a, b) => rank[a.level] - rank[b.level]), recommendation };
}

/** The Orders page: newest first, with items, receipts and the reasons each one needs attention. Pending orders always come back, however old. */
export async function loadOrders(workspaceId: string, limit = 120): Promise<OrderWithItems[]> {
  const rows = await db
    .select({ o: t.orders, by: t.users.name })
    .from(t.orders)
    .leftJoin(t.users, eq(t.users.id, t.orders.handledBy))
    .where(eq(t.orders.workspaceId, workspaceId))
    .orderBy(sql`(${t.orders.status} = 'pending') desc`, desc(t.orders.createdAt))
    .limit(limit);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.o.id);
  const items = await db.select().from(t.orderItems).where(inArray(t.orderItems.orderId, ids));
  const receipts = await receiptsFor(ids);
  const holds = await db.select({ orderId: t.stockHolds.orderId, variantId: t.stockHolds.variantId, qty: t.stockHolds.qty, status: t.stockHolds.status, date: t.stockHolds.date, expiresAt: t.stockHolds.expiresAt }).from(t.stockHolds).where(inArray(t.stockHolds.orderId, ids));
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  const today = businessDate(ws);
  const pending = new Set(rows.filter((r) => r.o.status === "pending").map((r) => r.o.id));
  const wants = items.filter((i) => i.variantId && pending.has(i.orderId)).map((i) => ({ variantId: i.variantId!, date: rows.find((r) => r.o.id === i.orderId)?.o.wantedDate ?? today }));
  const avail = await availability(db, ws, wants);
  const msgIds = rows.flatMap((r) => r.o.notifications.map((n) => n.messageId)).filter((x): x is string => Boolean(x));
  const msgs = msgIds.length ? await db.select({ id: t.messages.id, status: t.messages.status, error: t.messages.error, deliveredAt: t.messages.deliveredAt, readAt: t.messages.readAt }).from(t.messages).where(inArray(t.messages.id, msgIds)) : [];
  const now = new Date();
  const bookings = await bookingFacts(db, rows.filter((r) => r.o.kind === "appointment").map((r) => r.o.id));
  // A pending booking whose time has passed, or that someone else's booking now overlaps (its payment window ran out).
  const clash = new Set<string>();
  for (const b of bookings) {
    const o = rows.find((r) => r.o.id === b.orderId)!.o;
    if (o.status === "pending" && b.staffId && b.startsAt > now && (await slotTaken(db, ws, b.staffId, b.startsAt, b.endsAt, o.id))) clash.add(o.id);
  }
  const opts = { receiptRequired: receiptRequired(ws), now, timezone: ws.timezone, holdMinutes: stockSettings(ws).holdMinutes };
  return rows.map((r) => {
    // A message that left fine but later bounced (WhatsApp status webhook) shows as failed here too.
    const notificationsView = r.o.notifications.map((n) => {
      const m = msgs.find((x) => x.id === n.messageId);
      const status = m?.status === "failed" ? "failed" : m?.status === "pending_approval" ? "draft" : n.status;
      return { ...n, status, error: m?.status === "failed" ? m.error ?? n.error ?? null : n.error ?? null, deliveredAt: m?.deliveredAt?.toISOString() ?? null, readAt: m?.readAt?.toISOString() ?? null } as NotificationView;
    });
    const order = { ...r.o, notifications: notificationsView };
    const its = items.filter((i) => i.orderId === r.o.id);
    const rs = receipts.filter((x) => x.orderId === r.o.id);
    const hs = holds.filter((h) => h.orderId === r.o.id).map(({ orderId: _o, ...h }) => h);
    const { attention, recommendation } = explainOrder(order, its, rs, { holds: hs, avail, date: today }, opts);
    const b = bookings.find((x) => x.orderId === r.o.id);
    if (b && r.o.status === "pending") {
      if (b.startsAt <= now) attention.unshift({ level: "block", text: `The booked time (${when(ws, b.startsAt)}) has passed: reject it, or ask the customer to pick another time.` });
      else if (clash.has(r.o.id)) attention.unshift({ level: "block", text: `${b.staffName ?? "That person"} has another booking at ${when(ws, b.startsAt)} now: confirming will fail. Reject it, or ask the customer to pick another time.` });
    }
    const appointment: OrderAppointment | null = b ? { id: b.appointmentId, service: b.service, staffId: b.staffId, staffName: b.staffName, startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString(), meetLink: b.meetLink, inPerson: b.inPerson, attendance: b.attendance as OrderAppointment["attendance"] } : null;
    return { ...r.o, handledByName: r.by ?? null, items: its, holds: hs, receipts: rs, attention, recommendation, notificationsView, appointment };
  });
}
