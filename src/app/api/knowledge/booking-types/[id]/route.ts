import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { BookingTypeFields } from "@/lib/booking-fields";

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner"]);
  const { id } = await ctx.params;
  const b = await body(req, BookingTypeFields.partial());
  const [row] = await db.update(t.bookingTypes).set({ ...b, updatedAt: new Date() }).where(and(eq(t.bookingTypes.id, id), eq(t.bookingTypes.workspaceId, s.workspaceId))).returning();
  if (!row) throw new HttpError(404, "Not found");
  return ok({ bookingType: row });
});

/** Existing bookings keep their record; they just lose the link to the type. */
export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner"]);
  const { id } = await ctx.params;
  await db.delete(t.bookingTypes).where(and(eq(t.bookingTypes.id, id), eq(t.bookingTypes.workspaceId, s.workspaceId)));
  return ok({ ok: true });
});
