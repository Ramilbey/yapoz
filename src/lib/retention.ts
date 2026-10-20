import { db, t } from "@/db";
import { sql } from "drizzle-orm";

/** Delete candidates (and their documents, matches, outreach) older than each workspace's retention setting. */
export async function purgeExpiredCandidates() {
  const res = await db.execute<{ id: string }>(sql`
    delete from candidates c using workspaces w
    where c.workspace_id = w.id
      and c.created_at < now() - make_interval(days => coalesce((w.settings->>'resumeRetentionDays')::int, 180))
    returning c.id`);
  return (res as unknown as { id: string }[]).length;
}
void t;
