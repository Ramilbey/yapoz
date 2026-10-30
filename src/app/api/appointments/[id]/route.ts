import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { calendar, markAttendance } from "@/lib/appointments";
import { localDate } from "@/lib/time";

export const dynamic = "force-dynamic";

const Patch = z.object({ attendance: z.enum(["present", "late", "no_show"]) });

/** After the appointment, staff mark the customer present, late or no-show; that completes the booking. */
export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Booking not found.");
  const b = await body(req, Patch);
  const r = await markAttendance({ workspaceId: s.workspaceId, appointmentId: id, attendance: b.attendance, userId: s.userId });
  if (!r.ok) throw new HttpError(r.status, r.error);
  const [a] = await db.select({ startsAt: t.appointments.startsAt }).from(t.appointments).where(eq(t.appointments.id, id));
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const day = localDate(a.startsAt, ws.timezone);
  return ok({ appointment: (await calendar(ws, day, day)).find((x) => x.id === id) });
});
