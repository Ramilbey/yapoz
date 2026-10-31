import { db, t } from "@/db";
import { and, eq, sql, asc } from "drizzle-orm";
import { formatMoney } from "@/lib/money";
import type { HoursData } from "@/lib/hours";
import { describeDay } from "@/lib/hours";
import { gapWords, sameQuestion } from "@/lib/gaps";

export type Workspace = typeof t.workspaces.$inferSelect;
export type KbItem = typeof t.kbItems.$inferSelect;
export type Variant = typeof t.kbVariants.$inferSelect;
export type Catalog = { items: (KbItem & { variants: Variant[] })[]; all: KbItem[] };

const g = globalThis as unknown as { __kbCache?: Map<string, { version: string; catalog: Catalog; block: string }> };
const cache = (g.__kbCache ??= new Map());

/** Fingerprint changes whenever any knowledge row or variant is edited. */
async function kbVersion(workspaceId: string): Promise<string> {
  const rows = await db.execute<{ v: string }>(sql`
    select concat(
      (select coalesce(max(updated_at)::text, '0') || ':' || count(*) from kb_items where workspace_id = ${workspaceId}),
      '/',
      (select coalesce(sum(coalesce(stock, -1) + price_minor)::text, '0') || ':' || count(*) from kb_variants where workspace_id = ${workspaceId}),
      '/',
      (select md5(settings::text) from workspaces where id = ${workspaceId})
    ) as v`);
  return String(rows[0]?.v ?? "0");
}

export async function loadCatalog(workspaceId: string): Promise<Catalog> {
  const all = await db.select().from(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), eq(t.kbItems.active, true))).orderBy(asc(t.kbItems.sort));
  const variants = await db.select().from(t.kbVariants).where(eq(t.kbVariants.workspaceId, workspaceId));
  const byItem = new Map<string, Variant[]>();
  for (const v of variants) byItem.set(v.itemId, [...(byItem.get(v.itemId) ?? []), v]);
  const items = all.filter((i) => i.kind === "product" || i.kind === "service").map((i) => ({ ...i, variants: byItem.get(i.id) ?? [] }));
  return { items, all };
}

/**
 * The cached knowledge block. Holds stable facts (identity, menu descriptions, FAQs, policy headlines).
 * Prices, stock, today's availability and computed hours always come from tools.
 */
export async function knowledge(ws: Workspace): Promise<{ catalog: Catalog; block: string; version: string }> {
  const version = await kbVersion(ws.id);
  const hit = cache.get(ws.id);
  if (hit && hit.version === version) return hit;
  const catalog = await loadCatalog(ws.id);
  const block = renderBlock(ws, catalog);
  const entry = { version, catalog, block };
  cache.set(ws.id, entry);
  return entry;
}

function renderBlock(ws: Workspace, c: Catalog): string {
  const lines: string[] = [];
  const biz = ws.settings.business;
  const policies = c.all.filter((i) => i.kind === "policy");
  const infos = c.all.filter((i) => i.kind === "info" && i.slug !== "extras");
  const faqs = c.all.filter((i) => i.kind === "faq");
  const hours = c.all.find((i) => i.kind === "hours");
  lines.push(`KNOWLEDGE for ${ws.name}${biz?.type ? `, a ${biz.type}` : ""} in ${ws.city}${biz?.country ? `, ${biz.country}` : ""}. Currency: ${ws.currency}.`);
  if (biz?.description) lines.push(`About: ${biz.description}`);
  if (biz?.address) lines.push(`Address: ${biz.address}`);
  if (biz?.phone) lines.push(`Phone: ${biz.phone}`);
  if (biz?.website) lines.push(`Website: ${biz.website}`);
  if (hours) {
    const h = hours.data as unknown as HoursData;
    const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    lines.push(
      "Regular weekly hours: " +
        order.map((d) => `${d} ${describeDay({ date: "", weekday: d, intervals: (h.weekly?.[d] ?? []).map(([open, close]) => ({ open, close })), closed: !(h.weekly?.[d] ?? []).length, note: null })}`).join("; ") +
        `.${h.lastOrdersMinutesBeforeClose ? ` Last orders ${h.lastOrdersMinutesBeforeClose} min before close.` : ""} Exceptions may apply: use get_business_info("hours", date) for a specific day.`,
    );
  } else lines.push("Opening hours: not on file.");

  lines.push("", "PRODUCTS AND SERVICES (prices, stock and today's availability: always use check_variant or search_catalog)");
  const groups = new Map<string, typeof c.items>();
  for (const i of c.items) groups.set(i.category, [...(groups.get(i.category) ?? []), i]);
  if (!c.items.length) lines.push("None listed.");
  for (const [cat, items] of groups) {
    lines.push(`[${cat}]`);
    for (const i of items) {
      const d = i.data as Record<string, unknown>;
      const flags = [d.vegan ? "vegan" : d.vegetarian ? "vegetarian" : null, d.halal === false ? "NOT halal (contains alcohol)" : null, d.spicy ? "spicy" : null, ...(i.tags ?? []).filter((x) => !["vegan", "vegetarian", "spicy", "halal", "merch"].includes(x))].filter(Boolean);
      const allergens = Array.isArray(d.allergens) && d.allergens.length ? ` Allergens: ${(d.allergens as string[]).join(", ")}.` : "";
      const opts = [...new Set(i.variants.map((v) => [v.size, v.color, v.option].filter(Boolean).join(" / ")).filter(Boolean))];
      const dur = i.kind === "service" && d.durationMinutes ? ` (${d.durationMinutes} min)` : "";
      lines.push(`- ${i.title}${dur}: ${i.body}${flags.length ? ` [${[...new Set(flags)].join(", ")}]` : ""}${allergens}${opts.length > 1 ? ` Options: ${opts.slice(0, 12).join(", ")}${opts.length > 12 ? "…" : ""}.` : ""}`);
    }
  }
  const extras = c.all.find((i) => i.slug === "extras");
  if (extras) {
    const ex = (extras.data as { extras?: { name: string; priceMinor: number }[] }).extras ?? [];
    lines.push(`Extras: ${ex.map((e) => `${e.name} ${formatMoney(e.priceMinor, ws.currency)}`).join(", ")}.`);
  }
  lines.push("", "POLICIES AND INFO (call get_business_info for details)");
  for (const p of [...policies, ...infos]) lines.push(`- ${p.title} [topic: ${p.category}]: ${p.body}`);
  lines.push("", "FAQ (how customers ask → the house answer)");
  for (const f of faqs) lines.push(`Q: ${f.title}\nA: ${f.body}`);
  return lines.join("\n");
}

/** Words that say nothing about which item it is, so they don't have to appear on the menu. */
const FILLER = new Set(["the", "and", "for", "with", "please", "pls", "some", "one", "two", "three", "four", "five", "satu", "dua", "tiga", "nak", "lah", "order", "want", "inch", "size"]);

/** One slip in a word of five letters or more, two from eight. Shorter words must be right: beef is not beer. */
function typo(a: string, b: string) {
  const shorter = Math.min(a.length, b.length);
  const limit = shorter >= 8 ? 2 : shorter >= 5 ? 1 : 0;
  if (!limit || Math.abs(a.length - b.length) > limit) return false;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let diagonal = row[0];
    row[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const above = row[j + 1];
      row[j + 1] = Math.min(row[j] + 1, above + 1, diagonal + (a[i] === b[j] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length] <= limit;
}

const sameWord = (a: string, b: string) => a === b || `${a}s` === b || a === `${b}s` || typo(a, b);
const hasWords = (text: string, part: string) => ` ${text} `.includes(` ${part} `);

/**
 * The one item a customer named, or null. Every word that matters has to be on the item, at least one of them in its name,
 * so "Sushi platter" is never "Kuih platter"; a name that fits several items equally isn't guessed either. Null sends the
 * assistant to the customer or a person. A description only counts when it holds every word and fits one item alone.
 */
export function findProduct(c: Catalog, name: string) {
  const n = norm(name);
  if (!n) return null;
  const wanted = n.split(" ").filter((w) => w.length > 2 && !FILLER.has(w));
  let best: { item: Catalog["items"][number]; score: number } | null = null;
  let tied = false;
  for (const item of c.items) {
    const title = norm(item.title);
    const slug = norm(item.slug.replace(/-/g, " "));
    const named = `${title} ${slug}`.split(" ");
    const options = norm(item.variants.flatMap((v) => [v.size, v.color, v.option]).filter(Boolean).join(" ")).split(" ");
    const inName = (w: string) => named.some((x) => sameWord(w, x) || (w.length >= 4 && x.startsWith(w)));
    let score = 0;
    if (title === n || slug === n) score = 100;
    else if (hasWords(title, n) || hasWords(n, title)) score = 80;
    else if (wanted.some(inName) && wanted.every((w) => inName(w) || options.some((x) => sameWord(w, x)))) score = 60;
    else if (wanted.length && wanted.every((w) => inName(w) || [...options, ...norm(item.body).split(" ")].some((x) => sameWord(w, x)))) score = 40;
    if (best && score === best.score) tied = score > 0 && best.item.id !== item.id;
    if (!best || score > best.score) {
      best = { item, score };
      tied = false;
    }
  }
  return best && best.score > 0 && (!tied || best.score === 100) ? best.item : null;
}

export function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(t-?shirts?|tees?)\b/g, "t shirt")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * FAQ entries (the owner's own answers, including ones taught from Knowledge → Gaps) that fit a question.
 * Loose: at least half of the question's content words appear in the FAQ's question and answer.
 * Strict: the question and the FAQ's question are the same question in other words.
 */
export function matchFaqs(c: Catalog, query: string, strict = false) {
  const words = gapWords(query);
  if (!words.length) return [];
  return c.all
    .filter((i) => i.kind === "faq")
    .map((i) => {
      const have = new Set(gapWords(`${i.title} ${i.body}`));
      return { i, hits: words.filter((w) => have.has(w)).length, same: sameQuestion(words, gapWords(i.title)) };
    })
    .filter((x) => (strict ? x.same : x.same || x.hits >= Math.max(1, Math.ceil(words.length / 2))))
    .sort((a, b) => Number(b.same) - Number(a.same) || b.hits - a.hits)
    .slice(0, 3)
    .map((x) => ({ question: x.i.title, answer: x.i.body }));
}
