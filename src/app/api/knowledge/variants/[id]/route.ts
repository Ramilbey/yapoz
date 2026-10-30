import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { checkLowStock } from "@/lib/stock";

const Patch = z.object({
  stock: z.number().int().min(0).nullable().optional(),
  dailyQty: z.number().int().min(0).max(100_000).nullable().optional(),
  /** null = the business's default; 0 = never alert. */
  lowStockAt: z.number().int().min(0).max(100_000).nullable().optional(),
  priceMinor: z.number().int().min(0).optional(),
  size: z.string().trim().max(40).nullable().optional(),
  color: z.string().trim().max(40).nullable().optional(),
  option: z.string().trim().max(80).nullable().optional(),
});

const label = (v: { size: string | null; color: string | null; option: string | null }) => [v.size, v.color, v.option].filter(Boolean).join(" / ") || "default";

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const b = await body(req, Patch);
  const [before] = await db.select().from(t.kbVariants).where(and(eq(t.kbVariants.id, id), eq(t.kbVariants.workspaceId, s.workspaceId)));
  const [v] = await db.update(t.kbVariants).set(b).where(and(eq(t.kbVariants.id, id), eq(t.kbVariants.workspaceId, s.workspaceId))).returning();
  if (!v) throw new HttpError(404, "Not found");
  await db.update(t.kbItems).set({ updatedAt: new Date() }).where(eq(t.kbItems.id, v.itemId));
  const [item] = await db.select({ title: t.kbItems.title }).from(t.kbItems).where(eq(t.kbItems.id, v.itemId));
  const props: Record<string, unknown> = { itemId: v.itemId, itemTitle: item?.title ?? null, variant: label(v) };
  if (before) {
    if (before.priceMinor !== v.priceMinor) props.priceMinor = { from: before.priceMinor, to: v.priceMinor };
    if (before.stock !== v.stock) props.stock = { from: before.stock, to: v.stock };
    if (before.dailyQty !== v.dailyQty) props.dailyQty = { from: before.dailyQty, to: v.dailyQty };
    if (before.lowStockAt !== v.lowStockAt) props.lowStockAt = { from: before.lowStockAt, to: v.lowStockAt };
    if (label(before) !== label(v)) props.previousVariant = label(before);
  }
  await audit(s, "kb.variant_updated", props);
  if (before && v.stock !== null && (before.stock ?? 0) < v.stock) await audit(s, "stock.restocked", { itemId: v.itemId, itemTitle: props.itemTitle, variant: props.variant, from: before.stock, to: v.stock });
  if (before && (before.stock !== v.stock || before.lowStockAt !== v.lowStockAt)) await checkLowStock(s.workspaceId, [v.id]).catch((e) => console.error("[stock] low-stock check failed", e));
  return ok({ variant: v });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const [v] = await db.delete(t.kbVariants).where(and(eq(t.kbVariants.id, id), eq(t.kbVariants.workspaceId, s.workspaceId))).returning();
  if (v) {
    await db.update(t.kbItems).set({ updatedAt: new Date() }).where(eq(t.kbItems.id, v.itemId));
    const [item] = await db.select({ title: t.kbItems.title }).from(t.kbItems).where(eq(t.kbItems.id, v.itemId));
    await audit(s, "kb.variant_deleted", { itemId: v.itemId, itemTitle: item?.title ?? null, variant: label(v), priceMinor: v.priceMinor, stock: v.stock });
  }
  return ok({ ok: true });
});
