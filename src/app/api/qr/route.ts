import QRCode from "qrcode";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * QR codes for Telegram links. Default: the shared bot (falls back to the site's simulator section).
 * ?start=<payload> deep-links into a business (e.g. FORNO7); ?bot=<username> uses a business's own bot;
 * ?theme=light draws dark modules for light backgrounds.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const start = u.searchParams.get("start");
  const own = u.searchParams.get("bot");
  const botName = own && /^[A-Za-z0-9_]{5,32}$/.test(own) ? own : env.telegramBotUsername;
  const payload = start && /^[A-Za-z0-9_-]{1,64}$/.test(start) ? start : null;
  const target = botName ? `https://t.me/${botName}${payload ? `?start=${payload}` : ""}` : `${env.appUrl}/#ring`;
  const dark = u.searchParams.get("theme") === "light" ? "#0E0D0B" : "#F2ECE0";
  const svg = await QRCode.toString(target, { type: "svg", margin: 0, color: { dark, light: "#0000" }, errorCorrectionLevel: "M" });
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300", "x-qr-target": target } });
}
