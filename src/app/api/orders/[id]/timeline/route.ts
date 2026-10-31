import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { orderTimeline } from "@/lib/order-timeline";

export const dynamic = "force-dynamic";

/** What the AI did and didn't do on one order. Owner and service staff, for their own business only. */
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Order not found.");
  const r = await orderTimeline(s.workspaceId, id);
  if (!r) throw new HttpError(404, "Order not found.");
  return ok(r);
});
