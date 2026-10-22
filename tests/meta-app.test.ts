// The Meta app (App ID + App secret, shared by WhatsApp and Instagram) and the WhatsApp number (Phone number ID,
// Business Account ID, Access token): what Meta is asked before anything is saved, where each value is stored, which
// secret webhooks are checked with, and that one business's secret can't speak for another's, against a fake Graph API.
import "../scripts/env";
import { test, after, afterEach, before } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { db, t, sql } from "../src/db";
import { and, eq, inArray } from "drizzle-orm";
import { createWorkspace } from "../src/lib/workspace";
import { decryptJson, encryptJson } from "../src/lib/crypto";
import { MetaError, metaAppOf, saveMetaApp, removeMetaApp, webhookAppSecret } from "../src/channels/meta";
import { channelOf, channelStatus, clearWebhookIssue, connectWhatsApp, whatsappCreds, whatsappDependsOnMetaApp, type WhatsAppSecrets } from "../src/channels/connections";

const APP_ID = "1234567890123456";
const SECRET = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
const OTHER_SECRET = "0f9e8d7c6b5a49382716f5e4d3c2b1a0";
const WABA = "109876543210987";
const PHONE = "106540352242922";
const GOOD = "EAAG-good-system-user-token-0000000000";

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
  process.env.INSTAGRAM_APP_SECRET = "p".repeat(32);
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

test("the Meta app is checked with Meta, saved apart from the number, and its secret never leaves the server", async () => {
  const { workspaceId: ws } = await biz("Kedai Meta Satu");
  await rejects(saveMetaApp(ws, null, APP_ID, OTHER_SECRET), "appSecret", /didn't accept this App ID and App secret together.*Invalid OAuth access token/);
  assert.equal(await metaAppOf(ws), null, "a wrong secret saves nothing");

  const saved = await saveMetaApp(ws, null, APP_ID, SECRET);
  assert.equal(saved.appName, "Kedai Test App");
  const [row] = await db.select().from(t.integrations).where(and(eq(t.integrations.workspaceId, ws), eq(t.integrations.provider, "meta_app")));
  assert.equal(row.meta.appId, APP_ID);
  assert.equal(row.meta.appName, "Kedai Test App");
  assert.ok(!JSON.stringify(row).includes(SECRET), "the secret is stored encrypted, not in the clear");
  assert.equal(decryptJson<{ appSecret: string }>(row.dataEnc).appSecret, SECRET);
  assert.deepEqual({ ...(await metaAppOf(ws)) }, { appId: APP_ID, appName: "Kedai Test App", appSecret: SECRET, source: "workspace" });

  const status = await channelStatus(ws);
  assert.deepEqual(status.metaApp, { connected: true, appId: APP_ID, appName: "Kedai Test App", source: "workspace" });
  assert.ok(!JSON.stringify(status).includes(SECRET));
  // Saving again replaces it instead of adding a second one.
  await saveMetaApp(ws, null, APP_ID, SECRET);
  assert.equal((await db.select().from(t.integrations).where(and(eq(t.integrations.workspaceId, ws), eq(t.integrations.provider, "meta_app")))).length, 1);
});

test("a WhatsApp number can't be connected before the Meta app exists", async () => {
  const { workspaceId: ws } = await biz("Kedai Tanpa App");
  graphCalls.length = 0;
  await rejects(connectWhatsApp(ws, input()), "appId", /Add your Meta app first/);
  assert.equal(graphCalls.length, 0, "nothing was sent to Meta");
});

test("connecting a number: each value lands in the right place, and the secret is not copied onto the number", async () => {
  const { workspaceId: ws } = await biz("Kedai Meta Dua");
  await saveMetaApp(ws, null, APP_ID, SECRET);
  graphCalls.length = 0;
  const r = await connectWhatsApp(ws, input());
  assert.deepEqual(graphCalls, ["GET debug_token", `GET ${WABA}/phone_numbers`, `POST ${WABA}/subscribed_apps`], "token, number on account, then the webhook subscription");
  assert.equal(r.displayPhone, "+60 12-345 6789");
  assert.equal(r.verifiedName, "Kedai Test");
  assert.equal(r.tokenExpiresAt, null);
  assert.match(r.webhookUrl, /\/api\/webhooks\/whatsapp\/[0-9a-f-]{36}$/);

  const ch = await wa(ws);
  assert.equal(ch.config.phoneNumberId, PHONE);
  assert.equal(ch.config.wabaId, WABA);
  assert.equal(ch.config.appId, APP_ID);
  const secrets = decryptJson<WhatsAppSecrets>(ch.credentialsEnc!);
  assert.equal(secrets.token, GOOD);
  assert.equal(secrets.verifyToken, r.verifyToken);
  assert.equal(secrets.appSecret, undefined, "the App secret lives with the Meta app only");

  const creds = await whatsappCreds(ws);
  assert.deepEqual(creds && { appId: creds.appId, appSecret: creds.appSecret, wabaId: creds.wabaId, phoneNumberId: creds.phoneNumberId, token: creds.token, source: creds.source }, { appId: APP_ID, appSecret: SECRET, wabaId: WABA, phoneNumberId: PHONE, token: GOOD, source: "workspace" });
  const wst = (await channelStatus(ws)).whatsapp;
  assert.equal(wst.connected, true);
  assert.equal(wst.wabaId, WABA);
  assert.equal(wst.needsMetaApp, false);
  assert.equal(wst.tokenChecked, true, "a number connected through the Meta app has had its token checked, even if it never expires");
  assert.ok(!JSON.stringify(await channelStatus(ws)).includes(GOOD), "the token is never sent to the browser");
  assert.equal(await whatsappDependsOnMetaApp(ws), true);
});

test("Meta's answers are turned into what to fix, per field, and a failed check saves nothing", async () => {
  const { workspaceId: ws } = await biz("Kedai Meta Tiga");
  await saveMetaApp(ws, null, APP_ID, SECRET);
  const untouched = async () => assert.equal((await wa(ws)).credentialsEnc, null);

  await rejects(connectWhatsApp(ws, input({ accessToken: "EAAG-token-of-another-meta-app-00000" })), "accessToken", /made by a different Meta app \(999888777666\), not 1234567890123456/);
  await rejects(connectWhatsApp(ws, input({ accessToken: "EAAG-expired-token-000000000000000000" })), "accessToken", /isn't valid \(Error validating access token: Session has expired\)/);
  await rejects(connectWhatsApp(ws, input({ accessToken: "EAAG-token-without-management-0000000" })), "accessToken", /missing the whatsapp_business_management permission/);
  await rejects(connectWhatsApp(ws, input({ accessToken: "EAAG-never-heard-of-this-token-000000" })), "accessToken", /isn't valid/);
  await rejects(connectWhatsApp(ws, input({ phoneNumberId: "555666777888999" })), "phoneNumberId", /isn't on WhatsApp Business Account 109876543210987\. That account has: \+60 12-345 6789 \(ID 106540352242922\), \+60 3-9999 0000 \(ID 100200300400500\)/);
  await rejects(connectWhatsApp(ws, input({ wabaId: "100000000000001" })), "wabaId", /Meta won't show the WhatsApp Business Account 100000000000001/);
  await untouched();
});

test("a temporary token is accepted, with the time it stops working, so the owner is warned", async () => {
  const { workspaceId: ws } = await biz("Kedai Meta Empat");
  await saveMetaApp(ws, null, APP_ID, SECRET);
  const r = await connectWhatsApp(ws, input({ accessToken: "EAAG-temporary-token-24-hours-000000" }));
  const left = new Date(r.tokenExpiresAt!).getTime() - Date.now();
  assert.ok(left > 22 * 3600_000 && left < 24 * 3600_000, `expires in about a day, got ${left}`);
  assert.equal((await channelStatus(ws)).whatsapp.tokenExpiresAt, r.tokenExpiresAt);
});

test("one WhatsApp number can't be connected to two businesses", async () => {
  const a = await biz("Kedai Pertama");
  const b = await biz("Kedai Kedua");
  for (const ws of [a.workspaceId, b.workspaceId]) await saveMetaApp(ws, null, APP_ID, SECRET);
  await connectWhatsApp(a.workspaceId, input());
  const e = await rejects(connectWhatsApp(b.workspaceId, input()), "phoneNumberId", /already connected to another business/);
  assert.equal(e.status, 409);
});

test("webhooks are checked with the Meta app's secret; older connections keep working until the Meta app is saved", async () => {
  const { POST } = await import("../src/app/api/webhooks/whatsapp/[channelId]/route");
  const sign = (raw: string, secret: string) => "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  const hook = (channelId: string, raw: string, secret: string | null) => POST(new Request("http://x", { method: "POST", body: raw, headers: secret ? { "x-hub-signature-256": sign(raw, secret) } : {} }), { params: Promise.resolve({ channelId }) });
  const raw = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: "s" }] } }] }] });

  // An older connection: the App secret was saved with the number, and it's the wrong one.
  const { workspaceId: ws } = await biz("Kedai Lama");
  const ch = await channelOf(ws, "whatsapp");
  await db.update(t.channels).set({ credentialsEnc: encryptJson({ token: GOOD, verifyToken: "v", appSecret: OTHER_SECRET }), config: { phoneNumberId: "777000111222333" } }).where(eq(t.channels.id, ch.id));
  assert.equal((await channelStatus(ws)).whatsapp.needsMetaApp, true);
  assert.equal((await channelStatus(ws)).whatsapp.tokenChecked, false, "an older connection's token has never been checked: the page must not say it doesn't expire");
  assert.equal(await whatsappDependsOnMetaApp(ws), false);
  assert.equal((await hook(ch.id, raw, OTHER_SECRET)).status, 200, "the old secret still works");
  assert.equal((await hook(ch.id, raw, SECRET)).status, 401, "Meta signs with the real secret: rejected until the Meta app is saved");
  assert.equal((await channelStatus(ws)).whatsapp.lastWebhookIssue, "signature");

  // Saving the Meta app fixes it without reconnecting the number, and clears the stale warning.
  await saveMetaApp(ws, null, APP_ID, SECRET);
  await clearWebhookIssue(ws);
  assert.equal((await channelStatus(ws)).whatsapp.lastWebhookIssue, null);
  assert.equal(await webhookAppSecret(ws, OTHER_SECRET), SECRET, "the Meta app wins over the old secret");
  assert.equal((await hook(ch.id, raw, SECRET)).status, 200);
  assert.equal((await hook(ch.id, raw, OTHER_SECRET)).status, 401);
  assert.equal((await hook(ch.id, raw, null)).status, 401, "unsigned is refused");
  assert.equal((await channelStatus(ws)).whatsapp.lastWebhookIssue, "signature");
});

test("a number connected through the Meta app says so, and the status shows it if the app is removed out from under it", async () => {
  const { workspaceId: ws } = await biz("Kedai Meta Lima");
  await saveMetaApp(ws, null, APP_ID, SECRET);
  await connectWhatsApp(ws, input());
  assert.equal(await whatsappDependsOnMetaApp(ws), true);
  // The API refuses to remove the app in that state; removing it directly shows what that protects against.
  await removeMetaApp(ws);
  assert.equal(await metaAppOf(ws), null);
  assert.equal((await channelStatus(ws)).whatsapp.needsMetaApp, true, "the number is left without its app: the status says so");
});

test("Instagram webhooks: Jawab's own app vouches for every account, a business's Meta app only for its own", async () => {
  const { POST } = await import("../src/app/api/webhooks/instagram/route");
  const a = await biz("Kedai Insta A");
  const b = await biz("Kedai Insta B");
  const SECRET_B = "b".repeat(32);
  for (const [ws, igId] of [[a.workspaceId, "17841400000000001"], [b.workspaceId, "17841400000000002"]] as const) {
    const ig = await channelOf(ws, "instagram");
    await db.update(t.channels).set({ config: { accountId: igId } }).where(eq(t.channels.id, ig.id));
  }
  await db.insert(t.integrations).values({ workspaceId: a.workspaceId, provider: "meta_app", dataEnc: encryptJson({ appSecret: SECRET }), meta: { appId: APP_ID } });
  await db.insert(t.integrations).values({ workspaceId: b.workspaceId, provider: "meta_app", dataEnc: encryptJson({ appSecret: SECRET_B }), meta: { appId: "222333444555" } });

  const send = (raw: string, secret: string | null) => POST(new Request("http://x", { method: "POST", body: raw, headers: secret ? { "x-hub-signature-256": "sha256=" + createHmac("sha256", secret).update(raw).digest("hex") } : {} }));
  const queued = async (ws: string) => (await db.select().from(t.jobs).where(eq(t.jobs.workspaceId, ws))).filter((j) => j.type === "instagram.webhook").length;
  const both = JSON.stringify({ object: "instagram", entry: [{ id: "17841400000000001", messaging: [] }, { id: "17841400000000002", messaging: [] }], note: "both" });

  // B signs a payload that names A's account as well as its own: only B's entry is accepted.
  assert.equal((await send(both, SECRET_B)).status, 200);
  assert.equal(await queued(a.workspaceId), 0, "B's secret can't speak for A");
  assert.equal(await queued(b.workspaceId), 1);
  // A signs it: only A's entry.
  assert.equal((await send(both.replace("both", "both2"), SECRET)).status, 200);
  assert.equal(await queued(a.workspaceId), 1);
  assert.equal(await queued(b.workspaceId), 1);
  // Jawab's own app (INSTAGRAM_APP_SECRET) covers every account.
  assert.equal((await send(both.replace("both", "both3"), "p".repeat(32))).status, 200);
  assert.equal(await queued(a.workspaceId), 2);
  assert.equal(await queued(b.workspaceId), 2);
  // Nobody's secret, or no signature at all, is refused; broken JSON never gets past either.
  assert.equal((await send(both.replace("both", "both4"), "z".repeat(32))).status, 401);
  assert.equal((await send(both.replace("both", "both5"), null)).status, 401);
  assert.equal((await send("{not json", null)).status, 401);
  assert.equal(await queued(a.workspaceId) + (await queued(b.workspaceId)), 4);
});

test("the demo workspace falls back to the server's own variables, each mapped to its field", async () => {
  process.env.META_APP_ID = "424242424242";
  process.env.META_APP_SECRET = "c".repeat(32);
  process.env.WHATSAPP_PHONE_NUMBER_ID = "8000000001";
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "8000000002";
  process.env.WHATSAPP_TOKEN = "env-token-0000000000000000";
  process.env.WHATSAPP_VERIFY_TOKEN = "env-verify";
  const app = await metaAppOf("FORNO7");
  assert.deepEqual({ ...app }, { appId: "424242424242", appName: null, appSecret: "c".repeat(32), source: "env" });
  const creds = await whatsappCreds("FORNO7");
  assert.ok(creds && creds.source === "env");
  assert.deepEqual({ appId: creds.appId, appSecret: creds.appSecret, phoneNumberId: creds.phoneNumberId, wabaId: creds.wabaId, token: creds.token, verifyToken: creds.verifyToken }, { appId: "424242424242", appSecret: "c".repeat(32), phoneNumberId: "8000000001", wabaId: "8000000002", token: "env-token-0000000000000000", verifyToken: "env-verify" });
  const status = await channelStatus("FORNO7");
  assert.equal(status.metaApp.source, "env");
  assert.equal(status.whatsapp.wabaId, "8000000002");
  assert.ok(!JSON.stringify(status).includes("c".repeat(32)));
  // A business that hasn't saved its own never inherits the demo's app.
  const { workspaceId: other } = await biz("Kedai Lain");
  assert.equal(await metaAppOf(other), null);
});
