import { db } from "@/db";
import { sql } from "drizzle-orm";
import { addLocalDays, localDate, zoned } from "@/lib/time";

type Row = Record<string, unknown>;

export async function ownerToday(workspaceId: string, timeZone: string, includeDemo: boolean) {
  const today = localDate(new Date(), timeZone);
  // Raw SQL params must be strings: the driver doesn't serialize Date objects here.
  const dayStartD = zoned(today, "00:00", timeZone);
  const dayStart = dayStartD.toISOString();
  const weekStart = zoned(addLocalDays(today, -6), "00:00", timeZone).toISOString();
  const yesterdayStart = new Date(dayStartD.getTime() - 86400000).toISOString();
  const demo = includeDemo ? sql`true` : sql`is_demo = false`;
  const q = async <T extends Row>(s: ReturnType<typeof sql>) => (await db.execute<T>(s)) as unknown as T[];

  const [kpi] = await q<{ handled: number; resolved: number; escalated: number; booked: number; median_ms: number | null; demo_share: number | null }>(sql`
    select count(*)::int as handled,
      count(*) filter (where outcome in ('auto_resolved','booked','ordered','declined'))::int as resolved,
      count(*) filter (where outcome = 'escalated')::int as escalated,
      count(*) filter (where outcome = 'booked')::int as booked,
      percentile_cont(0.5) within group (order by first_response_ms)::int as median_ms,
      avg(case when is_demo then 1 else 0 end)::float as demo_share
    from agent_runs where workspace_id = ${workspaceId} and created_at >= ${dayStart} and ${demo}`);

  const [yesterday] = await q<{ handled: number; resolved: number; median_ms: number | null }>(sql`
    select count(*)::int as handled, count(*) filter (where outcome in ('auto_resolved','booked','ordered','declined'))::int as resolved,
      percentile_cont(0.5) within group (order by first_response_ms)::int as median_ms
    from agent_runs where workspace_id = ${workspaceId} and created_at >= ${yesterdayStart} and created_at < ${dayStart} and ${demo}`);

  const [bookings] = await q<{ n: number }>(sql`
    select count(*)::int as n from bookings where workspace_id = ${workspaceId} and created_at >= ${dayStart} and channel is not null and ${demo}`);

  const [openEsc] = await q<{ n: number; urgent: number }>(sql`
    select count(*)::int as n, count(*) filter (where priority in ('high','urgent'))::int as urgent
    from escalations where workspace_id = ${workspaceId} and status = 'open' and is_demo = false`);

  const topics = await q<{ topic: string; n: number; resolved: number }>(sql`
    select coalesce(topic, 'other') as topic, count(*)::int as n, count(*) filter (where outcome in ('auto_resolved','booked','ordered','declined'))::int as resolved
    from agent_runs where workspace_id = ${workspaceId} and created_at >= ${weekStart} and ${demo}
    group by 1 order by 2 desc limit 10`);

  const langs = await q<{ language: string; n: number }>(sql`
    select coalesce(split_part(language, '-', 1), 'unknown') as language, count(*)::int as n
    from agent_runs where workspace_id = ${workspaceId} and created_at >= ${weekStart} and ${demo}
    group by 1 order by 2 desc`);

  const channels = await q<{ channel: string; n: number }>(sql`
    select channel::text, count(*)::int as n from agent_runs where workspace_id = ${workspaceId} and created_at >= ${weekStart} and ${demo} group by 1 order by 2 desc`);

  const sentiment = await q<{ day: string; positive: number; neutral: number; negative: number; total: number }>(sql`
    select to_char(created_at at time zone ${timeZone}, 'YYYY-MM-DD') as day,
      count(*) filter (where sentiment = 'positive')::int as positive,
      count(*) filter (where sentiment = 'neutral' or sentiment is null)::int as neutral,
      count(*) filter (where sentiment = 'negative')::int as negative,
      count(*)::int as total
    from agent_runs where workspace_id = ${workspaceId} and created_at >= ${weekStart} and ${demo}
    group by 1 order by 1`);

  const hourly = await q<{ hour: number; n: number }>(sql`
    select extract(hour from created_at at time zone ${timeZone})::int as hour, count(*)::int as n
    from agent_runs where workspace_id = ${workspaceId} and created_at >= ${dayStart} and ${demo} group by 1 order by 1`);

  const gaps = await q<{ id: string; key: string; question: string; count: number; last_asked_at: string; is_demo: boolean }>(sql`
    select id, key, question, count, last_asked_at, is_demo from knowledge_gaps
    where workspace_id = ${workspaceId} and status = 'open' and last_asked_at >= ${weekStart} and ${includeDemo ? sql`true` : sql`is_demo = false`}
    order by count desc, last_asked_at desc limit 8`);

  const [hiring] = await q<{ open_roles: number; candidates: number; shortlisted: number; invited: number; scheduled: number; approvals: number; next_interview: string | null }>(sql`
    select
      (select count(*)::int from requisitions where workspace_id = ${workspaceId} and status = 'open') as open_roles,
      (select count(*)::int from candidates where workspace_id = ${workspaceId}) as candidates,
      (select count(*)::int from matches where workspace_id = ${workspaceId} and stage = 'shortlisted') as shortlisted,
      (select count(*)::int from matches where workspace_id = ${workspaceId} and stage = 'invited') as invited,
      (select count(*)::int from interviews where workspace_id = ${workspaceId} and status = 'scheduled' and starts_at > now()) as scheduled,
      (select count(*)::int from outreach where workspace_id = ${workspaceId} and status = 'draft') as approvals,
      (select min(starts_at)::text from interviews where workspace_id = ${workspaceId} and status = 'scheduled' and starts_at > now()) as next_interview`);

  const days = Array.from({ length: 7 }, (_, i) => addLocalDays(today, i - 6));
  return {
    today,
    kpi: {
      handled: kpi.handled,
      autoResolvedPct: kpi.handled ? Math.round((kpi.resolved / kpi.handled) * 100) : null,
      escalated: kpi.escalated,
      medianFirstResponseMs: kpi.median_ms,
      bookingsCreated: bookings.n,
      openEscalations: openEsc.n,
      urgentEscalations: openEsc.urgent,
      demoShare: kpi.demo_share ?? 0,
      yesterday: {
        handled: yesterday.handled,
        autoResolvedPct: yesterday.handled ? Math.round((yesterday.resolved / yesterday.handled) * 100) : null,
        medianFirstResponseMs: yesterday.median_ms,
      },
    },
    topics,
    langs,
    channels,
    sentiment: days.map((d) => sentiment.find((s) => s.day === d) ?? { day: d, positive: 0, neutral: 0, negative: 0, total: 0 }),
    hourly: Array.from({ length: 24 }, (_, h) => hourly.find((x) => x.hour === h)?.n ?? 0),
    gaps,
    hiring,
  };
}
