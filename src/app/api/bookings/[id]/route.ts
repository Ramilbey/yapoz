import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";

const Patch = z.object({ status: z.enum(["confirmed", "cancelled", "seated", "no_show"]) });

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const b = await body(req, Patch);
  const [row] = await db.update(t.bookings).set({ status: b.status }).where(and(eq(t.bookings.id, id), eq(t.bookings.workspaceId, s.workspaceId))).returning();
  return ok({ booking: row });
});
