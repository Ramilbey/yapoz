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
      (select coalesce(sum(coalesce(stock, -1) + price_minor)::text, '0') || ':' || count(*) from kb_variants where workspace_id = ${workspaceId})
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
 * Prices, stock, today's availability, slots and computed hours always come from tools.
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
  const policies = c.all.filter((i) => i.kind === "policy");
  const faqs = c.all.filter((i) => i.kind === "faq");
  const hours = c.all.find((i) => i.kind === "hours");
  const location = policies.find((p) => p.category === "location");
  lines.push(`KNOWLEDGE for ${ws.name} (${ws.city}). Currency: ${ws.currency}.`);
  if (location) lines.push(`Address: ${location.body}`);
  if (hours) {
    const h = hours.data as unknown as HoursData;
    const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    lines.push(
      "Regular weekly hours: " +
        order.map((d) => `${d} ${describeDay({ date: "", weekday: d, intervals: (h.weekly[d] ?? []).map(([open, close]) => ({ open, close })), closed: !(h.weekly[d] ?? []).length, note: null })}`).join("; ") +
        `. Last orders ${h.lastOrdersMinutesBeforeClose} min before close. Holiday exceptions exist: use get_business_info("hours", date) for a specific day.`,
    );
  }
  lines.push("", "MENU AND PRODUCTS (prices, sizes in stock and today's availability: always use check_variant or search_catalog)");
  const groups = new Map<string, typeof c.items>();
  for (const i of c.items) groups.set(i.category, [...(groups.get(i.category) ?? []), i]);
  for (const [cat, items] of groups) {
    lines.push(`[${cat}]`);
    for (const i of items) {
      const d = i.data as Record<string, unknown>;
      const flags = [d.vegan ? "vegan" : d.vegetarian ? "vegetarian" : null, d.halal === false ? "NOT halal (contains alcohol)" : null, d.spicy ? "spicy" : null].filter(Boolean);
      const allergens = Array.isArray(d.allergens) && d.allergens.length ? ` Allergens: ${(d.allergens as string[]).join(", ")}.` : "";
      const sizes = [...new Set(i.variants.map((v) => v.size).filter(Boolean))];
      const colors = [...new Set(i.variants.map((v) => v.color).filter(Boolean))];
      const opts = [sizes.length ? `sizes ${sizes.join("/")}` : null, colors.length ? `colors ${colors.join("/")}` : null].filter(Boolean).join(", ");
      lines.push(`- ${i.title}: ${i.body}${flags.length ? ` (${flags.join(", ")})` : ""}${allergens}${opts ? ` Options: ${opts}.` : ""}`);
    }
  }
  const extras = c.all.find((i) => i.slug === "extras");
  if (extras) {
    const ex = (extras.data as { extras?: { name: string; priceMinor: number }[] }).extras ?? [];
    lines.push(`Extras on any pizza: ${ex.map((e) => `${e.name} ${formatMoney(e.priceMinor, ws.currency)}`).join(", ")}.`);
  }
  lines.push("", "POLICIES (summaries; call get_business_info for details)");
  for (const p of policies) lines.push(`- ${p.title} [topic: ${p.category}]: ${p.body}`);
  const delivery = c.all.find((i) => i.slug === "delivery");
  if (delivery) lines.push(`- Delivery [topic: delivery]: zones and fees via get_business_info("delivery"). ${delivery.body}`);
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
