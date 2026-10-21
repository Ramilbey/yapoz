import { enqueue } from "@/lib/jobs";
import { env } from "@/lib/env";
import { verifyMetaSignature, safeEqual } from "@/lib/crypto";
import { workspaceForWhatsAppNumber } from "@/channels/connections";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Jawab's own Meta app (env). Businesses that paste their own app's credentials use /api/webhooks/whatsapp/<channelId>.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const mode = u.searchParams.get("hub.mode");
  const token = u.searchParams.get("hub.verify_token") ?? "";
  const challenge = u.searchParams.get("hub.challenge") ?? "";
  if (mode === "subscribe" && env.whatsapp.verifyToken && safeEqual(token, env.whatsapp.verifyToken)) return new Response(challenge);
  return new Response("forbidden", { status: 403 });
}

type Entry = { changes?: { value?: { metadata?: { phone_number_id?: string }; messages?: unknown[] } }[] };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), env.whatsapp.appSecret)) return new Response("bad signature", { status: 401 });
  const body = JSON.parse(raw) as { object?: string; entry?: Entry[] };
  // One app can serve many numbers: route each change by the phone number it arrived on.
  const byWorkspace = new Map<string, Entry[]>();
  for (const e of body.entry ?? []) {
    for (const c of e.changes ?? []) {
      if (!c.value?.messages?.length) continue; // status callbacks (sent/delivered/read) carry no messages
      const ws = await workspaceForWhatsAppNumber(c.value.metadata?.phone_number_id ?? "");
      if (!ws) continue;
      byWorkspace.set(ws, [...(byWorkspace.get(ws) ?? []), { ...e, changes: [c] }]);
    }
  }
  const hash = createHash("sha256").update(raw).digest("hex");
  for (const [workspaceId, entry] of byWorkspace) {
    await enqueue("whatsapp.webhook", { workspaceId, body: { object: body.object, entry } }, { dedupeKey: `wa:${workspaceId}:${hash}`, workspaceId });
  }
  return Response.json({ ok: true });
}
