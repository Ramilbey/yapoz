import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { signSession, SESSION_COOKIE } from "./session";
import { db, t } from "@/db";

type User = typeof t.users.$inferSelect;

/** Returns whether this owner still has to finish setup: the token carries it so proxy.ts can hold them there. */
export async function startSession(user: User): Promise<boolean> {
  const [ws] = await db.select({ settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, user.workspaceId));
  const setupPending = user.role === "owner" && !ws?.settings.onboarding?.completedAt;
  const token = await signSession({ userId: user.id, workspaceId: user.workspaceId, role: user.role, name: user.name, email: user.email, sv: user.sessionVersion, setupPending });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return setupPending;
}
