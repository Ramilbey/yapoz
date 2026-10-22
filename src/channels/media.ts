// Fetches the bytes of a file a customer sent in chat. Each channel hands over a reference, not the file:
//   WhatsApp  media id → Graph API gives a short-lived URL → download with the business's token
//   Telegram  file id  → the bot's getFile → download
//   Instagram a CDN URL (only Meta's own hosts are fetched)
//   data:     inline bytes, for the simulator and tests
import { whatsappCreds } from "./connections";
import { downloadTelegramFile } from "./telegram/api";
import type { Attachment } from "@/db/schema";

export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

type Thread = { workspaceId: string; channel: "telegram" | "whatsapp" | "instagram" | "simulator"; routing: Record<string, unknown> };

const META_CDN = /(^|\.)(fbcdn\.net|cdninstagram\.com|fbsbx\.com)$/i;

async function download(url: string, token?: string): Promise<Buffer> {
  const res = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : undefined, signal: AbortSignal.timeout(15_000), cache: "no-store" });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  if (Number(res.headers.get("content-length") ?? 0) > MAX_MEDIA_BYTES) throw new Error("File too large");
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_MEDIA_BYTES) throw new Error("File too large");
  return bytes;
}

export async function fetchAttachment(thread: Thread, a: Attachment): Promise<Buffer> {
  const ref = a.ref;
  if (!ref) throw new Error("This attachment has no file reference");
  if (ref.startsWith("data:")) {
    const m = ref.match(/^data:[^;,]*;base64,(.*)$/s);
    if (!m) throw new Error("Unreadable inline file");
    const bytes = Buffer.from(m[1], "base64");
    if (bytes.length > MAX_MEDIA_BYTES) throw new Error("File too large");
    return bytes;
  }
  if (thread.channel === "telegram") {
    const bot = String(thread.routing.bot ?? "");
    if (!bot) throw new Error("No Telegram bot for this chat");
    return (await downloadTelegramFile(bot, ref, MAX_MEDIA_BYTES)).bytes;
  }
  if (thread.channel === "whatsapp") {
    const c = await whatsappCreds(thread.workspaceId);
    if (!c) throw new Error("WhatsApp isn't connected");
    const meta = await fetch(`https://graph.facebook.com/${c.graphVersion}/${encodeURIComponent(ref)}`, {
      headers: { authorization: `Bearer ${c.token}` }, signal: AbortSignal.timeout(12_000), cache: "no-store",
    });
    const j = (await meta.json().catch(() => ({}))) as { url?: string; file_size?: number; error?: { message?: string } };
    if (!meta.ok || !j.url) throw new Error(j.error?.message ?? `Meta wouldn't give the file (${meta.status})`);
    if ((j.file_size ?? 0) > MAX_MEDIA_BYTES) throw new Error("File too large");
    return download(j.url, c.token);
  }
  if (thread.channel === "instagram") {
    const u = new URL(ref);
    if (u.protocol !== "https:" || !META_CDN.test(u.hostname)) throw new Error("Not a Meta file URL");
    return download(u.toString());
  }
  throw new Error("This channel can't send files");
}
