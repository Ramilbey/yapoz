import type Anthropic from "@anthropic-ai/sdk";
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import type { Catalog, Workspace } from "./knowledge";
import { findProduct, norm } from "./knowledge";
import { formatMoney } from "@/lib/money";
import { hoursForDate, describeDay, openStatus, type HoursData } from "@/lib/hours";
import { addLocalDays, localDate, human, zoned } from "@/lib/time";
import { checkSlots, createBooking } from "@/lib/booking";
import type { ToolCallLog } from "@/db/schema";

export const ESCALATION_CATEGORIES = [
  "partnership", "wholesale", "complaint", "refund", "legal", "allergy", "abuse", "negotiation",
  "events_lead", "large_group", "knowledge_gap", "low_confidence", "other",
] as const;

const BUSINESS_TOPICS = ["hours", "delivery", "booking", "payment", "location", "halal", "allergens", "events", "complaints", "drinks", "house", "promotions", "food", "jobs", "extras"] as const;

export const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "search_catalog",
    description: "Search the menu, sides, drinks and merch. Returns matching items with prices per size, dietary flags, allergens and whether available today. Use for browsing or 'do you have X' questions.",
    input_schema: { type: "object", properties: { query: { type: "string", description: "What the customer is looking for, e.g. 'spicy pizza', 'vegan', 'dessert', 'apron'" } }, required: ["query"] },
  },
  {
    name: "check_variant",
    description: "Price and stock for one product, optionally a size and colour. Call this before stating any price or whether a specific item/size/colour is in stock or available today.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product name as the customer said it, e.g. 'margherita', 'apron'" },
        size: { type: "string", description: "S, M, L or XL (small/medium/large accepted)" },
        color: { type: "string" },
      },
      required: ["product"],
    },
  },
  {
    name: "get_business_info",
    description: "Opening hours (optionally for a specific date, including holiday exceptions), delivery zones and fees, and policy details.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", enum: [...BUSINESS_TOPICS] },
        date: { type: "string", description: "YYYY-MM-DD, for hours on a specific day" },
      },
      required: ["topic"],
    },
  },
  {
    name: "check_slots",
    description: "Available table times on a date for a party size. Returns open times and, if a time is given, whether it's free plus nearest alternatives.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD in the business's time zone" },
        party_size: { type: "integer", minimum: 1 },
        time: { type: "string", description: "Preferred time, 24h HH:MM" },
      },
      required: ["date", "party_size"],
    },
  },
  {
    name: "create_booking",
    description: "Book a table. Validates hours, lead time and capacity itself, so call it directly when date, time and party size are known. Returns a reference code on success, or the reason and alternatives.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "24h HH:MM, on a 30-minute boundary" },
        party_size: { type: "integer", minimum: 1 },
        phone: { type: "string" },
        notes: { type: "string", description: "e.g. birthday, high chair, terrace" },
      },
      required: ["customer_name", "date", "time", "party_size"],
    },
  },
  {
    name: "escalate",
    description: "Hand the thread to a human. It lands in the team's 'Needs you' queue with your summary. After calling it, send the customer a short holding reply and do not answer the substance.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: [...ESCALATION_CATEGORIES] },
        priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
        reason: { type: "string", description: "Why a human is needed, a few words" },
        summary: { type: "string", description: "One line for staff: who wants what" },
        gap_key: { type: "string", description: "Only for knowledge_gap: a short normalized topic, e.g. 'gluten-free base'. Reuse an existing open gap key if one matches." },
      },
      required: ["category", "priority", "reason", "summary"],
    },
  },
];

export type ToolContext = {
  ws: Workspace;
  catalog: Catalog;
  threadId: string;
  customerId: string;
  customerName: string;
  channel: "telegram" | "whatsapp" | "instagram" | "simulator";
  escalations: { id: string; category: string; summary: string }[];
  bookings: { refCode: string; id: string }[];
  isDemo?: boolean;
};

const SIZE_LABEL: Record<string, string> = { S: "Small", M: "Medium", L: "Large", XL: "XL" };

export function normSize(s?: string | null): string | null {
  if (!s) return null;
  const v = s.trim().toLowerCase().replace(/["”]/g, "");
  if (["xl", "extra large", "x-large", "xlarge"].includes(v)) return "XL";
  if (["s", "small", "9", "9in", "kecil"].includes(v)) return "S";
  if (["m", "medium", "12", "12in", "sederhana"].includes(v)) return "M";
  if (["l", "large", "15", "15in", "besar", "big"].includes(v)) return "L";
  return s.toUpperCase();
}

export function normTime(s: string): string | null {
  const v = s.trim().toLowerCase().replace(/\s+/g, "");
  let m = v.match(/^(\d{1,2})[:.](\d{2})$/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  m = v.match(/^(\d{1,2})(?:[:.](\d{2}))?(am|pm)$/);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3] === "pm") h += 12;
    return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
  }
  m = v.match(/^(\d{1,2})$/);
  if (m) return `${m[1].padStart(2, "0")}:00`;
  return null;
}

function itemSummary(ws: Workspace, i: Catalog["items"][number]) {
  const d = i.data as Record<string, unknown>;
  const bySize = i.variants
    .filter((v, idx, arr) => arr.findIndex((x) => x.size === v.size) === idx)
    .map((v) => ({ size: v.size ? `${v.size}${SIZE_LABEL[v.size] ? ` (${SIZE_LABEL[v.size]})` : ""}` : "one size", price: formatMoney(v.priceMinor, ws.currency) }));
  return {
    name: i.title,
    category: i.category,
    description: i.body,
    prices: bySize,
    vegetarian: Boolean(d.vegetarian),
    vegan: Boolean(d.vegan),
    halal: d.halal !== false,
    spicy: Boolean(d.spicy),
    allergens: (d.allergens as string[] | undefined) ?? [],
    availableToday: i.available,
    availabilityNote: i.availabilityNote,
    colors: [...new Set(i.variants.map((v) => v.color).filter(Boolean))],
  };
}

const STOP = new Set(["free", "without", "no", "based", "option", "options", "do", "you", "have", "got", "any", "the", "a", "an", "is", "there", "ada", "or", "not", "can", "i", "get", "some", "with", "for", "me", "your", "u", "pizza", "pizzas", "something", "what", "which"]);

function searchCatalog(ctx: ToolContext, query: string) {
  const q = norm(query);
  const words = q.split(" ").filter((w) => w && !STOP.has(w));
  let items = ctx.catalog.items;
  const want = (re: RegExp) => re.test(q);
  if (want(/\bvegan\b/)) items = items.filter((i) => (i.data as Record<string, unknown>).vegan);
  else if (want(/\b(veg|vegetarian|meatless|no meat)\b/)) items = items.filter((i) => (i.data as Record<string, unknown>).vegetarian);
  if (want(/\bspicy|pedas|hot\b/)) items = items.filter((i) => (i.data as Record<string, unknown>).spicy);
  if (want(/\b(nut free|no nuts?|without nuts?)\b/)) items = items.filter((i) => !((i.data as { allergens?: string[] }).allergens ?? []).some((a) => a.includes("nut")));
  const filtered = items.length !== ctx.catalog.items.length;
  const generic = /\b(menu|pizzas?|all)\b/.test(q) && words.length === 0;
  const category = (["merch", "drinks", "desserts", "sides"] as const).find((c) => q.includes(c.replace(/s$/, "")) || (c === "merch" && /\b(shirt|apron|merch|t shirt)\b/.test(q)) || (c === "drinks" && /\b(drink|beer|soda|lemonade|wine)\b/.test(q)) || (c === "desserts" && /\b(dessert|sweet|tiramisu)\b/.test(q)));
  let results: typeof items;
  if (category) results = items.filter((i) => i.category === category);
  else if (generic || (filtered && words.every((w) => /^(vegan|veg|vegetarian|spicy|pedas|hot|nut|nuts|free|no|without|meatless|meat)$/.test(w)))) results = items.filter((i) => i.category === "pizza");
  else {
    const scored = items
      .map((i) => {
        const hay = norm([i.title, i.body, i.category, ...(i.tags ?? []), ...(((i.data as { toppings?: string[] }).toppings) ?? [])].join(" "));
        const matched = words.filter((w) => hay.includes(w));
        const score = matched.reduce((s, w) => s + (norm(i.title).includes(w) ? 3 : 1), 0);
        return { i, score, matched: matched.length };
      })
      .filter((x) => x.score > 0 && x.matched >= Math.ceil(words.length / 2))
      .sort((a, b) => b.score - a.score);
    results = scored.map((x) => x.i);
  }
  results = results.slice(0, 14);
  return {
    output: { query, count: results.length, items: results.map((i) => itemSummary(ctx.ws, i)), note: results.length ? undefined : "Nothing in the catalog matches. Don't guess: say you'll check with the team and escalate as knowledge_gap." },
    label: `searched menu: “${query}” → ${results.length} found`,
  };
}

function checkVariant(ctx: ToolContext, input: { product: string; size?: string; color?: string }) {
  const item = findProduct(ctx.catalog, input.product);
  if (!item) {
    return { output: { found: false, product: input.product, note: "No such product. Offer search_catalog results or escalate if the customer insists." }, label: `checked stock: “${input.product}” ✗ not on menu`, ok: false };
  }
  const size = normSize(input.size);
  const colorIn = input.color?.trim().toLowerCase();
  const colors = [...new Set(item.variants.map((v) => v.color).filter(Boolean))] as string[];
  const color = colorIn ? colors.find((c) => c.toLowerCase() === colorIn || c.toLowerCase().includes(colorIn)) ?? null : null;
  let vs = item.variants;
  if (size) vs = vs.filter((v) => v.size === size);
  if (color) vs = vs.filter((v) => v.color === color);
  const madeToOrder = item.variants.every((v) => v.stock === null);
  const fmt = (v: (typeof vs)[number]) => ({
    size: v.size, color: v.color, price: formatMoney(v.priceMinor, ctx.ws.currency),
    ...(madeToOrder ? {} : { stock: v.stock ?? 0, inStock: (v.stock ?? 0) > 0 }),
  });
  const out: Record<string, unknown> = {
    found: true, product: item.title, category: item.category,
    availableToday: item.available, availabilityNote: item.availabilityNote, madeToOrder,
    requested: { size: size ?? null, color: input.color ?? null },
  };
  if (input.color && !color) {
    out.colorNotFound = `No colour named “${input.color}”. Available colours: ${colors.join(", ")}.`;
  }
  if (size && !item.variants.some((v) => v.size === size)) out.sizeNotFound = `No size ${size}. Sizes: ${[...new Set(item.variants.map((v) => v.size))].join(", ")}.`;
  out.variants = (vs.length ? vs : item.variants).map(fmt);
  if (!madeToOrder && size && color) {
    out.otherInStock = item.variants.filter((v) => (v.stock ?? 0) > 0 && !(v.size === size && v.color === color)).slice(0, 8).map(fmt);
  }
  const label = (() => {
    const name = `${size ? `${SIZE_LABEL[size] ?? size} ` : ""}${item.title}${color ? `, ${color}` : ""}`;
    if (!item.available) return `checked stock: ${name} ✗ ${item.availabilityNote ?? "unavailable today"}`;
    if (!madeToOrder && vs.length === 1) return `checked stock: ${name} ${(vs[0].stock ?? 0) > 0 ? `✓ ${vs[0].stock} left` : "✗ out of stock"}`;
    return `checked stock: ${name} ✓`;
  })();
  return { output: out, label, ok: true };
}

function businessInfo(ctx: ToolContext, input: { topic: string; date?: string }) {
  const tz = ctx.ws.timezone;
  const all = ctx.catalog.all;
  if (input.topic === "hours") {
    const hours = all.find((i) => i.kind === "hours")?.data as unknown as HoursData | undefined;
    if (!hours) return { output: { found: false }, label: "checked hours ✗ none on file" };
    const today = localDate(new Date(), tz);
    const days = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? [input.date] : Array.from({ length: 7 }, (_, i) => addLocalDays(today, i));
    const status = openStatus(hours, new Date(), tz);
    return {
      output: {
        now: human(new Date(), tz), openNow: status.open, closesAt: status.closesAt, lastOrdersAt: status.lastOrdersAt,
        lastOrdersMinutesBeforeClose: hours.lastOrdersMinutesBeforeClose,
        days: days.map((d) => {
          const h = hoursForDate(hours, d, tz);
          return { date: d, weekday: h.weekday, hours: describeDay(h), closed: h.closed };
        }),
      },
      label: input.date ? `checked hours for ${human(zoned(input.date, "12:00", tz), tz).split(",")[0]}` : "checked hours",
    };
  }
  if (input.topic === "delivery") {
    const d = all.find((i) => i.slug === "delivery");
    return { output: d ? { zones: (d.data as { zones: unknown }).zones, notes: d.body } : { found: false }, label: "checked delivery zones" };
  }
  if (input.topic === "extras") {
    const d = all.find((i) => i.slug === "extras");
    return { output: d?.data ?? { found: false }, label: "checked extras" };
  }
  const policy = all.find((i) => i.kind === "policy" && i.category === input.topic);
  if (!policy) return { output: { found: false, topic: input.topic, note: "No policy on file. Say you'll check with the team and escalate as knowledge_gap." }, label: `checked ${input.topic} ✗ nothing on file` };
  return { output: { topic: input.topic, title: policy.title, details: policy.body }, label: `checked ${policy.title.toLowerCase()}` };
}

async function upsertGap(ctx: ToolContext, key: string, question: string) {
  const k = key.toLowerCase().replace(/[^a-z0-9 \-/]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!k) return;
  await db
    .insert(t.knowledgeGaps)
    .values({ workspaceId: ctx.ws.id, key: k, question: question.slice(0, 140), isDemo: Boolean(ctx.isDemo) })
    .onConflictDoUpdate({
      target: [t.knowledgeGaps.workspaceId, t.knowledgeGaps.key],
      set: { count: sql`${t.knowledgeGaps.count} + 1`, lastAskedAt: new Date(), status: "open", isDemo: sql`${t.knowledgeGaps.isDemo} and ${Boolean(ctx.isDemo)}` },
    });
}

export async function runTool(ctx: ToolContext, name: string, input: Record<string, unknown>, lastQuestion: string): Promise<ToolCallLog> {
  const started = Date.now();
  const done = (output: unknown, label: string, ok = true): ToolCallLog => ({ name, input, output, ms: Date.now() - started, ok, label });
  try {
    switch (name) {
      case "search_catalog": {
        const r = searchCatalog(ctx, String(input.query ?? ""));
        return done(r.output, r.label);
      }
      case "check_variant": {
        const r = checkVariant(ctx, input as { product: string; size?: string; color?: string });
        return done(r.output, r.label, r.ok);
      }
      case "get_business_info": {
        const r = businessInfo(ctx, input as { topic: string; date?: string });
        return done(r.output, r.label);
      }
      case "check_slots": {
        const date = String(input.date ?? "");
        const party = Number(input.party_size ?? 0);
        const time = input.time ? normTime(String(input.time)) : null;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return done({ ok: false, reason: "date must be YYYY-MM-DD" }, "checked tables ✗ bad date", false);
        const r = await checkSlots(ctx.ws, date, party, time);
        const day = human(zoned(date, time ?? "12:00", ctx.ws.timezone), ctx.ws.timezone).split(",")[0];
        const label = r.ok === false ? `checked tables: ${day}, ${party} people ✗ too large` : (r as { closed?: boolean }).closed ? `checked tables: ${day} ✗ closed` : time ? `checked tables: ${day} ${time}, ${party} people ${(r as { requestedAvailable?: boolean }).requestedAvailable ? "✓" : "✗ full"}` : `checked tables: ${day}, ${party} people → ${((r as { availableTimes?: string[] }).availableTimes ?? []).length} times`;
        return done(r, label);
      }
      case "create_booking": {
        const time = normTime(String(input.time ?? ""));
        const date = String(input.date ?? "");
        if (!time || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return done({ ok: false, reason: "date must be YYYY-MM-DD and time HH:MM" }, "booking ✗ bad date/time", false);
        const r = await createBooking(ctx.ws, {
          customerName: String(input.customer_name || ctx.customerName || "Guest"), date, time, partySize: Number(input.party_size),
          phone: (input.phone as string) ?? null, notes: (input.notes as string) ?? null, threadId: ctx.threadId, customerId: ctx.customerId, channel: ctx.channel,
        });
        if (r.ok) {
          ctx.bookings.push({ refCode: r.refCode, id: r.bookingId });
          return done(r, `booked: ${r.when}, ${r.partySize} people · ${r.refCode}`);
        }
        return done(r, `booking ✗ ${r.reason}`, false);
      }
      case "escalate": {
        const category = String(input.category ?? "other");
        const [row] = await db
          .insert(t.escalations)
          .values({
            workspaceId: ctx.ws.id, threadId: ctx.threadId, reason: String(input.reason ?? "Needs a human"), category,
            priority: (["low", "normal", "high", "urgent"].includes(String(input.priority)) ? input.priority : "normal") as "low" | "normal" | "high" | "urgent",
            summary: String(input.summary ?? lastQuestion).slice(0, 300), isDemo: Boolean(ctx.isDemo),
          })
          .returning();
        await db.update(t.threads).set({ status: "needs_human" }).where(eq(t.threads.id, ctx.threadId));
        if (category === "knowledge_gap") await upsertGap(ctx, String(input.gap_key ?? input.reason ?? lastQuestion), lastQuestion);
        ctx.escalations.push({ id: row.id, category, summary: row.summary });
        return done({ ok: true, escalationId: row.id, instruction: "Now send a short holding reply: the team will follow up in this chat. Don't answer the substance." }, `escalated: ${category.replace("_", " ")}`);
      }
      default:
        return done({ error: `Unknown tool ${name}` }, `unknown tool ${name}`, false);
    }
  } catch (e) {
    return done({ error: e instanceof Error ? e.message : String(e) }, `${name} ✗ error`, false);
  }
}

export async function openGapKeys(workspaceId: string): Promise<string[]> {
  const rows = await db.select({ key: t.knowledgeGaps.key }).from(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.workspaceId, workspaceId), eq(t.knowledgeGaps.status, "open"))).limit(25);
  return rows.map((r) => r.key);
}
