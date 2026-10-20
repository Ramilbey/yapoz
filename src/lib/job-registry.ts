import type { JobHandler } from "./jobs";

const registry: Record<string, () => Promise<JobHandler>> = {
  "inbound.process": async () => (await import("@/agent/pipeline")).processInboundJob,
  "telegram.update": async () => (await import("@/channels/telegram/handle")).handleTelegramUpdateJob,
  "whatsapp.webhook": async () => (await import("@/channels/whatsapp")).handleWhatsAppJob,
  "instagram.webhook": async () => (await import("@/channels/instagram")).handleInstagramJob,
  "hiring.parse": async () => (await import("@/hiring/parse")).parseCandidateJob,
};

export function getHandler(type: string) {
  return registry[type];
}
