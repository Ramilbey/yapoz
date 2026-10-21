// The setup interview: Claude reads the owner's description, uploaded files (menus, price lists, flyers,
// photos of a price board) and website, and drafts everything the assistant needs, with open questions for
// whatever it couldn't find. Nothing is invented: missing facts become questions for the owner.
import type Anthropic from "@anthropic-ai/sdk";
import { db, t } from "@/db";
import { and, asc, eq } from "drizzle-orm";
import { claude } from "@/agent/claude";
import { env } from "@/lib/env";
import { Draft, DraftBookingType, DraftFaq, DraftHours, DraftItem, DraftPolicy, DraftQuestion, emptyDraft, type Draft as DraftT } from "./types";

type Ws = typeof t.workspaces.$inferSelect;

const option = { type: "object", properties: { label: { type: ["string", "null"], description: "Size, length or variant name, e.g. 'Large', 'Long hair', '1 hour'. null when there's only one price." }, price: { type: ["number", "null"], description: "In major units of the business currency, e.g. 28.5. null if not stated." }, stock: { type: ["integer", "null"], description: "Only if a stock count is stated" } }, required: ["label", "price"] };
const hours = { type: "array", items: { type: "array", items: { type: "string", description: "HH:MM, 24-hour" }, minItems: 2, maxItems: 2 }, description: "Open intervals, e.g. [[\"10:00\",\"14:00\"],[\"17:00\",\"22:00\"]]. Empty array = closed." };

const TOOL: Anthropic.Messages.Tool = {
  name: "record_business_draft",
  description: "Record the knowledge draft for this business's customer assistant.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "2-4 sentences: what the business is and offers, for the assistant's own context" },
      businessType: { type: "string", description: "A few words, e.g. 'hair salon', 'bakery and café'" },
      hours: {
        type: ["object", "null"],
        description: "Regular weekly opening hours, only if stated",
        properties: { weekly: { type: "object", properties: { mon: hours, tue: hours, wed: hours, thu: hours, fri: hours, sat: hours, sun: hours }, required: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] }, lastOrdersMinutesBeforeClose: { type: "integer" }, notes: { type: "string" } },
        required: ["weekly"],
      },
      items: {
        type: "array",
        description: "Every product and service with its prices. Group with short lowercase categories.",
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["product", "service"] },
            name: { type: "string" },
            category: { type: "string" },
            description: { type: "string", description: "What it is, what's included, notable details (ingredients, allergens, materials)" },
            options: { type: "array", items: option },
            durationMinutes: { type: ["integer", "null"], description: "For services that are booked" },
            bookingType: { type: ["string", "null"], description: "Key of the booking type used to book this service" },
            tags: { type: "array", items: { type: "string" }, description: "e.g. vegetarian, halal, spicy, bestseller" },
          },
          required: ["kind", "name", "category", "description", "options"],
        },
      },
      bookingTypes: {
        type: "array",
        description:
          "How customers book, if they do. unit 'party' = tables or group sessions by headcount (capacity = total seats per time slot); 'appointment' = one service per booking (capacity = staff or stations serving at the same time); 'day' = whole-day rentals or rooms (capacity = units per day). Empty if the business doesn't take bookings.",
        items: {
          type: "object",
          properties: {
            key: { type: "string", description: "short lowercase id, e.g. 'table', 'appointment', 'room'" },
            name: { type: "string" },
            unit: { type: "string", enum: ["party", "appointment", "day"] },
            capacity: { type: "integer" },
            durationMinutes: { type: "integer" },
            slotMinutes: { type: "integer", description: "Booking start times every N minutes" },
            maxPerBooking: { type: "integer" },
            leadMinutes: { type: "integer", description: "How far ahead a booking must be made" },
            notes: { type: "string", description: "Deposits, holding time, walk-ins" },
          },
          required: ["key", "name", "unit", "capacity", "durationMinutes", "slotMinutes", "maxPerBooking", "leadMinutes", "notes"],
        },
      },
      delivery: { type: ["object", "null"], properties: { offered: { type: "boolean" }, details: { type: "string", description: "Areas, fees, minimums, times, partners (Grab, Foodpanda...)" } }, required: ["offered", "details"] },
      policies: { type: "array", items: { type: "object", properties: { topic: { type: "string", description: "one lowercase word: payment, cancellation, booking, location, returns, warranty, kids, pets..." }, title: { type: "string" }, body: { type: "string" } }, required: ["topic", "title", "body"] } },
      faqs: {
        type: "array",
        description: "15-25 questions customers will really send, written the way they type them (short, casual, local phrasing), each with the business's answer from the sources",
        items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" }, topic: { type: "string" } }, required: ["question", "answer", "topic"] },
      },
      openQuestions: {
        type: "array",
        description: "Up to 8 important things customers will ask that the sources don't answer or leave ambiguous, for the owner to answer",
        items: { type: "object", properties: { question: { type: "string" }, why: { type: "string" } }, required: ["question", "why"] },
      },
    },
    required: ["summary", "businessType", "hours", "items", "bookingTypes", "delivery", "policies", "faqs", "openQuestions"],
  },
};

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

/** Builds the user message from everything the owner gave us. */
export async function sourceBlocks(ws: Ws): Promise<Anthropic.Messages.ContentBlockParam[]> {
  const sources = await db.select().from(t.setupSources).where(eq(t.setupSources.workspaceId, ws.id)).orderBy(asc(t.setupSources.createdAt));
  const b = ws.settings.business;
  const blocks: Anthropic.Messages.ContentBlockParam[] = [
    {
      type: "text",
      text: [
        `Business: ${ws.name}${b.type ? ` (${b.type})` : ""}`,
        `City: ${ws.city}. Time zone: ${ws.timezone}. Currency: ${ws.currency}.`,
        b.address ? `Address: ${b.address}` : "",
        b.phone ? `Phone: ${b.phone}` : "",
        b.website ? `Website: ${b.website}` : "",
        `Customers write in: ${b.languages.join(", ") || "English"}.`,
      ].filter(Boolean).join("\n"),
    },
  ];
  for (const s of sources) {
    if (s.kind === "notes" && s.text.trim()) blocks.push({ type: "text", text: `The owner describes the business in their own words:\n"""\n${s.text.slice(0, 20_000)}\n"""` });
    else if (s.kind === "website" && s.text.trim()) blocks.push({ type: "text", text: `Text from the business's website:\n"""\n${s.text.slice(0, 40_000)}\n"""` });
    else if (s.kind === "file" && s.bytes) {
      const data = Buffer.from(s.bytes).toString("base64");
      if (s.mime === "application/pdf") blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data }, title: s.filename ?? "document.pdf" });
      else if (s.mime && IMAGE_TYPES.has(s.mime)) {
        blocks.push({ type: "text", text: `Uploaded image: ${s.filename ?? "image"}` });
        blocks.push({ type: "image", source: { type: "base64", media_type: s.mime as "image/png", data } });
      } else if (s.text.trim()) blocks.push({ type: "text", text: `Uploaded file ${s.filename ?? ""}:\n"""\n${s.text.slice(0, 30_000)}\n"""` });
    }
  }
  blocks.push({ type: "text", text: "Draft the knowledge for this business's assistant now by calling record_business_draft." });
  return blocks;
}

const list = <T,>(x: unknown, parse: (v: unknown) => { success: true; data: T } | { success: false }) =>
  (Array.isArray(x) ? x : []).map((v) => parse(v)).filter((r): r is { success: true; data: T } => r.success).map((r) => r.data);

/** Keeps every valid part of what came back instead of failing the whole draft on one odd field. */
export function coerceDraft(raw: Record<string, unknown>): DraftT {
  const d = emptyDraft();
  d.summary = String(raw.summary ?? "").slice(0, 1500);
  d.businessType = String(raw.businessType ?? "").slice(0, 80);
  const h = DraftHours.safeParse(raw.hours);
  d.hours = h.success ? h.data : null;
  d.items = list(raw.items, (v) => DraftItem.safeParse(v));
  d.bookingTypes = list(
    (Array.isArray(raw.bookingTypes) ? raw.bookingTypes : []).map((b: Record<string, unknown>) => ({ ...b, key: String(b?.key ?? b?.name ?? "booking").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "booking" })),
    (v) => DraftBookingType.safeParse(v),
  );
  const del = raw.delivery as { offered?: unknown; details?: unknown } | null;
  d.delivery = del && typeof del === "object" ? { offered: Boolean(del.offered), details: String(del.details ?? "").slice(0, 1500) } : null;
  const full = Draft.safeParse({ ...d, policies: raw.policies, faqs: raw.faqs, openQuestions: raw.openQuestions });
  if (full.success) return full.data;
  d.policies = list(raw.policies, (v) => DraftPolicy.safeParse(v));
  d.faqs = list(raw.faqs, (v) => DraftFaq.safeParse(v));
  d.openQuestions = list(raw.openQuestions, (v) => DraftQuestion.safeParse(v));
  return d;
}

export async function generateDraft(ws: Ws): Promise<DraftT> {
  const system = [
    "You set up the AI front desk for a small business: the assistant that answers its customers on WhatsApp, Telegram and Instagram.",
    "From the owner's own words, their uploaded files (menus, price lists, flyers, photos of a price board) and their website, draft the knowledge the assistant needs by calling record_business_draft.",
    "Only record facts that are in the sources. Never invent prices, opening hours, policies, stock or delivery areas. If something customers will ask about is missing or unclear, put it in openQuestions instead.",
    `Prices are numbers in ${ws.currency} major units. When an item has sizes, lengths or variants with different prices, list each as an option.`,
    "Services that customers book get durationMinutes and the key of their booking type.",
    "Write FAQ questions the way real customers type in chat apps: short, casual, sometimes with local slang or mixed languages. Answers are friendly, short and come from the sources.",
    "Keep the business's own names for things. Leave out anything about staff personal details.",
  ].join("\n");
  const res = await claude().messages.create(
    {
      model: env.smartModel,
      max_tokens: 16_000,
      system,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: await sourceBlocks(ws) }],
    },
    { timeout: 240_000 },
  );
  const block = res.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
  if (!block) throw new Error("Claude didn't return a draft. Try again.");
  const draft = coerceDraft(block.input as Record<string, unknown>);
  await db.insert(t.events).values({ workspaceId: ws.id, type: "setup.drafted", props: { items: draft.items.length, faqs: draft.faqs.length, questions: draft.openQuestions.length, stopReason: res.stop_reason, model: env.smartModel, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens } });
  return draft;
}

export async function saveDraft(workspaceId: string, draft: DraftT) {
  await db.delete(t.setupSources).where(and(eq(t.setupSources.workspaceId, workspaceId), eq(t.setupSources.kind, "draft")));
  await db.insert(t.setupSources).values({ workspaceId, kind: "draft", text: JSON.stringify(draft) });
}

export async function loadDraft(workspaceId: string): Promise<DraftT | null> {
  const [row] = await db.select().from(t.setupSources).where(and(eq(t.setupSources.workspaceId, workspaceId), eq(t.setupSources.kind, "draft")));
  if (!row) return null;
  try {
    return coerceDraft(JSON.parse(row.text));
  } catch {
    return null;
  }
}
