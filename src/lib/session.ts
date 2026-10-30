// Edge-safe session primitives (used by proxy.ts and server code).
import { SignJWT, jwtVerify } from "jose";

export type Role = "owner" | "service";
export type Session = { userId: string; workspaceId: string; role: Role; name: string; email: string; /** users.session_version when signed: a newer version in the database revokes this session. */ sv?: number; setupPending?: boolean };

export const SESSION_COOKIE = "jawab_session";
const enc = (s: string) => new TextEncoder().encode(s);

/**
 * A secret from the environment. The fallback only lets `next build`, tests and local dev run without one:
 * it is public (this repo is), so a production server must refuse to run on it rather than accept forged sessions.
 */
export function requiredSecret(name: "AUTH_SECRET" | "APP_ENCRYPTION_KEY", minLength: number, fallback: string): string {
  const v = process.env[name];
  if (v && v.length >= minLength) return v;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error(`${name} must be set${minLength > 1 ? ` (${minLength}+ characters)` : ""} on this server.`);
  }
  return fallback;
}

export const authSecret = () => requiredSecret("AUTH_SECRET", 32, "default-fallback-secret-for-build-and-demo-32chars");

function secret() {
  return enc(authSecret());
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ ws: s.workspaceId, role: s.role, name: s.name, email: s.email, sv: s.sv ?? 0, setup: Boolean(s.setupPending) })
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
      sv: Number(payload.sv ?? 0),
      setupPending: payload.setup === true,
    };
  } catch {
    return null;
  }
}

export const ROLE_HOME: Record<Role, string> = { owner: "/app/today", service: "/app/orders" };

/** Which app sections each role may open. */
export const ROLE_SECTIONS: Record<Role, string[]> = {
  owner: ["setup", "today", "orders", "calendar", "inbox", "needs-you", "activity", "knowledge", "settings", "account"],
  service: ["orders", "calendar", "inbox", "needs-you", "activity", "knowledge", "account"],
};

export function canOpen(role: Role, pathname: string): boolean {
  const section = pathname.split("/")[2] ?? "";
  if (!section) return true;
  return ROLE_SECTIONS[role].includes(section);
}

/** What an owner can open before finishing setup: Account for sign-out, and the pages the wizard's steps link out to. */
export function canOpenDuringSetup(pathname: string): boolean {
  return ["setup", "knowledge", "settings", "calendar", "account"].includes(pathname.split("/")[2] ?? "");
}
