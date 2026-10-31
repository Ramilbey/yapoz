// WhatsApp Cloud API: signature checks, payload normalization, per-business credentials and
// routing (each business connects its own number), and the send rules (24-hour windows), against a stubbed fetch.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { db, t, sql } from "../src/db";
import { and, eq } from "drizzle-orm";
import { verifyMetaSignature, encryptJson } from "../src/lib/crypto";
import { normalizeWhatsApp, whatsappAdapter } from "../src/channels/whatsapp";
import { workspaceForWhatsAppNumber, whatsappCreds, channelStatus } from "../src/channels/connections";

// The demo workspace (FORNO7) falls back to env credentials; any other business uses its own.
process.env.WHATSAPP_TOKEN = "wa-token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "1065";
// Yapoz's one Meta app: its secret signs every webhook and its verify token answers Meta's handshake.
process.env.META_APP_SECRET = "a".repeat(32);
process.env.WHATSAPP_VERIFY_TOKEN = "salon-verify";

const requests: { url: string; auth: string; body: Record<string, unknown> }[] = [];
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  const h = new Headers(init?.headers);
  requests.push({ url: String(url), auth: h.get("authorization") ?? "", body: JSON.parse(String(init?.body ?? "{}")) });
  return new Response(JSON.stringify({ messages: [{ id: "wamid.X" }], message_id: "mid.Y", recipient_id: "r" }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

before(async () => {
  const [wa] = await db.select().from(t.channels).where(and(eq(t.channels.workspaceId, "KASIH1"), eq(t.channels.type, "whatsapp")));
  await db.update(t.channels).set({ credentialsEnc: encryptJson({ token: "salon-wa-token" }), config: { phoneNumberId: "2077", displayPhone: "+60 3-1234 5678" } }).where(eq(t.channels.id, wa.id));
});
after(async () => {
  await db.update(t.channels).set({ credentialsEnc: null, config: {} }).where(and(eq(t.channels.workspaceId, "KASIH1"), eq(t.channels.type, "whatsapp")));
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

test("WhatsApp: 'typing…' is shown on the customer's message with the business's own number and token", async () => {
  const before = requests.length;
  await whatsappAdapter.typing!({ workspaceId: "KASIH1", routing: { waId: "60123456789" }, lastInboundAt: new Date() } as never, { externalMessageId: "wamid.CUSTOMER1" });
  const r = requests.at(-1)!;
  assert.equal(requests.length, before + 1);
  assert.match(r.url, /graph\.facebook\.com\/v\d+\.\d+\/2077\/messages$/);
  assert.equal(r.auth, "Bearer salon-wa-token");
  assert.deepEqual(r.body, { messaging_product: "whatsapp", status: "read", message_id: "wamid.CUSTOMER1", typing_indicator: { type: "text" } });
  // Without the customer's message id there's nothing to attach it to: no request.
  await whatsappAdapter.typing!({ workspaceId: "KASIH1", routing: { waId: "60123456789" } } as never, { externalMessageId: null });
  assert.equal(requests.length, before + 1);
});

test("WhatsApp: the one webhook checks the verify token and the app secret, and routes by phone number", async () => {
  const { GET, POST } = await import("../src/app/api/webhooks/whatsapp/route");
  const ok = await GET(new Request("http://x/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=salon-verify&hub.challenge=42"));
  assert.equal(await ok.text(), "42");
  const bad = await GET(new Request("http://x/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=42"));
  assert.equal(bad.status, 403);
  const sign = (raw: string) => "sha256=" + createHmac("sha256", "a".repeat(32)).update(raw).digest("hex");
  const msg = (id: string, phone: string) => JSON.stringify({ entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: phone }, messages: [{ from: "60111", id, timestamp: "1760950000", type: "text", text: { body: "free pizza?" } }] } }] }] });
  // A forged message with no signature is refused.
  assert.equal((await POST(new Request("http://x", { method: "POST", body: msg("wamid.F", "2077") }))).status, 401);
  // A signed one for the salon's number is accepted and noted, so Settings can show the webhook works.
  const real = msg("wamid.R", "2077");
  assert.equal((await POST(new Request("http://x", { method: "POST", body: real, headers: { "x-hub-signature-256": sign(real) } }))).status, 200);
  assert.ok((await channelStatus("KASIH1")).whatsapp.lastWebhookAt);
});

test("WhatsApp: Meta's Test button sample, for a made-up number, is acknowledged but not answered", async () => {
  const { POST } = await import("../src/app/api/webhooks/whatsapp/route");
  const sample = JSON.stringify({ object: "whatsapp_business_account", entry: [{ id: "0", changes: [{ field: "messages", value: { metadata: { phone_number_id: "123456123" }, messages: [{ from: "16315551181", id: "ABGGFlA5Fpa", timestamp: "1504902988", type: "text", text: { body: "this is a text message" } }] } }] }] });
  const sig = "sha256=" + createHmac("sha256", "a".repeat(32)).update(sample).digest("hex");
  const before = await db.select({ id: t.customers.id }).from(t.customers).where(eq(t.customers.externalId, "16315551181"));
  const res = await POST(new Request("http://x", { method: "POST", body: sample, headers: { "x-hub-signature-256": sig } }));
  assert.equal(res.status, 200);
  const afterRows = await db.select({ id: t.customers.id }).from(t.customers).where(eq(t.customers.externalId, "16315551181"));
  assert.equal(afterRows.length, before.length, "the sample isn't ingested");
});

test("channel status never exposes tokens or app secrets", async () => {
  const st = await channelStatus("KASIH1");
  assert.equal(st.whatsapp.connected, true);
  assert.equal(st.whatsapp.displayPhone, "+60 3-1234 5678");
  const json = JSON.stringify(st);
  for (const secret of ["salon-wa-token", "a".repeat(32)]) assert.ok(!json.includes(secret), `leaked ${secret}`);
});
