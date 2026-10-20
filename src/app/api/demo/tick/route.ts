import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { demoTick } from "@/demo/replay";
import { env } from "@/lib/env";

/** Owner-only "Demo traffic": replays one seeded conversation (labeled is_demo) so charts move on stage. */
export const POST = handle(async () => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  if (!env.demoMode || !ws.settings.demoTraffic) return ok({ skipped: true });
  const r = await demoTick(ws.id, ws.timezone);
  return ok(r);
});
