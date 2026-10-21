// Where each business's channel credentials live. A business connects its own WhatsApp number, Instagram
// account or Telegram bot from Settings → Channels; secrets are stored AES-256-GCM encrypted on its channel
// row and never sent back to the browser. Env vars are only a fallback for the demo workspace.
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { decryptJson } from "@/lib/crypto";

export type ChannelType = "telegram" | "whatsapp" | "instagram" | "simulator";
type ChannelRow = typeof t.channels.$inferSelect;

/** The workspace's row for a channel type, created on first use. */
export async function channelOf(workspaceId: string, type: ChannelType): Promise<ChannelRow> {
  const where = and(eq(t.channels.workspaceId, workspaceId), eq(t.channels.type, type));
  const [c] = await db.select().from(t.channels).where(where);
  if (c) return c;
  await db.insert(t.channels).values({ workspaceId, type, mode: "autopilot", config: {} }).onConflictDoNothing();
  const [created] = await db.select().from(t.channels).where(where);
  return created;
}

export type WhatsAppSecrets = { token: string; appSecret: string; verifyToken: string };
export type WhatsAppCreds = WhatsAppSecrets & { phoneNumberId: string; graphVersion: string; source: "workspace" | "env" };

export async function whatsappCreds(workspaceId: string): Promise<WhatsAppCreds | null> {
  const c = await channelOf(workspaceId, "whatsapp");
  if (c.credentialsEnc && c.config.phoneNumberId) {
    const s = decryptJson<WhatsAppSecrets>(c.credentialsEnc);
    return { ...s, phoneNumberId: String(c.config.phoneNumberId), graphVersion: env.whatsapp.graphVersion, source: "workspace" };
  }
  const w = env.whatsapp;
  if (workspaceId === env.demoWorkspaceId && w.token && w.phoneNumberId) {
    return { token: w.token, appSecret: w.appSecret, verifyToken: w.verifyToken, phoneNumberId: w.phoneNumberId, graphVersion: w.graphVersion, source: "env" };
  }
  return null;
}

export type InstagramSecrets = { token: string; expiresAt: number | null; refreshedAt: number };
export type InstagramCreds = { token: string; accountId: string; username: string | null; graphVersion: string; expiresAt: number | null; source: "workspace" | "env" };

export async function instagramCreds(workspaceId: string): Promise<InstagramCreds | null> {
  const c = await channelOf(workspaceId, "instagram");
  if (c.credentialsEnc && c.config.accountId) {
    const s = decryptJson<InstagramSecrets>(c.credentialsEnc);
    return { token: s.token, expiresAt: s.expiresAt, accountId: String(c.config.accountId), username: (c.config.username as string) ?? null, graphVersion: env.instagram.graphVersion, source: "workspace" };
  }
  const ig = env.instagram;
  if (workspaceId === env.demoWorkspaceId && ig.token && ig.accountId) {
    return { token: ig.token, accountId: ig.accountId, username: null, graphVersion: ig.graphVersion, expiresAt: null, source: "env" };
  }
  return null;
}

/** Which business a WhatsApp phone number id belongs to. */
export async function workspaceForWhatsAppNumber(phoneNumberId: string): Promise<string | null> {
  if (!phoneNumberId) return null;
  const [c] = await db
    .select({ ws: t.channels.workspaceId })
    .from(t.channels)
    .where(and(eq(t.channels.type, "whatsapp"), sql`${t.channels.config}->>'phoneNumberId' = ${phoneNumberId}`));
  if (c) return c.ws;
  return phoneNumberId === env.whatsapp.phoneNumberId ? env.demoWorkspaceId : null;
}

/** Which business an Instagram professional account (webhook entry.id) belongs to. */
export async function workspaceForInstagramAccount(accountId: string): Promise<string | null> {
  if (!accountId) return null;
  const [c] = await db
    .select({ ws: t.channels.workspaceId })
    .from(t.channels)
    .where(and(eq(t.channels.type, "instagram"), sql`${t.channels.config}->>'accountId' = ${accountId}`));
  if (c) return c.ws;
  return accountId === env.instagram.accountId ? env.demoWorkspaceId : null;
}

/** Read-only status for Settings → Channels. Never includes tokens or app secrets. */
export async function channelStatus(workspaceId: string) {
  const rows = await db.select().from(t.channels).where(eq(t.channels.workspaceId, workspaceId));
  const row = (type: ChannelType) => rows.find((r) => r.type === type);
  const tgRow = row("telegram");
  const ownBot = tgRow?.credentialsEnc && tgRow.config.mode === "own" ? { username: String(tgRow.config.botUsername ?? "") } : null;
  const conns = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.workspaceId, workspaceId));
  const shared = env.telegramToken && env.telegramBotUsername ? env.telegramBotUsername : null;

  const wa = await whatsappCreds(workspaceId);
  const waRow = row("whatsapp");
  const ig = await instagramCreds(workspaceId);

  return {
    telegram: {
      mode: tgRow?.mode ?? "autopilot",
      sharedBot: shared,
      customerLink: ownBot?.username ? `https://t.me/${ownBot.username}` : shared ? `https://t.me/${shared}?start=${workspaceId}` : null,
      applyLink: ownBot?.username ? `https://t.me/${ownBot.username}?start=apply` : shared ? `https://t.me/${shared}?start=apply_${workspaceId}` : null,
      ownBot,
      businessConnections: conns.map((c) => ({ id: c.id, canReply: c.canReply, isEnabled: c.isEnabled, updatedAt: c.updatedAt })),
      connected: Boolean(ownBot || conns.some((c) => c.isEnabled) || shared),
    },
    whatsapp: {
      mode: waRow?.mode ?? "autopilot",
      connected: Boolean(wa),
      source: wa?.source ?? null,
      displayPhone: (waRow?.config.displayPhone as string) ?? null,
      verifiedName: (waRow?.config.verifiedName as string) ?? null,
      // Shown so the owner can paste them into their Meta app's webhook settings.
      webhookUrl: wa?.source === "workspace" && waRow ? `${env.appUrl}/api/webhooks/whatsapp/${waRow.id}` : wa?.source === "env" ? `${env.appUrl}/api/webhooks/whatsapp` : null,
      verifyToken: wa?.verifyToken ?? null,
    },
    instagram: {
      mode: row("instagram")?.mode ?? "autopilot",
      connected: Boolean(ig),
      source: ig?.source ?? null,
      username: ig?.username ?? null,
      expiresAt: ig?.expiresAt ? new Date(ig.expiresAt).toISOString() : null,
      canConnect: Boolean(env.instagram.appId && env.instagram.appSecret),
    },
    simulator: { mode: row("simulator")?.mode ?? "autopilot", connected: true },
  };
}
