// Local development without a public URL: long-polls Telegram for the shared Jawab bot and every business's
// own bot, and runs the same handler as the webhooks. Usage: npm run telegram:poll
// (stop it before setting webhooks again; polling removes a bot's webhook).
import "./env";
import { Api } from "grammy";
import { db, t } from "@/db";
import { eq, isNotNull, and } from "drizzle-orm";
import { handleTelegramUpdateJob } from "@/channels/telegram/handle";
import { ALLOWED_UPDATES } from "@/channels/telegram/connect";
import { decryptJson } from "@/lib/crypto";
import { env } from "@/lib/env";

const polling = new Map<string, boolean>();

async function poll(ref: string, token: string) {
  const api = new Api(token);
  await api.deleteWebhook({ drop_pending_updates: false });
  const me = await api.getMe();
  console.log(`Polling @${me.username} (${ref === "platform" ? "shared Jawab bot" : `own bot, channel ${ref}`})`);
  let offset = 0;
  while (polling.get(ref)) {
    try {
      const updates = await api.getUpdates({ offset, timeout: 30, allowed_updates: [...ALLOWED_UPDATES] });
      for (const u of updates) {
        offset = u.update_id + 1;
        console.log(`← @${me.username} ${Object.keys(u).find((k) => k !== "update_id")}`);
        await handleTelegramUpdateJob({ bot: ref, update: u as unknown as Record<string, unknown> }).catch((e) => console.error("handler failed:", e));
      }
    } catch (e) {
      console.error(`@${me.username} getUpdates failed, retrying in 3s:`, (e as Error).message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

function start(ref: string, token: string) {
  if (polling.get(ref)) return;
  polling.set(ref, true);
  poll(ref, token).catch((e) => {
    console.error(`stopped polling ${ref}:`, (e as Error).message);
    polling.delete(ref);
  });
}

if (env.telegramToken) start("platform", env.telegramToken);
// Pick up own bots as businesses connect them.
for (;;) {
  const rows = await db.select().from(t.channels).where(and(eq(t.channels.type, "telegram"), isNotNull(t.channels.credentialsEnc)));
  for (const ch of rows) start(ch.id, decryptJson<{ token: string }>(ch.credentialsEnc!).token);
  if (!polling.size) console.log("No bots to poll yet: set TELEGRAM_BOT_TOKEN or connect a bot in Settings → Channels.");
  await new Promise((r) => setTimeout(r, 15_000));
}
