import { enqueue } from "@/lib/jobs";
import { env } from "@/lib/env";
import { verifyMetaSignature, safeEqual } from "@/lib/crypto";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Webhook verification handshake.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const mode = u.searchParams.get("hub.mode");
  const token = u.searchParams.get("hub.verify_token") ?? "";
  const challenge = u.searchParams.get("hub.challenge") ?? "";
  if (mode === "subscribe" && env.whatsapp.verifyToken && safeEqual(token, env.whatsapp.verifyToken)) return new Response(challenge);
  return new Response("forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), env.whatsapp.appSecret)) return new Response("bad signature", { status: 401 });
  const body = JSON.parse(raw);
  const workspaceId = env.demoWorkspaceId;
  // Status callbacks (sent/delivered/read) carry no messages; skip them.
  const hasMessages = (body.entry ?? []).some((e: { changes?: { value?: { messages?: unknown[] } }[] }) => e.changes?.some((c) => c.value?.messages?.length));
  if (hasMessages) {
    await enqueue("whatsapp.webhook", { workspaceId, body }, { dedupeKey: `wa:${createHash("sha256").update(raw).digest("hex")}`, workspaceId });
  }
  return Response.json({ ok: true });
}
