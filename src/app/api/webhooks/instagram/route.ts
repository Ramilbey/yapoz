import { enqueue } from "@/lib/jobs";
import { env } from "@/lib/env";
import { verifyMetaSignature, safeEqual } from "@/lib/crypto";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), env.instagram.appSecret)) return new Response("bad signature", { status: 401 });
  const body = JSON.parse(raw);
  const workspaceId = env.demoWorkspaceId;
  await enqueue("instagram.webhook", { workspaceId, body }, { dedupeKey: `ig:${createHash("sha256").update(raw).digest("hex")}`, workspaceId });
  return Response.json({ ok: true });
}
