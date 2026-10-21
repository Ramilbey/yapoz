// Telegram end to end against recording Bot API clients (no network): the shared Jawab bot (link codes for
// Business Mode, deep links per business, unknown chats), a business's own bot, /apply with consent,
// approve → invite with slot buttons → booked interview, and /delete_my_data.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { Api } from "grammy";
import { db, t, sql } from "../src/db";
import { and, eq, desc, inArray } from "drizzle-orm";
import { encryptJson } from "../src/lib/crypto";

process.env.TELEGRAM_BOT_TOKEN ||= "123456:TEST";
type Call = { bot: string; method: string; payload: Record<string, unknown> };
const calls: Call[] = [];
let msgId = 1000;

const { setTelegramApi } = await import("../src/channels/telegram/api");
const { handleTelegramUpdateJob } = await import("../src/channels/telegram/handle");
const { draftInvite, approveAndSend } = await import("../src/hiring/outreach");

const WS = "FORNO7";
const OWNER = 900001;
const CUSTOMER = 900002;
const CANDIDATE = 900003;
const STRANGER = 900004;
const BC = "bc_test_connection";
let updateId = 1;
let ownChannelId = "";

function recorder(bot: string) {
  const api = new Api("123456:TEST");
  api.config.use(async (_prev, method, payload) => {
    const p = payload as Record<string, unknown>;
    calls.push({ bot, method, payload: p });
    const result =
      method === "sendMessage"
        ? { message_id: ++msgId, date: Math.floor(Date.now() / 1000), chat: { id: p.chat_id, type: "private" }, text: p.text }
        : method === "getBusinessConnection"
          ? { id: BC, user: { id: OWNER, is_bot: false, first_name: "Lina" }, user_chat_id: OWNER, date: 1, rights: { can_reply: true }, is_enabled: true }
          : true;
    return { ok: true, result } as never;
  });
  return api;
}

async function cleanup() {
  await db.delete(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, BC));
  await db.delete(t.telegramLinks).where(inArray(t.telegramLinks.code, ["TESTCODE1"]));
  await db.delete(t.telegramLinks).where(eq(t.telegramLinks.telegramUserId, String(OWNER)));
  await db.delete(t.customers).where(inArray(t.customers.externalId, ["900001", "900002", "900004"]));
  await db.delete(t.candidates).where(eq(t.candidates.telegramChatId, String(CANDIDATE)));
  await db.delete(t.telegramChatBindings).where(inArray(t.telegramChatBindings.chatId, ["900002", "900003", "900004"]));
}

before(async () => {
  await cleanup();
  setTelegramApi(recorder("platform"), "platform", "jawab_test_bot");
  const [ch] = await db.select().from(t.channels).where(and(eq(t.channels.workspaceId, "KASIH1"), eq(t.channels.type, "telegram")));
  await db.update(t.channels).set({ credentialsEnc: encryptJson({ token: "999:OWN", secret: "s" }), config: { mode: "own", botUsername: "kasih_test_bot" } }).where(eq(t.channels.id, ch.id));
  ownChannelId = ch.id;
  setTelegramApi(recorder("own"), ch.id, "kasih_test_bot");
});
after(async () => {
  await cleanup();
  await db.update(t.channels).set({ credentialsEnc: null, config: {} }).where(eq(t.channels.id, ownChannelId));
  await sql.end();
});

const run = (update: Record<string, unknown>, bot = "platform") => handleTelegramUpdateJob({ bot, update: { update_id: updateId++, ...update } });
const user = (id: number, first_name: string, username?: string) => ({ id, is_bot: false, first_name, username });
const pm = (from: ReturnType<typeof user>, text: string, extra: Record<string, unknown> = {}) => ({ message_id: ++msgId, date: Math.floor(Date.now() / 1000), chat: { id: from.id, type: "private", first_name: from.first_name }, from, text, ...extra });
const last = (bot = "platform") => calls.filter((c) => c.bot === bot && c.method === "sendMessage").at(-1)!;

test("an unknown chat with the shared bot is pointed to the business link and sign-up", async () => {
  await run({ message: pm(user(STRANGER, "Sam"), "hi") });
  assert.equal(last().payload.chat_id, STRANGER);
  assert.match(String(last().payload.text), /signup/);
});

test("Business Mode: a connection waits until the owner proves which business with a link code", async () => {
  await run({ business_connection: { id: BC, user: user(OWNER, "Lina"), user_chat_id: OWNER, date: 1, rights: { can_reply: true }, is_enabled: true } });
  let [c] = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, BC));
  assert.equal(c.workspaceId, null);
  assert.match(String(last().payload.text), /Link my Telegram/);
  await db.insert(t.telegramLinks).values({ code: "TESTCODE1", workspaceId: WS, expiresAt: new Date(Date.now() + 600_000) });
  await run({ message: pm(user(OWNER, "Lina"), "/start link_TESTCODE1") });
  [c] = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, BC));
  assert.equal(c.workspaceId, WS);
  assert.match(String(last().payload.text), /Linked to Forno Sette/);
});

test("owner's own business messages are ignored; customers get a reply from the shop's account", async () => {
  const before = calls.length;
  await run({ business_message: { ...pm(user(OWNER, "Lina"), "on my way"), chat: { id: CUSTOMER, type: "private", first_name: "Aisha" }, business_connection_id: BC } });
  assert.equal(calls.length, before);
  await run({ business_message: { ...pm(user(CUSTOMER, "Aisha"), "u guys open on monday?"), chat: { id: CUSTOMER, type: "private", first_name: "Aisha" }, business_connection_id: BC } });
  const [th] = await db.select().from(t.threads).where(eq(t.threads.externalThreadId, `biz:${BC}:${CUSTOMER}`));
  assert.ok(th, "thread created in the linked business");
  assert.equal(th.workspaceId, WS);
  assert.equal(last().payload.business_connection_id, BC);
});

test("a deep link binds a customer's chat with the shared bot to that business", async () => {
  await run({ message: pm(user(CUSTOMER, "Aisha"), "/start FORNO7") });
  assert.match(String(last().payload.text), /Forno Sette/);
  await run({ message: pm(user(CUSTOMER, "Aisha"), "large margherita how much") });
  const [th] = await db.select().from(t.threads).where(eq(t.threads.externalThreadId, `chat:platform:${CUSTOMER}`));
  assert.equal(th?.workspaceId, WS);
});

test("a business's own bot routes everything to that business", async () => {
  await run({ message: pm(user(STRANGER, "Sam"), "do u do keratin") }, ownChannelId);
  const [th] = await db.select().from(t.threads).where(eq(t.threads.externalThreadId, `chat:${ownChannelId}:${STRANGER}`));
  assert.equal(th?.workspaceId, "KASIH1");
  assert.equal(last("own").payload.chat_id, STRANGER);
});

test("/apply via the shared bot collects details, asks for consent, and creates a reachable candidate", async () => {
  const cand = user(CANDIDATE, "Rizal", "rizal_cooks_test");
  await run({ message: pm(cand, "/start apply_FORNO7") });
  await run({ message: pm(cand, "Rizal bin Ahmad") });
  await run({ callback_query: { id: "cb1", from: cand, chat_instance: "x", data: "apply:role:Pizza cook", message: { message_id: 1, date: 1, chat: { id: CANDIDATE, type: "private" } } } });
  await run({ message: pm(cand, "5 years on a wood-fired oven at Casa Fumo, Bukit Bintang, dough and evening service") });
  await run({ message: pm(cand, "evenings and weekends") });
  await run({ message: pm(cand, "Brickfields") });
  await run({ message: pm(cand, "skip") });
  assert.match(String(last().payload.text), /agree/i);
  await run({ callback_query: { id: "cb2", from: cand, chat_instance: "x", data: "apply:consent:yes", message: { message_id: 2, date: 1, chat: { id: CANDIDATE, type: "private" } } } });
  const [c] = await db.select().from(t.candidates).where(eq(t.candidates.telegramChatId, String(CANDIDATE)));
  assert.ok(c, "candidate created");
  assert.equal(c.workspaceId, WS);
  assert.equal(c.telegramBot, "platform");
  assert.equal(c.consent, true);
});

test("approved invite goes out with slot buttons; tapping one books the interview", async () => {
  const [c] = await db.select().from(t.candidates).where(eq(t.candidates.telegramChatId, String(CANDIDATE)));
  const [m] = await db.select().from(t.matches).where(eq(t.matches.candidateId, c.id));
  const draft = await draftInvite(WS, m.id, "onsite");
  assert.equal(draft.channel, "telegram");
  assert.equal(draft.slots.length, 3);
  const r = await approveAndSend(WS, draft.id, "00000000-0000-4000-8000-000000000003");
  assert.equal(r.ok, true);
  const invite = last();
  assert.equal(invite.payload.chat_id, CANDIDATE);
  const kb = (invite.payload.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard;
  assert.equal(kb.length, 3);
  await run({ callback_query: { id: "cb3", from: user(CANDIDATE, "Rizal"), chat_instance: "x", data: kb[1][0].callback_data, message: { message_id: 3, date: 1, chat: { id: CANDIDATE, type: "private" } } } });
  const [iv] = await db.select().from(t.interviews).where(eq(t.interviews.candidateId, c.id)).orderBy(desc(t.interviews.createdAt));
  assert.equal(iv?.status, "scheduled");
  assert.match(String(last().payload.text), /Confirmed/);
});

test("/delete_my_data removes the candidate and their documents", async () => {
  await run({ message: pm(user(CANDIDATE, "Rizal"), "/delete_my_data") });
  const rows = await db.select().from(t.candidates).where(eq(t.candidates.telegramChatId, String(CANDIDATE)));
  assert.equal(rows.length, 0);
});

test("a business's own bot: /start apply respects the hiring switch (off for the salon)", async () => {
  await run({ message: pm(user(STRANGER, "Sam"), "/start apply") }, ownChannelId);
  assert.match(String(last("own").payload.text), /isn't taking job applications/);
});

test("connecting an own bot checks the token with Telegram and stores it encrypted", async () => {
  const { connectOwnBot } = await import("../src/channels/telegram/connect");
  await assert.rejects(connectOwnBot("KASIH1", "not-a-token"), /doesn't look like a bot token/);
  const api = recorder("connect");
  api.config.use(async (prev, method, payload, signal) => {
    if (method === "getMe") return { ok: true, result: { id: 7770001, is_bot: true, first_name: "Kasih", username: "kasih_hair_bot" } } as never;
    return prev(method, payload, signal);
  });
  const r = await connectOwnBot("KASIH1", "7770001:AAH" + "x".repeat(32), { api });
  assert.equal(r.username, "kasih_hair_bot");
  assert.equal(r.webhook, "local"); // APP_URL isn't public https in tests
  assert.ok(calls.some((c) => c.bot === "connect" && c.method === "setMyCommands"));
  const [ch] = await db.select().from(t.channels).where(eq(t.channels.id, ownChannelId));
  assert.equal(ch.config.mode, "own");
  assert.ok(ch.credentialsEnc && !ch.credentialsEnc.includes("7770001:AAH"));
  await assert.rejects(connectOwnBot("FORNO7", "7770001:AAH" + "x".repeat(32), { api }), /already connected to another business/);
});
