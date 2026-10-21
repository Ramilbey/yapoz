import type { t } from "@/db";
import { env } from "@/lib/env";

type Cand = typeof t.candidates.$inferSelect;
export type CandidateChannel = "telegram" | "whatsapp" | "manual";

/** Where an invite can actually reach this candidate. Bots can only DM people who started them. */
export async function reachableChannel(c: Cand): Promise<{ channel: CandidateChannel; why: string }> {
  if (c.telegramChatId) return { channel: "telegram", why: "Applied through the bot, so the bot can message them" };
  const { whatsappCreds } = await import("@/channels/connections");
  if (c.phone && (await whatsappCreds(c.workspaceId))) return { channel: "whatsapp", why: "WhatsApp, via the approved interview_invite template" };
  const handle = c.telegramUsername ? `@${c.telegramUsername}` : c.email ?? "their contact";
  const link = env.telegramBotUsername ? ` (t.me/${env.telegramBotUsername}?start=apply_${c.workspaceId})` : "";
  return { channel: "manual", why: `Can't message them automatically: they haven't applied through your Telegram bot yet. Send them your apply link${link}, or contact ${handle} yourself.` };
}

export async function sendToCandidate(c: Cand, channel: string, text: string, buttons?: { text: string; data: string }[][]) {
  if (channel === "telegram") {
    if (!c.telegramChatId) throw new Error("Candidate hasn't started the bot");
    const { bot } = await import("@/channels/telegram/api");
    const api = await bot(c.telegramBot ?? "platform");
    const m = await api.sendMessage(Number(c.telegramChatId), text, {
      link_preview_options: { is_disabled: true },
      ...(buttons?.length ? { reply_markup: { inline_keyboard: buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))) } } : {}),
    });
    return String(m.message_id);
  }
  if (channel === "whatsapp") {
    if (!c.phone) throw new Error("No phone number for WhatsApp");
    const wa = await import("@/channels/whatsapp");
    // Invites go out as the approved interview_invite template (the candidate may be outside the 24h window);
    // their reply opens the window and the scheduler then sends the time buttons.
    if (buttons?.length) return wa.sendWhatsAppTemplate(c.workspaceId, c.phone, "interview_invite", "en", [c.fullName.split(" ")[0]]);
    return wa.sendWhatsAppText(c.workspaceId, c.phone, text);
  }
  throw new Error((await reachableChannel(c)).why);
}
