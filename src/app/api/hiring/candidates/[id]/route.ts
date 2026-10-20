import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

/** Delete a candidate and their documents (on request, or by retention policy). */
export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "hr"]);
  const { id } = await ctx.params;
  await db.delete(t.candidates).where(and(eq(t.candidates.id, id), eq(t.candidates.workspaceId, s.workspaceId)));
  await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "candidate.deleted", props: { by: s.userId } });
  return ok({ ok: true });
});
