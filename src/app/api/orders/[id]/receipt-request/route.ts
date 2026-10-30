import { z } from "zod";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { requestReceipt } from "@/lib/orders";
import { notifyCustomer } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Body = z.object({
  reason: z.string().trim().min(3, "Say what's wrong with the receipt, in a few words.").max(300),
  kind: z.enum(["replace", "top_up"]),
  /** Only build the message the customer would get, so staff can read it before sending. */
  preview: z.boolean().optional(),
});

/** Turn the customer's receipt down and ask for another, with the reason. The chat then waits for that receipt. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Order not found.");
  const b = await body(req, Body);
  const r = await requestReceipt({ workspaceId: s.workspaceId, orderId: id, userId: s.userId, reason: b.reason, kind: b.kind, dryRun: b.preview });
  if (!r.ok) throw new HttpError(r.status, r.error);
  if (b.preview) return ok({ message: r.message, expectedMinor: r.request.expectedMinor });
  const notified = await notifyCustomer(r.order, "receipt_request", r.message, s.userId);
  return ok({ order: r.order, notified });
});
