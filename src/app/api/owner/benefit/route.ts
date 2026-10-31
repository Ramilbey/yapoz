import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { benefitRows, measureBenefit, outcomeRows } from "@/lib/benefit";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** The Phase 2 measures from this business's own records. Owners only. Real and demo records are measured apart, never mixed. */
export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const includeDemo = env.demoMode && Boolean(ws.settings.sample) && new URL(req.url).searchParams.get("demo") !== "0";
  const set = async (demo: boolean) => {
    const b = await measureBenefit(ws.id, { demo });
    return { demo, measured: b.orders.total + b.receipts.total > 0, rows: benefitRows(b), outcomes: outcomeRows(b) };
  };
  return ok({ sets: [await set(false), ...(includeDemo ? [await set(true)] : [])] });
});
