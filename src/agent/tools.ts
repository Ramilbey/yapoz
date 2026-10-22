import type Anthropic from "@anthropic-ai/sdk";
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import type { Catalog, Workspace } from "./knowledge";
import { findProduct, norm } from "./knowledge";
import { formatMoney } from "@/lib/money";
import { hoursForDate, describeDay, openStatus, type HoursData } from "@/lib/hours";
import { addLocalDays, localDate, human, zoned } from "@/lib/time";
import { checkSlots, createBooking, resolveBookingType, resolveService, bookingTypesOf } from "@/lib/booking";
import { placeOrder, lineTotal, MAX_LINES, MAX_QTY, type OrderLine } from "@/lib/orders";
import type { ToolCallLog } from "@/db/schema";

export const ESCALATION_CATEGORIES = [
  "partnership", "wholesale", "complaint", "refund", "legal", "allergy", "medical", "abuse", "negotiation",
  "events_lead", "large_group", "knowledge_gap", "low_confidence", "other",
] as const;

export const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "search_catalog",
    description: "Search the business's products and services (menu, items, treatments, rooms...). Returns matches with prices per option, flags and whether available today. Use for browsing or 'do you have X' questions.",
    input_schema: { type: "object", properties: { query: { type: "string", description: "What the customer is looking for, in a few words" } }, required: ["query"] },
  },
  {
    name: "check_variant",
    description: "Price and stock for one product or service, optionally a size, colour or other option. Call this before stating any price or whether a specific item/option is in stock or available today.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product or service name as the customer said it" },
        size: { type: "string", description: "Size if relevant (S, M, L, XL or the business's own sizes)" },
        color: { type: "string" },
        option: { type: "string", description: "Any other option, e.g. 'long hair', 'double room', '1 hour'" },
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
    name: "check_slots",
    description: "Availability for a booking type on a date. Party types need a headcount, appointments can take a service (sets the duration), day types take a number of days. Returns open times (or days) and, if a time is given, whether it's free plus nearest alternatives.",
    input_schema: {
      type: "object",
      properties: {
        booking_type: { type: "string", description: "Key or name of a booking type from KNOWLEDGE; optional if there is only one" },
        date: { type: "string", description: "YYYY-MM-DD in the business's time zone" },
        quantity: { type: "integer", minimum: 1, description: "People for party types, units for day types; 1 for appointments" },
        time: { type: "string", description: "Preferred time, 24h HH:MM" },
        service: { type: "string", description: "Service name for appointments" },
        nights: { type: "integer", minimum: 1, description: "Number of days/nights for day types" },
      },
      required: ["date"],
    },
  },
  {
    name: "create_booking",
    description: "Make a booking. Validates hours, lead time and capacity itself, so call it directly when the details are known. Returns a reference code on success, or the reason and alternatives.",
    input_schema: {
      type: "object",
      properties: {
        booking_type: { type: "string" },
        customer_name: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "24h HH:MM (not needed for day types)" },
        quantity: { type: "integer", minimum: 1 },
        service: { type: "string" },
        nights: { type: "integer", minimum: 1 },
        phone: { type: "string" },
        notes: { type: "string" },
      },
      required: ["customer_name", "date"],
    },
  },
  {
    name: "create_order",
    description: "Place an order for products (menu items, merchandise...). It prices every line itself from the catalog and checks availability and stock, then saves the order for the team to approve. Call it once the customer has said what they want (each item with its size/option and quantity), pickup or delivery (delivery needs an address) and who it's for. Returns a reference code and the total, or exactly what to fix. The order is NOT confirmed until staff approve it. Services are booked with create_booking, not ordered.",
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
        notes: { type: "string", description: "Anything about the whole order" },
      },
      required: ["items", "fulfilment"],
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

function itemSummary(ws: Workspace, i: Item) {
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
    availableToday: i.available,
    availabilityNote: i.availabilityNote,
    colors: [...new Set(i.variants.map((v) => v.color).filter(Boolean))],
  };
}

const STOP = new Set(["free", "without", "no", "based", "option", "options", "do", "you", "have", "got", "any", "the", "a", "an", "is", "there", "ada", "or", "not", "can", "i", "get", "some", "with", "for", "me", "your", "u", "something", "what", "which", "how", "much", "price", "prices"]);

function searchCatalog(ctx: ToolContext, query: string) {
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
  return {
    output: { query, count: results.length, items: results.map((i) => itemSummary(ctx.ws, i)), note: results.length ? undefined : "Nothing in the catalog matches. Don't guess: say you'll check with the team and escalate as knowledge_gap." },
    label: `searched catalog: “${query}” → ${results.length} found`,
  };
}

const lc = (s?: string | null) => (s ?? "").trim().toLowerCase();

/** Which of an item's variants a customer's size / colour / option words point at. Shared by check_variant and create_order. */
function matchVariants(item: Item, input: { size?: string; color?: string; option?: string }) {
  const size = normSize(input.size);
  const colors = [...new Set(item.variants.map((v) => v.color).filter(Boolean))] as string[];
  const color = input.color ? colors.find((c) => lc(c) === lc(input.color) || lc(c).includes(lc(input.color))) ?? null : null;
  const optionWanted = lc(input.option);
  let vs = item.variants;
  if (size) vs = vs.filter((v) => lc(v.size) === lc(size));
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

function checkVariant(ctx: ToolContext, input: { product: string; size?: string; color?: string; option?: string }) {
  const item = findProduct(ctx.catalog, input.product);
  if (!item) {
    return { output: { found: false, product: input.product, note: "Not in the catalog. Offer search_catalog results or escalate if the customer insists." }, label: `checked: “${input.product}” ✗ not listed`, ok: false };
  }
  const { size, colors, color, vs } = matchVariants(item, input);
  const madeToOrder = item.variants.every((v) => v.stock === null);
  const fmt = (v: Variant) => ({ option: variantLabel(v), price: formatMoney(v.priceMinor, ctx.ws.currency), ...(madeToOrder || v.stock === null ? {} : { stock: v.stock, inStock: (v.stock ?? 0) > 0 }) });
  const out: Record<string, unknown> = {
    found: true, product: item.title, kind: item.kind, category: item.category,
    availableToday: item.available, availabilityNote: item.availabilityNote, madeToOrder,
    requested: { size: size ?? null, color: input.color ?? null, option: input.option ?? null },
  };
  if (item.kind === "service") out.durationMinutes = (item.data as { durationMinutes?: number }).durationMinutes ?? null;
  if (input.color && !color) out.colorNotFound = `No colour named “${input.color}”. Available colours: ${colors.join(", ")}.`;
  if (size && !item.variants.some((v) => lc(v.size) === lc(size))) out.sizeNotFound = `No size ${size}. Sizes: ${[...new Set(item.variants.map((v) => v.size).filter(Boolean))].join(", ") || "none"}.`;
  out.variants = (vs.length ? vs : item.variants).map(fmt);
  if (!madeToOrder && (size || color)) {
    out.otherInStock = item.variants.filter((v) => (v.stock ?? 0) > 0 && !vs.includes(v)).slice(0, 8).map(fmt);
  }
  const label = (() => {
    const name = `${size ? `${SIZE_LABEL[size] ?? size} ` : ""}${item.title}${color ? `, ${color}` : ""}${input.option && vs.length === 1 && vs[0].option ? `, ${vs[0].option}` : ""}`;
    if (!item.available) return `checked: ${name} ✗ ${item.availabilityNote ?? "unavailable today"}`;
    if (!madeToOrder && vs.length === 1 && vs[0].stock !== null) return `checked stock: ${name} ${(vs[0].stock ?? 0) > 0 ? `✓ ${vs[0].stock} left` : "✗ out of stock"}`;
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
    if (!hours) return { output: { found: false, note: "No hours on file. Say you'll check with the team and escalate as knowledge_gap." }, label: "checked hours ✗ none on file" };
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
  if (!policy) return { output: { found: false, topic: input.topic, note: "No policy on file. Say you'll check with the team and escalate as knowledge_gap." }, label: `checked ${input.topic} ✗ nothing on file` };
  return { output: { topic: input.topic, title: policy.title, details: policy.body, data: policy.data }, label: `checked ${policy.title.toLowerCase()}` };
}

/** How a line reads to the customer and staff: "Large Margherita", "Medium Forno Sette T-shirt, Charcoal". */
function lineName(item: Item, v: Variant) {
  const size = v.size ? SIZE_LABEL[v.size] ?? v.size : null;
  const extras = [v.color, v.option].filter(Boolean);
  return `${[size, item.title].filter(Boolean).join(" ")}${extras.length ? `, ${extras.join(", ")}` : ""}`;
}

type OrderLineInput = { product?: unknown; size?: unknown; color?: unknown; option?: unknown; quantity?: unknown; note?: unknown };

/** Turn what the model asked for into priced lines, or say everything that has to change first. */
function resolveOrderLines(ctx: ToolContext, raw: unknown): { lines: OrderLine[]; problems: string[] } {
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
      problems.push(`${item.title} is a service: book it with create_booking instead of ordering it.`);
      continue;
    }
    if (!item.available) {
      problems.push(`${item.title} isn't available today${item.availabilityNote ? `: ${item.availabilityNote}` : ""}. Offer an alternative.`);
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
    const used = (take.get(v.id) ?? 0) + qty;
    if (v.stock !== null && used > v.stock) {
      problems.push(v.stock <= 0 ? `${item.title} (${variantLabel(v)}) is out of stock.` : `Only ${v.stock} left of ${item.title} (${variantLabel(v)}).`);
      continue;
    }
    take.set(v.id, used);
    // Words that matched no variant ("extra sauce") are the customer's request for the kitchen, not an option.
    const unmatched = w.option && !m.optionMatched ? String(w.option).trim() : "";
    const note = [String(w.note ?? "").trim(), unmatched].filter(Boolean).join(", ").slice(0, 120) || null;
    lines.push({ itemId: item.id, variantId: v.id, name: lineName(item, v), quantity: qty, unitPriceMinor: v.priceMinor, note });
  }
  return { lines, problems };
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

async function bookingContext(ctx: ToolContext, input: Record<string, unknown>) {
  const type = await resolveBookingType(ctx.ws.id, (input.booking_type as string) ?? null);
  if (!type) {
    const types = await bookingTypesOf(ctx.ws.id);
    return { error: types.length ? `Which booking type? Options: ${types.map((x) => `${x.key} (${x.name})`).join(", ")}.` : "This business doesn't take bookings through chat. Offer to pass the request to the team (escalate as other)." };
  }
  const svc = await resolveService(ctx.ws.id, (input.service as string) ?? null);
  const service = svc ? { id: svc.id, title: svc.title, durationMinutes: Number((svc.data as { durationMinutes?: number }).durationMinutes) || null } : null;
  const qty = Number(input.quantity ?? input.party_size ?? 1) || 1;
  return { type, service, qty };
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
        const r = checkVariant(ctx, input as { product: string; size?: string; color?: string; option?: string });
        return done(r.output, r.label, r.ok);
      }
      case "get_business_info": {
        const r = businessInfo(ctx, input as { topic: string; date?: string });
        return done(r.output, r.label);
      }
      case "check_slots": {
        const date = String(input.date ?? "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return done({ ok: false, reason: "date must be YYYY-MM-DD" }, "checked availability ✗ bad date", false);
        const bc = await bookingContext(ctx, input);
        if ("error" in bc) return done({ ok: false, reason: bc.error }, "checked availability ✗ no booking type", false);
        const time = input.time ? normTime(String(input.time)) : null;
        const r = await checkSlots(ctx.ws, { type: bc.type, date, qty: bc.qty, time, durationMinutes: bc.service?.durationMinutes, nights: Number(input.nights ?? 1) || 1 });
        const day = human(zoned(date, time ?? "12:00", ctx.ws.timezone), ctx.ws.timezone).split(",")[0];
        const what = bc.type.unit === "party" ? `${bc.qty} people` : bc.type.unit === "day" ? `${bc.qty} × ${input.nights ?? 1} day(s)` : bc.service?.title ?? bc.type.name;
        const rr = r as { ok?: boolean; closed?: boolean; requestedAvailable?: boolean; availableTimes?: string[]; available?: boolean };
        const label =
          rr.ok === false ? `checked ${bc.type.name}: ${day}, ${what} ✗ too large`
          : rr.closed ? `checked ${bc.type.name}: ${day} ✗ closed`
          : bc.type.unit === "day" ? `checked ${bc.type.name}: ${day}, ${what} ${rr.available ? "✓" : "✗ full"}`
          : time ? `checked ${bc.type.name}: ${day} ${time}, ${what} ${rr.requestedAvailable ? "✓" : "✗ taken"}`
          : `checked ${bc.type.name}: ${day}, ${what} → ${(rr.availableTimes ?? []).length} times`;
        return done(r, label);
      }
      case "create_booking": {
        const date = String(input.date ?? "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return done({ ok: false, reason: "date must be YYYY-MM-DD" }, "booking ✗ bad date", false);
        const bc = await bookingContext(ctx, input);
        if ("error" in bc) return done({ ok: false, reason: bc.error }, "booking ✗ no booking type", false);
        const time = input.time ? normTime(String(input.time)) : null;
        const r = await createBooking(ctx.ws, {
          type: bc.type, customerName: String(input.customer_name || ctx.customerName || "Guest"), date, time, qty: bc.qty, nights: Number(input.nights ?? 1) || 1,
          service: bc.service, phone: (input.phone as string) ?? null, notes: (input.notes as string) ?? null, threadId: ctx.threadId, customerId: ctx.customerId, channel: ctx.channel,
        });
        if (r.ok) {
          ctx.bookings.push({ refCode: r.refCode, id: r.bookingId });
          return done(r, `booked: ${r.service ? `${r.service}, ` : ""}${r.when}${bc.type.unit === "party" ? `, ${r.quantity} people` : ""} · ${r.refCode}`);
        }
        return done(r, `booking ✗ ${r.reason}`, false);
      }
      case "create_order": {
        const { lines, problems } = resolveOrderLines(ctx, input.items);
        const fulfilment = input.fulfilment === "delivery" ? "delivery" : "pickup";
        const address = String(input.address ?? "").trim();
        const customerName = String(input.customer_name || ctx.customerName || "").trim();
        if (fulfilment === "delivery" && !address) problems.push("Delivery needs the customer's address. Ask for it.");
        if (!customerName) problems.push("Who is the order for? Ask for a name.");
        if (problems.length) return done({ ok: false, problems, instruction: "Nothing was ordered. Fix these with the customer (ask only for what's missing), then call create_order again." }, `order ✗ ${problems[0].slice(0, 90)}`, false);
        const r = await placeOrder(ctx.ws, {
          lines, customerName, phone: (input.phone as string) ?? null, fulfilment, address, wanted: (input.when as string) ?? null, notes: (input.notes as string) ?? null,
          threadId: ctx.threadId, customerId: ctx.customerId, channel: ctx.channel, isDemo: ctx.isDemo,
        });
        (ctx.orders ??= []).push({ refCode: r.order.refCode, id: r.order.id });
        const money = (m: number) => formatMoney(m, ctx.ws.currency);
        return done(
          {
            ok: true, refCode: r.order.refCode, status: "pending", duplicate: r.duplicate, fulfilment, ...(fulfilment === "delivery" ? { address } : {}),
            items: r.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: money(i.unitPriceMinor), lineTotal: money(lineTotal(i)), note: i.note })),
            total: money(r.order.totalMinor), note: fulfilment === "delivery" ? "Total is for the items; the delivery fee is confirmed by the team." : undefined,
            instruction: `${r.duplicate ? "This exact order was already placed a moment ago, so no second one was made. " : ""}Tell the customer the order is received, with the reference code, the items and the total. Say the team will confirm it shortly. Do NOT say it is confirmed, paid or being prepared.`,
          },
          `ordered: ${r.items.reduce((n, i) => n + i.quantity, 0)} item${r.items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"} · ${money(r.order.totalMinor)} · ${r.order.refCode}${r.duplicate ? " (already placed)" : ""}`,
        );
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
