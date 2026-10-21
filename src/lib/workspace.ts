// Creating a business on Jawab: a short readable workspace ID, sensible defaults, and the four channel rows.
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
    resumeRetentionDays: 180,
    business: { type: "", description: "", address: "", phone: null, website: null, languages: ["English"] },
    modules: { hiring: false },
    live: false,
    onboarding: { step: 1, completedAt: null },
    hr: { interviewMinutes: 30, workdayStart: "10:00", workdayEnd: "18:00", location: "" },
  };
}

export async function createWorkspace(input: { name: string; timezone: string; owner: { name: string; email: string; passwordHash: string } }) {
  const id = await makeWorkspaceId(input.name);
  const timezone = isTimezone(input.timezone) ? input.timezone : "UTC";
  return db.transaction(async (tx) => {
    await tx.insert(t.workspaces).values({ id, name: input.name.trim(), city: cityFor(timezone), timezone, currency: currencyFor(timezone), settings: defaultSettings() });
    const [user] = await tx.insert(t.users).values({ workspaceId: id, email: input.owner.email.trim().toLowerCase(), name: input.owner.name.trim(), role: "owner", passwordHash: input.owner.passwordHash }).returning();
    await tx.insert(t.channels).values([
      { workspaceId: id, type: "simulator", mode: "autopilot", config: {} },
      { workspaceId: id, type: "telegram", mode: "autopilot", config: {} },
      { workspaceId: id, type: "whatsapp", mode: "autopilot", config: {} },
      { workspaceId: id, type: "instagram", mode: "autopilot", config: {} },
    ]);
    await tx.insert(t.events).values({ workspaceId: id, type: "workspace.created", props: {} });
    return { workspaceId: id, user };
  });
}
