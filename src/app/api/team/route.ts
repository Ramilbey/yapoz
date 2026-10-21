import { db, t } from "@/db";
import { and, eq, gt, isNull, asc } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner"]);
  const members = await db.select({ id: t.users.id, name: t.users.name, email: t.users.email, role: t.users.role, createdAt: t.users.createdAt }).from(t.users).where(eq(t.users.workspaceId, s.workspaceId)).orderBy(asc(t.users.createdAt));
  const invites = await db
    .select()
    .from(t.invites)
    .where(and(eq(t.invites.workspaceId, s.workspaceId), isNull(t.invites.acceptedAt), gt(t.invites.expiresAt, new Date())))
    .orderBy(asc(t.invites.createdAt));
  return ok({
    me: s.userId,
    members,
    invites: invites.map((i) => ({ token: i.token, email: i.email, role: i.role, expiresAt: i.expiresAt, url: `${env.appUrl}/invite/${i.token}` })),
  });
});
