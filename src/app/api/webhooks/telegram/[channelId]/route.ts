import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { enqueue } from "@/lib/jobs";
import { decryptJson, safeEqual } from "@/lib/crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** A business's own bot. Each bot gets its own URL and secret token when it's connected. */
export async function POST(req: Request, ctx: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(channelId)) return new Response("not found", { status: 404 });
  const [ch] = await db.select().from(t.channels).where(and(eq(t.channels.id, channelId), eq(t.channels.type, "telegram")));
  if (!ch?.credentialsEnc) return new Response("not found", { status: 404 });
  const { secret } = decryptJson<{ secret: string }>(ch.credentialsEnc);
  if (!safeEqual(req.headers.get("x-telegram-bot-api-secret-token") ?? "", secret)) return new Response("unauthorized", { status: 401 });
  const update = (await req.json().catch(() => null)) as { update_id?: number } | null;
  if (!update?.update_id) return Response.json({ ok: true });
  await enqueue("telegram.update", { bot: channelId, update }, { dedupeKey: `tg:${channelId}:${update.update_id}`, workspaceId: ch.workspaceId });
  return Response.json({ ok: true });
}
