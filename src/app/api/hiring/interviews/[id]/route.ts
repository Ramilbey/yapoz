import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";

const Patch = z.object({ status: z.enum(["done", "cancelled"]) });

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "hr"]);
  const { id } = await ctx.params;
  const b = await body(req, Patch);
  const [iv] = await db.update(t.interviews).set({ status: b.status }).where(and(eq(t.interviews.id, id), eq(t.interviews.workspaceId, s.workspaceId))).returning();
  if (iv && b.status === "done") await db.update(t.matches).set({ stage: "interviewed", updatedAt: new Date() }).where(eq(t.matches.id, iv.matchId));
  if (iv && b.status === "cancelled") await db.delete(t.calendarEvents).where(eq(t.calendarEvents.interviewId, iv.id));
  return ok({ ok: true });
});
