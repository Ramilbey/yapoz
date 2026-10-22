// Where each business's channel credentials live. A business connects its own WhatsApp number, Instagram
// account or Telegram bot from Settings → Channels; secrets are stored AES-256-GCM encrypted on its channel
// row and never sent back to the browser. Env vars are only a fallback for the demo workspace.
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { env } from "@/lib/env";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { MetaError, checkNumberOnWaba, inspectAccessToken, metaAppOf, subscribeWaba } from "./meta";

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

/** What is encrypted on the WhatsApp channel row. The app secret lives with the Meta app now; older connections kept it here. */
export type WhatsAppSecrets = { token: string; verifyToken: string; appSecret?: string };
/**
 * Everything needed to talk to one WhatsApp number, from the form fields to where they come from:
 *   appId (Meta app ID)  appSecret (App secret)  → the business's saved Meta app (integrations), else older channel secret
 *   phoneNumberId, wabaId (Business Account ID)  → channel config        token (Access token) → channel secrets
 */
export type WhatsAppCreds = { token: string; verifyToken: string; appSecret: string; appId: string; wabaId: string; phoneNumberId: string; graphVersion: string; source: "workspace" | "env" };

export async function whatsappCreds(workspaceId: string): Promise<WhatsAppCreds | null> {
  const c = await channelOf(workspaceId, "whatsapp");
  if (c.credentialsEnc && c.config.phoneNumberId) {
    const s = decryptJson<WhatsAppSecrets>(c.credentialsEnc);
    const app = await metaAppOf(workspaceId);
    return {
      token: s.token, verifyToken: s.verifyToken, appSecret: app?.appSecret ?? s.appSecret ?? "", appId: app?.appId || String(c.config.appId ?? ""),
      wabaId: String(c.config.wabaId ?? ""), phoneNumberId: String(c.config.phoneNumberId), graphVersion: env.whatsapp.graphVersion, source: "workspace",
    };
  }
  const w = env.whatsapp;
  if (workspaceId === env.demoWorkspaceId && w.token && w.phoneNumberId) {
    return { token: w.token, appSecret: w.appSecret, appId: w.appId, wabaId: w.wabaId, verifyToken: w.verifyToken, phoneNumberId: w.phoneNumberId, graphVersion: w.graphVersion, source: "env" };
  }
  return null;
}

/**
 * Connect a business's WhatsApp number. Needs the business's Meta app first. Meta is asked three things before anything is
 * saved: is the access token valid, made by this app and allowed to use WhatsApp; is the number on this Business Account;
 * and can the app be subscribed to that account's webhooks.
 */
export async function connectWhatsApp(workspaceId: string, input: { phoneNumberId: string; wabaId: string; accessToken: string }) {
  const app = await metaAppOf(workspaceId);
  if (!app?.appId || !app.appSecret) throw new MetaError("appId", "Add your Meta app first: its App ID and App secret go in the Meta app box above.");
  const [taken] = await db
    .select({ ws: t.channels.workspaceId })
    .from(t.channels)
    .where(and(eq(t.channels.type, "whatsapp"), sql`${t.channels.workspaceId} <> ${workspaceId}`, sql`${t.channels.config}->>'phoneNumberId' = ${input.phoneNumberId}`));
  if (taken) throw new MetaError("phoneNumberId", "This WhatsApp number is already connected to another business on Jawab.", 409);

  const token = await inspectAccessToken(app.appId, app.appSecret, input.accessToken);
  const number = await checkNumberOnWaba(input.wabaId, input.phoneNumberId, input.accessToken);
  await subscribeWaba(input.wabaId, input.accessToken);

  const ch = await channelOf(workspaceId, "whatsapp");
  const secrets: WhatsAppSecrets = { token: input.accessToken, verifyToken: randomBytes(18).toString("base64url") };
  await db
    .update(t.channels)
    .set({
      credentialsEnc: encryptJson(secrets),
      // A fresh connection starts with a clean health record.
      config: { ...ch.config, phoneNumberId: input.phoneNumberId, wabaId: input.wabaId, appId: app.appId, ...number, tokenExpiresAt: token.expiresAt, lastWebhookAt: null, lastWebhookIssue: null, lastWebhookTest: false, lastSendError: null, lastSendErrorAt: null },
      enabled: true,
    })
    .where(eq(t.channels.id, ch.id));
  await db.insert(t.events).values({ workspaceId, type: "channel.connected", props: { channel: "whatsapp", phone: number.displayPhone, appId: app.appId } });
  return { ...number, tokenExpiresAt: token.expiresAt, webhookUrl: `${env.appUrl}/api/webhooks/whatsapp/${ch.id}`, verifyToken: secrets.verifyToken };
}

/** A WhatsApp connection made through the Meta app box has no secret of its own: it can't lose the Meta app. */
export async function whatsappDependsOnMetaApp(workspaceId: string): Promise<boolean> {
  const c = await channelOf(workspaceId, "whatsapp");
  if (!c.credentialsEnc || !c.config.phoneNumberId) return false;
  return !decryptJson<WhatsAppSecrets>(c.credentialsEnc).appSecret;
}

/** After the Meta app changes, an old "signature doesn't match" warning is stale: wait for the next delivery. */
export async function clearWebhookIssue(workspaceId: string) {
  await db
    .update(t.channels)
    .set({ config: sql`${t.channels.config} || '{"lastWebhookIssue": null}'::jsonb` })
    .where(and(eq(t.channels.workspaceId, workspaceId), eq(t.channels.type, "whatsapp")));
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
  const meta = await metaAppOf(workspaceId);

  return {
    metaApp: { connected: Boolean(meta), appId: meta?.appId || null, appName: meta?.appName ?? null, source: meta?.source ?? null },
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
      wabaId: wa?.wabaId || null,
      /** When the access token stops working (null: it doesn't expire, or isn't known). */
      tokenExpiresAt: (waRow?.config.tokenExpiresAt as string) ?? null,
      /** Connected before the Meta app box existed: its secret is still the one saved with the number. */
      needsMetaApp: wa?.source === "workspace" && !meta,
      // Shown so the owner can paste them into their Meta app's webhook settings.
      webhookUrl: wa?.source === "workspace" && waRow ? `${env.appUrl}/api/webhooks/whatsapp/${waRow.id}` : wa?.source === "env" ? `${env.appUrl}/api/webhooks/whatsapp` : null,
      verifyToken: wa?.verifyToken ?? null,
      // Written by the webhook route and the sender, so the owner can see where the chain breaks.
      lastWebhookAt: (waRow?.config.lastWebhookAt as string) ?? null,
      lastWebhookIssue: (waRow?.config.lastWebhookIssue as "signature" | null) ?? null,
      lastWebhookTest: Boolean(waRow?.config.lastWebhookTest),
      lastSendError: waRow?.config.lastSendError ? { at: String(waRow.config.lastSendErrorAt ?? ""), message: String(waRow.config.lastSendError) } : null,
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
