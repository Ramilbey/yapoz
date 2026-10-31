import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { loadApprovedOrderEvent, NotApproved } from "@/lib/orbyte";

export const dynamic = "force-dynamic";

/** Preview of the approved-order event in our assumed format. Only reads: nothing is sent, and other businesses' orders 404. */
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Order not found.");
  const event = await loadApprovedOrderEvent(s.workspaceId, id).catch((e) => {
    throw e instanceof NotApproved ? new HttpError(409, e.message) : e;
  });
  if (!event) throw new HttpError(404, "Order not found.");
  return ok({ event });
});
