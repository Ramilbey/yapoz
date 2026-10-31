// An approved order as the event Orbyte would receive. The format is our assumption, not a real Orbyte API (see
// docs/orbyte-integration.md), and nothing here sends it: this only reads, and approval itself stays in transitionOrder.
import { and, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { lineTotal, noun, type OrderItemRow, type OrderRow } from "./orders";

export const APPROVED_ORDER_EVENT = "yapoz.order.approved.v1";

export type ApprovedOrderEvent = ReturnType<typeof approvedOrderEvent>;

/** Only an order a person confirmed: pending, rejected, expired, and cancelled-after-confirming orders all throw. */
export function approvedOrderEvent(order: OrderRow, items: OrderItemRow[], approvedBy: string) {
  if (!order.confirmedAt || !["confirmed", "ready", "completed"].includes(order.status)) throw new Error(`Order ${order.refCode} isn't approved.`);
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

/** The event for one order in one business, with the person who confirmed it from the activity log. */
export async function loadApprovedOrderEvent(workspaceId: string, orderId: string) {
  const [order] = await db.select().from(t.orders).where(and(eq(t.orders.id, orderId), eq(t.orders.workspaceId, workspaceId)));
  if (!order) return null;
  const items = await db.select().from(t.orderItems).where(eq(t.orderItems.orderId, order.id));
  const logged = await db.select({ props: t.events.props }).from(t.events).where(and(eq(t.events.workspaceId, workspaceId), eq(t.events.type, "order.confirmed")));
  const by = logged.map((e) => e.props as { orderId?: string; by?: string }).find((p) => p.orderId === order.id)?.by;
  if (!by) throw new Error(`Order ${order.refCode} has no recorded approval.`);
  return approvedOrderEvent(order, items, by);
}
