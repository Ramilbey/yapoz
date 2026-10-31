// Where each business's channel credentials live. A business connects its own WhatsApp number or Telegram bot
// from Settings → Channels; secrets are stored AES-256-GCM encrypted on its channel
// row and never sent back to the browser. Env vars are only a fallback for the demo workspace.
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { MetaError, checkNumber, embeddedSignupReady, exchangeSignupCode, inspectAccessToken, metaAppReady, registerNumber, subscribeWaba, unsubscribeWaba } from "./meta";

export type ChannelType = "telegram" | "whatsapp" | "simulator";
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

/** What is encrypted on the WhatsApp channel row: the number's access token. The Meta app is Yapoz's own, from env. */
export type WhatsAppSecrets = { token?: string };
/**
 * Everything needed to talk to one WhatsApp number:
 *   phoneNumberId, wabaId (Business Account ID) → channel config      token (Access token) → channel secrets
 *   appId, appSecret, verifyToken               → Yapoz's Meta app (env), the same for every number
 */
export type WhatsAppCreds = { token: string; verifyToken: string; appSecret: string; appId: string; wabaId: string; phoneNumberId: string; graphVersion: string; source: "workspace" | "env"; method: "embedded" | "manual" | "env" };

export async function whatsappCreds(workspaceId: string): Promise<WhatsAppCreds | null> {
  const c = await channelOf(workspaceId, "whatsapp");
  const s = c.credentialsEnc && c.config.phoneNumberId ? decryptJson<WhatsAppSecrets>(c.credentialsEnc) : null;
  const w = env.whatsapp;
  if (s?.token) {
    return { token: s.token, verifyToken: w.verifyToken, appSecret: w.appSecret, appId: w.appId, wabaId: String(c.config.wabaId ?? ""), phoneNumberId: String(c.config.phoneNumberId), graphVersion: w.graphVersion, source: "workspace", method: c.config.connectMethod === "embedded" ? "embedded" : "manual" };
  }
  if (workspaceId === env.demoWorkspaceId && w.token && w.phoneNumberId) {
    return { token: w.token, appSecret: w.appSecret, appId: w.appId, wabaId: w.wabaId, verifyToken: w.verifyToken, phoneNumberId: w.phoneNumberId, graphVersion: w.graphVersion, source: "env", method: "env" };
  }
  return null;
}

/**
 * Connect a business's WhatsApp number from its own details. Meta is asked three things before anything is saved: is the
 * access token valid, made by Yapoz's Meta app and allowed to use WhatsApp; is the number on this Business Account;
 * and can the app be subscribed to that account's webhooks.
 */
export async function connectWhatsApp(workspaceId: string, input: { phoneNumberId: string; wabaId: string; accessToken: string }) {
  if (!metaAppReady()) throw new MetaError(null, "WhatsApp isn't set up on this server yet: it needs META_APP_ID and META_APP_SECRET.", 501);
  if (await numberTaken(workspaceId, input.phoneNumberId)) throw new MetaError("phoneNumberId", "This WhatsApp number is already connected to another business on Yapoz.", 409);

  const token = await inspectAccessToken(input.accessToken);
  const { accountChecked, ...number } = await checkNumber(input.wabaId, input.phoneNumberId, input.accessToken);
  // When Meta hides the account from the token there's nothing to subscribe: the app-level webhook in Meta's dashboard is what delivers.
  if (accountChecked) await subscribeWaba(input.wabaId, input.accessToken);

  const ch = await channelOf(workspaceId, "whatsapp");
  await db
    .update(t.channels)
    .set({
      credentialsEnc: encryptJson({ token: input.accessToken } satisfies WhatsAppSecrets),
      // A fresh connection starts with a clean health record.
      config: { ...ch.config, connectMethod: "manual", registerIssue: null, phoneNumberId: input.phoneNumberId, wabaId: input.wabaId, appId: env.whatsapp.appId, ...number, wabaChecked: accountChecked, tokenExpiresAt: token.expiresAt, lastWebhookAt: null, lastSendError: null, lastSendErrorAt: null },
      enabled: true,
    })
    .where(eq(t.channels.id, ch.id));
  await db.insert(t.events).values({ workspaceId, type: "channel.connected", props: { channel: "whatsapp", method: "manual", phone: number.displayPhone, appId: env.whatsapp.appId } });
  return { ...number, accountChecked, tokenExpiresAt: token.expiresAt };
}

async function numberTaken(workspaceId: string, phoneNumberId: string) {
  const [taken] = await db
    .select({ ws: t.channels.workspaceId })
    .from(t.channels)
    .where(and(eq(t.channels.type, "whatsapp"), sql`${t.channels.workspaceId} <> ${workspaceId}`, sql`${t.channels.config}->>'phoneNumberId' = ${phoneNumberId}`));
  return Boolean(taken);
}

/**
 * Embedded Signup: the owner signs in with Facebook in a Meta popup and picks (or creates) their WhatsApp Business Account
 * and number. The popup gives the browser a one-time code plus the number and account IDs; the code becomes the business's
 * token here. Webhooks then arrive through Yapoz's own app, so there's nothing for the owner to paste into Meta.
 */
export async function connectWhatsAppEmbedded(workspaceId: string, input: { code: string; phoneNumberId: string; wabaId: string }) {
  if (!embeddedSignupReady()) throw new MetaError(null, "Connecting with Facebook isn't set up on this server. Enter your credentials manually instead.", 501);
  if (await numberTaken(workspaceId, input.phoneNumberId)) throw new MetaError("phoneNumberId", "This WhatsApp number is already connected to another business on Yapoz.", 409);
  const w = env.whatsapp;
  const accessToken = await exchangeSignupCode(input.code);
  const token = await inspectAccessToken(accessToken);
  const { accountChecked, ...number } = await checkNumber(input.wabaId, input.phoneNumberId, accessToken);
  await subscribeWaba(input.wabaId, accessToken);
  const registerIssue = await registerNumber(input.phoneNumberId, accessToken);

  const ch = await channelOf(workspaceId, "whatsapp");
  await db
    .update(t.channels)
    .set({
      credentialsEnc: encryptJson({ token: accessToken } satisfies WhatsAppSecrets),
      config: { ...ch.config, connectMethod: "embedded", registerIssue, phoneNumberId: input.phoneNumberId, wabaId: input.wabaId, appId: w.appId, ...number, wabaChecked: accountChecked, tokenExpiresAt: token.expiresAt, lastWebhookAt: null, lastSendError: null, lastSendErrorAt: null },
      enabled: true,
    })
    .where(eq(t.channels.id, ch.id));
  await db.insert(t.events).values({ workspaceId, type: "channel.connected", props: { channel: "whatsapp", method: "embedded", phone: number.displayPhone } });
  return { ...number, registerIssue };
}

/** Disconnect the number: its access token and details go, and Meta stops sending its webhooks here. */
export async function disconnectWhatsApp(workspaceId: string) {
  const ch = await channelOf(workspaceId, "whatsapp");
  if (ch.credentialsEnc && ch.config.wabaId) {
    const { token } = decryptJson<WhatsAppSecrets>(ch.credentialsEnc);
    if (token) await unsubscribeWaba(String(ch.config.wabaId), token);
  }
  const {
    connectMethod: _m, registerIssue: _r, phoneNumberId: _p, wabaId: _w, appId: _a, displayPhone: _d, verifiedName: _v, tokenExpiresAt: _x,
    wabaChecked: _wc, lastWebhookAt: _l1, lastSendError: _l4, lastSendErrorAt: _l5, ...rest
  } = ch.config;
  await db.update(t.channels).set({ credentialsEnc: null, config: rest }).where(eq(t.channels.id, ch.id));
  await db.insert(t.events).values({ workspaceId, type: "channel.disconnected", props: { channel: "whatsapp" } });
}

/** Records that Meta delivered something for this business's number, so Settings can show the webhook works. */
export async function noteWhatsAppWebhook(workspaceId: string) {
  await db
    .update(t.channels)
    .set({ config: sql`${t.channels.config} || ${JSON.stringify({ lastWebhookAt: new Date().toISOString() })}::jsonb` })
    .where(and(eq(t.channels.workspaceId, workspaceId), eq(t.channels.type, "whatsapp")))
    .catch((e) => console.error("[whatsapp:webhook] couldn't record status", e));
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

  return {
    telegram: {
      mode: tgRow?.mode ?? "autopilot",
      sharedBot: shared,
      customerLink: ownBot?.username ? `https://t.me/${ownBot.username}` : shared ? `https://t.me/${shared}?start=${workspaceId}` : null,
      ownBot,
      businessConnections: conns.map((c) => ({ id: c.id, canReply: c.canReply, isEnabled: c.isEnabled, updatedAt: c.updatedAt })),
      connected: Boolean(ownBot || conns.some((c) => c.isEnabled) || shared),
    },
    whatsapp: {
      mode: waRow?.mode ?? "autopilot",
      connected: Boolean(wa),
      method: wa?.method ?? null,
      /** Yapoz's Meta app is configured, so a number can be connected at all. */
      available: metaAppReady(),
      /** Embedded Signup (needs the optional config ID): the IDs the browser needs to open Meta's popup. Never the secret. */
      embedded: embeddedSignupReady() ? { appId: env.whatsapp.appId, configId: env.whatsapp.embeddedConfigId, graphVersion: env.whatsapp.graphVersion } : null,
      registerIssue: (waRow?.config.registerIssue as string) ?? null,
      source: wa?.source ?? null,
      displayPhone: (waRow?.config.displayPhone as string) ?? null,
      verifiedName: (waRow?.config.verifiedName as string) ?? null,
      wabaId: wa?.wabaId || null,
      /** Meta confirmed the number sits on this Business Account. False for Meta's test numbers (it hides the account from the token). */
      wabaChecked: waRow?.config.wabaChecked !== false,
      /** When the access token stops working (null: it doesn't expire, or isn't known). */
      tokenExpiresAt: (waRow?.config.tokenExpiresAt as string) ?? null,
      /** Meta has been asked about this token (done when the number is connected through the Meta app box). Older connections: not yet. */
      tokenChecked: waRow?.config.tokenExpiresAt !== undefined,
      // Written by the webhook route and the sender, so the owner can see where the chain breaks.
      lastWebhookAt: (waRow?.config.lastWebhookAt as string) ?? null,
      lastSendError: waRow?.config.lastSendError ? { at: String(waRow.config.lastSendErrorAt ?? ""), message: String(waRow.config.lastSendError) } : null,
    },
    simulator: { mode: row("simulator")?.mode ?? "autopilot", connected: true },
  };
}
