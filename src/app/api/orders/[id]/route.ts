import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { orderMessage, transitionOrder } from "@/lib/orders";
import { deliver } from "@/agent/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Patch = z.object({ action: z.enum(["confirm", "ready", "complete", "cancel", "paid", "unpaid"]), reason: z.string().trim().max(200).optional() });

/**
 * Staff act on an order. Confirming takes stock off and tells the customer in their chat; "ready" and "cancel" tell
 * them too. A failed message never undoes the status change: the answer says whether the customer was reached.
 */
export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const b = await body(req, Patch);
  const r = await transitionOrder({ workspaceId: s.workspaceId, orderId: id, action: b.action, userId: s.userId, reason: b.reason });
  if (!r.ok) throw new HttpError(r.status, r.error);

  let notified: "sent" | "failed" | "no_chat" | null = null;
  let notifyError: string | undefined;
  if (r.notify) {
    const [thread] = r.order.threadId ? await db.select().from(t.threads).where(and(eq(t.threads.id, r.order.threadId), eq(t.threads.workspaceId, s.workspaceId))) : [];
    if (!thread) notified = "no_chat";
    else {
      const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
      const sent = await deliver(thread, orderMessage(ws, r.notify, r.order, r.items), { author: "staff", userId: s.userId, isDemo: r.order.isDemo });
      notified = sent.status === "sent" ? "sent" : "failed";
      if (sent.status !== "sent" && "error" in sent) notifyError = sent.error;
    }
  }
  return ok({ order: { ...r.order, items: r.items }, notified, notifyError });
});
