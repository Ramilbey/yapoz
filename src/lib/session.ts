// Edge-safe session primitives (used by proxy.ts and server code).
import { SignJWT, jwtVerify } from "jose";

export type Role = "owner" | "service" | "hr";
export type Session = { userId: string; workspaceId: string; role: Role; name: string; email: string };

export const SESSION_COOKIE = "jawab_session";
const enc = (s: string) => new TextEncoder().encode(s);

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) return enc("default-fallback-secret-for-build-and-demo-32chars");
  return enc(s);
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ ws: s.workspaceId, role: s.role, name: s.name, email: s.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return {
      userId: String(payload.sub),
      workspaceId: String(payload.ws),
      role: payload.role as Role,
      name: String(payload.name),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export const ROLE_HOME: Record<Role, string> = { owner: "/app/today", service: "/app/inbox", hr: "/app/hiring" };

/** Which app sections each role may open. */
export const ROLE_SECTIONS: Record<Role, string[]> = {
  owner: ["setup", "today", "inbox", "needs-you", "knowledge", "bookings", "hiring", "settings", "account"],
  service: ["inbox", "needs-you", "knowledge", "bookings", "account"],
  hr: ["hiring", "account"],
};

export function canOpen(role: Role, pathname: string): boolean {
  const section = pathname.split("/")[2] ?? "";
  if (!section) return true;
  return ROLE_SECTIONS[role].includes(section);
}
