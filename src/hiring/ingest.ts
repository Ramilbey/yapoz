import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { enqueue } from "@/lib/jobs";

export type NewCandidate = {
  workspaceId: string;
  fullName: string;
  source: "telegram_channel" | "bot_apply" | "upload";
  sourceRef?: string | null;
  telegramChatId?: string | null;
  telegramBot?: string | null;
  telegramUsername?: string | null;
  email?: string | null;
  phone?: string | null;
  rawText: string;
  doc?: { filename: string; mime: string; bytes: Buffer; text: string };
  consent: boolean;
  roleInterest?: string | null;
  district?: string | null;
};

/** Store a candidate from a source the business controls, attach to open requisitions, and parse with Claude. */
export async function addCandidate(c: NewCandidate) {
  // Re-applying through the bot updates the existing record instead of duplicating it.
  if (c.telegramChatId) {
    const [existing] = await db.select({ id: t.candidates.id }).from(t.candidates).where(and(eq(t.candidates.workspaceId, c.workspaceId), eq(t.candidates.telegramChatId, c.telegramChatId)));
    if (existing) await db.delete(t.candidates).where(eq(t.candidates.id, existing.id));
  }
  const [cand] = await db
    .insert(t.candidates)
    .values({
      workspaceId: c.workspaceId, fullName: c.fullName, source: c.source, sourceRef: c.sourceRef ?? null,
      telegramChatId: c.telegramChatId ?? null, telegramBot: c.telegramBot ?? null, telegramUsername: c.telegramUsername ?? null, email: c.email ?? null, phone: c.phone ?? null,
      rawText: c.rawText, consent: c.consent, consentAt: c.consent ? new Date() : null, roleInterest: c.roleInterest ?? null, district: c.district ?? null,
    })
    .returning();
  if (c.doc) {
    await db.insert(t.candidateDocuments).values({ workspaceId: c.workspaceId, candidateId: cand.id, filename: c.doc.filename, mime: c.doc.mime, bytes: c.doc.bytes, text: c.doc.text });
  }
  const reqs = await db.select({ id: t.requisitions.id }).from(t.requisitions).where(and(eq(t.requisitions.workspaceId, c.workspaceId), eq(t.requisitions.status, "open")));
  if (reqs.length) {
    await db.insert(t.matches).values(reqs.map((r) => ({ workspaceId: c.workspaceId, requisitionId: r.id, candidateId: cand.id, stage: "sourced" as const }))).onConflictDoNothing();
  }
  await db.insert(t.events).values({ workspaceId: c.workspaceId, type: "candidate.added", props: { source: c.source, candidateId: cand.id } });
  await enqueue("hiring.parse", { candidateId: cand.id }, { workspaceId: c.workspaceId, dedupeKey: `parse:${cand.id}` });
  return cand;
}
