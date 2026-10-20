import { db } from "@/db";
import { sql } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner", "hr"]);
  const rows = await db.execute(sql`
    select c.id, c.full_name as "fullName", c.source, c.source_ref as "sourceRef", c.district, c.total_years as "totalYears", c.availability,
      c.consent, c.consent_at as "consentAt", c.parsed_at as "parsedAt", c.parsed_by as "parsedBy", c.created_at as "createdAt",
      c.telegram_chat_id is not null as "botReachable", c.profile->>'headline' as headline,
      exists(select 1 from candidate_documents d where d.candidate_id = c.id) as "hasDocument"
    from candidates c where c.workspace_id = ${s.workspaceId} order by c.created_at desc`);
  return ok({ candidates: rows });
});
