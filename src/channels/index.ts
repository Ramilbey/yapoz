import type { t } from "@/db";

type ThreadRow = typeof t.threads.$inferSelect;
export type Buttons = { text: string; data: string }[][];
export type SendResult = { externalMessageId?: string };

/** One interface for every channel. Inbound normalization lives with each channel's webhook handler. */
export interface ChannelAdapter {
  send(thread: ThreadRow, text: string, extra?: { buttons?: Buttons }): Promise<SendResult>;
  typing?(thread: ThreadRow): Promise<void>;
}

const simulator: ChannelAdapter = {
  // The simulator reads replies from the database (and the live stream), so sending is just persisting.
  async send() {
    return {};
  },
};

const lazy = (load: () => Promise<ChannelAdapter>): ChannelAdapter => ({
  async send(thread, text, extra) {
    return (await load()).send(thread, text, extra);
  },
  async typing(thread) {
    const a = await load();
    await a.typing?.(thread);
  },
});

const adapters: Record<string, ChannelAdapter> = {
  simulator,
  telegram: lazy(async () => (await import("./telegram/adapter")).telegramAdapter),
  whatsapp: lazy(async () => (await import("./whatsapp")).whatsappAdapter),
  instagram: lazy(async () => (await import("./instagram")).instagramAdapter),
};

export function adapterFor(channel: string): ChannelAdapter {
  const a = adapters[channel];
  if (!a) throw new Error(`No adapter for channel ${channel}`);
  return a;
}
