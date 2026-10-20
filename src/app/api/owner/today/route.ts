import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { ownerToday } from "@/server/metrics";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const u = new URL(req.url);
  const includeDemo = env.demoMode && u.searchParams.get("demo") !== "0";
  const data = await ownerToday(ws.id, ws.timezone, includeDemo);
  return ok({ ...data, includeDemo, demoMode: env.demoMode, demoTraffic: ws.settings.demoTraffic, workspace: { name: ws.name, city: ws.city, timezone: ws.timezone, currency: ws.currency } });
});
