import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";

const Patch = z.object({ stock: z.number().int().min(0).nullable().optional(), priceMinor: z.number().int().min(0).optional() });

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const b = await body(req, Patch);
  const [v] = await db.update(t.kbVariants).set(b).where(and(eq(t.kbVariants.id, id), eq(t.kbVariants.workspaceId, s.workspaceId))).returning();
  if (!v) throw new HttpError(404, "Not found");
  await db.update(t.kbItems).set({ updatedAt: new Date() }).where(eq(t.kbItems.id, v.itemId));
  return ok({ variant: v });
});
