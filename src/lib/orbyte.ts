// An approved order as the event Orbyte would receive. The format is our assumption, not a real Orbyte API (see
// docs/orbyte-integration.md), and nothing here sends it: this only reads, and approval itself stays in transitionOrder.
import { createHmac } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, t } from "@/db";
import { isReasonCode, REASON_LABELS } from "./order-reasons";
import { lineTotal, noun, type OrderItemRow, type OrderRow } from "./orders";

export const APPROVED_ORDER_EVENT = "yapoz.order.approved.v1";

export type ApprovedOrderEvent = ReturnType<typeof approvedOrderEvent>;

export class NotApproved extends Error {}

/** Only an order a person confirmed: pending, rejected, expired, and cancelled-after-confirming orders all throw. */
export function approvedOrderEvent(order: OrderRow, items: OrderItemRow[], approvedBy: string) {
  if (!order.confirmedAt || !["confirmed", "ready", "completed"].includes(order.status)) throw new NotApproved(`Order ${order.refCode} isn't approved.`);
  return {
    event: APPROVED_ORDER_EVENT,
    eventId: `${order.id}:approved`,
    occurredAt: order.confirmedAt.toISOString(),
    workspaceId: order.workspaceId,
    approvedBy: { userId: approvedBy },
    testData: order.isDemo,
    order: {
      id: order.id,
      refCode: order.refCode,
      type: noun(order),
      status: order.status,
      channel: order.channel,
      fulfilment: order.fulfilment,
      wantedDate: order.wantedDate,
      currency: order.currency,
      totalMinor: order.totalMinor,
      paid: order.paid,
      customer: { name: order.customerName, phone: order.phone, address: order.address },
      lines: items.map((i) => ({ variantId: i.variantId, name: i.name, quantity: i.quantity, unitPriceMinor: i.unitPriceMinor, lineTotalMinor: lineTotal(i), note: i.note })),
    },
  };
}

const summary = (order: OrderRow) => ({ id: order.id, refCode: order.refCode, type: noun(order), currency: order.currency, totalMinor: order.totalMinor });

/** An order as it started waiting, for Orbyte's Approve queue. No customer details: the person decides inside Yapoz. */
export function pendingApprovalEvent(order: OrderRow) {
  return {
    event: "yapoz.order.pending_approval.v1",
    eventId: `${order.id}:pending`,
    occurredAt: order.createdAt.toISOString(),
    workspaceId: order.workspaceId,
    testData: order.isDemo,
    action: { queue: "approve", title: `Approve ${noun(order)} ${order.refCode}`, path: "/app/orders" },
    order: summary(order),
  };
}

/** A rejection closes the queue item. It never gives Orbyte anything to act on. */
export function rejectedOrderEvent(order: OrderRow, rejectedBy: string, reasonCode?: string | null) {
  if (order.status !== "cancelled" || order.confirmedAt || !order.cancelledAt) throw new NotApproved(`Order ${order.refCode} wasn't rejected.`);
  return {
    event: "yapoz.order.rejected.v1",
    eventId: `${order.id}:rejected`,
    occurredAt: order.cancelledAt.toISOString(),
    workspaceId: order.workspaceId,
    rejectedBy: { userId: rejectedBy },
    reasonCode: reasonCode ?? null,
    reason: order.cancelReason ?? (isReasonCode(reasonCode) ? REASON_LABELS[reasonCode] : null),
    testData: order.isDemo,
    order: summary(order),
  };
}

/** One completed order as one unit of usage. What a unit costs in credits would be Orbyte's setting. */
export function orderUsageEvent(order: OrderRow) {
  if (order.status !== "completed" || !order.completedAt) throw new NotApproved(`Order ${order.refCode} isn't completed.`);
  return {
    event: "yapoz.usage.order_completed.v1",
    eventId: `${order.id}:usage`,
    occurredAt: order.completedAt.toISOString(),
    workspaceId: order.workspaceId,
    testData: order.isDemo,
    usage: { unit: "completed_order", quantity: 1 },
    order: { id: order.id, refCode: order.refCode },
  };
}

/** How a receiver would know an event is from Yapoz and is recent: an HMAC over the timestamp and the exact body. */
export function signEvent(body: string, secret: string, timestampMs: number) {
  return { "x-yapoz-timestamp": String(timestampMs), "x-yapoz-signature": `sha256=${createHmac("sha256", secret).update(`${timestampMs}.${body}`).digest("hex")}` };
}

/** Every event an order would have produced so far, oldest first, with who decided from the activity log. */
export async function loadOrderEvents(workspaceId: string, orderId: string) {
  const [order] = await db.select().from(t.orders).where(and(eq(t.orders.id, orderId), eq(t.orders.workspaceId, workspaceId)));
  if (!order) return null;
  const items = await db.select().from(t.orderItems).where(eq(t.orderItems.orderId, order.id));
  const logged = await db.select({ type: t.events.type, props: t.events.props }).from(t.events).where(and(eq(t.events.workspaceId, workspaceId), inArray(t.events.type, ["order.confirmed", "order.rejected"])));
  const decision = (type: string) => logged.map((e) => ({ type: e.type, ...(e.props as { orderId?: string; by?: string; reasonCode?: string }) })).find((e) => e.type === type && e.orderId === order.id);
  const approver = decision("order.confirmed")?.by;
  const rejection = decision("order.rejected");
  const rejecter = rejection?.by;
  const events: { stage: string; event: unknown }[] = [{ stage: "Waiting for approval", event: pendingApprovalEvent(order) }];
  if (approver && order.confirmedAt && ["confirmed", "ready", "completed"].includes(order.status)) events.push({ stage: "Approved", event: approvedOrderEvent(order, items, approver) });
  if (rejecter && order.status === "cancelled" && !order.confirmedAt && order.cancelledAt) events.push({ stage: "Rejected", event: rejectedOrderEvent(order, rejecter, rejection?.reasonCode) });
  if (order.status === "completed" && order.completedAt) events.push({ stage: "Completed: one unit of usage", event: orderUsageEvent(order) });
  return events;
}

/** The event for one order in one business, with the person who confirmed it from the activity log. */
export async function loadApprovedOrderEvent(workspaceId: string, orderId: string) {
  const [order] = await db.select().from(t.orders).where(and(eq(t.orders.id, orderId), eq(t.orders.workspaceId, workspaceId)));
  if (!order) return null;
  const items = await db.select().from(t.orderItems).where(eq(t.orderItems.orderId, order.id));
  const logged = await db.select({ props: t.events.props }).from(t.events).where(and(eq(t.events.workspaceId, workspaceId), eq(t.events.type, "order.confirmed")));
  const by = logged.map((e) => e.props as { orderId?: string; by?: string }).find((p) => p.orderId === order.id)?.by;
  if (!by) throw new NotApproved(`Order ${order.refCode} has no recorded approval.`);
  return approvedOrderEvent(order, items, by);
}
