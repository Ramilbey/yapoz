import { cookies } from "next/headers";
import { signSession, SESSION_COOKIE } from "./session";
import type { t } from "@/db";

type User = typeof t.users.$inferSelect;

export async function startSession(user: User) {
  const token = await signSession({ userId: user.id, workspaceId: user.workspaceId, role: user.role, name: user.name, email: user.email });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export const PASSWORD_RULE = "Use at least 8 characters.";
