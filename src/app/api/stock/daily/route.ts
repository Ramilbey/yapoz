import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { businessDate, optionName } from "@/lib/stock";

export const dynamic = "force-dynamic";

const Put = z.object({
  variantId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  /** null: back to the usual daily quantity. */
  qty: z.number().int().min(0).max(100_000).nullable(),
});

/** Set one day's quantity for a daily item (today or a day ahead), or go back to the usual. */
export const PUT = handle(async (req: Request) => {
  const s = await apiSession(["owner", "service"]);
  const b = await body(req, Put);
  const [row] = await db
    .select({ v: t.kbVariants, title: t.kbItems.title, ws: t.workspaces })
    .from(t.kbVariants)
    .innerJoin(t.kbItems, eq(t.kbItems.id, t.kbVariants.itemId))
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.kbVariants.workspaceId))
    .where(and(eq(t.kbVariants.id, b.variantId), eq(t.kbVariants.workspaceId, s.workspaceId)));
  if (!row) throw new HttpError(404, "Not found");
  if (b.date < businessDate(row.ws)) throw new HttpError(400, "That day has passed.");
  const [before] = await db.select().from(t.dailyStock).where(and(eq(t.dailyStock.variantId, b.variantId), eq(t.dailyStock.date, b.date)));
  if (b.qty === null) await db.delete(t.dailyStock).where(and(eq(t.dailyStock.variantId, b.variantId), eq(t.dailyStock.date, b.date)));
  else {
    await db
      .insert(t.dailyStock)
      .values({ workspaceId: s.workspaceId, variantId: b.variantId, date: b.date, qty: b.qty })
      .onConflictDoUpdate({ target: [t.dailyStock.variantId, t.dailyStock.date], set: { qty: b.qty, updatedAt: new Date() } });
  }
  await audit(s, "stock.daily_set", { variantId: b.variantId, itemId: row.v.itemId, name: optionName(row.title, row.v), date: b.date, from: before?.qty ?? row.v.dailyQty, to: b.qty ?? row.v.dailyQty, usual: b.qty === null });
  return ok({ ok: true });
});
