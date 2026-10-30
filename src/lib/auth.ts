import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { SESSION_COOKIE, verifySession, type Role, type Session, ROLE_HOME } from "./session";

/**
 * The signed cookie, checked against the database: a removed team member, a changed role, a changed password or
 * "sign out everywhere" takes effect on the next request instead of when the 7-day cookie runs out.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const s = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!s || !/^[0-9a-f-]{36}$/.test(s.userId)) return null;
  const [u] = await db
    .select({ role: t.users.role, name: t.users.name, email: t.users.email, sv: t.users.sessionVersion })
    .from(t.users)
    .where(and(eq(t.users.id, s.userId), eq(t.users.workspaceId, s.workspaceId)));
  if (!u || u.sv !== (s.sv ?? 0)) return null;
  return { ...s, role: u.role, name: u.name, email: u.email };
}

/** For server components / actions: redirect when signed out or wrong role. */
export async function requireSession(roles?: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (roles && !roles.includes(s.role)) redirect(ROLE_HOME[s.role]);
  return s;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** For route handlers: throws HttpError(401/403). */
export async function apiSession(roles?: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Sign in required");
  if (roles && !roles.includes(s.role)) throw new HttpError(403, "Your role can't do that");
  return s;
}

export function handle<T extends unknown[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      // Internal errors (SQL, provider responses) stay in the server log: the browser only gets a reference to quote.
      const ref = Math.random().toString(36).slice(2, 8);
      console.error(`[api error ${ref}]`, e);
      return Response.json({ error: `Something went wrong on our side (ref ${ref}). Try again, and if it keeps happening, share the ref.` }, { status: 500 });
    }
  };
}
