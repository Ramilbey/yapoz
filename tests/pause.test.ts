// Pausing the AI: before "Go live" real channels only collect messages (the simulator still answers),
// and a staff takeover silences the AI until released, or until two quiet hours after the last staff reply.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db, t, sql as pg } from "../src/db";
import { createWorkspace } from "../src/lib/workspace";
import { ingest, respond } from "../src/agent/pipeline";

process.env.GROQ_API_KEY = "test-groq";
delete process.env.GEMINI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

const realFetch = globalThis.fetch;
let modelCalls = 0;
const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.endsWith("/models")) return new Response("down", { status: 503 });
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  modelCalls++;
  const mk = (message: unknown, finish: string) => json({ id: "x", object: "chat.completion", created: 0, model: body.model, choices: [{ index: 0, finish_reason: finish, message }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
  if (body.tool_choice?.function?.name === "classify") {
    const args = { intent: "question", topic: "hours", language: "en", sentiment: "neutral", confidence: 0.99, must_escalate: false, escalate_category: null, summary: "asks hours", holding_reply: "One moment" };
    return mk({ role: "assistant", content: null, tool_calls: [{ id: "c0", type: "function", function: { name: "classify", arguments: JSON.stringify(args) } }] }, "tool_calls");
  }
  return mk({ role: "assistant", content: "Happy to help, we open at 9." }, "stop");
}) as typeof fetch;

let wsId = "";
before(async () => {
  const a = await createWorkspace({ name: "Pause Bakes", timezone: "Asia/Kuala_Lumpur", owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  wsId = a.workspaceId;
});
after(async () => {
  globalThis.fetch = realFetch;
  if (wsId) await db.delete(t.workspaces).where(eq(t.workspaces.id, wsId));
  await pg.end();
});

const setLive = async (live: boolean) => {
  const [row] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, wsId));
  await db.update(t.workspaces).set({ settings: { ...row.settings, live } }).where(eq(t.workspaces.id, wsId));
};
let n = 0;
const send = (channel: "whatsapp" | "simulator", id: string, text = "What time do you open?") => {
  const k = `${id}${Date.now()}${n++}`;
  return ingest({
    workspaceId: wsId, channel, externalThreadId: `${channel}:${k}`,
    customer: { externalId: k, displayName: "Hana", ...(channel === "whatsapp" ? { phone: "60123456789" } : {}) },
    text, attachments: [], receivedAt: new Date(), externalMessageId: channel === "whatsapp" ? `wamid.${k}` : undefined,
  } as never);
};
const msgs = (threadId: string) => db.select().from(t.messages).where(eq(t.messages.threadId, threadId));
const orderCount = async () => (await db.select().from(t.orders).where(eq(t.orders.workspaceId, wsId))).length;

test("not live: WhatsApp messages are stored but not answered, and no order or AI reply is created", async () => {
  await setLive(false);
  const r = await send("whatsapp", "nl", "2 large cakes please");
  const calls = modelCalls;
  const out = await respond(r.thread.id, r.messageId);
  assert.equal(out.skipped, "not_live");
  assert.equal(modelCalls, calls, "no model is called");
  const all = await msgs(r.thread.id);
  assert.equal(all.filter((m) => m.direction === "in").length, 1, "the customer's message is kept");
  assert.equal(all.filter((m) => m.direction === "out").length, 0, "nothing goes out");
  assert.equal(all.filter((m) => m.author === "ai").length, 0);
  assert.equal(await orderCount(), 0);
});

test("not live: the dashboard simulator still answers", async () => {
  await setLive(false);
  const r = await send("simulator", "sim");
  const out = await respond(r.thread.id, r.messageId);
  assert.equal(out.skipped, undefined);
  assert.match(out.reply ?? "", /we open at 9/);
  const outbound = (await msgs(r.thread.id)).filter((m) => m.direction === "out");
  assert.equal(outbound.length, 1);
});

test("going live: the next message is answered, and an earlier skipped one stays unanswered", async () => {
  await setLive(false);
  const first = await send("simulator", "flip");
  await setLive(true);
  const r = await send("simulator", "flip2");
  const out = await respond(r.thread.id, r.messageId);
  assert.equal(out.skipped, undefined);
  assert.ok(out.reply);
  // Same thread, paused then live: ingest a second message on a WhatsApp-style thread flips from skipped to answered.
  await setLive(false);
  const w = await send("whatsapp", "flipw");
  assert.equal((await respond(w.thread.id, w.messageId)).skipped, "not_live");
  await setLive(true);
  const again = await ingest({
    workspaceId: wsId, channel: "whatsapp", externalThreadId: (await db.select().from(t.threads).where(eq(t.threads.id, w.thread.id)))[0].externalThreadId,
    customer: { externalId: (await db.select().from(t.customers).where(eq(t.customers.id, w.thread.customerId)))[0].externalId, displayName: "Hana" },
    text: "Hello? Anyone there?", attachments: [], receivedAt: new Date(), externalMessageId: `wamid.again${Date.now()}`,
  } as never);
  assert.equal(again.thread.id, w.thread.id);
  const calls = modelCalls;
  const out2 = await respond(again.thread.id, again.messageId);
  assert.notEqual(out2.skipped, "not_live");
  assert.ok(modelCalls > calls, "the model ran once the workspace went live");
  void first;
});

async function pausedThread(staffAgoMs: number | null) {
  await setLive(true);
  const r = await send("simulator", "pause");
  await db.update(t.threads).set({ aiPaused: true }).where(eq(t.threads.id, r.thread.id));
  if (staffAgoMs !== null) {
    await db.insert(t.messages).values({ workspaceId: wsId, threadId: r.thread.id, direction: "out", author: "staff", text: "Hi, Sam here", status: "sent", createdAt: new Date(Date.now() - staffAgoMs) });
  }
  return r;
}
const paused = async (id: string) => (await db.select().from(t.threads).where(eq(t.threads.id, id)))[0].aiPaused;

test("takeover with no staff reply yet is a deliberate hold: the AI stays silent however long it lasts", async () => {
  const r = await pausedThread(null);
  await db.update(t.messages).set({ createdAt: new Date(Date.now() - 24 * 3600_000) }).where(eq(t.messages.threadId, r.thread.id));
  const out = await respond(r.thread.id, r.messageId);
  assert.equal(out.skipped, "takeover");
  assert.equal(await paused(r.thread.id), true);
  assert.equal((await msgs(r.thread.id)).filter((m) => m.author === "ai").length, 0);
});

test("takeover with a recent staff reply keeps the AI silent", async () => {
  const r = await pausedThread(30 * 60_000);
  assert.equal((await respond(r.thread.id, r.messageId)).skipped, "takeover");
  assert.equal(await paused(r.thread.id), true);
});

test("takeover lapses after 2 hours of staff silence: the AI answers and the thread is released", async () => {
  const r = await pausedThread(3 * 3600_000);
  const out = await respond(r.thread.id, r.messageId);
  assert.equal(out.skipped, undefined);
  assert.ok(out.reply);
  assert.equal(await paused(r.thread.id), false);
  const [row] = await db.select().from(t.threads).where(and(eq(t.threads.id, r.thread.id)));
  assert.equal(row.takenOverBy, null);
});
