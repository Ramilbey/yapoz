import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { approveAndSend } from "@/hiring/outreach";

export const maxDuration = 60;

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), text: z.string().trim().min(5).max(2000).optional() }),
  z.object({ action: z.literal("edit"), text: z.string().trim().min(5).max(2000) }),
  z.object({ action: z.literal("cancel") }),
]);

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "hr"]);
  const { id } = await ctx.params;
  const a = await body(req, Action);
  if (a.action === "approve") return ok(await approveAndSend(s.workspaceId, id, s.userId, a.text));
  if (a.action === "edit") {
    await db.update(t.outreach).set({ draft: a.text }).where(and(eq(t.outreach.id, id), eq(t.outreach.workspaceId, s.workspaceId), eq(t.outreach.status, "draft")));
    return ok({ ok: true });
  }
  await db.update(t.outreach).set({ status: "cancelled" }).where(and(eq(t.outreach.id, id), eq(t.outreach.workspaceId, s.workspaceId)));
  return ok({ ok: true });
});
