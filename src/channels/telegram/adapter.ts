import type { ChannelAdapter } from "..";
import { bot, PLATFORM } from "./api";

export const telegramAdapter: ChannelAdapter = {
  async send(thread, text, extra) {
    const chatId = thread.routing.chatId;
    if (chatId === undefined || chatId === null) throw new Error("Thread has no Telegram chat id");
    const api = await bot(String(thread.routing.bot ?? PLATFORM));
    const bc = thread.routing.businessConnectionId ? String(thread.routing.businessConnectionId) : undefined;
    const msg = await api.sendMessage(Number(chatId), text, {
      ...(bc ? { business_connection_id: bc } : {}),
      ...(extra?.buttons?.length ? { reply_markup: { inline_keyboard: extra.buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))) } } : {}),
      link_preview_options: { is_disabled: true },
    });
    return { externalMessageId: String(msg.message_id) };
  },
  async typing(thread) {
    const chatId = thread.routing.chatId;
    if (chatId === undefined || chatId === null) return;
    const api = await bot(String(thread.routing.bot ?? PLATFORM));
    const bc = thread.routing.businessConnectionId ? String(thread.routing.businessConnectionId) : undefined;
    await api.sendChatAction(Number(chatId), "typing", bc ? { business_connection_id: bc } : {}).catch(() => {});
  },
};
