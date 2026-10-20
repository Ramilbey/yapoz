import { z } from "zod";
import { db, t } from "@/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner", "service"]);
  const items = await db.select().from(t.kbItems).where(eq(t.kbItems.workspaceId, s.workspaceId)).orderBy(asc(t.kbItems.sort), asc(t.kbItems.title));
  const variants = await db.select().from(t.kbVariants).where(eq(t.kbVariants.workspaceId, s.workspaceId));
  const gaps = await db.select().from(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.workspaceId, s.workspaceId), eq(t.knowledgeGaps.status, "open"))).orderBy(desc(t.knowledgeGaps.count));
  return ok({ items: items.map((i) => ({ ...i, variants: variants.filter((v) => v.itemId === i.id) })), gaps });
});

const Create = z.object({
  kind: z.enum(["product", "service", "policy", "faq", "info"]),
  category: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(4000).default(""),
  data: z.record(z.string(), z.unknown()).optional(),
  variants: z.array(z.object({ size: z.string().nullable().optional(), color: z.string().nullable().optional(), priceMinor: z.number().int().min(0), stock: z.number().int().nullable().optional() })).optional(),
});

export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner", "service"]);
  const b = await body(req, Create);
  const slug = `${b.kind}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now().toString(36)}`;
  const [item] = await db.insert(t.kbItems).values({ workspaceId: s.workspaceId, kind: b.kind, category: b.category, slug, title: b.title, body: b.body, data: b.data ?? {}, sort: 999 }).returning();
  if (b.variants?.length) await db.insert(t.kbVariants).values(b.variants.map((v) => ({ workspaceId: s.workspaceId, itemId: item.id, size: v.size ?? null, color: v.color ?? null, priceMinor: v.priceMinor, stock: v.stock ?? null })));
  await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "kb.created", props: { id: item.id, kind: b.kind } });
  return ok({ item });
});
