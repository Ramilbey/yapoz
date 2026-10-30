// Creating a business on Jawab: a short readable workspace ID, sensible defaults, the channel rows and the owner's staff row.
import { randomInt } from "node:crypto";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import type { WorkspaceSettings } from "@/db/schema";

/** Currency guess from the browser's time zone; the owner confirms it during setup. */
const TZ_CURRENCY: [RegExp, string][] = [
  [/^Asia\/(Kuala_Lumpur|Kuching)$/, "MYR"],
  [/^Asia\/Singapore$/, "SGD"],
  [/^Asia\/(Jakarta|Makassar|Jayapura|Pontianak)$/, "IDR"],
  [/^Asia\/Bangkok$/, "THB"],
  [/^Asia\/Manila$/, "PHP"],
  [/^Asia\/(Ho_Chi_Minh|Saigon)$/, "VND"],
  [/^Asia\/(Kolkata|Calcutta)$/, "INR"],
  [/^Asia\/Karachi$/, "PKR"],
  [/^Asia\/Dhaka$/, "BDT"],
  [/^Asia\/Dubai$/, "AED"],
  [/^Asia\/Riyadh$/, "SAR"],
  [/^Asia\/Qatar$/, "QAR"],
  [/^Asia\/Tokyo$/, "JPY"],
  [/^Asia\/Seoul$/, "KRW"],
  [/^Asia\/(Hong_Kong)$/, "HKD"],
  [/^Asia\/(Shanghai|Chongqing|Harbin|Urumqi)$/, "CNY"],
  [/^Africa\/Cairo$/, "EGP"],
  [/^Africa\/Lagos$/, "NGN"],
  [/^Africa\/Nairobi$/, "KES"],
  [/^Africa\/Johannesburg$/, "ZAR"],
  [/^Europe\/London$/, "GBP"],
  [/^Europe\/Istanbul$/, "TRY"],
  [/^Europe\/(Zurich)$/, "CHF"],
  [/^Europe\//, "EUR"],
  [/^Australia\//, "AUD"],
  [/^Pacific\/Auckland$/, "NZD"],
  [/^America\/Toronto|^America\/Vancouver$/, "CAD"],
  [/^America\/Sao_Paulo$/, "BRL"],
  [/^America\/Mexico_City$/, "MXN"],
  [/^America\//, "USD"],
];

export function currencyFor(timezone: string) {
  return TZ_CURRENCY.find(([re]) => re.test(timezone))?.[1] ?? "USD";
}

export function cityFor(timezone: string) {
  const last = timezone.split("/").pop() ?? "";
  return last.replace(/_/g, " ");
}

export function isTimezone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** "Kasih Hair Studio" → "KASIH" + digits, unique, 3–12 characters (it doubles as the Telegram deep-link code). */
export async function makeWorkspaceId(name: string): Promise<string> {
  const words = name.toUpperCase().normalize("NFKD").replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  let stem = (words[0] ?? "").slice(0, 7);
  if (stem.length < 3) stem = (words.join("") || "SHOP").slice(0, 7);
  if (stem.length < 3) stem = (stem + "SHOP").slice(0, 4);
  for (let i = 0; i < 40; i++) {
    const digits = i < 20 ? randomInt(10, 100) : randomInt(100, 10000);
    const id = `${stem}${digits}`.slice(0, 12);
    const [hit] = await db.select({ id: t.workspaces.id }).from(t.workspaces).where(eq(t.workspaces.id, id));
    if (!hit) return id;
  }
  throw new Error("Couldn't pick a workspace ID, try again.");
}

export function defaultSettings(): WorkspaceSettings {
  return {
    confidenceThreshold: 0.55,
    demoTraffic: false,
    business: { type: "", description: "", address: "", phone: null, website: null, languages: ["English"] },
    live: false,
    onboarding: { step: 1, completedAt: null, version: ONBOARDING_VERSION },
  };
}

export const ONBOARDING_VERSION = 2;
export const ONBOARDING_STEPS = 7;

/**
 * The setup step in today's numbering. Version 2 put "How you sell" in at step 4, so an unfinished workspace from
 * before that at step 4 or later moves up one. Finished workspaces stay as they are.
 */
export function onboardingOf(settings: Pick<WorkspaceSettings, "onboarding">): WorkspaceSettings["onboarding"] {
  const o = settings.onboarding ?? { step: 1, completedAt: null };
  if (o.completedAt || (o.version ?? 1) >= ONBOARDING_VERSION) return o;
  const step = o.step >= 4 ? o.step + 1 : o.step;
  return { ...o, step: Math.min(Math.max(step, 1), ONBOARDING_STEPS), version: ONBOARDING_VERSION };
}

/** Saves the renumbered step the first time an old workspace is read, so the bump happens once. */
export async function ensureOnboarding<W extends { id: string; settings: WorkspaceSettings }>(ws: W): Promise<W> {
  const o = onboardingOf(ws.settings);
  if (o === ws.settings.onboarding) return ws;
  const settings = { ...ws.settings, onboarding: o };
  await db.update(t.workspaces).set({ settings }).where(eq(t.workspaces.id, ws.id));
  return { ...ws, settings };
}

export async function createWorkspace(input: { name: string; timezone: string; owner: { name: string; email: string; passwordHash: string } }) {
  const id = await makeWorkspaceId(input.name);
  const timezone = isTimezone(input.timezone) ? input.timezone : "UTC";
  return db.transaction(async (tx) => {
    await tx.insert(t.workspaces).values({ id, name: input.name.trim(), city: cityFor(timezone), timezone, currency: currencyFor(timezone), settings: defaultSettings() });
    const [user] = await tx.insert(t.users).values({ workspaceId: id, email: input.owner.email.trim().toLowerCase(), name: input.owner.name.trim(), role: "owner", passwordHash: input.owner.passwordHash }).returning();
    // The owner is on the team from the start, switched off until setup (or Calendar) turns bookings on.
    await tx.insert(t.staff).values({ userId: user.id, workspaceId: id, takesAppointments: false });
    await tx.insert(t.channels).values([
      { workspaceId: id, type: "simulator", mode: "autopilot", config: {} },
      { workspaceId: id, type: "telegram", mode: "autopilot", config: {} },
      { workspaceId: id, type: "whatsapp", mode: "autopilot", config: {} },
    ]);
    await tx.insert(t.events).values({ workspaceId: id, type: "workspace.created", props: {} });
    return { workspaceId: id, user };
  });
}
