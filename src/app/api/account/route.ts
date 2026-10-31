import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { startSession } from "@/lib/login";
import { audit } from "@/lib/audit";
import { sql } from "drizzle-orm";
import { password } from "@/lib/validation";

const Body = z.object({
  /** Sign out on every other device: bumps the session version, then re-signs this one. */
  signOutEverywhere: z.boolean().optional(),
  name: z.string().trim().min(1).max(80).optional(),
  currentPassword: z.string().max(200).optional(),
  newPassword: password.optional(),
});

export const PATCH = handle(async (req: Request) => {
  const s = await apiSession();
  const b = await body(req, Body);
  const [u] = await db.select().from(t.users).where(eq(t.users.id, s.userId));
  if (!u) throw new HttpError(401, "Sign in again");
  const set: Partial<typeof t.users.$inferInsert> = {};
  if (b.name) set.name = b.name;
  if (b.signOutEverywhere) set.sessionVersion = sql`${t.users.sessionVersion} + 1` as unknown as number;
  if (b.newPassword) {
    if (!(await hit(`pw:${s.userId}`, "hour", 10)).ok) throw new HttpError(429, "Too many attempts. Try again later.");
    if (!b.currentPassword || !(await bcrypt.compare(b.currentPassword, u.passwordHash))) throw new HttpError(400, "Your current password isn't right.");
    set.passwordHash = await bcrypt.hash(b.newPassword, 10);
    // A new password signs out every other device that had the old one.
    set.sessionVersion = sql`${t.users.sessionVersion} + 1` as unknown as number;
  }
  if (!Object.keys(set).length) return ok({ ok: true });
  const [next] = await db.update(t.users).set(set).where(eq(t.users.id, u.id)).returning();
  // Devices signed out here shouldn't keep showing orders.
  if (b.newPassword || b.signOutEverywhere) await db.delete(t.pushSubscriptions).where(eq(t.pushSubscriptions.userId, u.id));
  await startSession(next);
  if (b.newPassword) await audit(s, "auth.password_changed");
  if (b.signOutEverywhere) await audit(s, "auth.signed_out_everywhere");
  return ok({ ok: true });
});
