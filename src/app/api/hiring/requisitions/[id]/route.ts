import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "hr"]);
  const { id } = await ctx.params;
  const [req] = await db.select().from(t.requisitions).where(and(eq(t.requisitions.id, id), eq(t.requisitions.workspaceId, s.workspaceId)));
  if (!req) throw new HttpError(404, "Not found");
  const matches = await db.execute(sql`
    select m.id, m.score, m.evidence, m.summary, m.stage, m.distance_km as "distanceKm", m.updated_at as "updatedAt",
      c.id as "candidateId", c.full_name as "fullName", c.source, c.source_ref as "sourceRef", c.district, c.total_years as "totalYears",
      c.availability, c.profile, c.telegram_chat_id is not null as "botReachable", c.telegram_username as "telegramUsername", c.parsed_at as "parsedAt",
      exists(select 1 from candidate_documents d where d.candidate_id = c.id) as "hasDocument",
      (select json_build_object('id', o.id, 'kind', o.kind, 'status', o.status, 'channel', o.channel, 'error', o.error) from outreach o where o.match_id = m.id order by o.created_at desc limit 1) as outreach,
      (select json_build_object('id', i.id, 'startsAt', i.starts_at, 'mode', i.mode, 'meetUrl', i.meet_url, 'status', i.status, 'provider', i.provider) from interviews i where i.match_id = m.id order by i.created_at desc limit 1) as interview
    from matches m join candidates c on c.id = m.candidate_id
    where m.requisition_id = ${id}
    order by m.score desc nulls last, c.total_years desc nulls last`);
  return ok({ requisition: req, matches, aiConfigured: env.hasAnthropic, botUsername: env.telegramBotUsername || null });
});
