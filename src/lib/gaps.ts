// Knowledge gaps: questions the assistant couldn't answer, so the owner teaches it once (Knowledge → Gaps) and every
// later customer gets the answer. A question is recorded however it reached a person; the same question worded
// differently lands on the same gap; and once answered it stays answered.
import { and, eq, sql } from "drizzle-orm";
import { db, t } from "@/db";

const STOP = new Set([
  "the", "a", "an", "do", "does", "did", "you", "your", "u", "ur", "have", "has", "is", "are", "was", "can", "could", "i", "we", "my", "me", "for", "to", "of", "and", "or", "what", "how", "any",
  "there", "it", "in", "on", "at", "with", "got", "ada", "boleh", "ke", "tak", "ka", "lah", "kah", "please", "pls", "plz", "hi", "hello", "bro", "yo", "this", "that", "be", "will", "would", "get",
]);

/** Content words, lower-cased, with a trailing plural "s" dropped so "bases" and "base" are one word. */
export function gapWords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
  return [...new Set(words)];
}

/** A short stable key for a question, e.g. "do you have gluten free bases?" → "gluten free base". */
export const gapKey = (text: string) => gapWords(text).slice(0, 6).join(" ").slice(0, 60);

/** Same question, different words: most of the content words are shared, or the shorter one sits entirely inside the longer. */
export function sameQuestion(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false;
  const [small, big] = a.length <= b.length ? [a, b] : [b, a];
  const shared = small.filter((w) => big.includes(w)).length;
  if (small.length >= 2 && shared === small.length) return true;
  return shared / new Set([...a, ...b]).size >= 0.6;
}

export type GapInput = { workspaceId: string; question: string; key?: string | null; isDemo?: boolean };

/**
 * Record that a customer asked something the assistant couldn't answer. An existing gap with the same key, or the same
 * question in other words, counts one more ask instead of making a second row. Dismissed stays dismissed; answered stays
 * answered while its answer is still live (if the owner deleted that answer, the question is open again).
 */
export async function recordGap(i: GapInput): Promise<{ id: string; created: boolean; reopened: boolean } | null> {
  // A one-word key ("halal", "delivery") is too coarse to tell questions apart: use the customer's own words.
  const source = gapWords(i.key ?? "").length >= 2 ? (i.key as string) : i.question;
  const key = gapKey(source);
  if (!key) return null;
  const words = gapWords(source);
  const gaps = await db.select().from(t.knowledgeGaps).where(eq(t.knowledgeGaps.workspaceId, i.workspaceId));
  const match = gaps.find((g) => g.key === key) ?? gaps.find((g) => sameQuestion(words, gapWords(g.key)) || sameQuestion(words, gapWords(g.question)));
  const isDemo = Boolean(i.isDemo);

  if (!match) {
    const [row] = await db
      .insert(t.knowledgeGaps)
      .values({ workspaceId: i.workspaceId, key, question: i.question.slice(0, 140), isDemo })
      .onConflictDoNothing()
      .returning({ id: t.knowledgeGaps.id });
    if (row) return { id: row.id, created: true, reopened: false };
    // Lost a race with the same question arriving twice: count it on the row that won.
    const [won] = await db.select().from(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.workspaceId, i.workspaceId), eq(t.knowledgeGaps.key, key)));
    if (!won) return null;
    await db.update(t.knowledgeGaps).set({ count: sql`${t.knowledgeGaps.count} + 1`, lastAskedAt: new Date() }).where(eq(t.knowledgeGaps.id, won.id));
    return { id: won.id, created: false, reopened: false };
  }

  let status = match.status;
  if (match.status === "answered") {
    const [item] = match.kbItemId ? await db.select({ active: t.kbItems.active }).from(t.kbItems).where(eq(t.kbItems.id, match.kbItemId)) : [];
    if (!item?.active) status = "open";
  }
  await db
    .update(t.knowledgeGaps)
    .set({ count: sql`${t.knowledgeGaps.count} + 1`, lastAskedAt: new Date(), status, isDemo: sql`${t.knowledgeGaps.isDemo} and ${isDemo}` })
    .where(eq(t.knowledgeGaps.id, match.id));
  return { id: match.id, created: false, reopened: status === "open" && match.status !== "open" };
}

// ───────────────────────────── when a finished chat turn counts as an unanswered question

const QUESTION_INTENTS = new Set(["question", "price", "stock", "delivery", "other"]);
/** The assistant promised to ask the team instead of answering. */
const DEFERS = /\b(check|checking|confirm|ask|asking|verify)\b[^.!?\n]{0,30}\b(team|staff|manager|kitchen|owner)\b|\b(team|staff|manager|someone)\b[^.!?\n]{0,30}\b(follow up|get back|reply|respond|confirm|check)\b|\bget back to you\b|\bpassed (this|it|that) (on )?to\b/i;

export const defers = (reply: string) => DEFERS.test(reply);

/**
 * What to do with a finished turn.
 *  "record"   it already went to a person (low confidence, or no reply): add it to Gaps too.
 *  "escalate" the assistant said it would check with the team but never told the team: do both.
 *  null       nothing to add (answered, a booking/order, an outage, small talk, or already a gap).
 */
export function gapAction(i: { intent?: string | null; escalations: { category: string }[]; reply: string; failed: boolean }): "record" | "escalate" | null {
  if (i.failed || !i.intent || !QUESTION_INTENTS.has(i.intent)) return null;
  const cats = i.escalations.map((e) => e.category);
  if (cats.includes("knowledge_gap")) return null;
  if (cats.some((c) => c === "low_confidence" || c === "other")) return "record";
  if (!cats.length && defers(i.reply)) return "escalate";
  return null;
}
