import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";

const Create = z.object({
  size: z.string().trim().max(40).nullable().optional(),
  color: z.string().trim().max(40).nullable().optional(),
  option: z.string().trim().max(80).nullable().optional(),
  priceMinor: z.number().int().min(0),
  stock: z.number().int().min(0).nullable().optional(),
  dailyQty: z.number().int().min(0).max(100_000).nullable().optional(),
  lowStockAt: z.number().int().min(0).max(100_000).nullable().optional(),
});

/** Add a priced option (size, colour, length, duration…) to a product or service. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const b = await body(req, Create);
  const [item] = await db.select().from(t.kbItems).where(and(eq(t.kbItems.id, id), eq(t.kbItems.workspaceId, s.workspaceId)));
  if (!item || (item.kind !== "product" && item.kind !== "service")) throw new HttpError(404, "Not found");
  const [v] = await db.insert(t.kbVariants).values({ workspaceId: s.workspaceId, itemId: id, size: b.size || null, color: b.color || null, option: b.option || null, priceMinor: b.priceMinor, stock: b.stock ?? null, dailyQty: b.dailyQty ?? null, lowStockAt: b.lowStockAt ?? null }).returning();
  await db.update(t.kbItems).set({ updatedAt: new Date() }).where(and(eq(t.kbItems.id, id), eq(t.kbItems.workspaceId, s.workspaceId)));
  await audit(s, "kb.variant_created", { itemId: id, itemTitle: item.title, variant: [v.size, v.color, v.option].filter(Boolean).join(" / ") || "default", priceMinor: v.priceMinor, stock: v.stock });
  return ok({ variant: v });
});
