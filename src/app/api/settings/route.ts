import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, t } from "@/db";
import { and, eq, gt, sql } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { channelStatus } from "@/channels/connections";
import { getProviders } from "@/agent/ai-router";
import { stockSettings } from "@/lib/stock";
import { appointmentSettings } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  return ok({
    workspace: { id: ws.id, name: ws.name, city: ws.city, settings: ws.settings, timezone: ws.timezone, currency: ws.currency },
    /** With defaults filled in (the business type picks the default mode until the owner chooses one). */
    stock: stockSettings(ws),
    appointments: appointmentSettings(ws),
    channels: await channelStatus(s.workspaceId),
    ai: {
      providers: getProviders().map((p) => ({ name: p.name, vision: p.vision })),
      recent: await db
        .select({ model: t.agentRuns.model, n: sql<number>`count(*)::int`, failed: sql<number>`count(*) filter (where ${t.agentRuns.outcome} = 'error')::int` })
        .from(t.agentRuns)
        .where(and(eq(t.agentRuns.workspaceId, s.workspaceId), eq(t.agentRuns.isDemo, false), gt(t.agentRuns.createdAt, new Date(Date.now() - 86_400_000))))
        .groupBy(t.agentRuns.model)
        .orderBy(sql`2 desc`)
        .limit(8),
    },
    demoMode: env.demoMode,
    appUrl: env.appUrl,
  });
});

const Patch = z.object({
  // partialRecord: zod 4's z.record with enum keys demands every key, and the UI sends one channel at a time.
  channelModes: z.partialRecord(z.enum(["telegram", "whatsapp", "simulator"]), z.enum(["autopilot", "copilot"])).optional(),
  demoTraffic: z.boolean().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  retentionDays: z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365), z.null()]).optional(),
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
  stock: z
    .object({
      defaultMode: z.enum(["none", "daily", "tracked"]),
      dayStartsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 04:00"),
      holdMinutes: z.number().int().min(5, "At least 5 minutes").max(24 * 60),
      preorderDays: z.number().int().min(0).max(60),
      lowStockDefault: z.number().int().min(0).max(100_000),
    })
    .optional(),
  appointments: z
    .object({
      slotMinutes: z.number().int().min(5).max(240),
      assignment: z.enum(["anyone", "specific"]),
      bookingDays: z.number().int().min(1).max(365),
      minNoticeMinutes: z.number().int().min(0).max(10_080),
      changeCutoffHours: z.number().int().min(0).max(720),
      reminderMinutes: z.number().int().min(0).max(10_080),
      bufferMinutes: z.number().int().min(0).max(240),
      meetBase: z.url({ protocol: /^https$/, error: "Use an https:// address" }).max(200),
      whatsappTemplate: z.object({ name: z.string().trim().regex(/^[a-z0-9_]{1,100}$/i, "Letters, digits and underscores only"), lang: z.string().trim().min(2).max(10) }).nullable().optional(),
    })
    .optional(),
});

export const PATCH = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const b = await body(req, Patch);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const settings = { ...ws.settings };
  if (b.demoTraffic !== undefined) settings.demoTraffic = b.demoTraffic && env.demoMode && Boolean(settings.sample);
  if (b.confidenceThreshold !== undefined) settings.confidenceThreshold = b.confidenceThreshold;
  if (b.retentionDays !== undefined) settings.privacy = { ...settings.privacy, retentionDays: b.retentionDays };
  if (b.stock) settings.stock = b.stock;
  if (b.appointments) settings.appointments = { ...b.appointments, whatsappTemplate: b.appointments.whatsappTemplate ?? null };
  if (b.payments) {
    settings.payments = { enabled: b.payments.enabled, requireReceipt: b.payments.requireReceipt, note: b.payments.note || undefined, accounts: b.payments.accounts.map((a) => ({ ...a, id: randomUUID().slice(0, 8) })) };
  }
  await db.update(t.workspaces).set({ settings }).where(eq(t.workspaces.id, ws.id));
  for (const [type, mode] of Object.entries(b.channelModes ?? {})) {
    if (!mode) continue;
    await db.update(t.channels).set({ mode }).where(and(eq(t.channels.workspaceId, ws.id), eq(t.channels.type, type as "telegram")));
  }
  const props: Record<string, unknown> = { keys: Object.keys(b) };
  if (b.channelModes) props.channelModes = b.channelModes;
  if (b.stock) props.stock = b.stock;
  if (b.appointments) props.appointments = { ...b.appointments, whatsappTemplate: b.appointments.whatsappTemplate?.name ?? null };
  if (b.payments) props.payments = { enabled: b.payments.enabled, requireReceipt: b.payments.requireReceipt, accounts: b.payments.accounts.length };
  await audit(s, "settings.updated", props);
  return ok({ ok: true, settings });
});
