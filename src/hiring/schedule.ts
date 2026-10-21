import { db, t } from "@/db";
import { and, eq, gte, lt, inArray } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { googleBusy, googleCreateEvent } from "./google";
import { sendToCandidate } from "./send";
import { addLocalDays, localDate, localWeekday, zoned, minutesOf, timeOf, human } from "@/lib/time";
import type { SlotOffer } from "@/db/schema";

type Ws = typeof t.workspaces.$inferSelect;

async function busyBlocks(ws: Ws, from: Date, to: Date) {
  const local = await db
    .select({ start: t.calendarEvents.startsAt, end: t.calendarEvents.endsAt })
    .from(t.calendarEvents)
    .where(and(eq(t.calendarEvents.workspaceId, ws.id), lt(t.calendarEvents.startsAt, to), gte(t.calendarEvents.endsAt, from)));
  const iv = await db
    .select({ start: t.interviews.startsAt, end: t.interviews.endsAt })
    .from(t.interviews)
    .where(and(eq(t.interviews.workspaceId, ws.id), inArray(t.interviews.status, ["scheduled", "offered"]), lt(t.interviews.startsAt, to), gte(t.interviews.endsAt, from)));
  // Slots already offered in invites that haven't been answered stay held.
  const offered = await db.select({ slots: t.outreach.slots }).from(t.outreach).where(and(eq(t.outreach.workspaceId, ws.id), eq(t.outreach.kind, "invite"), inArray(t.outreach.status, ["draft", "approved", "sent"])));
  const held = offered.flatMap((o) => o.slots.map((s) => ({ start: new Date(s.start), end: new Date(s.end) })));
  let google: { start: Date; end: Date }[] = [];
  try {
    google = (await googleBusy(ws.id, from, to)) ?? [];
  } catch (e) {
    console.error("[calendar] Google free/busy failed, using built-in calendar only", e);
  }
  return { blocks: [...local, ...iv, ...held, ...google], source: google.length ? "google+builtin" : "builtin" };
}

/** Three interview slots on different days, inside HR's working hours, avoiding busy time. */
export async function proposeSlots(ws: Ws, count = 3, now = new Date()): Promise<SlotOffer[]> {
  const len = ws.settings.hr.interviewMinutes;
  const startDay = addLocalDays(localDate(now, ws.timezone), 1);
  const from = zoned(startDay, "00:00", ws.timezone);
  const to = zoned(addLocalDays(startDay, 14), "00:00", ws.timezone);
  const { blocks } = await busyBlocks(ws, from, to);
  const preferred = ["11:00", "14:30", "16:00", "10:00", "15:30", "17:00", "12:00"];
  const out: SlotOffer[] = [];
  for (let d = 0; d < 14 && out.length < count; d++) {
    const day = addLocalDays(startDay, d);
    const wd = localWeekday(zoned(day, "12:00", ws.timezone), ws.timezone);
    if (wd === "sat" || wd === "sun") continue;
    for (const time of preferred) {
      if (minutesOf(time) < minutesOf(ws.settings.hr.workdayStart) || minutesOf(time) + len > minutesOf(ws.settings.hr.workdayEnd)) continue;
      const start = zoned(day, time, ws.timezone);
      const end = new Date(start.getTime() + len * 60_000);
      const clash = blocks.some((b) => b.start < end && b.end > start);
      if (!clash) {
        out.push({ start: start.toISOString(), end: end.toISOString() });
        break;
      }
    }
  }
  return out;
}

export function slotLabel(ws: Ws, s: SlotOffer) {
  return human(new Date(s.start), ws.timezone);
}

/** Candidate tapped a slot button. Creates the interview and calendar event, confirms both sides. */
export async function pickSlot(workspaceId: string, outreachId: string, idx: number, fromChatId: string): Promise<{ ok: boolean; toast: string }> {
  const [o] = await db.select().from(t.outreach).where(and(eq(t.outreach.id, outreachId), eq(t.outreach.workspaceId, workspaceId)));
  if (!o || o.kind !== "invite") return { ok: false, toast: "This invite is no longer valid." };
  const [cand] = await db.select().from(t.candidates).where(eq(t.candidates.id, o.candidateId));
  if (!cand || (cand.telegramChatId && cand.telegramChatId !== fromChatId && o.channel === "telegram")) return { ok: false, toast: "This invite was sent to someone else." };
  const [existing] = await db.select().from(t.interviews).where(and(eq(t.interviews.outreachId, o.id), eq(t.interviews.status, "scheduled")));
  if (existing) return { ok: true, toast: "You're already booked in. See you then!" };
  const slot = o.slots[idx];
  if (!slot) return { ok: false, toast: "That time isn't available." };
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  const [match] = await db.select().from(t.matches).where(eq(t.matches.id, o.matchId));
  const [req] = await db.select().from(t.requisitions).where(eq(t.requisitions.id, match.requisitionId));
  const start = new Date(slot.start);
  const end = new Date(slot.end);

  // Re-check the slot against everything except this invite's own hold.
  const clashes = await db
    .select({ id: t.interviews.id })
    .from(t.interviews)
    .where(and(eq(t.interviews.workspaceId, workspaceId), eq(t.interviews.status, "scheduled"), lt(t.interviews.startsAt, end), gte(t.interviews.endsAt, start)));
  if (clashes.length) return { ok: false, toast: "Sorry, that time was just taken. Please pick another." };

  const video = o.interviewMode === "video";
  let meetUrl: string | null = null;
  let provider = "builtin";
  let externalEventId: string | null = null;
  try {
    const g = await googleCreateEvent(workspaceId, {
      summary: `Interview: ${cand.fullName} (${req.title})`,
      description: `Interview booked by Jawab.\nCandidate: ${cand.fullName}\nRole: ${req.title}\nSource: ${cand.sourceRef ?? cand.source}`,
      start, end, timeZone: ws.timezone, video, location: video ? null : ws.settings.hr.location || ws.settings.business?.address || null, attendeeEmail: cand.email,
    });
    if (g) {
      provider = "google";
      externalEventId = g.id;
      meetUrl = g.meetUrl;
    }
  } catch (e) {
    console.error("[calendar] Google event failed, falling back to built-in", e);
  }
  if (video && !meetUrl) meetUrl = `https://meet.jit.si/jawab-${workspaceId.toLowerCase()}-${randomBytes(6).toString("hex")}`;

  const [iv] = await db
    .insert(t.interviews)
    .values({
      workspaceId, matchId: match.id, candidateId: cand.id, requisitionId: req.id, outreachId: o.id, startsAt: start, endsAt: end,
      mode: video ? "video" : "onsite", location: video ? null : ws.settings.hr.location || ws.settings.business?.address || null, meetUrl, provider, externalEventId, status: "scheduled",
    })
    .returning();
  await db.insert(t.calendarEvents).values({ workspaceId, title: `Interview: ${cand.fullName}`, kind: "interview", interviewId: iv.id, startsAt: start, endsAt: end });
  await db.update(t.matches).set({ stage: "scheduled", updatedAt: new Date() }).where(eq(t.matches.id, match.id));
  await db.insert(t.events).values({ workspaceId, type: "interview.scheduled", props: { interviewId: iv.id, candidate: cand.fullName, provider } });

  const when = human(start, ws.timezone);
  const confirm = video
    ? `Confirmed: ${when} (${ws.settings.hr.interviewMinutes} min video call).\nJoin here: ${meetUrl}`
    : `Confirmed: ${when}, ${ws.settings.hr.interviewMinutes} min at ${ws.settings.hr.location || ws.settings.business?.address || ws.name}. See you there!`;
  try {
    await sendToCandidate(cand, o.channel, confirm);
  } catch (e) {
    console.error("[schedule] confirmation failed", e);
  }
  const hrChat = process.env.HR_TELEGRAM_CHAT_ID;
  if (hrChat) {
    const { bot } = await import("@/channels/telegram/api");
    await (await bot()).sendMessage(Number(hrChat), `${cand.fullName} booked an interview for ${req.title}: ${when}${meetUrl ? `\n${meetUrl}` : ""}`).catch(() => {});
  }
  return { ok: true, toast: `Booked: ${when}` };
}

export { timeOf };
