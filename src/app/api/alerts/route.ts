import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { alertPrefs, inQuietHours } from "@/lib/alert-prefs";
import { recentAlerts } from "@/lib/alerts";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { localTime } from "@/lib/time";

export const dynamic = "force-dynamic";

const MAX_LOOK_BACK_MS = 10 * 60_000;

/** The bell asks this on every change. Without `since` it only returns the server's clock, for the bell to start from. */
export const GET = handle(async (req: Request) => {
  const s = await apiSession();
  const now = new Date();
  const since = new Date(new URL(req.url).searchParams.get("since") ?? "");
  const [[u], [ws]] = await Promise.all([
    db.select({ alertPrefs: t.users.alertPrefs }).from(t.users).where(eq(t.users.id, s.userId)),
    db.select({ timezone: t.workspaces.timezone }).from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId)),
  ]);
  const prefs = alertPrefs(u?.alertPrefs, s.role);
  const from = new Date(Math.max(since.getTime() || now.getTime(), now.getTime() - MAX_LOOK_BACK_MS));
  return ok({
    now: now.toISOString(),
    sound: prefs.sound && !inQuietHours(prefs.quietHours, localTime(now, ws?.timezone ?? "UTC")),
    volume: prefs.volume,
    alerts: await recentAlerts(s.workspaceId, from, prefs),
  });
});
