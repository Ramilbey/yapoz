// What the setup interview produces: a draft of everything the assistant needs to know, which the owner
// reviews and edits before it's saved to Knowledge. Shared by the server (Claude output, import) and the wizard UI.
import { z } from "zod";

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
  bookingType: text(40).nullable().default(null),
  tags: z.array(text(30)).max(10).default([]),
});

export const DraftBookingType = z.object({
  key: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{2,30}$/),
  name: text(60).min(1),
  unit: z.enum(["party", "appointment", "day"]),
  capacity: z.number().int().min(1).max(10_000),
  durationMinutes: z.number().int().min(5).max(24 * 60).default(60),
  slotMinutes: z.number().int().min(5).max(24 * 60).default(30),
  maxPerBooking: z.number().int().min(1).max(1000).default(1),
  leadMinutes: z.number().int().min(0).max(60 * 24 * 30).default(60),
  notes: text(500).default(""),
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
  bookingTypes: z.array(DraftBookingType).max(10).default([]),
  delivery: z.object({ offered: z.boolean(), details: text(1500) }).nullable().default(null),
  policies: z.array(DraftPolicy).max(40).default([]),
  faqs: z.array(DraftFaq).max(80).default([]),
  openQuestions: z.array(DraftQuestion).max(20).default([]),
});

export type Draft = z.infer<typeof Draft>;
export type DraftItem = z.infer<typeof DraftItem>;
export type DraftBookingType = z.infer<typeof DraftBookingType>;

export function emptyDraft(): Draft {
  return Draft.parse({});
}

export type SetupSource = { id: string; kind: "file" | "notes" | "website"; filename: string | null; mime: string | null; size: number; chars: number; createdAt: string };
