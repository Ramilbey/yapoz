import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner"]);
  const { id } = await ctx.params;
  await db.delete(t.setupSources).where(and(eq(t.setupSources.id, id), eq(t.setupSources.workspaceId, s.workspaceId), eq(t.setupSources.kind, "file")));
  return ok({ ok: true });
});
