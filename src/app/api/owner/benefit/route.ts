import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { benefitSets } from "@/lib/benefit";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** The Phase 2 measures from this business's own records. Owners only. Customer, test and demo records are never mixed. */
export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const includeDemo = env.demoMode && Boolean(ws.settings.sample) && new URL(req.url).searchParams.get("demo") !== "0";
  return ok({ sets: await benefitSets(ws, includeDemo) });
});
