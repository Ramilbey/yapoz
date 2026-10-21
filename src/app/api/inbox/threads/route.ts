import { db } from "@/db";
import { sql } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner", "service"]);
  const u = new URL(req.url);
  const filter = u.searchParams.get("filter") ?? "all";
  const channel = u.searchParams.get("channel");
  const includeDemo = u.searchParams.get("demo") === "1";
  const rows = await db.execute(sql`
    select th.id, th.channel, th.status, th.ai_paused as "aiPaused", th.accent, th.is_demo as "isDemo",
      th.last_message_at as "lastMessageAt", th.last_preview as "lastPreview", th.routing,
      c.display_name as "customerName", c.username, c.language,
      (select count(*)::int from messages m where m.thread_id = th.id and m.status = 'pending_approval') as drafts,
      (select count(*)::int from escalations e where e.thread_id = th.id and e.status = 'open') as "openEscalations",
      (select json_build_object('category', e.category, 'priority', e.priority, 'summary', e.summary, 'reason', e.reason, 'createdAt', e.created_at)
         from escalations e where e.thread_id = th.id and e.status = 'open' order by e.created_at desc limit 1) as escalation,
      (select m.direction from messages m where m.thread_id = th.id order by m.created_at desc limit 1) as "lastDirection"
    from threads th join customers c on c.id = th.customer_id
    where th.workspace_id = ${s.workspaceId}
      ${includeDemo ? sql`` : sql`and th.is_demo = false`}
      ${channel ? sql`and th.channel = ${channel}::channel_type` : sql``}
      ${filter === "needs" ? sql`and th.status = 'needs_human'` : filter === "drafts" ? sql`and exists (select 1 from messages m where m.thread_id = th.id and m.status = 'pending_approval')` : filter === "takeover" ? sql`and th.ai_paused` : sql``}
    order by th.last_message_at desc
    limit 150`);
  const [counts] = (await db.execute(sql`
    select count(*) filter (where status = 'needs_human')::int as needs,
      count(*) filter (where ai_paused)::int as takeover,
      (select count(distinct thread_id)::int from messages where workspace_id = ${s.workspaceId} and status = 'pending_approval') as drafts,
      count(*)::int as all
    from threads where workspace_id = ${s.workspaceId} ${includeDemo ? sql`` : sql`and is_demo = false`}`)) as unknown as Record<string, number>[];
  const [ws] = (await db.execute(sql`select (settings->>'sample')::boolean as sample from workspaces where id = ${s.workspaceId}`)) as unknown as { sample: boolean | null }[];
  return ok({ threads: rows, counts, sample: Boolean(ws?.sample) });
});
