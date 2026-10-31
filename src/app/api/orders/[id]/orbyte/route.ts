import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { loadOrderEvents } from "@/lib/orbyte";

export const dynamic = "force-dynamic";

/** Preview of an order's events so far in our assumed format. Only reads: nothing is sent, and other businesses' orders 404. */
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Order not found.");
  const events = await loadOrderEvents(s.workspaceId, id);
  if (!events) throw new HttpError(404, "Order not found.");
  return ok({ events });
});
