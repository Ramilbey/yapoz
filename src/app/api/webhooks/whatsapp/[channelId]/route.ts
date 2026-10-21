import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { enqueue } from "@/lib/jobs";
import { decryptJson, safeEqual, verifyMetaSignature } from "@/lib/crypto";
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
  return { ch, secrets: decryptJson<WhatsAppSecrets>(ch.credentialsEnc) };
}

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
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), c.secrets.appSecret)) return new Response("bad signature", { status: 401 });
  const body = JSON.parse(raw) as { entry?: { changes?: { value?: { messages?: unknown[]; metadata?: { phone_number_id?: string } } }[] }[] };
  const mine = String(c.ch.config.phoneNumberId ?? "");
  const hasMessages = (body.entry ?? []).some((e) => e.changes?.some((x) => x.value?.messages?.length && (!x.value.metadata?.phone_number_id || x.value.metadata.phone_number_id === mine)));
  if (hasMessages) {
    await enqueue("whatsapp.webhook", { workspaceId: c.ch.workspaceId, body }, { dedupeKey: `wa:${c.ch.workspaceId}:${createHash("sha256").update(raw).digest("hex")}`, workspaceId: c.ch.workspaceId });
  }
  return Response.json({ ok: true });
}
