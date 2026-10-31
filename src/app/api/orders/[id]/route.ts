import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { editOrder, messageFor, transitionOrder } from "@/lib/orders";
import { REASON_CODES } from "@/lib/order-reasons";
import { notifyCustomer } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Patch = z.object({ action: z.enum(["confirm", "ready", "complete", "reject", "cancel", "paid", "unpaid", "keep_reserved"]), reason: z.string().trim().max(200).optional(), reasonCode: z.enum(REASON_CODES).optional() });
const Edit = z.object({
  lines: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(0).max(50) })).max(20).optional(),
  notes: z.string().max(500).nullable().optional(),
  wanted: z.string().max(120).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
});

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
  const r = await transitionOrder({ workspaceId: s.workspaceId, orderId: id, action: b.action, userId: s.userId, reason: b.reason, reasonCode: b.reasonCode });
  if (!r.ok) throw new HttpError(r.status, r.error);
  let notified = null;
  if (r.notify) {
    const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
    notified = await notifyCustomer(r.order, r.notify, await messageFor(ws, r.notify, r.order, r.items), s.userId);
  }
  return ok({ order: { ...r.order, items: r.items }, notified });
});

/** The owner corrects an order waiting for them (quantities, notes, time wanted, address) before deciding. */
export const PUT = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Order not found.");
  const r = await editOrder({ workspaceId: s.workspaceId, orderId: id, userId: s.userId, edit: await body(req, Edit) });
  if (!r.ok) throw new HttpError(r.status, r.error);
  return ok({ order: { ...r.order, items: r.items } });
});
