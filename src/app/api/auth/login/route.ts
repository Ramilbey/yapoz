import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { handle } from "@/lib/auth";
import { body, clientIp, ok } from "@/lib/api";
import { signSession, SESSION_COOKIE, ROLE_HOME } from "@/lib/session";
import { hit } from "@/lib/ratelimit";

const Body = z.object({ workspaceId: z.string().trim().min(1).max(32), email: z.string().trim().min(3).max(120), password: z.string().min(1).max(200) });

export const POST = handle(async (req: Request) => {
  const b = await body(req, Body);
  const limited = await hit(`login:${clientIp(req)}:m`, "minute", 12);
  if (!limited.ok) return ok({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  const wsId = b.workspaceId.toUpperCase();
  const [user] = await db.select().from(t.users).where(and(eq(t.users.workspaceId, wsId), eq(sql`lower(${t.users.email})`, b.email.toLowerCase())));
  const valid = user ? await bcrypt.compare(b.password, user.passwordHash) : await bcrypt.compare(b.password, "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  if (!user || !valid) return ok({ error: "That workspace, email and password don't match." }, { status: 401 });
  const token = await signSession({ userId: user.id, workspaceId: user.workspaceId, role: user.role, name: user.name, email: user.email });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return ok({ ok: true, home: ROLE_HOME[user.role], role: user.role });
});
