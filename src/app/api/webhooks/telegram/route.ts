import { enqueue } from "@/lib/jobs";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Telegram retries until it gets a 2xx, so verify, enqueue and return immediately.
export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!env.telegramWebhookSecret || !safeEqual(secret, env.telegramWebhookSecret)) return new Response("unauthorized", { status: 401 });
  const update = (await req.json().catch(() => null)) as { update_id?: number } | null;
  if (!update?.update_id) return Response.json({ ok: true });
  // The shared Yapoz bot: the handler works out which business each chat belongs to.
  await enqueue("telegram.update", { bot: "platform", update }, { dedupeKey: `tg:platform:${update.update_id}` });
  return Response.json({ ok: true });
}
