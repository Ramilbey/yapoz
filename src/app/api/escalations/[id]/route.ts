import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return ok({ ok: true });
  const [e] = await db
    .update(t.escalations)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy: s.userId })
    .where(and(eq(t.escalations.id, id), eq(t.escalations.workspaceId, s.workspaceId), eq(t.escalations.status, "open")))
    .returning();
  if (e) {
    await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "escalation.resolved", props: { threadId: e.threadId, category: e.category, summary: e.summary, by: s.userId }, isDemo: e.isDemo });
    // Low-stock cards aren't about a chat.
    if (e.threadId) {
      const open = await db.select({ id: t.escalations.id }).from(t.escalations).where(and(eq(t.escalations.threadId, e.threadId), eq(t.escalations.status, "open")));
      if (!open.length) await db.update(t.threads).set({ status: "open" }).where(eq(t.threads.id, e.threadId));
    }
  }
  return ok({ ok: true });
});
