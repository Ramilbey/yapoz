import { z } from "zod";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { isTimezone, ONBOARDING_STEPS, ONBOARDING_VERSION, onboardingOf } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  return ok({ id: ws.id, name: ws.name, city: ws.city, timezone: ws.timezone, currency: ws.currency, settings: ws.settings });
});

const Patch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().max(80).optional(),
  timezone: z.string().refine(isTimezone, "Unknown time zone").optional(),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code like MYR").optional(),
  business: z
    .object({
      type: z.string().trim().max(80),
      description: z.string().trim().max(2000),
      address: z.string().trim().max(300),
      phone: z.string().trim().max(40).nullable(),
      website: z.string().trim().max(300).nullable(),
      languages: z.array(z.string().trim().min(1).max(40)).max(8),
    })
    .partial()
    .optional(),
  live: z.boolean().optional(),
  onboardingStep: z.number().int().min(1).max(ONBOARDING_STEPS).optional(),
  completeOnboarding: z.boolean().optional(),
});

export const PATCH = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const b = await body(req, Patch);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const settings = structuredClone(ws.settings);
  if (b.business) settings.business = { ...settings.business, ...b.business };
  if (b.live !== undefined) {
    if (b.live) {
      const items = await db.select({ id: t.kbItems.id }).from(t.kbItems).where(eq(t.kbItems.workspaceId, ws.id)).limit(1);
      if (!items.length) throw new HttpError(400, "Add what your business sells or offers before going live, so the assistant has something to answer from.");
    }
    settings.live = b.live;
  }
  settings.onboarding = onboardingOf(settings);
  if (b.onboardingStep) settings.onboarding = { ...settings.onboarding, step: Math.max(settings.onboarding.step, b.onboardingStep) };
  if (b.completeOnboarding) settings.onboarding = { step: ONBOARDING_STEPS, completedAt: settings.onboarding.completedAt ?? new Date().toISOString(), version: ONBOARDING_VERSION };
  const patch: Partial<typeof t.workspaces.$inferInsert> = { settings };
  if (b.name) patch.name = b.name;
  if (b.city !== undefined) patch.city = b.city;
  if (b.timezone) patch.timezone = b.timezone;
  if (b.currency) patch.currency = b.currency;
  await db.update(t.workspaces).set(patch).where(eq(t.workspaces.id, ws.id));
  await audit(s, "settings.updated", { keys: Object.keys(b) });
  if (b.live !== undefined && b.live !== Boolean(ws.settings.live)) await audit(s, "assistant.live", { live: b.live });
  return ok({ ok: true, settings });
});
