// Telling the customer about a staff action on their order. The order change and the message are separate on purpose:
// a message that fails never undoes the confirmation, and each attempt is kept on the order (notifications) so the
// Orders page can say "Confirmed" and, separately, "customer told / not told, and why", with a Retry.
import { and, eq, sql } from "drizzle-orm";
import { db, t } from "@/db";
import type { OrderNotification } from "@/db/schema";
import { deliver, sendExisting } from "@/agent/pipeline";
import { sendWhatsAppTemplate } from "@/channels/whatsapp";

/** WhatsApp only accepts free text within 24 hours of the customer's last message; after that, approved templates only. */
const WHATSAPP_WINDOW_MS = 24 * 3600_000;
export type Template = { name: string; lang: string; params: string[] };

type OrderRow = typeof t.orders.$inferSelect;

export type NotifyResult = { status: OrderNotification["status"]; error?: string | null; messageId: string | null };

/**
 * Send `text` to the order's chat, record the attempt on the order, and log it. userId null: the system sent it (an order
 * expired, a reminder). `template`: on WhatsApp past the 24-hour window, send this approved template instead of the text.
 */
export async function notifyCustomer(order: OrderRow, kind: string, text: string, userId: string | null, template?: Template | null): Promise<NotifyResult> {
  const [thread] = order.threadId ? await db.select().from(t.threads).where(and(eq(t.threads.id, order.threadId), eq(t.threads.workspaceId, order.workspaceId))) : [];
  let result: NotifyResult;
  if (!thread) result = { status: "no_chat", messageId: null, error: null };
  else if (template && thread.channel === "whatsapp" && Date.now() - (thread.lastInboundAt?.getTime() ?? 0) > WHATSAPP_WINDOW_MS) {
    // The chat shows what the template said, so staff see the same text the customer got.
    const [msg] = await db.insert(t.messages).values({ workspaceId: thread.workspaceId, threadId: thread.id, direction: "out", author: userId ? "staff" : "system", authorUserId: userId, text, status: "sent", isDemo: order.isDemo }).returning();
    try {
      const id = await sendWhatsAppTemplate(thread.workspaceId, String(thread.routing.waId ?? ""), template.name, template.lang, template.params);
      await db.update(t.messages).set({ externalMessageId: id || null }).where(eq(t.messages.id, msg.id));
      await db.update(t.threads).set({ lastMessageAt: new Date(), lastPreview: text.slice(0, 160) }).where(eq(t.threads.id, thread.id));
      result = { status: "sent", messageId: msg.id, error: null };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await db.update(t.messages).set({ status: "failed", error: error.slice(0, 500) }).where(eq(t.messages.id, msg.id));
      result = { status: "failed", messageId: msg.id, error };
    }
  } else {
    const sent = await deliver(thread, text, { author: userId ? "staff" : "system", userId: userId ?? undefined, isDemo: order.isDemo });
    result = { status: sent.status === "sent" ? "sent" : "failed", messageId: sent.id, error: "error" in sent ? sent.error ?? null : null };
  }
  await record(order, { kind, messageId: result.messageId, status: result.status, error: result.error?.slice(0, 300) ?? null, at: new Date().toISOString() }, userId);
  return result;
}

async function record(order: OrderRow, n: OrderNotification, userId: string | null) {
  await db.update(t.orders).set({ notifications: sql`${t.orders.notifications} || ${JSON.stringify([n])}::jsonb` }).where(eq(t.orders.id, order.id));
  await db.insert(t.events).values({
    workspaceId: order.workspaceId,
    type: n.status === "sent" ? "order.notified" : "order.notify_failed",
    props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, kind: n.kind, status: n.status, error: n.error ?? null, by: userId },
    isDemo: order.isDemo,
  });
}

/** Retry the last failed message about this order. The same message row is resent, so the chat never shows it twice. */
export async function retryNotification(workspaceId: string, orderId: string, userId: string): Promise<NotifyResult | { error: string; code: number }> {
  const [order] = await db.select().from(t.orders).where(and(eq(t.orders.id, orderId), eq(t.orders.workspaceId, workspaceId)));
  if (!order) return { error: "Order not found.", code: 404 };
  const last = order.notifications[order.notifications.length - 1];
  if (!last?.messageId) return { error: "There's no failed message to retry on this order.", code: 409 };
  const [msg] = await db.select().from(t.messages).where(eq(t.messages.id, last.messageId));
  if (!msg || msg.status !== "failed") return { error: msg?.status === "sent" ? "That message already went through." : "There's no failed message to retry on this order.", code: 409 };
  // Claim it first: two Retry clicks at once must not send twice.
  const claimed = await db.update(t.messages).set({ status: "received" }).where(and(eq(t.messages.id, msg.id), eq(t.messages.status, "failed"))).returning({ id: t.messages.id });
  if (!claimed.length) return { error: "That message is already being retried.", code: 409 };
  const [thread] = await db.select().from(t.threads).where(eq(t.threads.id, msg.threadId));
  const sent = await sendExisting(thread, msg.id, msg.text);
  const result: NotifyResult = { status: sent.status === "sent" ? "sent" : "failed", messageId: msg.id, error: "error" in sent ? sent.error ?? null : null };
  await record(order, { kind: last.kind, messageId: msg.id, status: result.status, error: result.error?.slice(0, 300) ?? null, at: new Date().toISOString() }, userId);
  return result;
}
