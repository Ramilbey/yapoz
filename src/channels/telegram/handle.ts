import type { Update, Message, CallbackQuery, ChatMemberUpdated, BusinessConnection } from "grammy/types";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { tg, downloadTelegramFile } from "./api";
import { ingest, respond } from "@/agent/pipeline";
import { handleApplyFlow, startApply, deleteMyData } from "./apply";
import { addCandidate } from "@/hiring/ingest";
import { pickSlot } from "@/hiring/schedule";
import { extractPdfText } from "@/hiring/pdf";
import type { Attachment } from "@/db/schema";

type Payload = { workspaceId: string; update: Update };

export async function handleTelegramUpdateJob(payload: Record<string, unknown>) {
  const { workspaceId, update } = payload as unknown as Payload;
  if (update.business_connection) return onBusinessConnection(workspaceId, update.business_connection);
  if (update.business_message) return onBusinessMessage(workspaceId, update.business_message);
  if (update.callback_query) return onCallback(workspaceId, update.callback_query);
  if (update.my_chat_member) return onMyChatMember(workspaceId, update.my_chat_member);
  if (update.channel_post) return onSourcePost(workspaceId, update.channel_post);
  if (update.message) {
    const m = update.message;
    if (m.chat.type === "private") return onPrivateMessage(workspaceId, m);
    if (m.chat.type === "group" || m.chat.type === "supergroup") return onSourcePost(workspaceId, m);
  }
  // edited_business_message, deleted_business_messages, etc. are intentionally ignored.
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

async function onBusinessConnection(workspaceId: string, c: BusinessConnection) {
  await db
    .insert(t.telegramBusinessConnections)
    .values({ id: c.id, workspaceId, ownerUserId: String(c.user.id), ownerChatId: String(c.user_chat_id), canReply: Boolean(c.rights?.can_reply), rights: (c.rights ?? {}) as Record<string, boolean>, isEnabled: c.is_enabled })
    .onConflictDoUpdate({
      target: t.telegramBusinessConnections.id,
      set: { canReply: Boolean(c.rights?.can_reply), rights: (c.rights ?? {}) as Record<string, boolean>, isEnabled: c.is_enabled, updatedAt: new Date() },
    });
  await db.insert(t.events).values({ workspaceId, type: "telegram.business_connection", props: { enabled: c.is_enabled, canReply: Boolean(c.rights?.can_reply), owner: displayName(c.user) } });
  if (c.is_enabled) {
    await tg()
      .sendMessage(c.user_chat_id, c.rights?.can_reply ? "Jawab is connected to your business account. I'll answer customer chats from your own account. Messages you send yourself are never touched." : "Connected, but I can't reply yet: allow the “Reply to messages” permission in Settings → Business → Chatbots.")
      .catch(() => {});
  }
}

async function onBusinessMessage(workspaceId: string, m: Message) {
  const bcId = m.business_connection_id;
  if (!bcId) return;
  let [conn] = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, bcId));
  if (!conn) {
    const c = await tg().getBusinessConnection(bcId);
    await onBusinessConnection(workspaceId, c);
    [conn] = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.id, bcId));
  }
  if (!conn || !conn.isEnabled) return;
  // Ignore anything the owner typed themselves, and our own messages sent on their behalf.
  if (m.sender_business_bot || String(m.from?.id) === conn.ownerUserId) return;
  const text = m.text ?? m.caption ?? "";
  const r = await ingest({
    workspaceId, channel: "telegram", externalThreadId: `biz:${bcId}:${m.chat.id}`,
    customer: { externalId: String(m.from?.id ?? m.chat.id), displayName: displayName(m.from), username: m.from?.username ?? null },
    text, attachments: attachmentsOf(m), receivedAt: new Date(m.date * 1000), externalMessageId: String(m.message_id),
    routing: { chatId: m.chat.id, businessConnectionId: bcId, mode: "business" },
  });
  if (r.duplicate) return;
  if (!conn.canReply) {
    await db.insert(t.events).values({ workspaceId, type: "telegram.cannot_reply", props: { threadId: r.thread.id } });
    return;
  }
  await respond(r.thread.id, r.messageId);
}

async function onPrivateMessage(workspaceId: string, m: Message) {
  const chatId = String(m.chat.id);
  const text = (m.text ?? m.caption ?? "").trim();
  const cmd = text.match(/^\/(\w+)(?:@\w+)?(?:\s+(.*))?$/);
  if (cmd) {
    const [, name, arg] = cmd;
    if (name === "start" && arg === "apply") return startApply(workspaceId, m);
    if (name === "apply") return startApply(workspaceId, m);
    if (name === "delete_my_data") return deleteMyData(workspaceId, m);
    if (name === "cancel") {
      await db.delete(t.botSessions).where(and(eq(t.botSessions.workspaceId, workspaceId), eq(t.botSessions.chatId, chatId)));
      await tg().sendMessage(m.chat.id, "Cancelled. Ask me anything about Forno Sette, or send /apply to apply for a job.");
      return;
    }
    if (name === "start") {
      const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
      await tg().sendMessage(m.chat.id, `Hi${m.from?.first_name ? ` ${m.from.first_name}` : ""}! This is ${ws?.name ?? "the team"}. Ask me about the menu, sizes, stock, opening hours, delivery or book a table. Looking for a job? Send /apply.`);
      return;
    }
  }
  if (await handleApplyFlow(workspaceId, m)) return;
  const r = await ingest({
    workspaceId, channel: "telegram", externalThreadId: `chat:${chatId}`,
    customer: { externalId: String(m.from?.id ?? chatId), displayName: displayName(m.from), username: m.from?.username ?? null },
    text, attachments: attachmentsOf(m), receivedAt: new Date(m.date * 1000), externalMessageId: String(m.message_id),
    routing: { chatId: m.chat.id, mode: "bot" },
  });
  if (r.duplicate) return;
  await respond(r.thread.id, r.messageId);
}

async function onCallback(workspaceId: string, q: CallbackQuery) {
  const data = q.data ?? "";
  try {
    if (data.startsWith("slot:")) {
      const [, outreachId, idx] = data.split(":");
      const result = await pickSlot(workspaceId, outreachId, Number(idx), String(q.from.id));
      await tg().answerCallbackQuery(q.id, { text: result.toast });
      return;
    }
    if (data.startsWith("apply:")) {
      const handled = await handleApplyFlow(workspaceId, null, q);
      await tg().answerCallbackQuery(q.id, handled ? {} : { text: "This step has expired. Send /apply to start again." });
      return;
    }
    await tg().answerCallbackQuery(q.id);
  } catch (e) {
    console.error("[telegram callback]", e);
    await tg().answerCallbackQuery(q.id, { text: "Something went wrong, please try again." }).catch(() => {});
  }
}

/** Remember channels/groups where the bot was made admin: those become candidate sources. */
async function onMyChatMember(workspaceId: string, u: ChatMemberUpdated) {
  if (u.chat.type === "private") return;
  const isAdmin = u.new_chat_member.status === "administrator";
  const [ch] = await db.select().from(t.channels).where(and(eq(t.channels.workspaceId, workspaceId), eq(t.channels.type, "telegram")));
  if (!ch) return;
  const sources = new Set(String(ch.config.hrSources ?? "").split(",").filter(Boolean));
  if (isAdmin) sources.add(String(u.chat.id));
  else sources.delete(String(u.chat.id));
  await db
    .update(t.channels)
    .set({ config: { ...ch.config, hrSources: [...sources].join(","), [`hrSourceTitle:${u.chat.id}`]: "title" in u.chat ? (u.chat.title ?? null) : null } })
    .where(eq(t.channels.id, ch.id));
}

async function isHrSource(workspaceId: string, chatId: number) {
  const envIds = (process.env.TELEGRAM_HR_CHANNEL_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (envIds.includes(String(chatId))) return true;
  const [ch] = await db.select({ config: t.channels.config }).from(t.channels).where(and(eq(t.channels.workspaceId, workspaceId), eq(t.channels.type, "telegram")));
  return String(ch?.config.hrSources ?? "").split(",").includes(String(chatId));
}

/** Resume posts and PDFs in a channel/group the business administers (bot is admin there). */
async function onSourcePost(workspaceId: string, m: Message) {
  if (!(await isHrSource(workspaceId, m.chat.id))) return;
  const text = (m.text ?? m.caption ?? "").trim();
  let raw = text;
  let doc: { filename: string; mime: string; bytes: Buffer; text: string } | undefined;
  if (m.document && (m.document.mime_type === "application/pdf" || m.document.file_name?.toLowerCase().endsWith(".pdf"))) {
    const { bytes } = await downloadTelegramFile(m.document.file_id);
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
