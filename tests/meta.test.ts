// WhatsApp Cloud API + Instagram: signature checks, payload normalization, per-business credentials and
// routing (each business connects its own number / account), and the send rules (24-hour windows, one
// private reply per comment), against a stubbed fetch.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { db, t, sql } from "../src/db";
import { and, eq } from "drizzle-orm";
import { verifyMetaSignature, encryptJson } from "../src/lib/crypto";
import { normalizeWhatsApp, whatsappAdapter } from "../src/channels/whatsapp";
import { normalizeInstagram, instagramAdapter } from "../src/channels/instagram";
import { workspaceForWhatsAppNumber, workspaceForInstagramAccount, whatsappCreds, channelStatus } from "../src/channels/connections";

// The demo workspace (FORNO7) falls back to env credentials; any other business uses its own.
process.env.WHATSAPP_TOKEN = "wa-token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "1065";
process.env.INSTAGRAM_ACCESS_TOKEN = "ig-token";
process.env.INSTAGRAM_ACCOUNT_ID = "1784";

const requests: { url: string; auth: string; body: Record<string, unknown> }[] = [];
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  const h = new Headers(init?.headers);
  requests.push({ url: String(url), auth: h.get("authorization") ?? "", body: JSON.parse(String(init?.body ?? "{}")) });
  return new Response(JSON.stringify({ messages: [{ id: "wamid.X" }], message_id: "mid.Y", recipient_id: "r" }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

let salonWaChannel = "";
before(async () => {
  const [wa] = await db.select().from(t.channels).where(and(eq(t.channels.workspaceId, "KASIH1"), eq(t.channels.type, "whatsapp")));
  await db.update(t.channels).set({ credentialsEnc: encryptJson({ token: "salon-wa-token", appSecret: "a".repeat(32), verifyToken: "salon-verify" }), config: { phoneNumberId: "2077", displayPhone: "+60 3-1234 5678" } }).where(eq(t.channels.id, wa.id));
  salonWaChannel = wa.id;
  const [ig] = await db.select().from(t.channels).where(and(eq(t.channels.workspaceId, "KASIH1"), eq(t.channels.type, "instagram")));
  await db.update(t.channels).set({ credentialsEnc: encryptJson({ token: "salon-ig-token", expiresAt: Date.now() + 50 * 86400_000, refreshedAt: Date.now() }), config: { accountId: "1799", username: "kasih.hair" } }).where(eq(t.channels.id, ig.id));
});
after(async () => {
  await db.update(t.channels).set({ credentialsEnc: null, config: {} }).where(and(eq(t.channels.workspaceId, "KASIH1"), eq(t.channels.type, "whatsapp")));
  await db.update(t.channels).set({ credentialsEnc: null, config: {} }).where(and(eq(t.channels.workspaceId, "KASIH1"), eq(t.channels.type, "instagram")));
  await sql.end();
});

test("X-Hub-Signature-256 is verified against the raw body", () => {
  const raw = JSON.stringify({ hello: "world" });
  const sig = "sha256=" + createHmac("sha256", "secret").update(raw).digest("hex");
  assert.equal(verifyMetaSignature(raw, sig, "secret"), true);
  assert.equal(verifyMetaSignature(raw + " ", sig, "secret"), false);
  assert.equal(verifyMetaSignature(raw, null, "secret"), false);
});

test("WhatsApp text and button replies normalize into one event shape", () => {
  const evs = normalizeWhatsApp("FORNO7", {
    object: "whatsapp_business_account",
    entry: [{ id: "1", changes: [{ field: "messages", value: { metadata: { phone_number_id: "1065" }, contacts: [{ profile: { name: "Aisha" }, wa_id: "60123456789" }], messages: [
      { from: "60123456789", id: "wamid.1", timestamp: "1760950000", type: "text", text: { body: "large margherita how much" } },
      { from: "60123456789", id: "wamid.2", timestamp: "1760950010", type: "interactive", interactive: { type: "button_reply", button_reply: { id: "slot:abc:1", title: "Wed 21 Oct, 2:30pm" } } },
    ] } }] }],
  });
  assert.equal(evs.length, 2);
  assert.equal(evs[0].event.channel, "whatsapp");
  assert.equal(evs[0].event.externalThreadId, "wa:60123456789");
  assert.equal(evs[0].event.customer.displayName, "Aisha");
  assert.equal(evs[0].event.text, "large margherita how much");
  assert.equal(evs[1].buttonId, "slot:abc:1");
});

test("WhatsApp: each number routes to the business that connected it", async () => {
  assert.equal(await workspaceForWhatsAppNumber("2077"), "KASIH1");
  assert.equal(await workspaceForWhatsAppNumber("1065"), "FORNO7"); // env number = demo workspace
  assert.equal(await workspaceForWhatsAppNumber("9999"), null);
  const c = await whatsappCreds("KASIH1");
  assert.equal(c?.source, "workspace");
  assert.equal(c?.phoneNumberId, "2077");
});

test("WhatsApp: free-form inside the 24h window with the business's own token, refused outside it", async () => {
  await whatsappAdapter.send({ workspaceId: "KASIH1", routing: { waId: "60123456789" }, lastInboundAt: new Date() } as never, "RM 110 for long hair.");
  let r = requests.at(-1)!;
  assert.match(r.url, /graph\.facebook\.com\/v\d+\.\d+\/2077\/messages$/);
  assert.equal(r.auth, "Bearer salon-wa-token");
  await whatsappAdapter.send({ workspaceId: "FORNO7", routing: { waId: "60123456789" }, lastInboundAt: new Date() } as never, "RM 52 for a Large.");
  r = requests.at(-1)!;
  assert.match(r.url, /\/1065\/messages$/);
  assert.deepEqual(r.body.text, { body: "RM 52 for a Large.", preview_url: false });
  const old = { workspaceId: "FORNO7", routing: { waId: "60123456789" }, lastInboundAt: new Date(Date.now() - 25 * 3600_000) } as never;
  await assert.rejects(whatsappAdapter.send(old, "hello"), /24-hour/);
});

test("WhatsApp: a business's own webhook URL checks its verify token and app secret", async () => {
  const { GET, POST } = await import("../src/app/api/webhooks/whatsapp/[channelId]/route");
  const params = { params: Promise.resolve({ channelId: salonWaChannel }) };
  const ok = await GET(new Request(`http://x/api/webhooks/whatsapp/${salonWaChannel}?hub.mode=subscribe&hub.verify_token=salon-verify&hub.challenge=42`), params);
  assert.equal(await ok.text(), "42");
  const bad = await GET(new Request(`http://x/api/webhooks/whatsapp/${salonWaChannel}?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=42`), params);
  assert.equal(bad.status, 403);
  const raw = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: "s" }] } }] }] });
  const unsigned = await POST(new Request("http://x", { method: "POST", body: raw }), params);
  assert.equal(unsigned.status, 401);
  const sig = "sha256=" + createHmac("sha256", "a".repeat(32)).update(raw).digest("hex");
  const signed = await POST(new Request("http://x", { method: "POST", body: raw, headers: { "x-hub-signature-256": sig } }), params);
  assert.equal(signed.status, 200);
  // A forged message with no signature is refused, and the owner is told the app secret didn't match.
  const forged = JSON.stringify({ entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "2077" }, messages: [{ from: "60111", id: "wamid.F", timestamp: "1760950000", type: "text", text: { body: "free pizza?" } }] } }] }] });
  assert.equal((await POST(new Request("http://x", { method: "POST", body: forged }), params)).status, 401);
  assert.equal((await channelStatus("KASIH1")).whatsapp.lastWebhookIssue, "signature");
});

test("WhatsApp: Meta's Test button sample is recorded as proof the webhook works, but not answered", async () => {
  const { POST } = await import("../src/app/api/webhooks/whatsapp/[channelId]/route");
  const params = { params: Promise.resolve({ channelId: salonWaChannel }) };
  const sample = JSON.stringify({ object: "whatsapp_business_account", entry: [{ id: "0", changes: [{ field: "messages", value: { metadata: { phone_number_id: "123456123" }, messages: [{ from: "16315551181", id: "ABGGFlA5Fpa", timestamp: "1504902988", type: "text", text: { body: "this is a text message" } }] } }] }] });
  const sig = "sha256=" + createHmac("sha256", "a".repeat(32)).update(sample).digest("hex");
  const before = await db.select({ id: t.customers.id }).from(t.customers).where(eq(t.customers.externalId, "16315551181"));
  const res = await POST(new Request("http://x", { method: "POST", body: sample, headers: { "x-hub-signature-256": sig } }), params);
  assert.equal(res.status, 200);
  const st = (await channelStatus("KASIH1")).whatsapp;
  assert.equal(st.lastWebhookTest, true);
  assert.equal(st.lastWebhookIssue, null);
  assert.ok(st.lastWebhookAt);
  const afterRows = await db.select({ id: t.customers.id }).from(t.customers).where(eq(t.customers.externalId, "16315551181"));
  assert.equal(afterRows.length, before.length, "the sample isn't ingested");
});

test("Instagram: echoes are dropped, comments become private-reply threads (id or comment_id)", () => {
  const evs = normalizeInstagram("FORNO7", {
    object: "instagram",
    entry: [{ id: "1784", time: 1760950000, messaging: [
      { sender: { id: "555" }, recipient: { id: "1784" }, timestamp: 1760950000000, message: { mid: "m1", text: "open on monday?" } },
      { sender: { id: "1784" }, recipient: { id: "555" }, timestamp: 1760950001000, message: { mid: "m2", text: "We're closed", is_echo: true } },
    ], changes: [
      { field: "comments", value: { id: "c77", text: "price?", from: { id: "777", username: "foodie.kl" }, media: { id: "p1" } } },
      { field: "comments", value: { comment_id: "c78", text: "open sunday?", from: { id: "778" }, media: { id: "p1" } } },
      { field: "comments", value: { id: "c79", text: "thanks!", from: { id: "1784", username: "fornosette" } } },
    ] }],
  });
  assert.equal(evs.length, 3);
  assert.equal(evs[0].externalThreadId, "ig:555");
  assert.equal(evs[1].externalThreadId, "igc:c77");
  assert.equal(evs[1].routing?.commentId, "c77");
  assert.equal(evs[2].routing?.commentId, "c78");
});

test("Instagram: each account routes to its business; the first answer to a comment is the single private reply", async () => {
  assert.equal(await workspaceForInstagramAccount("1799"), "KASIH1");
  assert.equal(await workspaceForInstagramAccount("1784"), "FORNO7");
  const thread = { id: "00000000-0000-4000-8000-00000000ffff", workspaceId: "KASIH1", routing: { commentId: "c77", commentAt: Date.now() }, lastInboundAt: new Date() } as never;
  await instagramAdapter.send(thread, "Balayage starts at RM 380.");
  const r = requests.at(-1)!;
  assert.match(r.url, /graph\.instagram\.com\/v\d+\.\d+\/1799\/messages$/);
  assert.equal(r.auth, "Bearer salon-ig-token");
  assert.deepEqual(r.body.recipient, { comment_id: "c77" });
});

test("channel status never exposes tokens or app secrets", async () => {
  const st = await channelStatus("KASIH1");
  assert.equal(st.whatsapp.connected, true);
  assert.equal(st.whatsapp.displayPhone, "+60 3-1234 5678");
  assert.equal(st.instagram.username, "kasih.hair");
  const json = JSON.stringify(st);
  for (const secret of ["salon-wa-token", "salon-ig-token", "a".repeat(32)]) assert.ok(!json.includes(secret), `leaked ${secret}`);
});
