// Orders taken in chat. The agent's create_order tool saves one as "pending"; nothing is promised to the customer
// until staff confirm it. Prices always come from the catalog (never from the model), stock comes off when an order
// is confirmed and goes back if it is cancelled, and every step is logged to the events table.
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db, t } from "@/db";
import { shortCode } from "./crypto";
import { formatMoney } from "./money";

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
  notes?: string | null;
  threadId?: string | null;
  customerId?: string | null;
  channel?: "telegram" | "whatsapp" | "instagram" | "simulator" | null;
  isDemo?: boolean;
};

export const MAX_LINES = 20;
export const MAX_QTY = 50;
const DUPLICATE_WINDOW_MS = 15 * 60_000;

export const lineTotal = (l: Pick<OrderLine, "quantity" | "unitPriceMinor">) => l.quantity * l.unitPriceMinor;

/** Same items, quantities, notes and pickup/delivery as a still-pending order in this chat: the customer repeated themselves. */
const signature = (fulfilment: string, lines: { variantId: string | null; quantity: number; note: string | null }[]) =>
  `${fulfilment}|${lines.map((l) => `${l.variantId}:${l.quantity}:${(l.note ?? "").trim().toLowerCase()}`).sort().join(",")}`;

export async function placeOrder(ws: Ws, input: OrderInput): Promise<{ ok: true; order: OrderRow; items: OrderItemRow[]; duplicate: boolean }> {
  const total = input.lines.reduce((s, l) => s + lineTotal(l), 0);
  if (input.threadId) {
    const recent = await db
      .select()
      .from(t.orders)
      .where(and(eq(t.orders.threadId, input.threadId), eq(t.orders.status, "pending"), gt(t.orders.createdAt, new Date(Date.now() - DUPLICATE_WINDOW_MS))));
    for (const o of recent) {
      const items = await db.select().from(t.orderItems).where(eq(t.orderItems.orderId, o.id));
      if (signature(o.fulfilment, items) === signature(input.fulfilment, input.lines)) return { ok: true, order: o, items, duplicate: true };
    }
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const done = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(t.orders)
        .values({
          workspaceId: ws.id, threadId: input.threadId ?? null, customerId: input.customerId ?? null, refCode: shortCode("ORD"),
          customerName: input.customerName.slice(0, 80), phone: input.phone?.slice(0, 40) ?? null, fulfilment: input.fulfilment,
          address: input.fulfilment === "delivery" ? input.address?.slice(0, 300) ?? null : null,
          wanted: input.wanted?.slice(0, 120) ?? null, notes: input.notes?.slice(0, 500) ?? null,
          totalMinor: total, currency: ws.currency, channel: input.channel ?? null, isDemo: Boolean(input.isDemo),
        })
        .onConflictDoNothing()
        .returning();
      if (!order) return null;
      const items = await tx
        .insert(t.orderItems)
        .values(input.lines.map((l) => ({ workspaceId: ws.id, orderId: order.id, itemId: l.itemId, variantId: l.variantId, name: l.name, quantity: l.quantity, unitPriceMinor: l.unitPriceMinor, note: l.note })))
        .returning();
      await tx.insert(t.events).values({ workspaceId: ws.id, type: "order.created", props: { orderId: order.id, refCode: order.refCode, totalMinor: total, items: items.length, channel: input.channel ?? null }, isDemo: Boolean(input.isDemo) });
      return { order, items };
    });
    if (done) return { ok: true, ...done, duplicate: false };
  }
  throw new Error("Couldn't pick a reference code for the order, try again.");
}

export type OrderAction = "confirm" | "ready" | "complete" | "cancel" | "paid" | "unpaid";
export type Transition =
  | { ok: true; order: OrderRow; items: OrderItemRow[]; /** Tell the customer in chat. */ notify: "confirmed" | "ready" | "cancelled" | null }
  | { ok: false; status: number; error: string };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Stock changed: bump the items so the agent's cached knowledge refreshes. */
async function touchItems(tx: Tx, items: OrderItemRow[], now: Date) {
  const ids = [...new Set(items.map((i) => i.itemId).filter((x): x is string => Boolean(x)))];
  if (ids.length) await tx.update(t.kbItems).set({ updatedAt: now }).where(inArray(t.kbItems.id, ids));
}

const EVENT: Record<OrderAction, string> = { confirm: "order.confirmed", ready: "order.ready", complete: "order.completed", cancel: "order.cancelled", paid: "order.paid", unpaid: "order.unpaid" };

/** Move an order along. Workspace-scoped; stock is taken on confirm (refusing if short) and returned on cancel. */
export async function transitionOrder(o: { workspaceId: string; orderId: string; action: OrderAction; userId: string; reason?: string | null }): Promise<Transition> {
  return db.transaction(async (tx): Promise<Transition> => {
    const [order] = await tx.select().from(t.orders).where(and(eq(t.orders.id, o.orderId), eq(t.orders.workspaceId, o.workspaceId))).for("update");
    if (!order) return { ok: false, status: 404, error: "Order not found." };
    const items = await tx.select().from(t.orderItems).where(eq(t.orderItems.orderId, order.id));
    const now = new Date();
    const fail = (status: number, error: string): Transition => ({ ok: false, status, error });
    const byVariant = new Map<string, number>();
    for (const i of items) if (i.variantId) byVariant.set(i.variantId, (byVariant.get(i.variantId) ?? 0) + i.quantity);
    let set: Partial<typeof t.orders.$inferInsert> = {};
    let notify: "confirmed" | "ready" | "cancelled" | null = null;

    switch (o.action) {
      case "confirm": {
        if (order.status !== "pending") return fail(409, `This order is already ${order.status}.`);
        if (byVariant.size) {
          const vs = await tx.select().from(t.kbVariants).where(inArray(t.kbVariants.id, [...byVariant.keys()])).for("update");
          for (const v of vs) {
            const need = byVariant.get(v.id) ?? 0;
            if (v.stock !== null && v.stock < need) {
              const name = items.find((i) => i.variantId === v.id)?.name ?? "an item";
              return fail(409, v.stock <= 0 ? `${name} is out of stock now. Cancel the order or restock it first.` : `Only ${v.stock} left of ${name} (ordered ${need}). Cancel the order or restock it first.`);
            }
          }
          for (const v of vs) if (v.stock !== null) await tx.update(t.kbVariants).set({ stock: v.stock - (byVariant.get(v.id) ?? 0) }).where(eq(t.kbVariants.id, v.id));
          await touchItems(tx, items, now);
        }
        set = { status: "confirmed", confirmedAt: now, stockTaken: true, handledBy: o.userId };
        notify = "confirmed";
        break;
      }
      case "ready":
        if (order.status !== "confirmed") return fail(409, order.status === "pending" ? "Confirm the order first." : `This order is already ${order.status}.`);
        set = { status: "ready", readyAt: now, handledBy: o.userId };
        notify = "ready";
        break;
      case "complete":
        if (order.status !== "confirmed" && order.status !== "ready") return fail(409, order.status === "pending" ? "Confirm the order first." : `This order is already ${order.status}.`);
        set = { status: "completed", completedAt: now, handledBy: o.userId };
        break;
      case "cancel": {
        if (order.status === "completed" || order.status === "cancelled") return fail(409, `This order is already ${order.status}.`);
        if (order.stockTaken && byVariant.size) {
          const vs = await tx.select().from(t.kbVariants).where(inArray(t.kbVariants.id, [...byVariant.keys()])).for("update");
          for (const v of vs) if (v.stock !== null) await tx.update(t.kbVariants).set({ stock: v.stock + (byVariant.get(v.id) ?? 0) }).where(eq(t.kbVariants.id, v.id));
          await touchItems(tx, items, now);
        }
        set = { status: "cancelled", cancelledAt: now, cancelReason: o.reason?.trim().slice(0, 200) || null, stockTaken: false, handledBy: o.userId };
        notify = "cancelled";
        break;
      }
      case "paid":
      case "unpaid":
        if (order.status === "cancelled") return fail(409, "This order was cancelled.");
        set = { paid: o.action === "paid", handledBy: o.userId };
        break;
    }
    const [updated] = await tx.update(t.orders).set(set).where(eq(t.orders.id, order.id)).returning();
    await tx.insert(t.events).values({ workspaceId: o.workspaceId, type: EVENT[o.action], props: { orderId: order.id, refCode: order.refCode, by: o.userId, ...(o.action === "cancel" && o.reason ? { reason: o.reason.slice(0, 200) } : {}) }, isDemo: order.isDemo });
    return { ok: true, order: updated, items, notify };
  });
}

/** What the customer is told when staff act on their order. */
export function orderMessage(ws: Ws, kind: "confirmed" | "ready" | "cancelled", order: OrderRow, items: OrderItemRow[]): string {
  const money = (m: number) => formatMoney(m, order.currency);
  const lines = items.map((i) => `• ${i.quantity} × ${i.name}${i.note ? ` (${i.note})` : ""}`).join("\n");
  const delivery = order.fulfilment === "delivery";
  if (kind === "confirmed") {
    return `Your order ${order.refCode} is confirmed ✅\n${lines}\nTotal ${money(order.totalMinor)}${delivery ? " plus delivery" : ""}. ${delivery ? "We'll let you know when it's on its way." : "We'll let you know when it's ready for pickup."}`;
  }
  if (kind === "ready") return delivery ? `Your order ${order.refCode} is on its way 🛵` : `Your order ${order.refCode} is ready for pickup at ${ws.name}!`;
  return `Sorry, we can't make your order ${order.refCode}${order.cancelReason ? `: ${order.cancelReason}` : ""}. Reply here and we'll sort something out.`;
}

export type OrderWithItems = OrderRow & { items: OrderItemRow[]; handledByName: string | null };

/** The Orders page: newest first, with items. Pending orders always come back, however old. */
export async function loadOrders(workspaceId: string, limit = 120): Promise<OrderWithItems[]> {
  const rows = await db
    .select({ o: t.orders, by: t.users.name })
    .from(t.orders)
    .leftJoin(t.users, eq(t.users.id, t.orders.handledBy))
    .where(eq(t.orders.workspaceId, workspaceId))
    .orderBy(sql`(${t.orders.status} = 'pending') desc`, desc(t.orders.createdAt))
    .limit(limit);
  if (!rows.length) return [];
  const items = await db.select().from(t.orderItems).where(inArray(t.orderItems.orderId, rows.map((r) => r.o.id)));
  return rows.map((r) => ({ ...r.o, handledByName: r.by ?? null, items: items.filter((i) => i.orderId === r.o.id) }));
}
