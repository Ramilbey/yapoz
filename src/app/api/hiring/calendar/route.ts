import { db, t } from "@/db";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { addLocalDays, localDate, zoned, localWeekday } from "@/lib/time";
import { googleConfigured, googleConnected } from "@/hiring/google";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner", "hr"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const u = new URL(req.url);
  let from = u.searchParams.get("from") ?? localDate(new Date(), ws.timezone);
  // Start the week on Monday.
  for (let i = 0; i < 7 && localWeekday(zoned(from, "12:00", ws.timezone), ws.timezone) !== "mon"; i++) from = addLocalDays(from, -1);
  const start = zoned(from, "00:00", ws.timezone);
  const end = zoned(addLocalDays(from, 7), "00:00", ws.timezone);
  const events = await db.select().from(t.calendarEvents).where(and(eq(t.calendarEvents.workspaceId, s.workspaceId), gte(t.calendarEvents.startsAt, start), lt(t.calendarEvents.startsAt, end))).orderBy(asc(t.calendarEvents.startsAt));
  const interviews = await db
    .select({ i: t.interviews, name: t.candidates.fullName, role: t.requisitions.title })
    .from(t.interviews)
    .innerJoin(t.candidates, eq(t.candidates.id, t.interviews.candidateId))
    .innerJoin(t.requisitions, eq(t.requisitions.id, t.interviews.requisitionId))
    .where(and(eq(t.interviews.workspaceId, s.workspaceId), gte(t.interviews.startsAt, start), lt(t.interviews.startsAt, end)));
  const offered = await db.select({ slots: t.outreach.slots, name: t.candidates.fullName, status: t.outreach.status }).from(t.outreach).innerJoin(t.candidates, eq(t.candidates.id, t.outreach.candidateId)).where(and(eq(t.outreach.workspaceId, s.workspaceId), eq(t.outreach.kind, "invite"), eq(t.outreach.status, "sent")));
  return ok({
    from, timezone: ws.timezone, workday: { start: ws.settings.hr.workdayStart, end: ws.settings.hr.workdayEnd },
    events, interviews: interviews.map((r) => ({ ...r.i, candidateName: r.name, role: r.role })),
    holds: offered.flatMap((o) => o.slots.map((sl) => ({ ...sl, name: o.name }))).filter((h) => new Date(h.start) >= start && new Date(h.start) < end),
    google: { configured: googleConfigured(), connected: await googleConnected(s.workspaceId) },
  });
});
