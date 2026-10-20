import { db, t } from "@/db";
import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { addLocalDays, localDate, zoned } from "@/lib/time";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner", "service"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const u = new URL(req.url);
  const from = u.searchParams.get("from") ?? localDate(new Date(), ws.timezone);
  const days = Math.min(14, Number(u.searchParams.get("days") ?? 7));
  const rows = await db
    .select()
    .from(t.bookings)
    .where(and(eq(t.bookings.workspaceId, s.workspaceId), ne(t.bookings.kind, "demo_replay"), gte(t.bookings.startsAt, zoned(from, "00:00", ws.timezone)), lt(t.bookings.startsAt, zoned(addLocalDays(from, days), "04:00", ws.timezone))))
    .orderBy(asc(t.bookings.startsAt));
  return ok({ bookings: rows, from, days, timezone: ws.timezone, seatsPerSlot: ws.settings.booking.seatsPerSlot });
});
