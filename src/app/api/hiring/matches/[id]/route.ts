import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { draftInvite, draftRejection } from "@/hiring/outreach";

export const maxDuration = 60;

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("invite"), mode: z.enum(["onsite", "video"]).default("onsite") }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("stage"), stage: z.enum(["sourced", "shortlisted", "invited", "scheduled", "interviewed", "hired", "rejected"]) }),
]);

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "hr"]);
  const { id } = await ctx.params;
  const a = await body(req, Action);
  const [m] = await db.select().from(t.matches).where(and(eq(t.matches.id, id), eq(t.matches.workspaceId, s.workspaceId)));
  if (!m) throw new HttpError(404, "Not found");
  if (a.action === "invite") return ok({ outreach: await draftInvite(s.workspaceId, id, a.mode) });
  if (a.action === "reject") return ok({ outreach: await draftRejection(s.workspaceId, id) });
  // Moving to "rejected" never messages anyone by itself: it drafts a rejection for approval.
  if (a.stage === "rejected") return ok({ outreach: await draftRejection(s.workspaceId, id) });
  await db.update(t.matches).set({ stage: a.stage, updatedAt: new Date() }).where(eq(t.matches.id, id));
  return ok({ ok: true });
});
