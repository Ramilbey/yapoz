import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { env } from "@/lib/env";
import { googleConfigured, googleConnected } from "@/hiring/google";
import { channelStatus } from "@/channels/connections";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  return ok({
    workspace: { id: ws.id, name: ws.name, city: ws.city, settings: ws.settings, timezone: ws.timezone, currency: ws.currency },
    channels: await channelStatus(s.workspaceId),
    ai: { configured: env.hasAnthropic, fast: env.fastModel, smart: env.smartModel },
    google: { configured: googleConfigured(), connected: await googleConnected(s.workspaceId) },
    demoMode: env.demoMode,
    appUrl: env.appUrl,
  });
});

const Patch = z.object({
  // partialRecord: zod 4's z.record with enum keys demands every key, and the UI sends one channel at a time.
  channelModes: z.partialRecord(z.enum(["telegram", "whatsapp", "instagram", "simulator"]), z.enum(["autopilot", "copilot"])).optional(),
  demoTraffic: z.boolean().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  resumeRetentionDays: z.number().int().min(7).max(730).optional(),
  payments: z
    .object({
      enabled: z.boolean(),
      requireReceipt: z.boolean(),
      note: z.string().trim().max(300).optional(),
      accounts: z
        .array(
          z.object({
            type: z.enum(["bank_transfer", "duitnow", "ewallet"]),
            provider: z.string().trim().min(1, "Which bank or wallet?").max(60),
            accountName: z.string().trim().min(1, "Whose account is it?").max(80),
            accountNumber: z.string().trim().min(3, "Add the account number, DuitNow ID or phone").max(40),
          }),
        )
        .max(5, "Five accounts at most"),
    })
    .refine((p) => !p.enabled || p.accounts.length > 0, { message: "Add at least one account before turning payments on", path: ["accounts"] })
    .optional(),
});

export const PATCH = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const b = await body(req, Patch);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const settings = { ...ws.settings };
  if (b.demoTraffic !== undefined) settings.demoTraffic = b.demoTraffic && env.demoMode && Boolean(settings.sample);
  if (b.confidenceThreshold !== undefined) settings.confidenceThreshold = b.confidenceThreshold;
  if (b.resumeRetentionDays !== undefined) settings.resumeRetentionDays = b.resumeRetentionDays;
  if (b.payments) {
    settings.payments = { enabled: b.payments.enabled, requireReceipt: b.payments.requireReceipt, note: b.payments.note || undefined, accounts: b.payments.accounts.map((a) => ({ ...a, id: randomUUID().slice(0, 8) })) };
  }
  await db.update(t.workspaces).set({ settings }).where(eq(t.workspaces.id, ws.id));
  for (const [type, mode] of Object.entries(b.channelModes ?? {})) {
    if (!mode) continue;
    await db.update(t.channels).set({ mode }).where(and(eq(t.channels.workspaceId, ws.id), eq(t.channels.type, type as "telegram")));
  }
  return ok({ ok: true, settings });
});
