// Settings → Privacy: conversations and receipt files older than a business's retention period are deleted by the daily
// sweep. Orders and their totals stay (the business needs its records), but finished orders past the period lose the
// customer's name, phone, address and notes; what customers wrote and sent goes.
import { and, eq, inArray, isNotNull, lt, ne, sql } from "drizzle-orm";
import { db, t } from "@/db";

export async function purgeExpired(now = new Date()) {
  const rows = await db.select({ id: t.workspaces.id, days: sql<number | null>`(${t.workspaces.settings}->'privacy'->>'retentionDays')::int` }).from(t.workspaces).where(isNotNull(sql`${t.workspaces.settings}->'privacy'->>'retentionDays'`));
  let threads = 0;
  let receipts = 0;
  let orders = 0;
  for (const w of rows) {
    if (!w.days || w.days < 7) continue;
    const cutoff = new Date(now.getTime() - w.days * 86_400_000);
    // Receipt files of orders no longer in progress; the reading and checks stay on the order.
    const r = await db
      .delete(t.orderReceipts)
      .where(and(eq(t.orderReceipts.workspaceId, w.id), lt(t.orderReceipts.createdAt, cutoff), sql`${t.orderReceipts.orderId} in (select id from orders where workspace_id = ${w.id} and status in ('completed', 'cancelled'))`))
      .returning({ id: t.orderReceipts.id });
    // Finished orders keep their totals but stop naming the customer (same wording as the customer-erase request).
    const o = await db
      .update(t.orders)
      .set({ customerName: "Deleted customer", phone: null, address: null, notes: null })
      .where(and(eq(t.orders.workspaceId, w.id), lt(t.orders.createdAt, cutoff), inArray(t.orders.status, ["completed", "cancelled"]), ne(t.orders.customerName, "Deleted customer")))
      .returning({ id: t.orders.id });
    // Logged copies of what customers wrote go with the chats they came from.
    await db.delete(t.events).where(and(eq(t.events.workspaceId, w.id), lt(t.events.createdAt, cutoff), inArray(t.events.type, ["message.received", "order.attempt_failed"])));
    // Chats with nothing newer than the cutoff go with their messages, AI runs and escalations (cascade).
    const th = await db.delete(t.threads).where(and(eq(t.threads.workspaceId, w.id), lt(t.threads.lastMessageAt, cutoff))).returning({ id: t.threads.id });
    await db.execute(sql`delete from customers c where c.workspace_id = ${w.id} and not exists (select 1 from threads th where th.customer_id = c.id) and c.last_seen_at < ${cutoff.toISOString()}`);
    if (r.length || th.length || o.length) await db.insert(t.events).values({ workspaceId: w.id, type: "privacy.retention_purge", props: { days: w.days, threads: th.length, receipts: r.length, orders: o.length } });
    threads += th.length;
    receipts += r.length;
    orders += o.length;
  }
  return { threads, receipts, orders };
}
