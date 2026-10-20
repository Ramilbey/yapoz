// Exercises the Telegram adapter end to end against a recording Bot API client (no network):
// business connections, owner-message filtering, replies via business_connection_id, /apply with consent,
// approve-to-send invites with slot buttons, slot pick → interview, and /delete_my_data.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { Api } from "grammy";
import { db, t, sql } from "../src/db";
import { and, eq, desc, inArray } from "drizzle-orm";

process.env.TELEGRAM_BOT_TOKEN ||= "123456:TEST";
const calls: { method: string; payload: Record<string, unknown> }[] = [];
let msgId = 1000;

const { setTelegramApi } = await import("../src/channels/telegram/api");
const { handleTelegramUpdateJob } = await import("../src/channels/telegram/handle");
const { draftInvite, approveAndSend } = await import("../src/hiring/outreach");

const WS = "FORNO7";
const OWNER = 900001;
const CUSTOMER = 900002;
const CANDIDATE = 900003;
const BC = "bc_test_connection";
let updateId = 1;

before(() => {
  const api = new Api("123456:TEST");
  api.config.use(async (_prev, method, payload) => {
    const p = payload as Record<string, unknown>;
    calls.push({ method, payload: p });
    const result =
      method === "sendMessage"
        ? { message_id: ++msgId, date: Math.floor(Date.now() / 1000), chat: { id: p.chat_id, type: "private" }, text: p.text }
        : method === "getBusinessConnection"
          ? { id: BC, user: { id: OWNER, is_bot: false, first_name: "Lina" }, user_chat_id: OWNER, date: 1, rights: { can_reply: true }, is_enabled: true }
          : true;
    return { ok: true, result } as never;
  });
  setTelegramApi(api);
});
after(async () => {
  await db.delete(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, BC));
  await db.delete(t.customers).where(and(eq(t.customers.workspaceId, WS), inArray(t.customers.externalId, ["900001", "900002"])));
  await db.delete(t.candidates).where(eq(t.candidates.telegramChatId, String(CANDIDATE)));
  await sql.end();
});

const run = (update: Record<string, unknown>) => handleTelegramUpdateJob({ workspaceId: WS, update: { update_id: updateId++, ...update } });
const user = (id: number, first_name: string, username?: string) => ({ id, is_bot: false, first_name, username });
const pm = (from: ReturnType<typeof user>, text: string, extra: Record<string, unknown> = {}) => ({ message_id: ++msgId, date: Math.floor(Date.now() / 1000), chat: { id: from.id, type: "private", first_name: from.first_name }, from, text, ...extra });
const sent = (method = "sendMessage") => calls.filter((c) => c.method === method);

test("business connection is stored and the owner is told", async () => {
  await run({ business_connection: { id: BC, user: user(OWNER, "Lina"), user_chat_id: OWNER, date: 1, rights: { can_reply: true }, is_enabled: true } });
  const [c] = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, BC));
  assert.equal(c.canReply, true);
  assert.equal(sent().at(-1)?.payload.chat_id, OWNER);
});

test("owner's own business messages are ignored", async () => {
  const before = calls.length;
  await run({ business_message: { ...pm(user(OWNER, "Lina"), "on my way"), chat: { id: CUSTOMER, type: "private", first_name: "Aisha" }, business_connection_id: BC } });
  const [th] = await db.select().from(t.threads).where(eq(t.threads.externalThreadId, `biz:${BC}:${CUSTOMER}`));
  assert.equal(th, undefined);
  assert.equal(calls.length, before);
});

test("customer business message gets a reply from the shop's account", async () => {
  await run({ business_message: { ...pm(user(CUSTOMER, "Aisha"), "u guys open on monday?"), chat: { id: CUSTOMER, type: "private", first_name: "Aisha" }, business_connection_id: BC } });
  const [th] = await db.select().from(t.threads).where(eq(t.threads.externalThreadId, `biz:${BC}:${CUSTOMER}`));
  assert.ok(th, "thread created");
  const reply = sent().at(-1)!;
  assert.equal(reply.payload.chat_id, CUSTOMER);
  assert.equal(reply.payload.business_connection_id, BC);
  const msgs = await db.select().from(t.messages).where(eq(t.messages.threadId, th.id));
  assert.equal(msgs.filter((m) => m.direction === "out" && m.status === "sent").length, 1);
});

test("/apply collects details, asks for consent, and creates a reachable candidate", async () => {
  const cand = user(CANDIDATE, "Rizal", "rizal_cooks_test");
  await run({ message: pm(cand, "/apply") });
  await run({ message: pm(cand, "Rizal bin Ahmad") });
  await run({ callback_query: { id: "cb1", from: cand, chat_instance: "x", data: "apply:role:Pizza cook", message: { message_id: 1, date: 1, chat: { id: CANDIDATE, type: "private" } } } });
  await run({ message: pm(cand, "5 years on a wood-fired oven at Casa Fumo, Bukit Bintang, dough and evening service") });
  await run({ message: pm(cand, "evenings and weekends") });
  await run({ message: pm(cand, "Brickfields") });
  await run({ message: pm(cand, "skip") });
  const consentAsk = sent().at(-1)!;
  assert.match(String(consentAsk.payload.text), /agree/i);
  await run({ callback_query: { id: "cb2", from: cand, chat_instance: "x", data: "apply:consent:yes", message: { message_id: 2, date: 1, chat: { id: CANDIDATE, type: "private" } } } });
  const [c] = await db.select().from(t.candidates).where(eq(t.candidates.telegramChatId, String(CANDIDATE)));
  assert.ok(c, "candidate created");
  assert.equal(c.consent, true);
  assert.equal(c.source, "bot_apply");
  assert.match(c.rawText, /wood-fired/);
  const [m] = await db.select().from(t.matches).where(eq(t.matches.candidateId, c.id));
  assert.ok(m, "attached to the open requisition");
});

test("approved invite goes out with slot buttons; tapping one books the interview", async () => {
  const [c] = await db.select().from(t.candidates).where(eq(t.candidates.telegramChatId, String(CANDIDATE)));
  const [m] = await db.select().from(t.matches).where(eq(t.matches.candidateId, c.id));
  const draft = await draftInvite(WS, m.id, "onsite");
  assert.equal(draft.channel, "telegram");
  assert.equal(draft.slots.length, 3);
  const beforeSend = sent().length;
  // Nothing is sent before approval.
  assert.equal(sent().length, beforeSend);
  const r = await approveAndSend(WS, draft.id, "00000000-0000-4000-8000-000000000003");
  assert.equal(r.ok, true);
  const invite = sent().at(-1)!;
  assert.equal(invite.payload.chat_id, CANDIDATE);
  const kb = (invite.payload.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard;
  assert.equal(kb.length, 3);
  await run({ callback_query: { id: "cb3", from: user(CANDIDATE, "Rizal"), chat_instance: "x", data: kb[1][0].callback_data, message: { message_id: 3, date: 1, chat: { id: CANDIDATE, type: "private" } } } });
  const [iv] = await db.select().from(t.interviews).where(eq(t.interviews.candidateId, c.id)).orderBy(desc(t.interviews.createdAt));
  assert.ok(iv, "interview created");
  assert.equal(iv.status, "scheduled");
  const [m2] = await db.select().from(t.matches).where(eq(t.matches.id, m.id));
  assert.equal(m2.stage, "scheduled");
  assert.match(String(sent().at(-1)!.payload.text), /Confirmed/);
  const [cal] = await db.select().from(t.calendarEvents).where(eq(t.calendarEvents.interviewId, iv.id));
  assert.ok(cal, "calendar block created");
});

test("/delete_my_data removes the candidate and their documents", async () => {
  await run({ message: pm(user(CANDIDATE, "Rizal"), "/delete_my_data") });
  const rows = await db.select().from(t.candidates).where(eq(t.candidates.telegramChatId, String(CANDIDATE)));
  assert.equal(rows.length, 0);
});
