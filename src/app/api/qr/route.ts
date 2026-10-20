import QRCode from "qrcode";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** QR to the live Telegram bot (falls back to the site's simulator section). */
export async function GET() {
  const target = env.telegramBotUsername ? `https://t.me/${env.telegramBotUsername}` : `${env.appUrl}/#ring`;
  const svg = await QRCode.toString(target, { type: "svg", margin: 0, color: { dark: "#F2ECE0", light: "#0000" }, errorCorrectionLevel: "M" });
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300", "x-qr-target": target } });
}
