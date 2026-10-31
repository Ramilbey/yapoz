// First-time email verification: a 6-digit code, and a short-lived cookie saying whose code the browser is entering.
import { createHmac, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db, t } from "@/db";
import { safeEqual } from "./crypto";
import { sendEmail } from "./email";
import { hit } from "./ratelimit";
import { authSecret } from "./session";
import { log } from "./log";

type User = typeof t.users.$inferSelect;

const COOKIE = "jawab_verify";
const CODE_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const SENDS_PER_HOUR = 6;

// A separate key, so this cookie can never pass as a session token.
const cookieKey = () => new TextEncoder().encode(`${authSecret()}:email-verify`);
const hashCode = (userId: string, code: string) => createHmac("sha256", authSecret()).update(`${userId}:${code}`).digest("hex");

export async function rememberPendingUser(user: User) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("1d").sign(cookieKey());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 });
}

export async function forgetPendingUser() {
  (await cookies()).delete(COOKIE);
}

/** The not-yet-verified account this browser just signed up or signed in with. */
export async function pendingUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, cookieKey(), { algorithms: ["HS256"] });
    const [user] = await db.select().from(t.users).where(and(eq(t.users.id, String(payload.sub)), isNull(t.users.emailVerifiedAt)));
    return user ?? null;
  } catch {
    return null;
  }
}

/** Replaces any earlier code. "throttled" means one went out moments ago, or too many were sent this hour. */
export async function sendCode(user: User): Promise<"sent" | "throttled" | "failed"> {
  const [last] = await db.select({ sentAt: t.emailVerifications.sentAt }).from(t.emailVerifications).where(eq(t.emailVerifications.userId, user.id));
  if (last && Date.now() - last.sentAt.getTime() < RESEND_SECONDS * 1000) return "throttled";
  if (!(await hit(`verify-send:${user.id}`, "hour", SENDS_PER_HOUR)).ok) return "throttled";

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const row = { workspaceId: user.workspaceId, codeHash: hashCode(user.id, code), attempts: 0, expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000), sentAt: new Date() };
  await db.insert(t.emailVerifications).values({ userId: user.id, ...row }).onConflictDoUpdate({ target: t.emailVerifications.userId, set: row });
  try {
    await sendEmail({
      to: user.email,
      subject: `${code} is your Yapoz verification code`,
      text: `Your Yapoz verification code is ${code}.\n\nIt expires in ${CODE_MINUTES} minutes. If you didn't sign up for Yapoz, you can ignore this email.`,
      html: `<p>Your Yapoz verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in ${CODE_MINUTES} minutes. If you didn't sign up for Yapoz, you can ignore this email.</p>`,
    });
    return "sent";
  } catch (e) {
    log.error("verification.email_failed", { err: e });
    return "failed";
  }
}

/** The attempt is counted before comparing, so parallel guesses can't get past the limit. */
export async function confirmCode(user: User, code: string): Promise<boolean> {
  const [row] = await db
    .update(t.emailVerifications)
    .set({ attempts: sql`${t.emailVerifications.attempts} + 1` })
    .where(and(eq(t.emailVerifications.userId, user.id), gt(t.emailVerifications.expiresAt, new Date()), lt(t.emailVerifications.attempts, MAX_ATTEMPTS)))
    .returning();
  if (!row || !safeEqual(row.codeHash, hashCode(user.id, code))) return false;
  await db.transaction(async (tx) => {
    await tx.update(t.users).set({ emailVerifiedAt: new Date() }).where(eq(t.users.id, user.id));
    await tx.delete(t.emailVerifications).where(eq(t.emailVerifications.userId, user.id));
  });
  return true;
}
