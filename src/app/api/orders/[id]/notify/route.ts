import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { retryNotification } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Retry the last message about this order that didn't reach the customer. */
export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Order not found.");
  const r = await retryNotification(s.workspaceId, id, s.userId);
  if ("code" in r) throw new HttpError(r.code, r.error);
  return ok({ notified: r });
});
