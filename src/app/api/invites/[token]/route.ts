import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { handle, HttpError } from "@/lib/auth";
import { body, clientIp, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { hit } from "@/lib/ratelimit";
import { startSession } from "@/lib/login";
import { ROLE_HOME } from "@/lib/session";
import { password } from "@/lib/validation";

const Body = z.object({ name: z.string().trim().min(1).max(80), password });

export const POST = handle(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  if (!(await hit(`accept:${clientIp(req)}`, "hour", 20)).ok) throw new HttpError(429, "Too many attempts.");
  const { token } = await ctx.params;
  const b = await body(req, Body);
  const [inv] = await db.select().from(t.invites).where(and(eq(t.invites.token, token), isNull(t.invites.acceptedAt), gt(t.invites.expiresAt, new Date())));
  if (!inv) throw new HttpError(410, "This invite has expired or was already used. Ask for a new link.");
  const [exists] = await db.select({ id: t.users.id }).from(t.users).where(and(eq(t.users.workspaceId, inv.workspaceId), eq(sql`lower(${t.users.email})`, inv.email.toLowerCase())));
  if (exists) throw new HttpError(409, "You already have an account here. Sign in instead.");
  const passwordHash = await bcrypt.hash(b.password, 10);
  const user = await db.transaction(async (tx) => {
    const [u] = await tx.insert(t.users).values({ workspaceId: inv.workspaceId, email: inv.email, name: b.name, role: inv.role, passwordHash }).returning();
    await tx.update(t.invites).set({ acceptedAt: new Date() }).where(eq(t.invites.token, token));
    return u;
  });
  await audit({ workspaceId: user.workspaceId, userId: user.id }, "team.joined", { name: user.name, email: user.email, role: user.role });
  await startSession(user);
  return ok({ ok: true, home: ROLE_HOME[user.role] });
});
