import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { env } from "@/lib/env";
import { googleConfigured, googleConnected } from "@/hiring/google";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const channels = await db.select().from(t.channels).where(eq(t.channels.workspaceId, s.workspaceId));
  const conns = await db.select().from(t.telegramBusinessConnections).where(eq(t.telegramBusinessConnections.workspaceId, s.workspaceId));
  const configured: Record<string, boolean> = {
    simulator: true,
    telegram: Boolean(env.telegramToken && env.telegramWebhookSecret),
    whatsapp: Boolean(env.whatsapp.token && env.whatsapp.phoneNumberId && env.whatsapp.appSecret),
    instagram: Boolean(env.instagram.token && env.instagram.accountId && env.instagram.appSecret),
  };
  return ok({
    workspace: { id: ws.id, name: ws.name, settings: ws.settings, timezone: ws.timezone, currency: ws.currency },
    channels: channels.map((c) => ({ type: c.type, mode: c.mode, enabled: c.enabled, configured: configured[c.type], config: c.config })),
    telegram: { botUsername: env.telegramBotUsername || null, businessConnections: conns.map((c) => ({ id: c.id, canReply: c.canReply, isEnabled: c.isEnabled, updatedAt: c.updatedAt })) },
    webhooks: { telegram: `${env.appUrl}/api/webhooks/telegram`, whatsapp: `${env.appUrl}/api/webhooks/whatsapp`, instagram: `${env.appUrl}/api/webhooks/instagram` },
    ai: { configured: env.hasAnthropic, fast: env.fastModel, smart: env.smartModel },
    google: { configured: googleConfigured(), connected: await googleConnected(s.workspaceId) },
    demoMode: env.demoMode,
  });
});

const Patch = z.object({
  channelModes: z.record(z.enum(["telegram", "whatsapp", "instagram", "simulator"]), z.enum(["autopilot", "copilot"])).optional(),
  demoTraffic: z.boolean().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  resumeRetentionDays: z.number().int().min(7).max(730).optional(),
});

export const PATCH = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const b = await body(req, Patch);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const settings = { ...ws.settings };
  if (b.demoTraffic !== undefined) settings.demoTraffic = b.demoTraffic && env.demoMode;
  if (b.confidenceThreshold !== undefined) settings.confidenceThreshold = b.confidenceThreshold;
  if (b.resumeRetentionDays !== undefined) settings.resumeRetentionDays = b.resumeRetentionDays;
  await db.update(t.workspaces).set({ settings }).where(eq(t.workspaces.id, ws.id));
  for (const [type, mode] of Object.entries(b.channelModes ?? {})) {
    await db.update(t.channels).set({ mode }).where(and(eq(t.channels.workspaceId, ws.id), eq(t.channels.type, type as "telegram")));
  }
  return ok({ ok: true, settings });
});
