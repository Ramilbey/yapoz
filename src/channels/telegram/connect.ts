// Connecting Telegram from Settings → Channels. Two ways:
// 1. The shared Jawab bot: the owner taps a one-time link (proves which business they are), then adds the bot
//    under Telegram Business → Chatbots so replies come from their own account. Customers can also use
//    t.me/<shared bot>?start=<WORKSPACE>.
// 2. The business's own bot: paste a token from @BotFather; it gets its own webhook URL and secret.
import { Api } from "grammy";
import { randomBytes } from "node:crypto";
import { db, t } from "@/db";
import { and, eq, ne, sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { channelOf } from "../connections";
import { forgetBot } from "./api";

export const ALLOWED_UPDATES = ["message", "edited_message", "callback_query", "business_connection", "business_message", "edited_business_message", "deleted_business_messages"] as const;

export const COMMANDS = [{ command: "start", description: "Say hello" }];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** One-time code for t.me/<shared bot>?start=link_<code>, valid for 15 minutes. */
export async function createLinkCode(workspaceId: string) {
  if (!env.telegramToken || !env.telegramBotUsername) throw new Error("The shared Yapoz bot isn't set up on this server (TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME).");
  const bytes = randomBytes(10);
  const code = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  const expiresAt = new Date(Date.now() + 15 * 60_000);
  await db.insert(t.telegramLinks).values({ code, workspaceId, expiresAt });
  return { code, expiresAt, url: `https://t.me/${env.telegramBotUsername}?start=link_${code}` };
}

export const ownBotWebhookUrl = (channelId: string) => `${env.appUrl}/api/webhooks/telegram/${channelId}`;

export async function connectOwnBot(workspaceId: string, token: string, opts: { api?: Api } = {}) {
  if (!/^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(token.trim())) throw new Error("That doesn't look like a bot token. Copy it from @BotFather: it looks like 123456789:AA…");
  const api = opts.api ?? new Api(token.trim());
  let me: Awaited<ReturnType<Api["getMe"]>>;
  try {
    me = await api.getMe();
  } catch {
    throw new Error("Telegram didn't accept that token. Check it in @BotFather (/mybots → API Token).");
  }
  const [taken] = await db
    .select({ ws: t.channels.workspaceId })
    .from(t.channels)
    .where(and(eq(t.channels.type, "telegram"), ne(t.channels.workspaceId, workspaceId), sql`${t.channels.config}->>'botId' = ${String(me.id)}`));
  if (taken) throw new Error(`@${me.username} is already connected to another business on Yapoz.`);

  const ch = await channelOf(workspaceId, "telegram");
  const secret = randomBytes(24).toString("base64url");
  await db
    .update(t.channels)
    .set({ credentialsEnc: encryptJson({ token: token.trim(), secret }), config: { ...ch.config, mode: "own", botUsername: me.username, botId: String(me.id), botName: me.first_name }, enabled: true })
    .where(eq(t.channels.id, ch.id));
  forgetBot(ch.id);

  let webhook: "set" | "local" = "local";
  // Telegram only delivers to public https URLs; locally, `npm run telegram:poll` polls own bots too.
  if (env.appUrl.startsWith("https://")) {
    try {
      await api.setWebhook(ownBotWebhookUrl(ch.id), { secret_token: secret, allowed_updates: [...ALLOWED_UPDATES], max_connections: 20 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/Failed to resolve host/i.test(msg)) {
        await api.setWebhook(ownBotWebhookUrl(ch.id), {
          secret_token: secret,
          allowed_updates: [...ALLOWED_UPDATES],
          max_connections: 20,
          ip_address: "76.76.21.21",
        });
      } else {
        throw err;
      }
    }
    webhook = "set";
  }
  await api.setMyCommands(COMMANDS).catch(() => {});
  await db.insert(t.events).values({ workspaceId, type: "channel.connected", props: { channel: "telegram", bot: me.username } });
  return { channelId: ch.id, username: me.username, webhook };
}

export async function disconnectOwnBot(workspaceId: string) {
  const ch = await channelOf(workspaceId, "telegram");
  if (ch.credentialsEnc) {
    const { token } = decryptJson<{ token: string }>(ch.credentialsEnc);
    await new Api(token).deleteWebhook().catch(() => {});
  }
  const { mode: _m, botUsername: _u, botId: _i, botName: _n, ...rest } = ch.config;
  await db.update(t.channels).set({ credentialsEnc: null, config: rest }).where(eq(t.channels.id, ch.id));
  await db.delete(t.telegramChatBindings).where(eq(t.telegramChatBindings.botId, ch.id));
  forgetBot(ch.id);
}

/** Stop answering through one Telegram Business connection (the owner can also remove the bot in Telegram). */
export async function unlinkBusinessConnection(workspaceId: string, connectionId: string) {
  await db
    .update(t.telegramBusinessConnections)
    .set({ workspaceId: null, updatedAt: new Date() })
    .where(and(eq(t.telegramBusinessConnections.id, connectionId), eq(t.telegramBusinessConnections.workspaceId, workspaceId)));
  // Forget the owner's link so the connection isn't re-linked automatically.
  const [c] = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, connectionId));
  if (c) await db.delete(t.telegramLinks).where(and(eq(t.telegramLinks.workspaceId, workspaceId), eq(t.telegramLinks.telegramUserId, c.ownerUserId)));
}
