import { enqueue } from "@/lib/jobs";
import { env } from "@/lib/env";
import { verifyMetaSignature, safeEqual } from "@/lib/crypto";
import { workspaceForInstagramAccount } from "@/channels/connections";
import { metaAppOf } from "@/channels/meta";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One Jawab app serves every business that connected Instagram; entry.id is the business's Instagram account.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const token = u.searchParams.get("hub.verify_token") ?? "";
  if (u.searchParams.get("hub.mode") === "subscribe" && env.instagram.verifyToken && safeEqual(token, env.instagram.verifyToken)) {
    return new Response(u.searchParams.get("hub.challenge") ?? "");
  }
  return new Response("forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  // Jawab's own Meta app (env) can vouch for every account. A business's saved Meta app can only vouch for that business's own
  // account, so one business can never forge messages into another's inbox.
  const platformOk = [env.instagram.appSecret, env.whatsapp.appSecret].some((secret) => secret && verifyMetaSignature(raw, signature, secret));
  let body: { object?: string; entry?: { id: string }[] } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  if (!body) return new Response(platformOk ? "bad request" : "bad signature", { status: platformOk ? 400 : 401 });
  const byWorkspace = new Map<string, { id: string }[]>();
  for (const e of body.entry ?? []) {
    const ws = await workspaceForInstagramAccount(String(e.id));
    if (!ws) continue;
    const app = platformOk ? null : await metaAppOf(ws);
    const own = platformOk || Boolean(app?.appSecret && verifyMetaSignature(raw, signature, app.appSecret));
    if (own) byWorkspace.set(ws, [...(byWorkspace.get(ws) ?? []), e]);
  }
  if (!platformOk && !byWorkspace.size) return new Response("bad signature", { status: 401 });
  const hash = createHash("sha256").update(raw).digest("hex");
  for (const [workspaceId, entry] of byWorkspace) {
    await enqueue("instagram.webhook", { workspaceId, body: { object: body.object, entry } }, { dedupeKey: `ig:${workspaceId}:${hash}`, workspaceId });
  }
  return Response.json({ ok: true });
}
