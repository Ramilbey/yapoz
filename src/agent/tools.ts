import { queueAlert } from "@/lib/alerts";
import type Anthropic from "@anthropic-ai/sdk";
import { db, t } from "@/db";
import { and, eq, gt, sql } from "drizzle-orm";
import type { Catalog, Workspace } from "./knowledge";
import { findProduct, norm } from "./knowledge";
import { formatMoney } from "@/lib/money";
import { hoursForDate, describeDay, openStatus, type HoursData } from "@/lib/hours";
import { addLocalDays, localDate, localTime, human, zoned } from "@/lib/time";
import { placeOrder, lineTotal, MAX_LINES, MAX_QTY, StockProblem, type OrderLine } from "@/lib/orders";
import { handOver, paymentInstruction, receiptRequired } from "@/lib/receipts";
import { availability, availKey, businessDate, dateProblem, dayLabel, modeOf, shortMessage, stockSettings, type Avail } from "@/lib/stock";
import { recordGap, gapWords } from "@/lib/gaps";
import { bookAppointment, changeAppointment, chatBookings } from "@/lib/appointments";
import { appointmentSettings, bookableStaff, checkTime, freeTimes, serviceMinutes, type Offer } from "@/lib/schedule";
import type { ToolCallLog } from "@/db/schema";

export const ESCALATION_CATEGORIES = [
  "partnership", "wholesale", "complaint", "refund", "legal", "allergy", "medical", "abuse", "negotiation",
  "events_lead", "large_group", "knowledge_gap", "low_confidence", "other",
] as const;

export const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "search_catalog",
    description: "Search the business's products and services (menu, items, treatments, rooms...). Returns matches with prices per option, flags and whether each is available (in stock / sold out). Use for browsing or 'do you have X' questions.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What the customer is looking for, in a few words" },
        date: { type: "string", description: "YYYY-MM-DD from the CALENDAR if they ask about a specific day (items made fresh each day). Default today." },
      },
      required: ["query"],
    },
  },
  {
    name: "check_variant",
    description: "Price and availability for one product or service, optionally a size, colour or other option, a quantity and a day. Call this before stating any price or whether a specific item/option is in stock or available. It says in stock or sold out, never how many; if they want more than can be done it returns maxQuantity.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product or service name as the customer said it" },
        size: { type: "string", description: "Size if relevant (S, M, L, XL or the business's own sizes)" },
        color: { type: "string" },
        option: { type: "string", description: "Any other option, e.g. 'long hair', 'double room', '1 hour'" },
        quantity: { type: "integer", minimum: 1, description: "How many they want, if they said" },
        date: { type: "string", description: "YYYY-MM-DD from the CALENDAR for the day they want it. Default today." },
      },
      required: ["product"],
    },
  },
  {
    name: "get_business_info",
    description: "Opening hours (optionally for a specific date, including holiday exceptions), delivery zones and fees, and the full text of a policy.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "'hours', 'delivery', or a policy topic from KNOWLEDGE (e.g. 'payment', 'cancellation')" },
        date: { type: "string", description: "YYYY-MM-DD, for hours on a specific day" },
      },
      required: ["topic"],
    },
  },
  {
    name: "create_order",
    description: "Place an order for products (menu items, merchandise...). It prices every line itself from the catalog and checks availability and stock, then saves the order for the team to approve. Call it once the customer has said what they want (each item with its size/option and quantity), pickup or delivery (delivery needs an address) and who it's for. Returns a reference code and the total, or exactly what to fix. The order is NOT confirmed until staff approve it. Services are booked with book_appointment instead.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "One entry per product and option",
          items: {
            type: "object",
            properties: {
              product: { type: "string", description: "Product name as the customer said it" },
              size: { type: "string" },
              color: { type: "string" },
              option: { type: "string", description: "Any other variant label, e.g. 'double room'" },
              quantity: { type: "integer", minimum: 1 },
              note: { type: "string", description: "The customer's request for this item, e.g. 'extra sauce', 'no onions'" },
            },
            required: ["product", "quantity"],
          },
        },
        fulfilment: { type: "string", enum: ["pickup", "delivery"] },
        customer_name: { type: "string" },
        phone: { type: "string" },
        address: { type: "string", description: "Delivery address (required for delivery)" },
        when: { type: "string", description: "When the customer wants it, in their words" },
        date: { type: "string", description: "The day they want it, YYYY-MM-DD from the CALENDAR (resolve 'tomorrow', 'Saturday'). Default today." },
        notes: { type: "string", description: "Anything about the whole order" },
      },
      required: ["items", "fulfilment"],
    },
  },
  {
    name: "find_times",
    description: "Free appointment times for a service. Without a time it lists the earliest free start times (on a day, or from now). With a date and time it checks that exact time: free (and with whom), or why not, a short delay that would work, others free then, and the next free times. Call it before offering or promising any appointment time.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string", description: "Service name as the customer said it" },
        option: { type: "string", description: "The service's option if it has several, e.g. 'long hair'" },
        staff: { type: "string", description: "Only if the customer asked for a specific person (a name from TEAM)" },
        date: { type: "string", description: "YYYY-MM-DD from the CALENDAR" },
        time: { type: "string", description: "Local start time they asked for, e.g. '15:00' or '3pm'" },
      },
      required: ["service"],
    },
  },
  {
    name: "book_appointment",
    description: "Book a service at a date and time. It checks the time is still free, prices it from the catalog and saves the booking for the team to approve (with payments on, the customer has to pay within the payment window). Call it once the customer has chosen the service (and option), the day and time, and given a name. Returns a reference code, the time, who, and the price, or exactly what to fix.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string" },
        option: { type: "string" },
        staff: { type: "string", description: "Only if the customer asked for a specific person" },
        date: { type: "string", description: "YYYY-MM-DD from the CALENDAR" },
        time: { type: "string", description: "Local start time, e.g. '15:00' or '3pm'" },
        customer_name: { type: "string" },
        phone: { type: "string" },
        notes: { type: "string", description: "Anything the customer wants the team to know" },
      },
      required: ["service", "date", "time"],
    },
  },
  {
    name: "change_appointment",
    description: "Cancel or reschedule the customer's own booking (from ORDERS IN THIS CHAT). Allowed in chat up to the business's cutoff before the start; closer than that it goes to the team. A rescheduled booking needs the team's approval again.",
    input_schema: {
      type: "object",
      properties: {
        ref: { type: "string", description: "The booking's reference code (APT-...), if they have more than one" },
        action: { type: "string", enum: ["cancel", "reschedule"] },
        date: { type: "string", description: "Reschedule: the new day, YYYY-MM-DD" },
        time: { type: "string", description: "Reschedule: the new start time" },
        staff: { type: "string", description: "Reschedule: only if they want a different person" },
      },
      required: ["action"],
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
  channel: "telegram" | "whatsapp" | "simulator";
  escalations: { id: string; category: string; summary: string }[];
  orders?: { refCode: string; id: string }[];
  isDemo?: boolean;
};

const SIZE_LABEL: Record<string, string> = { XS: "XS", S: "Small", M: "Medium", L: "Large", XL: "XL", XXL: "XXL" };

export function normSize(s?: string | null): string | null {
  if (!s) return null;
  const v = s.trim().toLowerCase().replace(/["”]/g, "");
  if (["xxl", "2xl"].includes(v)) return "XXL";
  if (["xl", "extra large", "x-large", "xlarge"].includes(v)) return "XL";
  if (["xs", "extra small"].includes(v)) return "XS";
  if (["s", "small", "kecil"].includes(v)) return "S";
  if (["m", "medium", "sederhana"].includes(v)) return "M";
  if (["l", "large", "besar", "big"].includes(v)) return "L";
  return s.trim();
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

type Item = Catalog["items"][number];
type Variant = Item["variants"][number];

const variantLabel = (v: Variant) => [v.size ? (SIZE_LABEL[v.size] ? `${v.size} (${SIZE_LABEL[v.size]})` : v.size) : null, v.color, v.option].filter(Boolean).join(" / ") || "standard";

/** In stock / sold out for an item, from live availability: true if any option can still be ordered. */
const anyLeft = (i: Item, av: Map<string, Avail>, date: string) => i.variants.some((v) => av.get(availKey(v.id, date))?.left !== 0);

function itemSummary(ws: Workspace, i: Item, av: Map<string, Avail>, date: string) {
  const d = i.data as Record<string, unknown>;
  const seen = new Set<string>();
  const prices = i.variants
    .filter((v) => {
      const k = `${v.size ?? ""}|${v.option ?? ""}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((v) => ({ option: [v.size ? (SIZE_LABEL[v.size] ? `${v.size} (${SIZE_LABEL[v.size]})` : v.size) : null, v.option].filter(Boolean).join(" / ") || "standard", price: formatMoney(v.priceMinor, ws.currency) }));
  return {
    name: i.title,
    kind: i.kind,
    category: i.category,
    description: i.body,
    prices,
    ...(i.kind === "service" && d.durationMinutes ? { durationMinutes: d.durationMinutes } : {}),
    ...(Array.isArray(d.allergens) && d.allergens.length ? { allergens: d.allergens } : {}),
    tags: i.tags,
    available: anyLeft(i, av, date),
    ...(date !== businessDate(ws) ? { forDate: date } : {}),
    availabilityNote: i.availabilityNote,
    colors: [...new Set(i.variants.map((v) => v.color).filter(Boolean))],
  };
}

const STOP = new Set(["free", "without", "no", "based", "option", "options", "do", "you", "have", "got", "any", "the", "a", "an", "is", "there", "ada", "or", "not", "can", "i", "get", "some", "with", "for", "me", "your", "u", "something", "what", "which", "how", "much", "price", "prices"]);

/**
 * FAQ answers (the ones the owner wrote, or taught from Knowledge → Gaps) that fit a question: at least half of its content
 * words appear in the FAQ's question and answer. Lets a tool that found nothing still hand the model the house answer.
 */
function matchFaqs(ctx: ToolContext, query: string) {
  const words = gapWords(query);
  if (!words.length) return [];
  return ctx.catalog.all
    .filter((i) => i.kind === "faq")
    .map((i) => {
      const have = new Set(gapWords(`${i.title} ${i.body}`));
      return { i, hits: words.filter((w) => have.has(w)).length };
    })
    .filter((x) => x.hits >= Math.max(1, Math.ceil(words.length / 2)))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((x) => ({ question: x.i.title, answer: x.i.body }));
}

const NO_MATCH = "Check faq (if given) and the FAQ in KNOWLEDGE first: if either answers the question, answer from it and do NOT escalate. Only if nothing answers it, say you'll check with the team and escalate as knowledge_gap.";

async function searchCatalog(ctx: ToolContext, query: string, rawDate?: string) {
  const q = norm(query);
  const words = q.split(" ").filter((w) => w && !STOP.has(w));
  let items = ctx.catalog.items;
  const flag = (k: string) => (i: Item) => Boolean((i.data as Record<string, unknown>)[k]) || i.tags.some((tg) => norm(tg) === k);
  if (/\bvegan\b/.test(q)) items = items.filter(flag("vegan"));
  else if (/\b(veg|vegetarian|meatless)\b/.test(q)) items = items.filter(flag("vegetarian"));
  if (/\b(spicy|pedas)\b/.test(q)) items = items.filter(flag("spicy"));
  if (/\bhalal\b/.test(q)) items = items.filter((i) => (i.data as Record<string, unknown>).halal !== false);
  const filtered = items.length !== ctx.catalog.items.length;
  const categories = [...new Set(ctx.catalog.items.map((i) => i.category))];
  const category = categories.find((c) => {
    const n = norm(c);
    return words.some((w) => w.length > 2 && (n === w || n.replace(/s$/, "") === w.replace(/s$/, "")));
  });
  const generic = /\b(menu|all|everything|list|products|services|catalog|catalogue)\b/.test(q) || (filtered && words.every((w) => /^(vegan|veg|vegetarian|spicy|pedas|halal|meatless|meat)$/.test(w)));
  let results: Item[];
  if (category) results = items.filter((i) => i.category === category);
  else if (generic || words.length === 0) results = items;
  else {
    results = items
      .map((i) => {
        const hay = norm([i.title, i.body, i.category, ...(i.tags ?? []), ...(((i.data as { toppings?: string[] }).toppings) ?? []), ...i.variants.map((v) => [v.size, v.color, v.option].filter(Boolean).join(" "))].join(" "));
        const matched = words.filter((w) => hay.includes(w));
        const score = matched.reduce((s, w) => s + (norm(i.title).includes(w) ? 3 : 1), 0);
        return { i, score, matched: matched.length };
      })
      .filter((x) => x.score > 0 && x.matched >= Math.ceil(words.length / 2))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.i);
  }
  results = results.slice(0, 16);
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : businessDate(ctx.ws);
  const av = await availability(db, ctx.ws, results.flatMap((i) => i.variants.map((v) => ({ variantId: v.id, date }))));
  const faq = results.length ? [] : matchFaqs(ctx, query);
  return {
    output: { query, count: results.length, items: results.map((i) => itemSummary(ctx.ws, i, av, date)), ...(faq.length ? { faq } : {}), note: results.length ? undefined : `Nothing in the catalog matches. Don't guess. ${NO_MATCH}` },
    label: `searched catalog: “${query}” → ${results.length} found`,
  };
}

const lc = (s?: string | null) => (s ?? "").trim().toLowerCase();
/** Size labels compared loosely: 10", 10”, 10″, 10'', 10 inch and 10-inch are the same size. */
const sizeKey = (s?: string | null) => lc(s).replace(/(\d)\s*-?\s*(?:inches|inch|in)\b/g, "$1").replace(/["“”″'‘’′`]/g, "").replace(/\s+/g, " ").trim();

/** The variants a size points at: the exact label, else every label containing all its words ("regular" or "10" finds "Regular 10\""). */
function bySize(vs: Variant[], wanted: string, raw?: string) {
  const exact = vs.filter((v) => sizeKey(v.size) === sizeKey(wanted));
  if (exact.length) return exact;
  const words = sizeKey(raw ?? wanted).split(" ").filter(Boolean);
  return words.length ? vs.filter((v) => { const have = sizeKey(v.size).split(" "); return words.every((w) => have.includes(w)); }) : [];
}

/** Which of an item's variants a customer's size / colour / option words point at. Shared by check_variant and create_order. */
function matchVariants(item: Item, input: { size?: string; color?: string; option?: string }) {
  // An item sold without sizes ("6-piece wings") reads a size the model sent as its option.
  const sized = item.variants.some((v) => v.size);
  const size = sized ? normSize(input.size) : null;
  const colors = [...new Set(item.variants.map((v) => v.color).filter(Boolean))] as string[];
  const color = input.color ? colors.find((c) => lc(c) === lc(input.color) || lc(c).includes(lc(input.color))) ?? null : null;
  const optionWanted = lc(input.option || (sized ? "" : input.size));
  let vs = item.variants;
  if (size) vs = bySize(vs, size, input.size);
  if (color) vs = vs.filter((v) => v.color === color);
  let optionMatched = false;
  if (optionWanted) {
    // A variant with no option label must not match everything: every string "includes" the empty string.
    const m = vs.filter((v) => (lc(v.option) && (lc(v.option).includes(optionWanted) || optionWanted.includes(lc(v.option)))) || lc(v.size).includes(optionWanted));
    if (m.length) {
      vs = m;
      optionMatched = true;
    }
  }
  return { size, colors, color, vs, optionMatched };
}

async function checkVariant(ctx: ToolContext, input: { product: string; size?: string; color?: string; option?: string; quantity?: number; date?: string }) {
  const item = findProduct(ctx.catalog, input.product);
  if (!item) {
    return { output: { found: false, product: input.product, note: "Not in the catalog. Offer search_catalog results or escalate if the customer insists." }, label: `checked: “${input.product}” ✗ not listed`, ok: false };
  }
  const { size, colors, color, vs } = matchVariants(item, input);
  const mode = modeOf(item, ctx.ws);
  const date = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : businessDate(ctx.ws);
  const av = await availability(db, ctx.ws, item.variants.map((v) => ({ variantId: v.id, date })));
  const left = (v: Variant) => av.get(availKey(v.id, date))?.left ?? null;
  const qty = Number.isInteger(input.quantity) && input.quantity! > 0 ? input.quantity! : null;
  // Customers hear in stock / sold out, never a count; the only number is "at most N", and only when they asked for more.
  const fmt = (v: Variant) => {
    const l = left(v);
    return { option: variantLabel(v), price: formatMoney(v.priceMinor, ctx.ws.currency), inStock: l !== 0, ...(qty && l !== null && l > 0 && qty > l ? { maxQuantity: l } : {}) };
  };
  const out: Record<string, unknown> = {
    found: true, product: item.title, kind: item.kind, category: item.category,
    available: anyLeft(item, av, date), availabilityNote: item.availabilityNote, madeFreshDaily: mode === "daily",
    ...(date !== businessDate(ctx.ws) || mode === "daily" ? { forDate: `${date} (${dayLabel(ctx.ws, date)})` } : {}),
    requested: { size: size ?? null, color: input.color ?? null, option: input.option ?? null, quantity: qty },
  };
  if (mode === "daily") {
    const problem = dateProblem(ctx.ws, date, hoursOf(ctx), new Date());
    if (problem) out.dateProblem = problem;
  }
  if (item.kind === "service") out.durationMinutes = (item.data as { durationMinutes?: number }).durationMinutes ?? null;
  if (input.color && !color) out.colorNotFound = `No colour named “${input.color}”. Available colours: ${colors.join(", ")}.`;
  if (size && !bySize(item.variants, size, input.size).length) out.sizeNotFound = `No size ${size}. Sizes: ${[...new Set(item.variants.map((v) => v.size).filter(Boolean))].join(", ") || "none"}.`;
  out.variants = (vs.length ? vs : item.variants).map(fmt);
  if ((out.variants as { maxQuantity?: number }[]).some((v) => v.maxQuantity)) out.note = "They asked for more than we can do: tell them we can do at most maxQuantity. Never mention any other number.";
  if (mode !== "none" && (size || color)) {
    out.otherInStock = item.variants.filter((v) => left(v) !== 0 && !vs.includes(v)).slice(0, 8).map(fmt);
  }
  // The label is for staff (the run log), so it can carry the count.
  const label = (() => {
    const name = `${size ? `${SIZE_LABEL[size] ?? size} ` : ""}${item.title}${color ? `, ${color}` : ""}${input.option && vs.length === 1 && vs[0].option ? `, ${vs[0].option}` : ""}`;
    const a = vs.length === 1 ? av.get(availKey(vs[0].id, date)) : undefined;
    if (item.variants.length && item.variants.every((v) => av.get(availKey(v.id, date))?.on === false)) return `checked: ${name} ✗ ${item.availabilityNote ?? "switched off"}`;
    if (a && a.left !== null) return `checked stock: ${name}${mode === "daily" ? ` (${date})` : ""} ${a.left > 0 ? `✓ ${a.left} left` : "✗ sold out"}`;
    return `checked: ${name} ✓`;
  })();
  return { output: out, label, ok: true };
}

function businessInfo(ctx: ToolContext, input: { topic: string; date?: string }) {
  const tz = ctx.ws.timezone;
  const all = ctx.catalog.all;
  const topic = (input.topic ?? "").toLowerCase().trim();
  if (topic === "hours" || topic.includes("open")) {
    const hours = all.find((i) => i.kind === "hours")?.data as unknown as HoursData | undefined;
    if (!hours) return { output: { found: false, note: `No hours on file. ${NO_MATCH}`, faq: matchFaqs(ctx, input.topic) }, label: "checked hours ✗ none on file" };
    const today = localDate(new Date(), tz);
    const days = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? [input.date] : Array.from({ length: 7 }, (_, i) => addLocalDays(today, i));
    const status = openStatus(hours, new Date(), tz);
    return {
      output: {
        now: human(new Date(), tz), openNow: status.open, closesAt: status.closesAt, lastOrdersAt: hours.lastOrdersMinutesBeforeClose ? status.lastOrdersAt : null,
        days: days.map((d) => {
          const h = hoursForDate(hours, d, tz);
          return { date: d, weekday: h.weekday, hours: describeDay(h), closed: h.closed };
        }),
      },
      label: input.date ? `checked hours for ${human(zoned(input.date, "12:00", tz), tz).split(",")[0]}` : "checked hours",
    };
  }
  if (topic === "delivery") {
    const d = all.find((i) => i.slug === "delivery" || (i.kind === "info" && i.category === "delivery"));
    return { output: d ? { zones: (d.data as { zones?: unknown }).zones ?? null, notes: d.body } : { found: false, note: "No delivery info on file." }, label: d ? "checked delivery zones" : "checked delivery ✗ nothing on file" };
  }
  const policies = all.filter((i) => i.kind === "policy" || i.kind === "info");
  const policy =
    policies.find((p) => p.category.toLowerCase() === topic) ??
    policies.find((p) => p.title.toLowerCase().includes(topic) || topic.includes(p.category.toLowerCase())) ??
    policies.find((p) => norm(p.body).includes(norm(topic)));
  if (!policy) {
    const faq = matchFaqs(ctx, input.topic);
    return { output: { found: false, topic: input.topic, ...(faq.length ? { faq } : {}), note: faq.length ? "No policy on file under that name, but the FAQ answers it: answer from faq, using its wording and nothing more." : `No policy on file. ${NO_MATCH}` }, label: faq.length ? `checked ${input.topic} → FAQ answer` : `checked ${input.topic} ✗ nothing on file` };
  }
  return { output: { topic: input.topic, title: policy.title, details: policy.body, data: policy.data }, label: `checked ${policy.title.toLowerCase()}` };
}

/** How a line reads to the customer and staff: "Large Margherita", "Medium Forno Sette T-shirt, Charcoal". */
function lineName(item: Item, v: Variant) {
  const size = v.size ? SIZE_LABEL[v.size] ?? v.size : null;
  const extras = [v.color, v.option].filter(Boolean);
  return `${[size, item.title].filter(Boolean).join(" ")}${extras.length ? `, ${extras.join(", ")}` : ""}`;
}

type OrderLineInput = { product?: unknown; size?: unknown; color?: unknown; option?: unknown; quantity?: unknown; note?: unknown };

const hoursOf = (ctx: ToolContext) => (ctx.catalog.all.find((i) => i.kind === "hours")?.data as unknown as HoursData | undefined) ?? null;

/**
 * Turn what the model asked for into priced lines, or say everything that has to change first. Availability comes from
 * the database for `date` (daily items) with holds subtracted, so "at most N" is never the model's number.
 */
async function resolveOrderLines(ctx: ToolContext, raw: unknown, date: string): Promise<{ lines: OrderLine[]; problems: string[] }> {
  const lines: OrderLine[] = [];
  const problems: string[] = [];
  const wanted = Array.isArray(raw) ? (raw as OrderLineInput[]) : [];
  if (!wanted.length) return { lines, problems: ["No items. Ask what they would like to order."] };
  if (wanted.length > MAX_LINES) return { lines, problems: [`That is more than ${MAX_LINES} different items. Ask the customer to split it, or escalate.`] };
  const take = new Map<string, number>();
  for (const w of wanted) {
    const name = String(w.product ?? "").trim();
    const qty = Number(w.quantity ?? 1);
    if (!name) {
      problems.push("An item has no product name.");
      continue;
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      problems.push(`${name}: quantity must be a whole number from 1 to ${MAX_QTY}${qty > MAX_QTY ? "; for bigger orders escalate (large_group)" : ""}.`);
      continue;
    }
    const item = findProduct(ctx.catalog, name);
    if (!item) {
      problems.push(`“${name}” isn't in the catalog. Use search_catalog to find what they mean, or escalate if it isn't sold.`);
      continue;
    }
    if (item.kind !== "product") {
      problems.push(`${item.title} is a service, not a product: it can't be ordered in chat. Tell the customer the team will arrange it and escalate (category "other").`);
      continue;
    }
    if (!item.available) {
      problems.push(`${item.title} isn't available${item.availabilityNote ? `: ${item.availabilityNote}` : ""}. Offer an alternative.`);
      continue;
    }
    const m = matchVariants(item, { size: w.size as string | undefined, color: w.color as string | undefined, option: w.option as string | undefined });
    const options = item.variants.map((v) => `${variantLabel(v)} ${formatMoney(v.priceMinor, ctx.ws.currency)}`);
    if (m.vs.length === 0) {
      problems.push(`${item.title}: no ${[w.size, w.color, w.option].filter(Boolean).join(" / ")} option. Choose from: ${options.join("; ")}.`);
      continue;
    }
    if (m.vs.length > 1) {
      problems.push(`${item.title}: which option? ${m.vs.map((v) => `${variantLabel(v)} ${formatMoney(v.priceMinor, ctx.ws.currency)}`).join("; ")}.`);
      continue;
    }
    const v = m.vs[0];
    take.set(v.id, (take.get(v.id) ?? 0) + qty);
    // Words that matched no variant ("extra sauce") are the customer's request for the kitchen, not an option.
    const unmatched = w.option && !m.optionMatched ? String(w.option).trim() : "";
    const note = [String(w.note ?? "").trim(), unmatched].filter(Boolean).join(", ").slice(0, 120) || null;
    lines.push({ itemId: item.id, variantId: v.id, name: lineName(item, v), quantity: qty, unitPriceMinor: v.priceMinor, note });
  }
  const av = await availability(db, ctx.ws, [...take.keys()].map((variantId) => ({ variantId, date })));
  for (const [id, used] of take) {
    const a = av.get(availKey(id, date));
    const short = a && shortMessage(ctx.ws, a, used, lines.find((l) => l.variantId === id)?.name);
    if (short) problems.push(short);
  }
  return { lines: problems.length ? [] : lines, problems };
}

export async function runTool(ctx: ToolContext, name: string, input: Record<string, unknown>, lastQuestion: string): Promise<ToolCallLog> {
  const started = Date.now();
  const done = (output: unknown, label: string, ok = true): ToolCallLog => ({ name, input, output, ms: Date.now() - started, ok, label });
  try {
    switch (name) {
      case "search_catalog": {
        const r = await searchCatalog(ctx, String(input.query ?? ""), input.date as string | undefined);
        return done(r.output, r.label);
      }
      case "check_variant": {
        const r = await checkVariant(ctx, input as { product: string; size?: string; color?: string; option?: string; quantity?: number; date?: string });
        return done(r.output, r.label, r.ok);
      }
      case "get_business_info": {
        const r = businessInfo(ctx, input as { topic: string; date?: string });
        return done(r.output, r.label);
      }
      case "create_order": {
        const today = businessDate(ctx.ws);
        const date = typeof input.date === "string" && input.date.trim() ? input.date.trim() : today;
        const pre = await resolveOrderLines(ctx, input.items, date);
        const { lines } = pre;
        const problems = [...pre.problems];
        // Daily items are held against the day they're wanted: that day has to be orderable.
        const daily = lines.some((l) => { const it = ctx.catalog.items.find((i) => i.id === l.itemId); return it && modeOf(it, ctx.ws) === "daily"; });
        const badDate = daily || date !== today ? dateProblem(ctx.ws, date, daily ? hoursOf(ctx) : null) : null;
        if (badDate) problems.unshift(badDate);
        const fulfilment = input.fulfilment === "delivery" ? "delivery" : "pickup";
        const address = String(input.address ?? "").trim();
        const customerName = String(input.customer_name || ctx.customerName || "").trim();
        if (fulfilment === "delivery" && !address) problems.push("Delivery needs the customer's address. Ask for it.");
        if (!customerName) problems.push("Who is the order for? Ask for a name.");
        if (problems.length) {
          await orderTrouble(ctx, problems, lastQuestion);
          return done({ ok: false, problems, instruction: "Nothing was ordered. Fix these with the customer (ask only for what's missing, offer alternatives for anything unavailable), then call create_order again. If a problem says \"we can do at most N\", tell them that exact N and no other number." }, `order ✗ ${problems[0].slice(0, 90)}`, false);
        }
        let r: Awaited<ReturnType<typeof placeOrder>>;
        try {
          r = await placeOrder(ctx.ws, {
            lines, customerName, phone: (input.phone as string) ?? null, fulfilment, address, wanted: (input.when as string) ?? null, notes: (input.notes as string) ?? null,
            wantedDate: daily || date !== today ? date : null, threadId: ctx.threadId, customerId: ctx.customerId, channel: ctx.channel, isDemo: ctx.isDemo,
          });
        } catch (e) {
          // Someone else took the last ones between the check and the save.
          if (!(e instanceof StockProblem)) throw e;
          await orderTrouble(ctx, e.problems, lastQuestion);
          return done({ ok: false, problems: e.problems, instruction: "Nothing was ordered. Tell the customer exactly what the problem says (no other numbers) and offer an alternative." }, `order ✗ ${e.problems[0].slice(0, 90)}`, false);
        }
        (ctx.orders ??= []).push({ refCode: r.order.refCode, id: r.order.id });
        const money = (m: number) => formatMoney(m, ctx.ws.currency);
        const payHow = paymentInstruction(ctx.ws, r.order.totalMinor, r.order.refCode, fulfilment === "delivery");
        const minutes = receiptRequired(ctx.ws) ? stockSettings(ctx.ws).holdMinutes : null;
        return done(
          {
            ok: true, refCode: r.order.refCode, status: "pending", duplicate: r.duplicate, fulfilment, ...(fulfilment === "delivery" ? { address } : {}),
            items: r.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: money(i.unitPriceMinor), lineTotal: money(lineTotal(i)), note: i.note })),
            total: money(r.order.totalMinor), note: fulfilment === "delivery" ? "Total is for the items; the delivery fee is confirmed by the team." : undefined,
            ...(r.order.wantedDate ? { forDate: `${r.order.wantedDate} (${dayLabel(ctx.ws, r.order.wantedDate)})` } : {}),
            ...(payHow ? { howToPay: payHow } : {}),
            ...(minutes && r.order.holdExpiresAt ? { heldForMinutes: minutes, expiresAt: human(r.order.holdExpiresAt, ctx.ws.timezone) } : {}),
            instruction: `${r.duplicate ? "This exact order was already placed a moment ago, so no second one was made. " : ""}Tell the customer the order is received, with the reference code, the items and the total${r.order.wantedDate ? " and the day it's for" : ""}.${payHow ? ` Then give them howToPay exactly as written (same accounts, same amount) and ask them to send the receipt in this chat. Make clear we hold the order for ${minutes ?? stockSettings(ctx.ws).holdMinutes} minutes: if no receipt arrives by then it expires. The team confirms the order after checking it.` : " Say the team will confirm it shortly."} Do NOT say it is confirmed, paid or being prepared, and never invent payment details.`,
          },
          `ordered: ${r.items.reduce((n, i) => n + i.quantity, 0)} item${r.items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"} · ${money(r.order.totalMinor)} · ${r.order.refCode}${r.duplicate ? " (already placed)" : ""}`,
        );
      }
      case "find_times":
      case "book_appointment":
      case "change_appointment": {
        const r = await appointmentTool(ctx, name, input, lastQuestion);
        return done(r.output, r.label, r.ok);
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
        await db.insert(t.events).values({ workspaceId: ctx.ws.id, type: "escalation.created", props: { threadId: ctx.threadId, category, priority: row.priority, reason: row.reason, summary: row.summary }, isDemo: Boolean(ctx.isDemo) });
        if (!ctx.isDemo && row.priority !== "low") await queueAlert("needs", row.id, ctx.ws.id);
        if (category === "knowledge_gap") await recordGap({ workspaceId: ctx.ws.id, key: String(input.gap_key ?? input.reason ?? ""), question: lastQuestion, isDemo: ctx.isDemo });
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

// ───────────────────────────── appointments

type ToolOut = { output: unknown; label: string; ok: boolean };

/** "2026-11-06" + "3pm" → the instant in the business's time zone, or what's wrong with them. */
function startOf(ctx: ToolContext, date: unknown, time: unknown): Date | string {
  const d = String(date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "Which day? Use YYYY-MM-DD from the CALENDAR.";
  const tm = normTime(String(time ?? ""));
  if (!tm) return `“${String(time ?? "")}” isn't a time I can read: ask for a time like 3pm.`;
  return zoned(d, tm, ctx.ws.timezone);
}

/** A time as the assistant passes it on, and as it would pass it back. */
const slot = (ctx: ToolContext, o: { start: Date; staffName?: string | null }) => ({ date: localDate(o.start, ctx.ws.timezone), time: localTime(o.start, ctx.ws.timezone), label: human(o.start, ctx.ws.timezone), ...(o.staffName ? { with: o.staffName } : {}) });
const offers = (ctx: ToolContext, list: Offer[]) => list.map((o) => slot(ctx, o));

/** The person the customer named, among those who take bookings for this service. */
async function staffByName(ctx: ToolContext, name: unknown, itemId?: string): Promise<{ id: string | null; problem?: string }> {
  const n = lc(String(name ?? ""));
  if (!n || /^(any|anyone|whoever|no preference|tak kisah)/.test(n)) return { id: null };
  const all = await bookableStaff(db, ctx.ws, itemId);
  const hit = all.find((p) => lc(p.name) === n) ?? all.find((p) => lc(p.name).split(/\s+/).includes(n) || lc(p.name).startsWith(n));
  if (hit) return { id: hit.userId };
  return { id: null, problem: all.length ? `Nobody called “${String(name)}” does this service. Who does: ${all.map((p) => p.name).join(", ")}.` : "Nobody takes bookings for this service yet." };
}

/** The service and, for booking, its one option. */
function serviceOf(ctx: ToolContext, input: Record<string, unknown>, needOption: boolean): { item: Item; v: Variant | null } | string {
  const item = findProduct(ctx.catalog, String(input.service ?? ""));
  if (!item) return `“${String(input.service ?? "")}” isn't one of our services. Use search_catalog to find what they mean.`;
  if (item.kind !== "service") return `${item.title} is a product, not a service: use create_order for it.`;
  if (!item.available) return `${item.title} isn't available right now${item.availabilityNote ? `: ${item.availabilityNote}` : ""}.`;
  if (!item.variants.length) return `${item.title} has no price on file yet: the team will arrange it (escalate, category "other").`;
  const m = matchVariants(item, { option: input.option as string | undefined });
  if (m.vs.length === 1) return { item, v: m.vs[0] };
  if (!needOption) return { item, v: null };
  return `${item.title}: which option? ${item.variants.map((v) => `${variantLabel(v)} ${formatMoney(v.priceMinor, ctx.ws.currency)}`).join("; ")}.`;
}

/** find_times, book_appointment and change_appointment. Times, people and prices all come from here, never the model. */
async function appointmentTool(ctx: ToolContext, name: string, input: Record<string, unknown>, lastQuestion: string): Promise<ToolOut> {
  const s = appointmentSettings(ctx.ws);
  const fail = (problem: string, extra: Record<string, unknown> = {}): ToolOut => ({ output: { ok: false, problem, ...extra }, label: `${name.replace("_", " ")} ✗ ${problem.slice(0, 80)}`, ok: false });
  const noStaff = async () => {
    await handOver(ctx.ws.id, ctx.threadId, { category: "booking", priority: "normal", reason: "Nobody takes bookings for this service", summary: `${ctx.customerName || "A customer"} wants to book “${String(input.service ?? "")}”, but nobody is switched on to take it (Calendar → Team availability). Last message: “${lastQuestion.slice(0, 80)}”`, isDemo: ctx.isDemo });
    return fail("Nobody takes bookings for this service in chat yet.", { instruction: "Tell the customer the team will arrange a time with them here. Don't offer any time." });
  };
  /** Not bookable: what to tell the customer, with the nearest options. Never another customer's details. */
  const notFree = (r: { problem: string; delay: { minutes: number; start: Date; staffName: string } | null; otherStaff: { staffName: string }[]; nextTimes: Offer[] }) =>
    fail(r.problem, {
      ...(r.delay ? { delay: { minutes: r.delay.minutes, ...slot(ctx, r.delay) } } : {}),
      ...(r.otherStaff.length ? { othersFreeThen: r.otherStaff.map((p) => p.staffName) } : {}),
      nextFreeTimes: offers(ctx, r.nextTimes),
      instruction: r.delay
        ? `Ask: start ${r.delay.minutes} minutes later (${human(r.delay.start, ctx.ws.timezone)}), or pick another time${r.otherStaff.length ? " or someone else" : ""}? Use only these times.`
        : "Offer the next free times (or the others free then) exactly as listed; don't suggest any other time.",
    });

  if (name === "change_appointment") {
    const mine = await chatBookings(ctx.threadId);
    const ref = String(input.ref ?? "").trim().toUpperCase();
    const chosen = ref ? mine.find((m) => m.o.refCode.toUpperCase() === ref) : mine.length === 1 ? mine[0] : undefined;
    if (!chosen) return fail(mine.length ? `Which booking? ${mine.map((m) => `${m.o.refCode} (${human(m.a.startsAt, ctx.ws.timezone)})`).join("; ")}.` : "There's no upcoming booking in this chat to change.");
    const action = input.action === "cancel" ? "cancel" : "reschedule";
    let start: Date | null = null;
    let staffId: string | null = null;
    if (action === "reschedule") {
      const st = startOf(ctx, input.date, input.time);
      if (typeof st === "string") return fail(st);
      start = st;
      if (input.staff) {
        const who = await staffByName(ctx, input.staff, chosen.a.itemId ?? undefined);
        if (who.problem) return fail(who.problem);
        staffId = who.id;
      }
    }
    const r = await changeAppointment(ctx.ws, { threadId: ctx.threadId, orderId: chosen.o.id, action, start, staffId, customerName: ctx.customerName, isDemo: ctx.isDemo });
    if (!r.ok && r.tooLate) {
      return { output: { ok: false, problem: r.problem, handedToTeam: true, instruction: "Tell the customer kindly that it's close to the time, so the team will sort out the change with them here. Don't promise it." }, label: `booking change ✗ inside the ${s.changeCutoffHours} h cutoff → team`, ok: false };
    }
    if (!r.ok) return notFree(r);
    if (r.action === "cancelled") {
      return { output: { ok: true, refCode: r.order.refCode, cancelled: true, instruction: `Tell the customer booking ${r.order.refCode} is cancelled.${r.paid ? " They had paid: say the team will be in touch here about the refund. Don't promise an amount or a date." : ""}` }, label: `booking cancelled: ${r.order.refCode}`, ok: true };
    }
    return {
      output: {
        ok: true, refCode: r.order.refCode, rescheduled: true, from: human(r.from, ctx.ws.timezone), to: slot(ctx, { start: r.facts.startsAt, staffName: r.facts.staffName }),
        instruction: `Tell the customer the booking is moved to ${human(r.facts.startsAt, ctx.ws.timezone)}${r.facts.staffName ? ` with ${r.facts.staffName}` : ""}${r.reconfirm ? ", and that the team will confirm the new time shortly (it isn't confirmed until then)" : ""}.`,
      },
      label: `booking moved: ${r.order.refCode} → ${human(r.facts.startsAt, ctx.ws.timezone)}`, ok: true,
    };
  }

  const svc = serviceOf(ctx, input, name === "book_appointment");
  if (typeof svc === "string") return fail(svc);
  const minutes = serviceMinutes(svc.item, s);
  const who = await staffByName(ctx, input.staff, svc.item.id);
  if (who.problem) return fail(who.problem);

  if (name === "find_times") {
    const base = { service: svc.item.title, durationMinutes: minutes, online: !svc.item.inPerson };
    if (input.time) {
      const st = startOf(ctx, input.date, input.time);
      if (typeof st === "string") return fail(st);
      const c = await checkTime(db, ctx.ws, { itemId: svc.item.id, minutes, start: st, staffId: who.id });
      if (c.ok) return { output: { ...base, free: true, ...slot(ctx, c), instruction: "That time is free. Book it with book_appointment once they confirm; it isn't held until then." }, label: `times: ${human(st, ctx.ws.timezone)} ✓ ${c.staffName}`, ok: true };
      if (c.noStaff) return noStaff();
      return notFree(c);
    }
    const date = typeof input.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : null;
    const list = await freeTimes(db, ctx.ws, { itemId: svc.item.id, minutes, staffId: who.id, date, limit: 6 });
    if (!list.length && !(await bookableStaff(db, ctx.ws, svc.item.id)).length) return noStaff();
    return {
      output: { ...base, ...(date ? { date } : {}), freeTimes: offers(ctx, list), instruction: list.length ? "Offer these times exactly as listed (earliest first); never suggest a time that isn't listed." : `Nothing free${date ? " that day" : ` in the next ${s.bookingDays} days`}. Ask for another day, or say the team will help.` },
      label: `times: ${svc.item.title}${date ? ` on ${date}` : ""} → ${list.length} free`, ok: true,
    };
  }

  // book_appointment
  const st = startOf(ctx, input.date, input.time);
  if (typeof st === "string") return fail(st);
  const customerName = String(input.customer_name || ctx.customerName || "").trim();
  if (!customerName) return fail("Who is the booking for? Ask for a name.");
  const r = await bookAppointment(ctx.ws, {
    itemId: svc.item.id, variantId: svc.v!.id, name: lineName(svc.item, svc.v!), staffId: who.id, start: st, customerName, phone: (input.phone as string) ?? null, notes: (input.notes as string) ?? null,
    threadId: ctx.threadId, customerId: ctx.customerId, channel: ctx.channel, isDemo: ctx.isDemo,
  });
  if (!r.ok) return r.noStaff ? noStaff() : notFree(r);
  (ctx.orders ??= []).push({ refCode: r.order.refCode, id: r.order.id });
  const payHow = paymentInstruction(ctx.ws, r.order.totalMinor, r.order.refCode, false, "booking");
  const held = receiptRequired(ctx.ws) ? stockSettings(ctx.ws).holdMinutes : null;
  return {
    output: {
      ok: true, refCode: r.order.refCode, status: "pending", duplicate: r.duplicate, service: r.facts.service, ...slot(ctx, { start: r.facts.startsAt, staffName: r.facts.staffName }),
      durationMinutes: minutes, price: formatMoney(r.order.totalMinor, ctx.ws.currency), where: r.facts.inPerson ? "in person at the business" : "online: the meeting link comes with the confirmation",
      ...(payHow ? { howToPay: payHow } : {}), ...(held && r.order.holdExpiresAt ? { heldForMinutes: held, expiresAt: human(r.order.holdExpiresAt, ctx.ws.timezone) } : {}),
      instruction: `${r.duplicate ? "This booking was already made a moment ago, so no second one was made. " : ""}Tell the customer the booking request is received, with the reference code, service, day and time${r.facts.staffName ? ", who with" : ""} and the price.${payHow ? ` Then give them howToPay exactly as written and ask for the receipt in this chat: the time is held for ${held ?? stockSettings(ctx.ws).holdMinutes} minutes, and after that it's released.` : ""} The team confirms it shortly${r.facts.inPerson ? "" : ", and the confirmation carries the meeting link"}. Do NOT say it is confirmed.`,
    },
    label: `booked: ${r.facts.service} · ${human(r.facts.startsAt, ctx.ws.timezone)}${r.facts.staffName ? ` · ${r.facts.staffName}` : ""} · ${r.order.refCode}${r.duplicate ? " (already booked)" : ""}`, ok: true,
  };
}

const STOCK_PROBLEM = /sold out|at most \d+|isn't available/i;

/**
 * A create_order that failed. Stock problems and an order the assistant can't complete after three tries go to a person
 * (Needs you), with the reason in plain words; the assistant keeps helping the customer meanwhile.
 */
async function orderTrouble(ctx: ToolContext, problems: string[], lastQuestion: string) {
  await db.insert(t.events).values({ workspaceId: ctx.ws.id, type: "order.attempt_failed", props: { threadId: ctx.threadId, problems: problems.slice(0, 5) }, isDemo: Boolean(ctx.isDemo) });
  const stock = problems.filter((p) => STOCK_PROBLEM.test(p));
  if (stock.length) {
    await handOver(ctx.ws.id, ctx.threadId, { category: "out_of_stock", priority: "normal", reason: "Customer asked for something that isn't available", summary: `${ctx.customerName || "A customer"} wanted: ${stock.join(" ")} The assistant offered alternatives; restock or reply if you can help.`, isDemo: ctx.isDemo });
    return;
  }
  const [n] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(t.events)
    .where(and(eq(t.events.workspaceId, ctx.ws.id), eq(t.events.type, "order.attempt_failed"), sql`${t.events.props}->>'threadId' = ${ctx.threadId}`, gt(t.events.createdAt, new Date(Date.now() - 3600_000))));
  if ((n?.n ?? 0) >= 3) {
    await handOver(ctx.ws.id, ctx.threadId, { category: "order_problem", priority: "normal", reason: `The assistant couldn't complete the order after ${n.n} tries`, summary: `Still missing or wrong: ${problems.join(" ").slice(0, 220)} Last message: “${lastQuestion.slice(0, 60)}”`, isDemo: ctx.isDemo });
  }
}

export async function openGapKeys(workspaceId: string): Promise<string[]> {
  const rows = await db.select({ key: t.knowledgeGaps.key }).from(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.workspaceId, workspaceId), eq(t.knowledgeGaps.status, "open"))).limit(25);
  return rows.map((r) => r.key);
}
