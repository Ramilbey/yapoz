// Points the shared Jawab bot at APP_URL/api/webhooks/telegram with the secret token, and registers the bot commands.
import "./env";
import { tg } from "@/channels/telegram/api";
import { env } from "@/lib/env";
import { ALLOWED_UPDATES, COMMANDS } from "@/channels/telegram/connect";

if (!env.telegramWebhookSecret) throw new Error("Set TELEGRAM_WEBHOOK_SECRET (A-Z a-z 0-9 _ -, 1-256 chars)");
if (!env.appUrl.startsWith("https://")) throw new Error(`APP_URL must be a public https URL (got ${env.appUrl}). For local dev use: npm run telegram:poll`);
const api = tg();
const url = `${env.appUrl}/api/webhooks/telegram`;
await api.setWebhook(url, {
  secret_token: env.telegramWebhookSecret,
  allowed_updates: [...ALLOWED_UPDATES],
  max_connections: 40,
});
await api.setMyCommands(COMMANDS(true));
const info = await api.getWebhookInfo();
console.log("Webhook set:", info.url, info.pending_update_count ? `(pending ${info.pending_update_count})` : "");
