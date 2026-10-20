import { db } from "@/db";
import { sql } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner", "hr"]);
  const rows = await db.execute(sql`
    select o.id, o.kind, o.channel, o.language, o.interview_mode as "interviewMode", o.slots, o.draft, o.final_text as "finalText", o.status, o.error,
      o.created_at as "createdAt", o.sent_at as "sentAt", o.approved_at as "approvedAt", u.name as "approverName",
      c.full_name as "fullName", c.telegram_username as "telegramUsername", r.title as role, m.score, m.id as "matchId"
    from outreach o join candidates c on c.id = o.candidate_id join matches m on m.id = o.match_id join requisitions r on r.id = m.requisition_id
    left join users u on u.id = o.approver_id
    where o.workspace_id = ${s.workspaceId} and o.status <> 'cancelled'
    order by case o.status when 'draft' then 0 when 'failed' then 1 else 2 end, o.created_at desc limit 100`);
  return ok({ outreach: rows });
});
