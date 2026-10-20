import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const [e] = await db
    .update(t.escalations)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy: s.userId })
    .where(and(eq(t.escalations.id, id), eq(t.escalations.workspaceId, s.workspaceId)))
    .returning();
  if (e) {
    const open = await db.select({ id: t.escalations.id }).from(t.escalations).where(and(eq(t.escalations.threadId, e.threadId), eq(t.escalations.status, "open")));
    if (!open.length) await db.update(t.threads).set({ status: "open" }).where(eq(t.threads.id, e.threadId));
  }
  return ok({ ok: true });
});
