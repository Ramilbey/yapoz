// Yapoz's one Meta app (env) and a business's WhatsApp number (Phone number ID, Business Account ID, Access token): what
// Meta is asked before anything is saved, where each value is stored, and that webhooks are checked with the app's secret
// and routed by phone number, against a fake Graph API.
import "../scripts/env";
import { test, after, afterEach, before } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { db, t, sql } from "../src/db";
import { and, eq, inArray } from "drizzle-orm";
import { createWorkspace } from "../src/lib/workspace";
import { decryptJson, encryptJson } from "../src/lib/crypto";
import { MetaError } from "../src/channels/meta";
import { channelOf, channelStatus, connectWhatsApp, disconnectWhatsApp, whatsappCreds, type WhatsAppSecrets } from "../src/channels/connections";

const APP_ID = "1234567890123456";
const SECRET = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
const WABA = "109876543210987";
const PHONE = "106540352242922";
const GOOD = "EAAG-good-system-user-token-0000000000";
// Meta's own test number: the token can read the number, but Meta hides the (Meta-owned) account it sits on.
const WABA_HIDDEN = "119999999999999";
const PHONE_TEST = "144360293216111";

const BOTH = ["whatsapp_business_messaging", "whatsapp_business_management", "business_management"];
const tokens: Record<string, { app_id?: string; is_valid: boolean; expires_at?: number; scopes?: string[]; error?: { message: string } }> = {
  [GOOD]: { app_id: APP_ID, is_valid: true, expires_at: 0, scopes: BOTH },
  "EAAG-temporary-token-24-hours-000000": { app_id: APP_ID, is_valid: true, expires_at: Math.floor(Date.now() / 1000) + 23 * 3600, scopes: BOTH },
  "EAAG-token-of-another-meta-app-00000": { app_id: "999888777666", is_valid: true, expires_at: 0, scopes: BOTH },
  "EAAG-expired-token-000000000000000000": { app_id: APP_ID, is_valid: false, error: { message: "Error validating access token: Session has expired" } },
  "EAAG-token-without-management-0000000": { app_id: APP_ID, is_valid: true, expires_at: 0, scopes: ["whatsapp_business_messaging"] },
};

const graphCalls: string[] = [];
const realFetch = globalThis.fetch;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const u = new URL(String(input instanceof Request ? input.url : input));
  const path = u.pathname.replace(/^\/v[\d.]+\//, "");
  const auth = new Headers(init?.headers).get("authorization") ?? "";
  graphCalls.push(`${init?.method ?? "GET"} ${path}`);
  const err = (message: string, code = 190) => json({ error: { message, code } }, 400);
  if (path === APP_ID) return u.searchParams.get("access_token") === `${APP_ID}|${SECRET}` ? json({ id: APP_ID, name: "Kedai Test App" }) : err("Invalid OAuth access token - Cannot parse access token");
  if (path === "debug_token") {
    if (u.searchParams.get("access_token") !== `${APP_ID}|${SECRET}`) return err("Invalid OAuth access token");
    return json({ data: tokens[u.searchParams.get("input_token") ?? ""] ?? { is_valid: false, error: { message: "Cannot parse access token" } } });
  }
  if (path === `${WABA}/phone_numbers`) return auth ? json({ data: [{ id: PHONE, display_phone_number: "+60 12-345 6789", verified_name: "Kedai Test" }, { id: "100200300400500", display_phone_number: "+60 3-9999 0000" }] }) : err("no token");
  if (path === `${WABA}/subscribed_apps` && init?.method === "POST") return json({ success: true });
  if (path === `${WABA_HIDDEN}/phone_numbers` || path === `${WABA_HIDDEN}/subscribed_apps`) return err("Unsupported get request. Object with ID '119999999999999' does not exist, cannot be loaded due to missing permissions, or does not support this operation.", 100);
  if (path === PHONE_TEST) return auth ? json({ id: PHONE_TEST, display_phone_number: "+1 555-200-1464", verified_name: "Test Number" }) : err("no token");
  return err(`Unsupported get request. Object with ID '${path}' does not exist`, 100);
}) as typeof fetch;

const made: string[] = [];
const biz = async (name: string) => {
  const r = await createWorkspace({ name, timezone: "Asia/Kuala_Lumpur", owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  made.push(r.workspaceId);
  return r;
};
const wa = async (ws: string) => (await channelOf(ws, "whatsapp"));
const input = (over: Partial<{ phoneNumberId: string; wabaId: string; accessToken: string }> = {}) => ({ phoneNumberId: PHONE, wabaId: WABA, accessToken: GOOD, ...over });
const rejects = async (p: Promise<unknown>, field: string, message: RegExp) => {
  const e = (await p.then(() => null, (x) => x)) as MetaError | null;
  assert.ok(e instanceof MetaError, `expected a MetaError, got ${e}`);
  assert.equal(e.field, field);
  assert.match(e.message, message);
  return e;
};

before(() => {
  process.env.META_APP_ID = APP_ID;
  process.env.META_APP_SECRET = SECRET;
  process.env.WHATSAPP_VERIFY_TOKEN = "platform-verify";
});
// Every test uses the same fake number, so each one gives it back.
afterEach(async () => {
  if (made.length) await db.update(t.channels).set({ credentialsEnc: null, config: {} }).where(and(inArray(t.channels.workspaceId, made), eq(t.channels.type, "whatsapp")));
});
after(async () => {
  globalThis.fetch = realFetch;
  for (const id of made) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await new Promise((r) => setTimeout(r, 300));
  await sql.end();
});

test("a WhatsApp number can't be connected until the server has its Meta app", async () => {
  const { workspaceId: ws } = await biz("Kedai Tanpa App");
  process.env.META_APP_SECRET = "";
  graphCalls.length = 0;
  const err = (await connectWhatsApp(ws, input()).then(() => null, (x) => x)) as MetaError;
  assert.ok(err instanceof MetaError);
  assert.equal(err.field, null);
  assert.equal(err.status, 501);
  assert.equal(graphCalls.length, 0, "nothing was sent to Meta");
  assert.equal((await channelStatus(ws)).whatsapp.available, false);
  process.env.META_APP_SECRET = SECRET;
  assert.equal((await channelStatus(ws)).whatsapp.available, true);
});

test("connecting a number: each value lands in the right place, and the secret is not copied onto the number", async () => {
  const { workspaceId: ws } = await biz("Kedai Meta Dua");
  graphCalls.length = 0;
  const r = await connectWhatsApp(ws, input());
  assert.deepEqual(graphCalls, ["GET debug_token", `GET ${WABA}/phone_numbers`, `POST ${WABA}/subscribed_apps`], "token, number on account, then the webhook subscription");
  assert.equal(r.displayPhone, "+60 12-345 6789");
  assert.equal(r.verifiedName, "Kedai Test");
  assert.equal(r.tokenExpiresAt, null);

  const ch = await wa(ws);
  assert.equal(ch.config.phoneNumberId, PHONE);
  assert.equal(ch.config.wabaId, WABA);
  assert.equal(ch.config.appId, APP_ID);
  assert.deepEqual(decryptJson<WhatsAppSecrets>(ch.credentialsEnc!), { token: GOOD }, "only the access token is stored with the number");

  const creds = await whatsappCreds(ws);
  assert.deepEqual(creds && { appId: creds.appId, appSecret: creds.appSecret, verifyToken: creds.verifyToken, wabaId: creds.wabaId, phoneNumberId: creds.phoneNumberId, token: creds.token, source: creds.source, method: creds.method }, { appId: APP_ID, appSecret: SECRET, verifyToken: "platform-verify", wabaId: WABA, phoneNumberId: PHONE, token: GOOD, source: "workspace", method: "manual" });
  const status = await channelStatus(ws);
  assert.equal(status.whatsapp.connected, true);
  assert.equal(status.whatsapp.wabaId, WABA);
  assert.equal(status.whatsapp.wabaChecked, true, "Meta confirmed the number sits on the Business Account");
  assert.equal(status.whatsapp.tokenChecked, true);
  const json = JSON.stringify(status);
  for (const secret of [GOOD, SECRET, "platform-verify"]) assert.ok(!json.includes(secret), `leaked ${secret}`);
});

test("Meta's answers are turned into what to fix, per field, and a failed check saves nothing", async () => {
  const { workspaceId: ws } = await biz("Kedai Meta Tiga");
  const untouched = async () => assert.equal((await wa(ws)).credentialsEnc, null);

  await rejects(connectWhatsApp(ws, input({ accessToken: "EAAG-token-of-another-meta-app-00000" })), "accessToken", /made by a different Meta app \(999888777666\), not the one Yapoz runs on \(1234567890123456\)/);
  await rejects(connectWhatsApp(ws, input({ accessToken: "EAAG-expired-token-000000000000000000" })), "accessToken", /isn't valid \(Error validating access token: Session has expired\)/);
  await rejects(connectWhatsApp(ws, input({ accessToken: "EAAG-token-without-management-0000000" })), "accessToken", /missing the whatsapp_business_management permission/);
  await rejects(connectWhatsApp(ws, input({ accessToken: "EAAG-never-heard-of-this-token-000000" })), "accessToken", /isn't valid/);
  await rejects(connectWhatsApp(ws, input({ phoneNumberId: "555666777888999" })), "phoneNumberId", /isn't on WhatsApp Business Account 109876543210987\. That account has: \+60 12-345 6789 \(ID 106540352242922\), \+60 3-9999 0000 \(ID 100200300400500\)/);
  await rejects(connectWhatsApp(ws, input({ wabaId: "100000000000001" })), "wabaId", /Meta won't show the WhatsApp Business Account 100000000000001/);
  await untouched();
});

test("a Meta test number whose account Meta hides from the token still connects: the number is confirmed, the account is flagged, nothing is subscribed", async () => {
  const { workspaceId: ws } = await biz("Kedai Nombor Ujian");
  graphCalls.length = 0;
  const r = await connectWhatsApp(ws, input({ phoneNumberId: PHONE_TEST, wabaId: WABA_HIDDEN }));
  assert.equal(r.accountChecked, false);
  assert.equal(r.displayPhone, "+1 555-200-1464");
  assert.equal(r.verifiedName, "Test Number");
  assert.deepEqual(graphCalls, ["GET debug_token", `GET ${WABA_HIDDEN}/phone_numbers`, `GET ${PHONE_TEST}`], "no subscription attempt on an account Meta won't show");
  const ch = await wa(ws);
  assert.equal(ch.config.phoneNumberId, PHONE_TEST);
  assert.equal(ch.config.wabaChecked, false);
  const st = (await channelStatus(ws)).whatsapp;
  assert.equal(st.connected, true);
  assert.equal(st.wabaChecked, false, "the page says the account wasn't confirmed");
  // The token still has to be valid and from the right app: hiding the account doesn't excuse a bad token.
  await db.update(t.channels).set({ credentialsEnc: null, config: {} }).where(eq(t.channels.id, ch.id));
  await rejects(connectWhatsApp(ws, input({ phoneNumberId: PHONE_TEST, wabaId: WABA_HIDDEN, accessToken: "EAAG-token-of-another-meta-app-00000" })), "accessToken", /different Meta app/);
  // A number Meta shows neither way is refused with the account's error.
  await rejects(connectWhatsApp(ws, input({ phoneNumberId: "999000999000999", wabaId: WABA_HIDDEN })), "wabaId", /Meta won't show the WhatsApp Business Account 119999999999999/);
});

test("a temporary token is accepted, with the time it stops working, so the owner is warned", async () => {
  const { workspaceId: ws } = await biz("Kedai Meta Empat");
  const r = await connectWhatsApp(ws, input({ accessToken: "EAAG-temporary-token-24-hours-000000" }));
  const left = new Date(r.tokenExpiresAt!).getTime() - Date.now();
  assert.ok(left > 22 * 3600_000 && left < 24 * 3600_000, `expires in about a day, got ${left}`);
  assert.equal((await channelStatus(ws)).whatsapp.tokenExpiresAt, r.tokenExpiresAt);
});

test("one WhatsApp number can't be connected to two businesses", async () => {
  const a = await biz("Kedai Pertama");
  const b = await biz("Kedai Kedua");
  await connectWhatsApp(a.workspaceId, input());
  const e = await rejects(connectWhatsApp(b.workspaceId, input()), "phoneNumberId", /already connected to another business/);
  assert.equal(e.status, 409);
});

test("the one webhook answers Meta's handshake with the env verify token, checks the app secret, and routes by phone number", async () => {
  const { GET, POST } = await import("../src/app/api/webhooks/whatsapp/route");
  const { workspaceId: ws } = await biz("Kedai Webhook");
  await connectWhatsApp(ws, input());
  const handshake = (token: string) => GET(new Request(`http://x/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=ok42`));
  assert.equal(await (await handshake("platform-verify")).text(), "ok42");
  assert.equal((await handshake("something-else")).status, 403);

  const sign = (raw: string, secret: string) => "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  const hook = (raw: string, secret: string | null) => POST(new Request("http://x", { method: "POST", body: raw, headers: secret ? { "x-hub-signature-256": sign(raw, secret) } : {} }));
  const raw = JSON.stringify({ entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: PHONE }, statuses: [{ id: "s" }] } }] }] });
  assert.equal((await hook(raw, null)).status, 401, "unsigned is refused");
  assert.equal((await hook(raw, "0f9e8d7c6b5a49382716f5e4d3c2b1a0")).status, 401, "another app's secret is refused");
  assert.equal((await wa(ws)).config.lastWebhookAt, undefined);
  assert.equal((await hook(raw, SECRET)).status, 200);
  assert.ok((await wa(ws)).config.lastWebhookAt, "a delivery for this number is recorded");
});

test("disconnecting drops the access token and the number's details", async () => {
  const { workspaceId: ws } = await biz("Kedai Putus");
  await connectWhatsApp(ws, input());
  await disconnectWhatsApp(ws);
  const ch = await wa(ws);
  assert.equal(ch.credentialsEnc, null);
  assert.equal(ch.config.phoneNumberId, undefined);
  assert.equal(await whatsappCreds(ws), null);
  assert.equal((await channelStatus(ws)).whatsapp.connected, false);
});

test("the demo workspace falls back to the server's own variables, each mapped to its field", async () => {
  process.env.WHATSAPP_PHONE_NUMBER_ID = "8000000001";
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "8000000002";
  process.env.WHATSAPP_TOKEN = "env-token-0000000000000000";
  const creds = await whatsappCreds("FORNO7");
  assert.ok(creds && creds.source === "env");
  assert.deepEqual({ appId: creds.appId, appSecret: creds.appSecret, phoneNumberId: creds.phoneNumberId, wabaId: creds.wabaId, token: creds.token, verifyToken: creds.verifyToken }, { appId: APP_ID, appSecret: SECRET, phoneNumberId: "8000000001", wabaId: "8000000002", token: "env-token-0000000000000000", verifyToken: "platform-verify" });
  const status = await channelStatus("FORNO7");
  assert.equal(status.whatsapp.wabaId, "8000000002");
  assert.ok(!JSON.stringify(status).includes(SECRET));
  // A business that hasn't connected a number never inherits the demo's.
  const { workspaceId: other } = await biz("Kedai Lain");
  assert.equal(await whatsappCreds(other), null);
});
