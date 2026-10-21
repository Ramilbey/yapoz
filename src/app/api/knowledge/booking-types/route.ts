import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { BookingTypeFields } from "@/lib/booking-fields";

export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const b = await body(req, BookingTypeFields.partial({ active: true, notes: true }));
  const existing = await db.select({ key: t.bookingTypes.key }).from(t.bookingTypes).where(eq(t.bookingTypes.workspaceId, s.workspaceId));
  if (existing.length >= 10) throw new HttpError(400, "Up to 10 booking types.");
  const base = b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "booking";
  let key = base.length < 2 ? `${base}-1` : base;
  for (let i = 2; existing.some((e) => e.key === key); i++) key = `${base}-${i}`;
  const [row] = await db.insert(t.bookingTypes).values({ workspaceId: s.workspaceId, key, ...b, notes: b.notes ?? "", active: b.active ?? true, sort: existing.length }).returning();
  return ok({ bookingType: row });
});
