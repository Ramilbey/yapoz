import { db, t } from "@/db";
import { and, eq, sql, asc } from "drizzle-orm";
import { formatMoney } from "@/lib/money";
import type { HoursData } from "@/lib/hours";
import { describeDay } from "@/lib/hours";

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
  lines.push(`KNOWLEDGE for ${ws.name}${biz?.type ? `, a ${biz.type}` : ""} in ${ws.city}. Currency: ${ws.currency}.`);
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

export function findProduct(c: Catalog, name: string) {
  const n = norm(name);
  if (!n) return null;
  let best: { item: Catalog["items"][number]; score: number } | null = null;
  for (const item of c.items) {
    const title = norm(item.title);
    const slug = norm(item.slug.replace(/-/g, " "));
    let score = 0;
    if (title === n || slug === n) score = 100;
    else if (title.includes(n) || n.includes(title)) score = 80;
    else {
      const words = n.split(" ").filter((w) => w.length > 2);
      const hits = words.filter((w) => title.includes(w) || slug.includes(w) || norm(item.body).includes(w));
      score = words.length ? (hits.length / words.length) * 60 : 0;
      if (title.split(" ").some((w) => w.length > 3 && n.includes(w))) score += 20;
    }
    if (!best || score > best.score) best = { item, score };
  }
  return best && best.score >= 30 ? best.item : null;
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
