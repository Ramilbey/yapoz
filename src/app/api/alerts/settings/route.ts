import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { alertPrefs } from "@/lib/alert-prefs";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { hit } from "@/lib/ratelimit";
import { email } from "@/lib/validation";

export const dynamic = "force-dynamic";

const ADDRESS_CHANGES_PER_HOUR = 5;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 22:00.");
const Body = z.object({
  sound: z.boolean(), volume: z.number().min(0.1).max(1), orders: z.boolean(), needsYou: z.boolean(), email: z.boolean(),
  emailTo: email.nullable(),
  quietHours: z.object({ start: time, end: time }).nullable(),
}).partial();

const own = (s: { userId: string; workspaceId: string }) => and(eq(t.users.id, s.userId), eq(t.users.workspaceId, s.workspaceId));
const pushKey = () => (env.push.publicKey && env.push.privateKey ? env.push.publicKey : null);

/** Alerts carry customer details, so a new address hears about it first: a typo shows up before an order does. */
async function confirmAddress(to: string, userId: string) {
  if (!(await hit(`alert-address:${userId}`, "hour", ADDRESS_CHANGES_PER_HOUR)).ok) throw new HttpError(429, "Too many changes. Try again later.");
  const text = "This address will now get Yapoz alerts about new orders and customers waiting. If you didn't expect this, please ignore this email or tell the business that uses Yapoz.";
  try {
    await sendEmail({ to, subject: "You'll get Yapoz alerts here", text, html: `<p>${text}</p>` });
  } catch (e) {
    console.error("[alerts] address confirmation failed", e);
    throw new HttpError(502, "We couldn't email that address. Check it and try again.");
  }
}

export const GET = handle(async () => {
  const s = await apiSession();
  const [u] = await db.select({ alertPrefs: t.users.alertPrefs }).from(t.users).where(own(s));
  return ok({ prefs: alertPrefs(u?.alertPrefs, s.role), pushKey: pushKey() });
});

export const PATCH = handle(async (req: Request) => {
  const s = await apiSession();
  const b = await body(req, Body);
  const [u] = await db.select({ alertPrefs: t.users.alertPrefs }).from(t.users).where(own(s));
  if (b.emailTo && b.emailTo !== u?.alertPrefs.emailTo) await confirmAddress(b.emailTo, s.userId);
  const stored = { ...u?.alertPrefs, ...b };
  await db.update(t.users).set({ alertPrefs: stored }).where(own(s));
  return ok({ prefs: alertPrefs(stored, s.role), pushKey: pushKey() });
});
