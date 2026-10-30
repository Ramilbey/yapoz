import type { JobHandler } from "./jobs";

const registry: Record<string, () => Promise<JobHandler>> = {
  "inbound.process": async () => (await import("@/agent/pipeline")).processInboundJob,
  "telegram.update": async () => (await import("@/channels/telegram/handle")).handleTelegramUpdateJob,
  "whatsapp.webhook": async () => (await import("@/channels/whatsapp")).handleWhatsAppJob,
};

export function getHandler(type: string) {
  return registry[type];
}
