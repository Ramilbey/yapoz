import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { messageFor, transitionOrder } from "@/lib/orders";
import { notifyCustomer } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Patch = z.object({ action: z.enum(["confirm", "ready", "complete", "reject", "cancel", "paid", "unpaid", "keep_reserved"]), reason: z.string().trim().max(200).optional() });

/**
 * Owner and service staff act on an order (no other role exists, and other businesses' orders 404). Confirming takes stock
 * off and tells the customer in their chat; ready, reject and cancel tell them too. The answer reports the order change and
 * the message separately: a failed message never undoes the status change.
 */
export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Order not found.");
  const b = await body(req, Patch);
  const r = await transitionOrder({ workspaceId: s.workspaceId, orderId: id, action: b.action, userId: s.userId, reason: b.reason });
  if (!r.ok) throw new HttpError(r.status, r.error);
  let notified = null;
  if (r.notify) {
    const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
    notified = await notifyCustomer(r.order, r.notify, await messageFor(ws, r.notify, r.order, r.items), s.userId);
  }
  return ok({ order: { ...r.order, items: r.items }, notified });
});
