import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { audit } from "@/lib/audit";

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ token: string }> }) => {
  const s = await apiSession(["owner"]);
  const { token } = await ctx.params;
  const [inv] = await db.delete(t.invites).where(and(eq(t.invites.token, token), eq(t.invites.workspaceId, s.workspaceId))).returning({ email: t.invites.email });
  if (inv) await audit(s, "team.invite_revoked", { email: inv.email });
  return ok({ ok: true });
});
