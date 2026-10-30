import { z } from "zod";
import { db, t } from "@/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { businessDate, stockSettings } from "@/lib/stock";
import { guessInPerson } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner", "service"]);
  const items = await db.select().from(t.kbItems).where(eq(t.kbItems.workspaceId, s.workspaceId)).orderBy(asc(t.kbItems.sort), asc(t.kbItems.title));
  const variants = await db.select().from(t.kbVariants).where(eq(t.kbVariants.workspaceId, s.workspaceId));
  const gaps = await db.select().from(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.workspaceId, s.workspaceId), eq(t.knowledgeGaps.status, "open"))).orderBy(desc(t.knowledgeGaps.count));
  const dismissed = await db.select().from(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.workspaceId, s.workspaceId), eq(t.knowledgeGaps.status, "dismissed"))).orderBy(desc(t.knowledgeGaps.lastAskedAt)).limit(50);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  // stock: the business default mode and thresholds, and today's business date (an item is "sold out today" while today < unavailableUntil).
  return ok({ items: items.map((i) => ({ ...i, variants: variants.filter((v) => v.itemId === i.id) })), gaps, dismissed, currency: ws?.currency ?? "MYR", stock: { ...stockSettings(ws), today: businessDate(ws) } });
});

const Create = z.object({
  kind: z.enum(["product", "service", "policy", "faq", "info", "hours"]),
  category: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(4000).default(""),
  data: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  variants: z.array(z.object({ size: z.string().max(40).nullable().optional(), color: z.string().max(40).nullable().optional(), option: z.string().max(80).nullable().optional(), priceMinor: z.number().int().min(0), stock: z.number().int().min(0).nullable().optional() })).max(60).optional(),
});

export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner", "service"]);
  const b = await body(req, Create);
  const slug = `${b.kind}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${Date.now().toString(36)}`;
  const [ws] = await db.select({ settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  if (b.kind === "hours") await db.delete(t.kbItems).where(and(eq(t.kbItems.workspaceId, s.workspaceId), eq(t.kbItems.kind, "hours")));
  const [item] = await db.insert(t.kbItems).values({ workspaceId: s.workspaceId, kind: b.kind, category: b.category.toLowerCase(), slug: b.kind === "hours" ? `hours-${Date.now().toString(36)}` : slug, title: b.title, body: b.body, data: b.data ?? {}, tags: b.tags ?? [], inPerson: b.kind === "service" && guessInPerson(ws?.settings.business.type), sort: 999 }).returning();
  if (b.variants?.length) await db.insert(t.kbVariants).values(b.variants.map((v) => ({ workspaceId: s.workspaceId, itemId: item.id, size: v.size || null, color: v.color || null, option: v.option || null, priceMinor: v.priceMinor, stock: v.stock ?? null })));
  await audit(s, "kb.created", { itemId: item.id, kind: b.kind, title: item.title });
  return ok({ item });
});
