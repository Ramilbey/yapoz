import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { claude, textOf } from "@/agent/claude";
import { env } from "@/lib/env";
import { proposeSlots, slotLabel } from "./schedule";
import { reachableChannel, sendToCandidate } from "./send";

type Ws = typeof t.workspaces.$inferSelect;

async function load(workspaceId: string, matchId: string) {
  const [match] = await db.select().from(t.matches).where(and(eq(t.matches.id, matchId), eq(t.matches.workspaceId, workspaceId)));
  if (!match) throw new Error("Match not found");
  const [cand] = await db.select().from(t.candidates).where(eq(t.candidates.id, match.candidateId));
  const [req] = await db.select().from(t.requisitions).where(eq(t.requisitions.id, match.requisitionId));
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  return { match, cand, req, ws };
}

function language(c: typeof t.candidates.$inferSelect) {
  return c.language || "en";
}

async function write(ws: Ws, instruction: string, fallback: string): Promise<string> {
  if (!env.hasAnthropic) return fallback;
  try {
    const res = await claude().messages.create({
      model: env.smartModel,
      max_tokens: 400,
      system: `You write short, warm, professional messages from the hiring team at ${ws.name} to job candidates on a messaging app. Plain text, no markdown, no emojis, no placeholders like [Name]. Never mention age, gender, religion, ethnicity or marital status. Max 90 words.`,
      messages: [{ role: "user", content: instruction }],
    });
    return textOf(res) || fallback;
  } catch (e) {
    console.error("[outreach] draft failed, using template", e);
    return fallback;
  }
}

export async function draftInvite(workspaceId: string, matchId: string, mode: "onsite" | "video" = "onsite") {
  const { match, cand, req, ws } = await load(workspaceId, matchId);
  const slots = await proposeSlots(ws);
  const reach = reachableChannel(cand);
  const first = cand.fullName.split(" ")[0];
  const where = mode === "video" ? "a short video call" : `our restaurant (${ws.settings.hr.location})`;
  const fallback = `Hi ${first}, thanks for your interest in the ${req.title} role at ${ws.name}. We liked your experience and would like to invite you to a ${ws.settings.hr.interviewMinutes}-minute interview at ${where}. Please pick a time below that suits you.`;
  const draft = await write(
    ws,
    `Write an interview invitation in language "${language(cand)}" to ${first} for the ${req.title} role. Interview: ${ws.settings.hr.interviewMinutes} minutes, ${mode === "video" ? "video call (link sent after they pick a time)" : `in person at ${ws.settings.hr.location}`}. Mention one specific thing from their experience: "${match.summary ?? cand.profile?.summary ?? ""}". End by asking them to pick one of the times shown as buttons below (don't list the times).`,
    fallback,
  );
  const [o] = await db
    .insert(t.outreach)
    .values({ workspaceId, matchId, candidateId: cand.id, kind: "invite", channel: reach.channel, language: language(cand), interviewMode: mode, slots, draft })
    .returning();
  return { ...o, reach, slotLabels: slots.map((s) => slotLabel(ws, s)) };
}

export async function draftRejection(workspaceId: string, matchId: string) {
  const { cand, req, ws } = await load(workspaceId, matchId);
  const reach = reachableChannel(cand);
  const first = cand.fullName.split(" ")[0];
  const fallback = `Hi ${first}, thank you for applying for the ${req.title} role at ${ws.name}. We've decided to move forward with other candidates this time. We appreciate your interest and wish you all the best.`;
  const draft = await write(ws, `Write a kind, brief rejection in language "${language(cand)}" to ${first} who applied for ${req.title}. Thank them, no reasons, no false promises.`, fallback);
  const [o] = await db.insert(t.outreach).values({ workspaceId, matchId, candidateId: cand.id, kind: "rejection", channel: reach.channel, language: language(cand), draft }).returning();
  return { ...o, reach };
}

/** The human "Approve": nothing reaches a candidate before this runs. */
export async function approveAndSend(workspaceId: string, outreachId: string, approverId: string, finalText?: string) {
  const [o] = await db.select().from(t.outreach).where(and(eq(t.outreach.id, outreachId), eq(t.outreach.workspaceId, workspaceId)));
  if (!o) throw new Error("Outreach not found");
  if (o.status !== "draft" && o.status !== "failed") throw new Error(`Already ${o.status}`);
  const [cand] = await db.select().from(t.candidates).where(eq(t.candidates.id, o.candidateId));
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  const text = (finalText ?? o.draft).trim();
  await db.update(t.outreach).set({ status: "approved", approverId, approvedAt: new Date(), finalText: text }).where(eq(t.outreach.id, o.id));
  // Re-validate the offered times at send time.
  let slots = o.slots;
  if (o.kind === "invite") {
    const fresh = await proposeSlots(ws);
    if (!slots.length || slots.some((s) => new Date(s.start) < new Date())) slots = fresh;
  }
  const buttons = o.kind === "invite" ? slots.map((s, i) => [{ text: slotLabel(ws, s), data: `slot:${o.id}:${i}` }]) : undefined;
  const channel = reachableChannel(cand).channel;
  try {
    await sendToCandidate(cand, channel, text, buttons);
    await db.update(t.outreach).set({ status: "sent", sentAt: new Date(), slots, channel, error: null }).where(eq(t.outreach.id, o.id));
    await db.update(t.matches).set({ stage: o.kind === "invite" ? "invited" : "rejected", updatedAt: new Date() }).where(eq(t.matches.id, o.matchId));
    await db.insert(t.events).values({ workspaceId, type: `outreach.sent`, props: { kind: o.kind, channel, candidateId: cand.id } });
    return { ok: true as const, channel };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await db.update(t.outreach).set({ status: "failed", error: err.slice(0, 500), slots }).where(eq(t.outreach.id, o.id));
    return { ok: false as const, error: err };
  }
}
