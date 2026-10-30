import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { ownerToday } from "@/server/metrics";
import { env } from "@/lib/env";
import { calendar } from "@/lib/appointments";
import { localDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const u = new URL(req.url);
  const sample = Boolean(ws.settings.sample);
  const includeDemo = env.demoMode && sample && u.searchParams.get("demo") !== "0";
  const data = await ownerToday(ws.id, ws.timezone, includeDemo);
  const date = localDate(new Date(), ws.timezone);
  // Today's bookings that still hold their time (cancelled, expired and lapsed-payment ones are left to the Calendar).
  const appointments = (await calendar(ws, date, date)).filter((a) => a.taken);
  return ok({
    ...data,
    appointments,
    includeDemo,
    demoMode: env.demoMode && sample,
    demoTraffic: ws.settings.demoTraffic && sample,
    live: Boolean(ws.settings.live),
    setupDone: Boolean(ws.settings.onboarding?.completedAt),
    workspace: { name: ws.name, city: ws.city, timezone: ws.timezone, currency: ws.currency },
  });
});
