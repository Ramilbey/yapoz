import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { handle } from "@/lib/auth";
import { body, clientIp, ok } from "@/lib/api";
import { ROLE_HOME } from "@/lib/session";
import { hit } from "@/lib/ratelimit";
import { startSession } from "@/lib/login";
import { audit } from "@/lib/audit";

const Body = z.object({ workspaceId: z.string().trim().max(32).optional().default(""), email: z.string().trim().min(3).max(120), password: z.string().min(1).max(200) });
const DUMMY = "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";

/** Workspace ID is only needed when the same email belongs to more than one business. */
export const POST = handle(async (req: Request) => {
  const b = await body(req, Body);
  const limited = await hit(`login:${clientIp(req)}:m`, "minute", 12);
  if (!limited.ok) return ok({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  // Per account too, so guessing one person's password from many addresses is slowed down as well.
  if (!(await hit(`login:email:${b.email.toLowerCase()}`, "hour", 20)).ok) return ok({ error: "Too many attempts for this account. Try again in an hour." }, { status: 429 });
  const wsId = b.workspaceId.toUpperCase();
  const emailEq = eq(sql`lower(${t.users.email})`, b.email.toLowerCase());
  const candidates = await db.select().from(t.users).where(wsId ? and(eq(t.users.workspaceId, wsId), emailEq) : emailEq).limit(10);
  const matches: (typeof candidates)[number][] = [];
  for (const u of candidates) if (await bcrypt.compare(b.password, u.passwordHash)) matches.push(u);
  if (!candidates.length) await bcrypt.compare(b.password, DUMMY); // same timing either way
  if (matches.length > 1) return ok({ error: "This email is on more than one business. Enter the Workspace ID too.", needWorkspace: true }, { status: 409 });
  const user = matches[0];
  if (!user) {
    // Logged for the business the email belongs to, so the owner can spot someone trying passwords.
    for (const ws of new Set(candidates.map((c) => c.workspaceId))) await audit({ workspaceId: ws, userId: null }, "auth.login_failed", { email: b.email.toLowerCase(), ip: clientIp(req) });
    return ok({ error: wsId ? "That workspace, email and password don't match." : "That email and password don't match." }, { status: 401 });
  }
  await startSession(user);
  await audit({ workspaceId: user.workspaceId, userId: user.id }, "auth.login", { ip: clientIp(req) });
  const [ws] = await db.select({ settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, user.workspaceId));
  const home = user.role === "owner" && !ws?.settings.onboarding?.completedAt ? "/app/setup" : ROLE_HOME[user.role];
  return ok({ ok: true, home, role: user.role });
});
