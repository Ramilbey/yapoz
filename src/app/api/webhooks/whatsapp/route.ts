import { enqueue } from "@/lib/jobs";
import { env } from "@/lib/env";
import { verifyMetaSignature, safeEqual } from "@/lib/crypto";
import { workspaceForWhatsAppNumber } from "@/channels/connections";
import { applyWhatsAppStatuses } from "@/channels/whatsapp";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Yapoz's own Meta app (env): the demo number and every number connected with Embedded Signup. Businesses that paste their
// own app's credentials use /api/webhooks/whatsapp/<channelId>.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const mode = u.searchParams.get("hub.mode");
  const token = u.searchParams.get("hub.verify_token") ?? "";
  const challenge = u.searchParams.get("hub.challenge") ?? "";
  if (mode === "subscribe" && env.whatsapp.verifyToken && safeEqual(token, env.whatsapp.verifyToken)) return new Response(challenge);
  return new Response("forbidden", { status: 403 });
}

type Entry = { changes?: { field?: string; value?: { metadata?: { phone_number_id?: string }; messages?: unknown[]; statuses?: unknown[] } }[] };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), env.whatsapp.appSecret)) return new Response("bad signature", { status: 401 });
  let body: { object?: string; entry?: Entry[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  // One app can serve many numbers: route each change by the phone number it arrived on.
  const byWorkspace = new Map<string, Entry[]>();
  for (const e of body.entry ?? []) {
    for (const c of e.changes ?? []) {
      const ws = await workspaceForWhatsAppNumber(c.value?.metadata?.phone_number_id ?? "");
      if (!ws) continue;
      // Delivery receipts are a few quick updates: applied right away, no job needed.
      if (c.value?.statuses?.length) await applyWhatsAppStatuses(ws, { entry: [{ id: "", changes: [c as never] }] });
      if (!c.value?.messages?.length) continue;
      byWorkspace.set(ws, [...(byWorkspace.get(ws) ?? []), { ...e, changes: [c] }]);
    }
  }
  const hash = createHash("sha256").update(raw).digest("hex");
  for (const [workspaceId, entry] of byWorkspace) {
    await enqueue("whatsapp.webhook", { workspaceId, body: { object: body.object, entry } }, { dedupeKey: `wa:${workspaceId}:${hash}`, workspaceId });
  }
  return Response.json({ ok: true });
}
