// "Let me leave": everything a shop holds about its customers and sales, as plain data. Every query is scoped to the
// workspace, and only fields are listed by name, so a new secret column can never leak by being added to a table.
import { asc, eq } from "drizzle-orm";
import { db, t } from "@/db";

export const EXPORT_TABLES = ["customers", "threads", "messages", "orders", "order_items", "receipts"] as const;
export type ExportTable = (typeof EXPORT_TABLES)[number];

export async function exportWorkspace(workspaceId: string) {
  const w = eq(t.customers.workspaceId, workspaceId);
  const [workspace] = await db
    .select({ id: t.workspaces.id, name: t.workspaces.name, city: t.workspaces.city, timezone: t.workspaces.timezone, currency: t.workspaces.currency, createdAt: t.workspaces.createdAt })
    .from(t.workspaces)
    .where(eq(t.workspaces.id, workspaceId));
  const customers = await db
    .select({ id: t.customers.id, channel: t.customers.channel, externalId: t.customers.externalId, displayName: t.customers.displayName, username: t.customers.username, phone: t.customers.phone, language: t.customers.language, createdAt: t.customers.createdAt, lastSeenAt: t.customers.lastSeenAt })
    .from(t.customers)
    .where(w)
    .orderBy(asc(t.customers.createdAt));
  const threads = await db
    .select({ id: t.threads.id, channel: t.threads.channel, customerId: t.threads.customerId, status: t.threads.status, createdAt: t.threads.createdAt, lastMessageAt: t.threads.lastMessageAt })
    .from(t.threads)
    .where(eq(t.threads.workspaceId, workspaceId))
    .orderBy(asc(t.threads.createdAt));
  const messages = await db
    .select({ id: t.messages.id, threadId: t.messages.threadId, direction: t.messages.direction, author: t.messages.author, text: t.messages.text, attachments: t.messages.attachments, status: t.messages.status, createdAt: t.messages.createdAt })
    .from(t.messages)
    .where(eq(t.messages.workspaceId, workspaceId))
    .orderBy(asc(t.messages.createdAt));
  const orderRows = await db
    .select({
      id: t.orders.id, refCode: t.orders.refCode, kind: t.orders.kind, threadId: t.orders.threadId, customerId: t.orders.customerId, customerName: t.orders.customerName, phone: t.orders.phone,
      fulfilment: t.orders.fulfilment, address: t.orders.address, wanted: t.orders.wanted, notes: t.orders.notes, status: t.orders.status, paid: t.orders.paid,
      totalMinor: t.orders.totalMinor, currency: t.orders.currency, channel: t.orders.channel, cancelReason: t.orders.cancelReason, createdAt: t.orders.createdAt,
    })
    .from(t.orders)
    .where(eq(t.orders.workspaceId, workspaceId))
    .orderBy(asc(t.orders.createdAt));
  const items = await db
    .select({ id: t.orderItems.id, orderId: t.orderItems.orderId, name: t.orderItems.name, quantity: t.orderItems.quantity, unitPriceMinor: t.orderItems.unitPriceMinor, note: t.orderItems.note })
    .from(t.orderItems)
    .where(eq(t.orderItems.workspaceId, workspaceId));
  const byOrder = new Map<string, typeof items>();
  for (const i of items) byOrder.set(i.orderId, [...(byOrder.get(i.orderId) ?? []), i]);
  const orders = orderRows.map((o) => ({ ...o, items: (byOrder.get(o.id) ?? []).map(({ orderId: _o, ...i }) => i) }));
  // Receipt metadata only: the image bytes are not included.
  const receipts = await db
    .select({ id: t.orderReceipts.id, orderId: t.orderReceipts.orderId, mime: t.orderReceipts.mime, sha256: t.orderReceipts.sha256, reading: t.orderReceipts.reading, checks: t.orderReceipts.checks, verdict: t.orderReceipts.verdict, rejectedAt: t.orderReceipts.rejectedAt, rejectedReason: t.orderReceipts.rejectedReason, createdAt: t.orderReceipts.createdAt })
    .from(t.orderReceipts)
    .where(eq(t.orderReceipts.workspaceId, workspaceId))
    .orderBy(asc(t.orderReceipts.createdAt));
  return { exportedAt: new Date().toISOString(), workspace, customers, threads, messages, orders, receipts };
}

export type WorkspaceExport = Awaited<ReturnType<typeof exportWorkspace>>;

/** One table as CSV rows. Nested values become JSON; cells that start like a formula are defused for spreadsheets. */
export function tableRows(data: WorkspaceExport, table: ExportTable): Record<string, unknown>[] {
  if (table === "order_items") return data.orders.flatMap((o) => o.items.map((i) => ({ orderId: o.id, ...i })));
  if (table === "orders") return data.orders.map(({ items, ...o }) => ({ ...o, itemCount: items.length }));
  return data[table] as Record<string, unknown>[];
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    let s = v == null ? "" : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n") + "\r\n";
}
