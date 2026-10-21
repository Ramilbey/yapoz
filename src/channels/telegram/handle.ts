// Telegram updates for every business. Two kinds of bot:
// - the shared Jawab bot ("platform"): one bot for everyone. Businesses connect it to their Telegram Business
//   account after proving ownership with a link code; customers reach a business through t.me/<bot>?start=<WORKSPACE>.
// - a business's own bot (ref = channel id): every update belongs to that business.
import type { Update, Message, CallbackQuery, ChatMemberUpdated, BusinessConnection } from "grammy/types";
import type { Api } from "grammy";
import { db, t } from "@/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import { botEntry, downloadTelegramFile, PLATFORM } from "./api";
import { ingest, respond } from "@/agent/pipeline";
import { handleApplyFlow, startApply, deleteMyData } from "./apply";
import { addCandidate } from "@/hiring/ingest";
import { pickSlot } from "@/hiring/schedule";
import { extractPdfText } from "@/hiring/pdf";
import { env } from "@/lib/env";
import type { Attachment } from "@/db/schema";

type Payload = { bot?: string; update: Update };
export type BotCtx = { ref: string; api: Api; username?: string; fixedWorkspace: string | null };

export async function handleTelegramUpdateJob(payload: Record<string, unknown>) {
  const p = payload as unknown as Payload;
  const ref = p.bot ?? PLATFORM;
  const entry = await botEntry(ref);
  let fixed: string | null = null;
  if (ref !== PLATFORM) {
    const [ch] = await db.select({ ws: t.channels.workspaceId }).from(t.channels).where(eq(t.channels.id, ref));
    fixed = ch?.ws ?? null;
  }
  const ctx: BotCtx = { ref, api: entry.api, username: entry.username, fixedWorkspace: fixed };
  const u = p.update;
  if (u.business_connection) return onBusinessConnection(ctx, u.business_connection);
  if (u.business_message) return onBusinessMessage(ctx, u.business_message);
  if (u.callback_query) return onCallback(ctx, u.callback_query);
  if (u.my_chat_member) return onMyChatMember(ctx, u.my_chat_member);
  if (u.channel_post) return onSourcePost(ctx, u.channel_post);
  if (u.message) {
    const m = u.message;
    if (m.chat.type === "private") return onPrivateMessage(ctx, m);
    if (m.chat.type === "group" || m.chat.type === "supergroup") return onSourcePost(ctx, m);
  }
}

function attachmentsOf(m: Message): Attachment[] {
  const out: Attachment[] = [];
  if (m.document) out.push({ kind: "document", name: m.document.file_name, mime: m.document.mime_type, ref: m.document.file_id });
  if (m.photo?.length) out.push({ kind: "image", ref: m.photo[m.photo.length - 1].file_id });
  if (m.voice) out.push({ kind: "voice", mime: m.voice.mime_type, ref: m.voice.file_id });
  return out;
}

function displayName(u?: { first_name: string; last_name?: string; username?: string }) {
  if (!u) return null;
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || null;
}

async function wsName(workspaceId: string) {
  const [w] = await db.select({ name: t.workspaces.name }).from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  return w?.name ?? "the business";
}

/** Workspace a Telegram user proved they own (via a link code), for the shared bot. */
async function linkedWorkspaceOf(telegramUserId: string): Promise<string | null> {
  const rows = await db.select().from(t.telegramLinks).where(eq(t.telegramLinks.telegramUserId, telegramUserId));
  const latest = rows.filter((r) => r.usedAt).sort((a, b) => b.usedAt!.getTime() - a.usedAt!.getTime())[0];
  return latest?.workspaceId ?? null;
}

async function chatWorkspace(ctx: BotCtx, chatId: number | string): Promise<string | null> {
  if (ctx.fixedWorkspace) return ctx.fixedWorkspace;
  const [b] = await db.select().from(t.telegramChatBindings).where(and(eq(t.telegramChatBindings.botId, ctx.ref), eq(t.telegramChatBindings.chatId, String(chatId))));
  return b?.workspaceId ?? null;
}

async function bindChat(ctx: BotCtx, chatId: number | string, workspaceId: string) {
  await db
    .insert(t.telegramChatBindings)
    .values({ botId: ctx.ref, chatId: String(chatId), workspaceId })
    .onConflictDoUpdate({ target: [t.telegramChatBindings.botId, t.telegramChatBindings.chatId], set: { workspaceId, updatedAt: new Date() } });
}

async function onBusinessConnection(ctx: BotCtx, c: BusinessConnection) {
  const ws = ctx.fixedWorkspace ?? (await linkedWorkspaceOf(String(c.user.id)));
  await db
    .insert(t.telegramBusinessConnections)
    .values({ id: c.id, workspaceId: ws, botId: ctx.ref, ownerUserId: String(c.user.id), ownerChatId: String(c.user_chat_id), canReply: Boolean(c.rights?.can_reply), rights: (c.rights ?? {}) as Record<string, boolean>, isEnabled: c.is_enabled })
    .onConflictDoUpdate({
      target: t.telegramBusinessConnections.id,
      set: { canReply: Boolean(c.rights?.can_reply), rights: (c.rights ?? {}) as Record<string, boolean>, isEnabled: c.is_enabled, updatedAt: new Date(), ...(ws ? { workspaceId: ws } : {}) },
    });
  if (ws) await db.insert(t.events).values({ workspaceId: ws, type: "telegram.business_connection", props: { enabled: c.is_enabled, canReply: Boolean(c.rights?.can_reply), owner: displayName(c.user) } });
  if (!c.is_enabled) return;
  const text = !ws
    ? `I'm connected to your Telegram Business account, but I don't know which business it is yet. Open Jawab → Channels → Telegram and tap “Link my Telegram”.`
    : c.rights?.can_reply
      ? `Connected to ${await wsName(ws)}. I'll answer customer chats from your own account. Messages you type yourself are never touched.`
      : `Connected to ${await wsName(ws)}, but I can't reply yet: allow “Reply to messages” in Settings → Business → Chatbots.`;
  await ctx.api.sendMessage(c.user_chat_id, text).catch(() => {});
}

async function onBusinessMessage(ctx: BotCtx, m: Message) {
  const bcId = m.business_connection_id;
  if (!bcId) return;
  let [conn] = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, bcId));
  if (!conn) {
    const c = await ctx.api.getBusinessConnection(bcId);
    await onBusinessConnection(ctx, c);
    [conn] = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, bcId));
  }
  if (!conn || !conn.isEnabled || !conn.workspaceId) return;
  // Ignore anything the owner typed themselves, and our own messages sent on their behalf.
  if (m.sender_business_bot || String(m.from?.id) === conn.ownerUserId) return;
  const r = await ingest({
    workspaceId: conn.workspaceId, channel: "telegram", externalThreadId: `biz:${bcId}:${m.chat.id}`,
    customer: { externalId: String(m.from?.id ?? m.chat.id), displayName: displayName(m.from), username: m.from?.username ?? null },
    text: m.text ?? m.caption ?? "", attachments: attachmentsOf(m), receivedAt: new Date(m.date * 1000), externalMessageId: String(m.message_id),
    routing: { chatId: m.chat.id, businessConnectionId: bcId, bot: ctx.ref, mode: "business" },
  });
  if (r.duplicate) return;
  if (!conn.canReply) {
    await db.insert(t.events).values({ workspaceId: conn.workspaceId, type: "telegram.cannot_reply", props: { threadId: r.thread.id } });
    return;
  }
  await respond(r.thread.id, r.messageId);
}

/** /start payloads on the shared bot: link_<code> (owner), apply_<WS> (candidate), <WS> (customer). */
async function onStart(ctx: BotCtx, m: Message, arg: string | undefined): Promise<boolean> {
  const from = String(m.from?.id ?? m.chat.id);
  if (arg?.startsWith("link_")) {
    const code = arg.slice(5);
    const [link] = await db.select().from(t.telegramLinks).where(and(eq(t.telegramLinks.code, code), gt(t.telegramLinks.expiresAt, new Date()), isNull(t.telegramLinks.usedAt)));
    if (!link) {
      await ctx.api.sendMessage(m.chat.id, "That link has expired. Open Jawab → Channels → Telegram and tap “Link my Telegram” again.");
      return true;
    }
    await db.update(t.telegramLinks).set({ telegramUserId: from, usedAt: new Date() }).where(eq(t.telegramLinks.code, code));
    // A Business connection that arrived before the link now gets its owner.
    await db.update(t.telegramBusinessConnections).set({ workspaceId: link.workspaceId, updatedAt: new Date() }).where(and(eq(t.telegramBusinessConnections.ownerUserId, from), isNull(t.telegramBusinessConnections.workspaceId)));
    await db.insert(t.events).values({ workspaceId: link.workspaceId, type: "telegram.linked", props: { telegramUserId: from } });
    const name = await wsName(link.workspaceId);
    await ctx.api.sendMessage(
      m.chat.id,
      `Linked to ${name}.\n\nLast step: in Telegram open Settings → Telegram Business → Chatbots, add ${ctx.username ? `@${ctx.username}` : "this bot"}, and allow it to reply to messages. From then on I answer your customers from your own account.`,
    );
    return true;
  }
  // A business's own bot belongs to one business: "/start apply" opens the application, nothing else rebinds it.
  if (ctx.fixedWorkspace) {
    if (arg === "apply" || arg === `apply_${ctx.fixedWorkspace}`) {
      await startApply(ctx, ctx.fixedWorkspace, m);
      return true;
    }
    return false;
  }
  const apply = arg?.startsWith("apply_") ? arg.slice(6) : null;
  const wsRef = (apply ?? arg ?? "").toUpperCase();
  if (wsRef && /^[A-Z0-9]{3,12}$/.test(wsRef)) {
    const [w] = await db.select({ id: t.workspaces.id, name: t.workspaces.name, settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, wsRef));
    if (w) {
      await bindChat(ctx, m.chat.id, w.id);
      if (apply) {
        await startApply(ctx, w.id, m);
        return true;
      }
      const hiring = w.settings.modules?.hiring ? " Looking for a job? Send /apply." : "";
      await ctx.api.sendMessage(m.chat.id, `Hi${m.from?.first_name ? ` ${m.from.first_name}` : ""}! You're chatting with ${w.name}. Ask about products, prices, opening hours or bookings.${hiring}`);
      return true;
    }
  }
  return false;
}

async function onPrivateMessage(ctx: BotCtx, m: Message) {
  const chatId = String(m.chat.id);
  const text = (m.text ?? m.caption ?? "").trim();
  const cmd = text.match(/^\/(\w+)(?:@\w+)?(?:\s+(.*))?$/);
  if (cmd && cmd[1] === "start" && (await onStart(ctx, m, cmd[2]?.trim()))) return;

  const workspaceId = await chatWorkspace(ctx, chatId);
  if (!workspaceId) {
    await ctx.api.sendMessage(
      m.chat.id,
      `Hi! I'm Jawab, the assistant that answers customers for many businesses. Open the Telegram link a business shared with you to chat with them.\n\nRun a business? Set up your own assistant at ${env.appUrl}/signup`,
    );
    return;
  }
  if (cmd) {
    const [, name] = cmd;
    if (name === "apply") return startApply(ctx, workspaceId, m);
    if (name === "delete_my_data") return deleteMyData(ctx, workspaceId, m);
    if (name === "cancel") {
      await db.delete(t.botSessions).where(and(eq(t.botSessions.workspaceId, workspaceId), eq(t.botSessions.chatId, chatId)));
      await ctx.api.sendMessage(m.chat.id, `Cancelled. Ask me anything about ${await wsName(workspaceId)}.`);
      return;
    }
    if (name === "start") {
      await ctx.api.sendMessage(m.chat.id, `Hi${m.from?.first_name ? ` ${m.from.first_name}` : ""}! This is ${await wsName(workspaceId)}. Ask about products, prices, opening hours or bookings.`);
      return;
    }
  }
  if (await handleApplyFlow(ctx, workspaceId, m)) return;
  const r = await ingest({
    workspaceId, channel: "telegram", externalThreadId: `chat:${ctx.ref}:${chatId}`,
    customer: { externalId: String(m.from?.id ?? chatId), displayName: displayName(m.from), username: m.from?.username ?? null },
    text, attachments: attachmentsOf(m), receivedAt: new Date(m.date * 1000), externalMessageId: String(m.message_id),
    routing: { chatId: m.chat.id, bot: ctx.ref, mode: "bot" },
  });
  if (r.duplicate) return;
  await respond(r.thread.id, r.messageId);
}

async function onCallback(ctx: BotCtx, q: CallbackQuery) {
  const data = q.data ?? "";
  try {
    const chat = q.message?.chat.id;
    const workspaceId = chat !== undefined ? await chatWorkspace(ctx, chat) : ctx.fixedWorkspace;
    if (data.startsWith("slot:")) {
      const [, outreachId, idx] = data.split(":");
      const [o] = await db.select({ ws: t.outreach.workspaceId }).from(t.outreach).where(eq(t.outreach.id, outreachId));
      const result = o ? await pickSlot(o.ws, outreachId, Number(idx), String(q.from.id)) : { toast: "This invite is no longer valid." };
      await ctx.api.answerCallbackQuery(q.id, { text: result.toast });
      return;
    }
    if (data.startsWith("apply:") && workspaceId) {
      const handled = await handleApplyFlow(ctx, workspaceId, null, q);
      await ctx.api.answerCallbackQuery(q.id, handled ? {} : { text: "This step has expired. Send /apply to start again." });
      return;
    }
    await ctx.api.answerCallbackQuery(q.id);
  } catch (e) {
    console.error("[telegram callback]", e);
    await ctx.api.answerCallbackQuery(q.id, { text: "Something went wrong, please try again." }).catch(() => {});
  }
}

/** Remember channels/groups where the bot was made admin: those become candidate sources for that business. */
async function onMyChatMember(ctx: BotCtx, u: ChatMemberUpdated) {
  if (u.chat.type === "private") return;
  const workspaceId = ctx.fixedWorkspace ?? (await linkedWorkspaceOf(String(u.from.id)));
  if (!workspaceId) return;
  const isAdmin = u.new_chat_member.status === "administrator";
  const [ch] = await db.select().from(t.channels).where(and(eq(t.channels.workspaceId, workspaceId), eq(t.channels.type, "telegram")));
  if (!ch) return;
  const sources = new Set(String(ch.config.hrSources ?? "").split(",").filter(Boolean));
  const key = `${ctx.ref}|${u.chat.id}`;
  if (isAdmin) sources.add(key);
  else sources.delete(key);
  await db
    .update(t.channels)
    .set({ config: { ...ch.config, hrSources: [...sources].join(","), [`hrSourceTitle:${u.chat.id}`]: "title" in u.chat ? (u.chat.title ?? null) : null } })
    .where(eq(t.channels.id, ch.id));
}

async function sourceWorkspace(ctx: BotCtx, chatId: number): Promise<string | null> {
  const envIds = (process.env.TELEGRAM_HR_CHANNEL_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ctx.ref === PLATFORM && envIds.includes(String(chatId))) return env.demoWorkspaceId;
  const rows = await db.select({ ws: t.channels.workspaceId, config: t.channels.config }).from(t.channels).where(eq(t.channels.type, "telegram"));
  const key = `${ctx.ref}|${chatId}`;
  return rows.find((r) => String(r.config.hrSources ?? "").split(",").includes(key))?.ws ?? null;
}

/** Resume posts and PDFs in a channel/group the business administers (bot is admin there). */
async function onSourcePost(ctx: BotCtx, m: Message) {
  const workspaceId = await sourceWorkspace(ctx, m.chat.id);
  if (!workspaceId) return;
  const text = (m.text ?? m.caption ?? "").trim();
  let raw = text;
  let doc: { filename: string; mime: string; bytes: Buffer; text: string } | undefined;
  if (m.document && (m.document.mime_type === "application/pdf" || m.document.file_name?.toLowerCase().endsWith(".pdf"))) {
    const { bytes } = await downloadTelegramFile(ctx.ref, m.document.file_id);
    const pdfText = await extractPdfText(bytes);
    doc = { filename: m.document.file_name ?? "resume.pdf", mime: "application/pdf", bytes, text: pdfText };
    raw = [text, pdfText].filter(Boolean).join("\n\n");
  }
  if (raw.length < 40) return; // chatter, not a resume
  const nameGuess = displayName(m.from) ?? text.match(/name[:\s]+([^\n]+)/i)?.[1]?.trim() ?? "Unnamed candidate";
  await addCandidate({
    workspaceId, fullName: nameGuess, source: "telegram_channel",
    sourceRef: `${"title" in m.chat ? m.chat.title : "chat"} #${m.message_id}`,
    telegramUsername: m.from?.username ?? text.match(/@([a-zA-Z0-9_]{5,32})/)?.[1] ?? null,
    telegramChatId: null, rawText: raw, doc, consent: true,
  });
}

