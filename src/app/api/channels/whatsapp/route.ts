import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db, t } from "@/db";
import { and, eq, ne, sql } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { encryptJson } from "@/lib/crypto";
import { env } from "@/lib/env";
import { channelOf, type WhatsAppSecrets } from "@/channels/connections";
import { verifyWhatsAppNumber, subscribeWaba } from "@/channels/whatsapp";

export const dynamic = "force-dynamic";

const Connect = z.object({
  phoneNumberId: z.string().regex(/^\d{6,25}$/, "Phone number ID is the long number from WhatsApp → API Setup, not the phone number itself"),
  accessToken: z.string().min(20).max(1000),
  appSecret: z.string().regex(/^[0-9a-f]{32}$/i, "App secret is the 32-character value in App settings → Basic"),
  wabaId: z.string().regex(/^\d{6,25}$/).optional().or(z.literal("")),
});

/**
 * Connect a WhatsApp Business number from the owner's own Meta app: we check the details with Meta,
 * store them encrypted, and give back the callback URL + verify token to paste into the app's webhook settings.
 */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  if (!(await hit(`connect:${s.workspaceId}`, "hour", 20)).ok) throw new HttpError(429, "Too many attempts. Try again in an hour.");
  const b = await body(req, Connect);
  const [taken] = await db
    .select({ ws: t.channels.workspaceId })
    .from(t.channels)
    .where(and(eq(t.channels.type, "whatsapp"), ne(t.channels.workspaceId, s.workspaceId), sql`${t.channels.config}->>'phoneNumberId' = ${b.phoneNumberId}`));
  if (taken) throw new HttpError(409, "This WhatsApp number is already connected to another business on Jawab.");
  let info: { displayPhone: string | null; verifiedName: string | null };
  try {
    info = await verifyWhatsAppNumber(b.phoneNumberId, b.accessToken);
    if (b.wabaId) await subscribeWaba(b.wabaId, b.accessToken);
  } catch (e) {
    throw new HttpError(400, `Meta says: ${(e as Error).message}`);
  }
  const ch = await channelOf(s.workspaceId, "whatsapp");
  const secrets: WhatsAppSecrets = { token: b.accessToken, appSecret: b.appSecret, verifyToken: randomBytes(18).toString("base64url") };
  await db
    .update(t.channels)
    .set({ credentialsEnc: encryptJson(secrets), config: { ...ch.config, phoneNumberId: b.phoneNumberId, wabaId: b.wabaId || null, ...info }, enabled: true })
    .where(eq(t.channels.id, ch.id));
  await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "channel.connected", props: { channel: "whatsapp", phone: info.displayPhone } });
  return ok({ ...info, webhookUrl: `${env.appUrl}/api/webhooks/whatsapp/${ch.id}`, verifyToken: secrets.verifyToken });
});

export const DELETE = handle(async () => {
  const s = await apiSession(["owner"]);
  const ch = await channelOf(s.workspaceId, "whatsapp");
  const { phoneNumberId: _p, wabaId: _w, displayPhone: _d, verifiedName: _v, ...rest } = ch.config;
  await db.update(t.channels).set({ credentialsEnc: null, config: rest }).where(eq(t.channels.id, ch.id));
  return ok({ ok: true });
});
