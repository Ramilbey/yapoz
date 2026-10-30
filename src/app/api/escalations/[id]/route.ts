import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { resolveCards } from "@/lib/receipts";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return ok({ ok: true });
  await resolveCards(s.workspaceId, { id }, s.userId);
  return ok({ ok: true });
});
