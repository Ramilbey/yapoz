import { Api } from "grammy";
import { env } from "@/lib/env";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { decryptJson } from "@/lib/crypto";

/** "platform" = the shared Jawab bot (TELEGRAM_BOT_TOKEN). Any other ref is the id of a business's own-bot channel. */
export const PLATFORM = "platform";

type Entry = { api: Api; token: string; username?: string };
const g = globalThis as unknown as { __tgApis?: Map<string, Entry> };
const apis = (g.__tgApis ??= new Map());

export async function botEntry(ref: string = PLATFORM): Promise<Entry> {
  const hit = apis.get(ref);
  if (hit) return hit;
  let token: string;
  let username: string | undefined;
  if (ref === PLATFORM) {
    if (!env.telegramToken) throw new Error("TELEGRAM_BOT_TOKEN is not set");
    token = env.telegramToken;
    username = env.telegramBotUsername || undefined;
  } else {
    const [ch] = await db.select().from(t.channels).where(eq(t.channels.id, ref));
    if (!ch?.credentialsEnc) throw new Error("This Telegram bot isn't connected any more");
    token = decryptJson<{ token: string }>(ch.credentialsEnc).token;
    username = String(ch.config.botUsername ?? "") || undefined;
  }
  const entry = { api: new Api(token), token, username };
  apis.set(ref, entry);
  return entry;
}

export async function bot(ref: string = PLATFORM): Promise<Api> {
  return (await botEntry(ref)).api;
}

/** Platform bot, synchronously (scripts). */
export function tg(): Api {
  const hit = apis.get(PLATFORM);
  if (hit) return hit.api;
  if (!env.telegramToken) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const entry = { api: new Api(env.telegramToken), token: env.telegramToken, username: env.telegramBotUsername || undefined };
  apis.set(PLATFORM, entry);
  return entry.api;
}

/** Test hook: replace a bot's API client (e.g. with one that records calls). */
export function setTelegramApi(api: Api, ref: string = PLATFORM, username = "jawab_test_bot") {
  apis.set(ref, { api, token: "test", username });
}

export function forgetBot(ref: string) {
  apis.delete(ref);
}

export async function downloadTelegramFile(ref: string, fileId: string, maxBytes = 15 * 1024 * 1024): Promise<{ bytes: Buffer; path: string }> {
  const { api, token } = await botEntry(ref);
  const f = await api.getFile(fileId);
  if (!f.file_path) throw new Error("Telegram returned no file_path");
  if (f.file_size && f.file_size > maxBytes) throw new Error("File too large");
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${f.file_path}`);
  if (!res.ok) throw new Error(`File download failed: ${res.status}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), path: f.file_path };
}
