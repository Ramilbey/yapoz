import { db } from "@/db";
import { sql } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession();
  const [r] = (await db.execute(sql`
    select
      (select count(*)::int from escalations where workspace_id = ${s.workspaceId} and status = 'open' and is_demo = false) as needs,
      (select count(distinct thread_id)::int from messages where workspace_id = ${s.workspaceId} and status = 'pending_approval') as drafts,
      (select count(*)::int from outreach where workspace_id = ${s.workspaceId} and status = 'draft') as approvals,
      (select count(*)::int from orders where workspace_id = ${s.workspaceId} and status = 'pending') as orders`)) as unknown as { needs: number; drafts: number; approvals: number; orders: number }[];
  return ok(r);
});
