import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";

const Answer = z.object({ question: z.string().trim().min(2).max(200), answer: z.string().trim().min(2).max(2000), category: z.string().trim().max(40).default("menu") });

/** "Add answer": turns a knowledge gap into an FAQ the agent uses on the very next message. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const b = await body(req, Answer);
  const [gap] = await db.select().from(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.id, id), eq(t.knowledgeGaps.workspaceId, s.workspaceId)));
  if (!gap) throw new HttpError(404, "Gap not found");
  const [item] = await db
    .insert(t.kbItems)
    .values({ workspaceId: s.workspaceId, kind: "faq", category: b.category, slug: `faq-gap-${gap.key.replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`, title: b.question, body: b.answer, sort: 500 })
    .returning();
  await db.update(t.knowledgeGaps).set({ status: "answered", kbItemId: item.id }).where(eq(t.knowledgeGaps.id, id));
  await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "kb.gap_answered", props: { gap: gap.key, itemId: item.id } });
  return ok({ item });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  await db.update(t.knowledgeGaps).set({ status: "dismissed" }).where(and(eq(t.knowledgeGaps.id, id), eq(t.knowledgeGaps.workspaceId, s.workspaceId)));
  return ok({ ok: true });
});

/** Put a dismissed question back in the list. */
export const PATCH = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const [gap] = await db
    .update(t.knowledgeGaps)
    .set({ status: "open" })
    .where(and(eq(t.knowledgeGaps.id, id), eq(t.knowledgeGaps.workspaceId, s.workspaceId), eq(t.knowledgeGaps.status, "dismissed")))
    .returning({ id: t.knowledgeGaps.id });
  if (!gap) throw new HttpError(404, "That question isn't dismissed.");
  return ok({ ok: true });
});
