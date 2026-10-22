import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { enqueue } from "@/lib/jobs";
import { decryptJson, safeEqual, verifyMetaSignature } from "@/lib/crypto";
import { webhookAppSecret } from "@/channels/meta";
import type { WhatsAppSecrets } from "@/channels/connections";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** A business that connected WhatsApp with its own Meta app: its own callback URL, verify token and app secret. */
async function channel(ctx: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(channelId)) return null;
  const [ch] = await db.select().from(t.channels).where(and(eq(t.channels.id, channelId), eq(t.channels.type, "whatsapp")));
  if (!ch?.credentialsEnc) return null;
  const secrets = decryptJson<WhatsAppSecrets>(ch.credentialsEnc);
  // A disconnected number keeps only its verify token: Meta's handshake still passes, but nothing is answered.
  return { ch, secrets, connected: Boolean(secrets.token && ch.config.phoneNumberId) };
}

/** What Settings → Channels shows the owner: when Meta last reached us, and whether it was a real message. */
async function note(channelId: string, info: { issue: "signature" | null; test: boolean }) {
  const patch = { lastWebhookAt: new Date().toISOString(), lastWebhookIssue: info.issue, lastWebhookTest: info.test };
  await db
    .update(t.channels)
    .set({ config: sql`${t.channels.config} || ${JSON.stringify(patch)}::jsonb` })
    .where(eq(t.channels.id, channelId))
    .catch((e) => console.error("[whatsapp:webhook] couldn't record status", e));
}

type Change = { field?: string; value?: { messages?: unknown[]; metadata?: { phone_number_id?: string } } };
type Body = { object?: string; entry?: { id?: string; changes?: Change[] }[] };

export async function GET(req: Request, ctx: { params: Promise<{ channelId: string }> }) {
  const c = await channel(ctx);
  const u = new URL(req.url);
  const token = u.searchParams.get("hub.verify_token") ?? "";
  if (c && u.searchParams.get("hub.mode") === "subscribe" && safeEqual(token, c.secrets.verifyToken)) return new Response(u.searchParams.get("hub.challenge") ?? "");
  return new Response("forbidden", { status: 403 });
}

export async function POST(req: Request, ctx: { params: Promise<{ channelId: string }> }) {
  const c = await channel(ctx);
  if (!c) return new Response("not found", { status: 404 });
  // 200, not an error: Meta would otherwise keep retrying deliveries for a number the owner chose to disconnect.
  if (!c.connected) return Response.json({ ok: true, ignored: "not connected" });
  const raw = await req.text();
  // Meta signs every delivery with the app secret; without this check anyone could post fake customer messages.
  // The secret comes from the business's saved Meta app; connections made before that existed keep the one stored with the number.
  const appSecret = (await webhookAppSecret(c.ch.workspaceId, c.secrets.appSecret)).trim();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), appSecret)) {
    console.error(`[whatsapp:webhook] Bad signature for channel ${c.ch.id}: the App secret saved in Jawab doesn't match the Meta app sending these webhooks.`);
    await note(c.ch.id, { issue: "signature", test: false });
    return new Response("bad signature", { status: 401 });
  }
  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // Only messages to this business's number. Meta's "Test" button sends a sample for a made-up number:
  // record that it arrived (proof the webhook works) but don't answer it.
  const mine = String(c.ch.config.phoneNumberId ?? "");
  const ours = (x: Change) => Boolean(x.value?.messages?.length) && (!x.value?.metadata?.phone_number_id || x.value.metadata.phone_number_id === mine);
  const entry = (body.entry ?? []).map((e) => ({ ...e, changes: (e.changes ?? []).filter(ours) })).filter((e) => e.changes.length);
  const sample = !entry.length && (body.entry ?? []).some((e) => e.changes?.some((x) => x.value?.messages?.length));
  if (entry.length || sample) await note(c.ch.id, { issue: null, test: sample });
  if (sample) console.log(`[whatsapp:webhook] Test webhook for another number received on channel ${c.ch.id}; not answered.`);

  if (entry.length) {
    // Answer before responding: Meta retries slow deliveries, and the dedupe key drops the repeats.
    await enqueue(
      "whatsapp.webhook",
      { workspaceId: c.ch.workspaceId, body: { object: body.object, entry } },
      { dedupeKey: `wa:${c.ch.workspaceId}:${createHash("sha256").update(raw).digest("hex")}`, workspaceId: c.ch.workspaceId, run: "now" },
    );
  }
  return Response.json({ ok: true });
}
