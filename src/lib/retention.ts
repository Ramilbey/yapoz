// Settings → Privacy: conversations and receipt files older than a business's retention period are deleted by the daily
// sweep. Orders and their totals stay (the business needs its records); what customers wrote and sent goes.
import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import { db, t } from "@/db";

export async function purgeExpired(now = new Date()) {
  const rows = await db.select({ id: t.workspaces.id, days: sql<number | null>`(${t.workspaces.settings}->'privacy'->>'retentionDays')::int` }).from(t.workspaces).where(isNotNull(sql`${t.workspaces.settings}->'privacy'->>'retentionDays'`));
  let threads = 0;
  let receipts = 0;
  for (const w of rows) {
    if (!w.days || w.days < 7) continue;
    const cutoff = new Date(now.getTime() - w.days * 86_400_000);
    // Receipt files of orders no longer in progress; the reading and checks stay on the order.
    const r = await db
      .delete(t.orderReceipts)
      .where(and(eq(t.orderReceipts.workspaceId, w.id), lt(t.orderReceipts.createdAt, cutoff), sql`${t.orderReceipts.orderId} in (select id from orders where workspace_id = ${w.id} and status in ('completed', 'cancelled'))`))
      .returning({ id: t.orderReceipts.id });
    // Chats with nothing newer than the cutoff go with their messages, AI runs and escalations (cascade).
    const th = await db.delete(t.threads).where(and(eq(t.threads.workspaceId, w.id), lt(t.threads.lastMessageAt, cutoff))).returning({ id: t.threads.id });
    await db.execute(sql`delete from customers c where c.workspace_id = ${w.id} and not exists (select 1 from threads th where th.customer_id = c.id) and c.last_seen_at < ${cutoff.toISOString()}`);
    if (r.length || th.length) await db.insert(t.events).values({ workspaceId: w.id, type: "privacy.retention_purge", props: { days: w.days, threads: th.length, receipts: r.length } });
    threads += th.length;
    receipts += r.length;
  }
  return { threads, receipts };
}
