import { db } from "@/db";
import { sql } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner", "service"]);
  const rows = await db.execute(sql`
    select e.id, e.thread_id as "threadId", e.category, e.priority, e.reason, e.summary, e.created_at as "createdAt",
      th.channel, c.display_name as "customerName", th.last_preview as "lastPreview",
      (select m.text from messages m where m.thread_id = th.id and m.direction = 'in' order by m.created_at desc limit 1) as "lastCustomerMessage"
    from escalations e join threads th on th.id = e.thread_id join customers c on c.id = th.customer_id
    where e.workspace_id = ${s.workspaceId} and e.status = 'open' and e.is_demo = false
    order by case e.priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end, e.created_at desc`);
  return ok({ escalations: rows });
});
