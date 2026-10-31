import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { alertPrefs } from "@/lib/alert-prefs";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 22:00.");
const Body = z.object({
  sound: z.boolean(), volume: z.number().min(0.1).max(1), orders: z.boolean(), needsYou: z.boolean(), email: z.boolean(),
  quietHours: z.object({ start: time, end: time }).nullable(),
}).partial();

const pushKey = () => (env.push.publicKey && env.push.privateKey ? env.push.publicKey : null);

export const GET = handle(async () => {
  const s = await apiSession();
  const [u] = await db.select({ alertPrefs: t.users.alertPrefs }).from(t.users).where(eq(t.users.id, s.userId));
  return ok({ prefs: alertPrefs(u?.alertPrefs, s.role), pushKey: pushKey() });
});

export const PATCH = handle(async (req: Request) => {
  const s = await apiSession();
  const b = await body(req, Body);
  const [u] = await db.select({ alertPrefs: t.users.alertPrefs }).from(t.users).where(eq(t.users.id, s.userId));
  const stored = { ...u?.alertPrefs, ...b };
  await db.update(t.users).set({ alertPrefs: stored }).where(eq(t.users.id, s.userId));
  return ok({ prefs: alertPrefs(stored, s.role), pushKey: pushKey() });
});
