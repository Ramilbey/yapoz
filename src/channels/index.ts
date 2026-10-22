import type { t } from "@/db";

type ThreadRow = typeof t.threads.$inferSelect;
export type Buttons = { text: string; data: string }[][];
export type SendResult = { externalMessageId?: string };

/** One interface for every channel. Inbound normalization lives with each channel's webhook handler. */
/** The customer's message being answered: WhatsApp ties its typing indicator to it. */
export type Inbound = { externalMessageId?: string | null };

export interface ChannelAdapter {
  send(thread: ThreadRow, text: string, extra?: { buttons?: Buttons }): Promise<SendResult>;
  /** Show "typing…" in the customer's app while the AI works. */
  typing?(thread: ThreadRow, inbound?: Inbound): Promise<void>;
  /** The indicator disappears on its own after a while: show it again this often until the reply is sent. */
  typingEveryMs?: number;
}

const simulator: ChannelAdapter = {
  // The simulator reads replies from the database (and the live stream), so sending is just persisting.
  async send() {
    return {};
  },
};

const lazy = (load: () => Promise<ChannelAdapter>, opts: { typingEveryMs?: number } = {}): ChannelAdapter => ({
  async send(thread, text, extra) {
    return (await load()).send(thread, text, extra);
  },
  async typing(thread, inbound) {
    const a = await load();
    await a.typing?.(thread, inbound);
  },
  typingEveryMs: opts.typingEveryMs,
});

const adapters: Record<string, ChannelAdapter> = {
  simulator,
  telegram: lazy(async () => (await import("./telegram/adapter")).telegramAdapter),
  // WhatsApp's indicator lasts up to 25 seconds.
  whatsapp: lazy(async () => (await import("./whatsapp")).whatsappAdapter, { typingEveryMs: 20_000 }),
  instagram: lazy(async () => (await import("./instagram")).instagramAdapter),
};

export function adapterFor(channel: string): ChannelAdapter {
  const a = adapters[channel];
  if (!a) throw new Error(`No adapter for channel ${channel}`);
  return a;
}
