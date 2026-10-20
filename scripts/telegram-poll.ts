// Local development without a public URL: long-polls Telegram and runs the same handler as the webhook.
// Usage: npm run telegram:poll   (stop it before setting the webhook again)
import "./env";
import { tg } from "@/channels/telegram/api";
import { handleTelegramUpdateJob } from "@/channels/telegram/handle";
import { env } from "@/lib/env";

const ALLOWED = ["message", "edited_message", "channel_post", "callback_query", "my_chat_member", "business_connection", "business_message", "edited_business_message", "deleted_business_messages"] as const;

const api = tg();
await api.deleteWebhook({ drop_pending_updates: false });
const me = await api.getMe();
console.log(`Polling as @${me.username} for workspace ${env.demoWorkspaceId}. Ctrl+C to stop.`);
let offset = 0;
for (;;) {
  try {
    const updates = await api.getUpdates({ offset, timeout: 30, allowed_updates: [...ALLOWED] });
    for (const u of updates) {
      offset = u.update_id + 1;
      const kind = Object.keys(u).find((k) => k !== "update_id");
      console.log(`← ${kind}`);
      await handleTelegramUpdateJob({ workspaceId: env.demoWorkspaceId, update: u as unknown as Record<string, unknown> }).catch((e) => console.error("handler failed:", e));
    }
  } catch (e) {
    console.error("getUpdates failed, retrying in 3s:", (e as Error).message);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
