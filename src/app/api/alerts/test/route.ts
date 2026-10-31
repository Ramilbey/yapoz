import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { alertPrefs, inQuietHours } from "@/lib/alert-prefs";
import { sendTestAlert, testAlertStatus } from "@/lib/alerts";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { localTime } from "@/lib/time";

export const dynamic = "force-dynamic";

const TESTS_PER_HOUR = 10;
const Body = z.object({ channel: z.enum(["push", "email"]) });

async function me(s: { userId: string; workspaceId: string; role: "owner" | "service" }) {
  const [[u], [ws]] = await Promise.all([
    db.select({ id: t.users.id, email: t.users.email, alertPrefs: t.users.alertPrefs }).from(t.users).where(eq(t.users.id, s.userId)),
    db.select({ timezone: t.workspaces.timezone }).from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId)),
  ]);
  if (!u) throw new HttpError(404, "Account not found.");
  return { user: { ...u, prefs: alertPrefs(u.alertPrefs, s.role) }, timeZone: ws?.timezone ?? "UTC" };
}

/** What the test panel needs to say why an alert would or wouldn't arrive. Each person sees only their own. */
export const GET = handle(async () => {
  const s = await apiSession();
  const { user, timeZone } = await me(s);
  return ok({ ...(await testAlertStatus(user)), quietNow: inQuietHours(user.prefs.quietHours, localTime(new Date(), timeZone)) });
});

/** A test goes only to the person asking, and never creates an order or touches anyone else's alerts. */
export const POST = handle(async (req: Request) => {
  const s = await apiSession();
  const b = await body(req, Body);
  if (!(await hit(`alert-test:${s.userId}`, "hour", TESTS_PER_HOUR)).ok) throw new HttpError(429, "That's plenty of tests for now. Try again in an hour.");
  const { user } = await me(s);
  return ok(await sendTestAlert(user, b.channel));
});
