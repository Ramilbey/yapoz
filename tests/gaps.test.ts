// Knowledge gaps: a question the assistant couldn't answer is recorded however it reached a person, the same question in
// other words lands on one gap, and an answered gap stays answered. Pure rules first, then the database, then the agent
// pipeline with the AI stubbed out.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { defers, gapAction, gapKey, gapWords, recordGap, sameQuestion } from "../src/lib/gaps";
import { createWorkspace } from "../src/lib/workspace";
import { ingest, respond } from "../src/agent/pipeline";

test("a question becomes a short key; plurals and filler words don't matter", () => {
  assert.equal(gapKey("Do you have gluten free bases?"), "gluten free base");
  assert.equal(gapKey("gluten-free base"), "gluten free base");
  assert.deepEqual(gapWords("can i get halal chicken pls"), ["halal", "chicken"]);
  assert.equal(gapKey("???"), "");
});

test("the same question in other words is recognised; a different question isn't", () => {
  const same = (a: string, b: string) => sameQuestion(gapWords(a), gapWords(b));
  assert.ok(same("do you have gluten free bases", "gluten-free base available?"));
  assert.ok(same("kids menu", "do you have a kids menu for my 5 year old"), "the short one sits inside the long one");
  assert.ok(!same("gluten free base", "vegan cheese"));
  assert.ok(!same("halal", "halal chicken"), "one word alone is too little to merge on");
  assert.ok(!same("parking", "delivery to subang"));
});

test("which finished turns count as unanswered: only questions that reached a person without becoming a gap", () => {
  const act = (o: Partial<Parameters<typeof gapAction>[0]>) => gapAction({ intent: "question", escalations: [], reply: "Our hours are 10 to 10.", failed: false, ...o });
  assert.equal(act({}), null, "answered");
  assert.equal(act({ escalations: [{ category: "knowledge_gap" }] }), null, "already a gap");
  assert.equal(act({ escalations: [{ category: "low_confidence" }] }), "record");
  assert.equal(act({ escalations: [{ category: "other" }] }), "record", "the assistant escalated as 'other'");
  assert.equal(act({ reply: "Let me check with the team and get back to you!" }), "escalate", "promised to check, told nobody");
  assert.equal(act({ intent: "price", reply: "I'll ask our manager and confirm." }), "escalate");
  assert.equal(act({ intent: "greeting", escalations: [{ category: "low_confidence" }] }), null, "small talk");
  assert.equal(act({ intent: "complaint", escalations: [{ category: "other" }] }), null, "complaints are for people, not for teaching");
  assert.equal(act({ failed: true, escalations: [{ category: "other" }] }), null, "an AI outage isn't a gap in the menu");
  assert.equal(act({ intent: null, escalations: [{ category: "other" }] }), null);
  assert.equal(act({ escalations: [{ category: "refund" }] }), null);
  assert.ok(defers("I'll check with the team and come back") && defers("Our team will get back to you shortly") && !defers("We open at 10am."));
});

const made: string[] = [];
let ws: string;
const mk = async (name: string) => {
  const r = await createWorkspace({ name, timezone: "Asia/Kuala_Lumpur", owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  made.push(r.workspaceId);
  return r.workspaceId;
};
before(async () => {
  ws = await mk("Gap Pizza");
});
after(async () => {
  for (const id of made) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await sql.end();
});
const gaps = (id = ws) => db.select().from(t.knowledgeGaps).where(eq(t.knowledgeGaps.workspaceId, id));

test("asking again, or in other words, counts on one gap; a different question is its own gap", async () => {
  const w = await mk("Gap One");
  const a = await recordGap({ workspaceId: w, key: "gluten-free base", question: "do you have a gluten free base?" });
  assert.ok(a?.created);
  const b = await recordGap({ workspaceId: w, key: "", question: "Gluten free bases available?" });
  assert.ok(b && !b.created && b.id === a.id, "reworded");
  const c = await recordGap({ workspaceId: w, key: "gluten free base", question: "gf pizza?" });
  assert.ok(c && c.id === a.id, "same key");
  await recordGap({ workspaceId: w, key: "parking", question: "is there parking nearby?" });
  const all = await gaps(w);
  assert.equal(all.length, 2);
  assert.equal(all.find((g) => g.id === a.id)?.count, 3);
  assert.equal(all.find((g) => g.id === a.id)?.question, "do you have a gluten free base?", "the first wording is kept");
  assert.equal(await recordGap({ workspaceId: w, key: "", question: "??" }), null, "nothing to key on");
});

test("a one-word key is too coarse: the customer's own words decide", async () => {
  const w = await mk("Gap Two");
  await recordGap({ workspaceId: w, key: "delivery", question: "do you deliver to Subang?" });
  await recordGap({ workspaceId: w, key: "delivery", question: "how much is the vegan cheese?" });
  assert.equal((await gaps(w)).length, 2);
});

test("an answered gap stays answered while its answer is live, and opens again if the answer is deleted or switched off", async () => {
  const w = await mk("Gap Three");
  const first = (await recordGap({ workspaceId: w, key: "kids menu", question: "do you have a kids menu?" }))!;
  const [item] = await db.insert(t.kbItems).values({ workspaceId: w, kind: "faq", category: "general", slug: `faq-${Math.random()}`, title: "Kids menu", body: "Yes: mini margherita RM 12.", sort: 500 }).returning();
  await db.update(t.knowledgeGaps).set({ status: "answered", kbItemId: item.id }).where(eq(t.knowledgeGaps.id, first.id));

  const again = await recordGap({ workspaceId: w, key: "kids menu", question: "kids menu?" });
  assert.equal(again?.reopened, false);
  let [g] = await gaps(w);
  assert.equal(g.status, "answered", "the owner isn't asked a second time");
  assert.equal(g.count, 2, "but the ask is still counted");

  await db.update(t.kbItems).set({ active: false }).where(eq(t.kbItems.id, item.id));
  const off = await recordGap({ workspaceId: w, key: "kids menu", question: "kids menu?" });
  assert.equal(off?.reopened, true);
  [g] = await gaps(w);
  assert.equal(g.status, "open", "the answer is gone, so it needs one again");
});

test("a dismissed gap stays dismissed", async () => {
  const w = await mk("Gap Four");
  const g = (await recordGap({ workspaceId: w, key: "wifi password", question: "wifi password?" }))!;
  await db.update(t.knowledgeGaps).set({ status: "dismissed" }).where(eq(t.knowledgeGaps.id, g.id));
  await recordGap({ workspaceId: w, key: "wifi password", question: "what is the wifi password" });
  const [row] = await gaps(w);
  assert.equal(row.status, "dismissed");
  assert.equal(row.count, 2);
});

// ───────────────────────────── through the agent

type Turn = { intent: string; confidence: number; reply: string };
/** An AI that classifies the message as given and answers with fixed text (no tools). */
async function ask(workspaceId: string, text: string, turn: Turn, customer = `c${Math.random()}`) {
  process.env.GROQ_API_KEY = "test-groq";
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const realFetch = globalThis.fetch;
  const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
  const msg = (message: unknown, finish: string) => json({ id: "x", object: "chat.completion", created: 0, model: "m", choices: [{ index: 0, finish_reason: finish, message }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith("/models")) return new Response("no", { status: 503 });
    const body = JSON.parse(String(init?.body ?? "{}"));
    if (body.tool_choice?.function?.name === "classify") {
      const args = { intent: turn.intent, topic: "gluten-free base", language: "en", sentiment: "neutral", confidence: turn.confidence, must_escalate: false, escalate_category: null, summary: "asks about a gluten free base", holding_reply: "We'll check and reply here." };
      return msg({ role: "assistant", content: null, tool_calls: [{ id: "c", type: "function", function: { name: "classify", arguments: JSON.stringify(args) } }] }, "tool_calls");
    }
    return msg({ role: "assistant", content: turn.reply }, "stop");
  }) as typeof fetch;
  try {
    const r = await ingest({ workspaceId, channel: "simulator", externalThreadId: `sim:${customer}`, customer: { externalId: customer, displayName: "Hana" }, text, attachments: [], receivedAt: new Date() });
    const out = await respond(r.thread.id, r.messageId);
    return { out, threadId: r.thread.id };
  } finally {
    globalThis.fetch = realFetch;
  }
}
const cards = (threadId: string) => db.select().from(t.escalations).where(eq(t.escalations.threadId, threadId));

test("agent: 'I'll check with the team' with no escalation becomes a staff card and a gap, with the reply left as written", async () => {
  const w = await mk("Gap Five");
  const { out, threadId } = await ask(w, "do you have a gluten free base?", { intent: "question", confidence: 0.9, reply: "Good question! Let me check with the team and get back to you." });
  assert.equal(out.reply, "Good question! Let me check with the team and get back to you.");
  assert.equal(out.outcome, "escalated");
  const [card] = await cards(threadId);
  assert.equal(card.category, "knowledge_gap");
  const [g] = await gaps(w);
  assert.equal(g.key, "gluten free base");
  assert.equal(g.question, "do you have a gluten free base?");
  assert.equal(g.count, 1);
});

test("agent: a low-confidence question that went to a person is in Gaps too, and the same question from another customer is counted once more", async () => {
  const w = await mk("Gap Six");
  const first = await ask(w, "got gluten free base ah?", { intent: "question", confidence: 0.2, reply: "" });
  assert.equal((await cards(first.threadId))[0].category, "low_confidence");
  assert.equal((await gaps(w)).length, 1);
  await ask(w, "Gluten free bases available?", { intent: "question", confidence: 0.2, reply: "" });
  const [g] = await gaps(w);
  assert.equal((await gaps(w)).length, 1, "one gap for the same question");
  assert.equal(g.count, 2);
});

test("agent: small talk that defers and a question the assistant answered leave Gaps alone", async () => {
  const w = await mk("Gap Seven");
  await ask(w, "hi", { intent: "greeting", confidence: 0.95, reply: "Hello! Our team will get back to you if you need anything." });
  await ask(w, "what time do you open?", { intent: "question", confidence: 0.95, reply: "We open at 10am every day." });
  assert.equal((await gaps(w)).length, 0);
  assert.equal((await db.select().from(t.escalations).where(and(eq(t.escalations.workspaceId, w)))).length, 0);
});
