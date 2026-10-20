import { Api } from "grammy";
import { env } from "@/lib/env";

const g = globalThis as unknown as { __tgApi?: Api };

export function tg(): Api {
  if (!env.telegramToken) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  g.__tgApi ??= new Api(env.telegramToken);
  return g.__tgApi;
}

/** Test hook: replace the Bot API client (e.g. with one that records calls). */
export function setTelegramApi(api: Api) {
  g.__tgApi = api;
}

export async function downloadTelegramFile(fileId: string, maxBytes = 15 * 1024 * 1024): Promise<{ bytes: Buffer; path: string }> {
  const f = await tg().getFile(fileId);
  if (!f.file_path) throw new Error("Telegram returned no file_path");
  if (f.file_size && f.file_size > maxBytes) throw new Error("File too large");
  const res = await fetch(`https://api.telegram.org/file/bot${env.telegramToken}/${f.file_path}`);
  if (!res.ok) throw new Error(`File download failed: ${res.status}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), path: f.file_path };
}
