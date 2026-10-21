import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { handle } from "@/lib/auth";
import { body, clientIp, ok } from "@/lib/api";
import { ROLE_HOME } from "@/lib/session";
import { hit } from "@/lib/ratelimit";
import { startSession } from "@/lib/login";

const Body = z.object({ workspaceId: z.string().trim().max(32).optional().default(""), email: z.string().trim().min(3).max(120), password: z.string().min(1).max(200) });
const DUMMY = "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";

/** Workspace ID is only needed when the same email belongs to more than one business. */
export const POST = handle(async (req: Request) => {
  const b = await body(req, Body);
  const limited = await hit(`login:${clientIp(req)}:m`, "minute", 12);
  if (!limited.ok) return ok({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  const wsId = b.workspaceId.toUpperCase();
  const emailEq = eq(sql`lower(${t.users.email})`, b.email.toLowerCase());
  const candidates = await db.select().from(t.users).where(wsId ? and(eq(t.users.workspaceId, wsId), emailEq) : emailEq).limit(10);
  const matches: (typeof candidates)[number][] = [];
  for (const u of candidates) if (await bcrypt.compare(b.password, u.passwordHash)) matches.push(u);
  if (!candidates.length) await bcrypt.compare(b.password, DUMMY); // same timing either way
  if (matches.length > 1) return ok({ error: "This email is on more than one business. Enter the Workspace ID too.", needWorkspace: true }, { status: 409 });
  const user = matches[0];
  if (!user) return ok({ error: wsId ? "That workspace, email and password don't match." : "That email and password don't match." }, { status: 401 });
  await startSession(user);
  const [ws] = await db.select({ settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, user.workspaceId));
  const home = user.role === "owner" && !ws?.settings.onboarding?.completedAt ? "/app/setup" : ROLE_HOME[user.role];
  return ok({ ok: true, home, role: user.role });
});
