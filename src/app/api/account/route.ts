import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { startSession } from "@/lib/login";

const Body = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(8, "Use at least 8 characters").max(200).optional(),
});

export const PATCH = handle(async (req: Request) => {
  const s = await apiSession();
  const b = await body(req, Body);
  const [u] = await db.select().from(t.users).where(eq(t.users.id, s.userId));
  if (!u) throw new HttpError(401, "Sign in again");
  const set: Partial<typeof t.users.$inferInsert> = {};
  if (b.name) set.name = b.name;
  if (b.newPassword) {
    if (!(await hit(`pw:${s.userId}`, "hour", 10)).ok) throw new HttpError(429, "Too many attempts. Try again later.");
    if (!b.currentPassword || !(await bcrypt.compare(b.currentPassword, u.passwordHash))) throw new HttpError(400, "Your current password isn't right.");
    set.passwordHash = await bcrypt.hash(b.newPassword, 10);
  }
  if (!Object.keys(set).length) return ok({ ok: true });
  const [next] = await db.update(t.users).set(set).where(eq(t.users.id, u.id)).returning();
  await startSession(next);
  return ok({ ok: true });
});
