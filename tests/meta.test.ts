// WhatsApp Cloud API + Instagram adapters: signature checks, payload normalization and the send rules
// (24-hour windows, one private reply per comment), against a stubbed fetch.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { sql } from "../src/db";
import { verifyMetaSignature } from "../src/lib/crypto";
import { normalizeWhatsApp, whatsappAdapter } from "../src/channels/whatsapp";
import { normalizeInstagram, instagramAdapter } from "../src/channels/instagram";

process.env.WHATSAPP_TOKEN = "wa-token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "1065";
process.env.INSTAGRAM_ACCESS_TOKEN = "ig-token";
process.env.INSTAGRAM_ACCOUNT_ID = "1784";

const requests: { url: string; body: Record<string, unknown> }[] = [];
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  requests.push({ url: String(url), body: JSON.parse(String(init?.body ?? "{}")) });
  return new Response(JSON.stringify({ messages: [{ id: "wamid.X" }], message_id: "mid.Y", recipient_id: "r" }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

after(async () => {
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

test("WhatsApp: free-form inside the 24h window, refused outside it", async () => {
  const thread = { routing: { waId: "60123456789" }, lastInboundAt: new Date() } as never;
  await whatsappAdapter.send(thread, "RM 52 for a Large.");
  const r = requests.at(-1)!;
  assert.match(r.url, /graph\.facebook\.com\/v\d+\.\d+\/1065\/messages$/);
  assert.deepEqual(r.body.text, { body: "RM 52 for a Large.", preview_url: false });
  const old = { routing: { waId: "60123456789" }, lastInboundAt: new Date(Date.now() - 25 * 3600_000) } as never;
  await assert.rejects(whatsappAdapter.send(old, "hello"), /24-hour/);
});

test("Instagram: echoes are dropped, comments become private-reply threads", () => {
  const evs = normalizeInstagram("FORNO7", {
    object: "instagram",
    entry: [{ id: "1784", time: 1760950000, messaging: [
      { sender: { id: "555" }, recipient: { id: "1784" }, timestamp: 1760950000000, message: { mid: "m1", text: "open on monday?" } },
      { sender: { id: "1784" }, recipient: { id: "555" }, timestamp: 1760950001000, message: { mid: "m2", text: "We're closed", is_echo: true } },
    ], changes: [{ field: "comments", value: { id: "c77", text: "price?", from: { id: "777", username: "foodie.kl" }, media: { id: "p1" } } }] }],
  });
  assert.equal(evs.length, 2);
  assert.equal(evs[0].externalThreadId, "ig:555");
  assert.equal(evs[1].externalThreadId, "igc:c77");
  assert.equal(evs[1].routing?.commentId, "c77");
});

test("Instagram: first answer to a comment is the single private reply", async () => {
  const thread = { id: "00000000-0000-4000-8000-00000000ffff", routing: { commentId: "c77", commentAt: Date.now() }, lastInboundAt: new Date() } as never;
  await instagramAdapter.send(thread, "Margherita starts at RM 28.");
  const r = requests.at(-1)!;
  assert.match(r.url, /graph\.instagram\.com\/v\d+\.\d+\/1784\/messages$/);
  assert.deepEqual(r.body.recipient, { comment_id: "c77" });
});
