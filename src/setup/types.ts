// What the setup interview produces: a draft of everything the assistant needs to know, which the owner
// reviews and edits before it's saved to Knowledge. Shared by the server (Claude output, import) and the wizard UI.
import { z } from "zod";
import type { AppointmentSettings, PaymentSettings, StockMode, StockSettings } from "@/db/schema";
import type { HoursData } from "@/lib/hours";

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/);
const text = (max: number) => z.string().trim().max(max);

export const DraftOption = z.object({
  label: text(80).nullable().default(null),
  /** Major units (e.g. 28.50). null = price on request. */
  price: z.number().min(0).max(10_000_000).nullable().default(null),
  stock: z.number().int().min(0).nullable().default(null),
});

export const DraftItem = z.object({
  kind: z.enum(["product", "service"]),
  name: text(120).min(1),
  category: text(40).min(1).default("general"),
  description: text(1000).default(""),
  options: z.array(DraftOption).max(30).default([]),
  durationMinutes: z.number().int().min(5).max(24 * 60).nullable().default(null),
  tags: z.array(text(30)).max(10).default([]),
});

const dayHours = z.array(z.tuple([hhmm, hhmm])).max(4).default([]);

export const DraftHours = z.object({
  weekly: z.object({ mon: dayHours, tue: dayHours, wed: dayHours, thu: dayHours, fri: dayHours, sat: dayHours, sun: dayHours }),
  lastOrdersMinutesBeforeClose: z.number().int().min(0).max(240).default(0),
  notes: text(300).default(""),
});

export const DraftPolicy = z.object({ topic: text(40).min(1), title: text(120).min(1), body: text(2000).min(1) });
export const DraftFaq = z.object({ question: text(300).min(1), answer: text(2000).min(1), topic: text(40).default("general") });
export const DraftQuestion = z.object({ question: text(300).min(1), why: text(300).default(""), answer: text(2000).default("") });

export const Draft = z.object({
  summary: text(1500).default(""),
  businessType: text(80).default(""),
  hours: DraftHours.nullable().default(null),
  items: z.array(DraftItem).max(300).default([]),
  delivery: z.object({ offered: z.boolean(), details: text(1500) }).nullable().default(null),
  policies: z.array(DraftPolicy).max(40).default([]),
  faqs: z.array(DraftFaq).max(80).default([]),
  openQuestions: z.array(DraftQuestion).max(20).default([]),
});

export type Draft = z.infer<typeof Draft>;
export type DraftItem = z.infer<typeof DraftItem>;

export function emptyDraft(): Draft {
  return Draft.parse({});
}

export type SetupSource = { id: string; kind: "file" | "notes" | "website"; filename: string | null; mime: string | null; size: number; chars: number; createdAt: string };

/** GET /api/setup → selling: what the "How you sell" step starts from (settings with their defaults filled in). */
export type SetupSelling = {
  businessName: string;
  businessType: string;
  address: string;
  stock: StockSettings;
  /** false = the default mode is still the guess from the business type. */
  stockSaved: boolean;
  appointments: AppointmentSettings;
  appointmentsSaved: boolean;
  payments: PaymentSettings | null;
  /** Where services happen by default for this business type. */
  inPersonGuess: boolean;
  hours: HoursData | null;
  /** The signed-in owner's staff row. */
  owner: { userId: string; name: string; takesAppointments: boolean };
  /** Logins in the workspace, and how many of them take bookings. */
  team: number;
  bookers: number;
  /** Active products; `mode` is the item's own mode or the business default. */
  products: { id: string; title: string; stockMode: StockMode | null; mode: StockMode; options: { id: string; label: string; stock: number | null; dailyQty: number | null }[] }[];
  /** Active services. */
  services: { id: string; title: string; inPerson: boolean; durationMinutes: number | null; data: Record<string, unknown> }[];
};

/** GET /api/setup → checks: the Go live warnings. */
export type SetupChecks = {
  services: number;
  inPersonServices: number;
  /** People switched on to take bookings. */
  bookers: number;
  /** Opening hours with at least one open day. */
  hasHours: boolean;
  hasAddress: boolean;
  /** Payments on with at least one account. */
  paymentsOn: boolean;
  stockMode: StockMode;
  /** Daily-mode products with an option that has no usual quantity (treated as unlimited). */
  dailyWithoutQty: number;
  firstService: string | null;
};
