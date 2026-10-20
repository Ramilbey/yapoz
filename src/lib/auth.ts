import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type Role, type Session, ROLE_HOME } from "./session";

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
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
      console.error(e);
      return Response.json({ error: e instanceof Error ? e.message : "Something went wrong" }, { status: 500 });
    }
  };
}
