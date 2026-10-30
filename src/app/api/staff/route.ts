import { and, asc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { staffViews } from "@/lib/appointments";
import type { StaffResponse } from "@/lib/appointment-types";
import { appointmentSettings, loadHours } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/** The team's appointment settings: who takes bookings, their hours and services. */
export const GET = handle(async () => {
  const s = await apiSession(["owner", "service"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const services = await db
    .select({ id: t.kbItems.id, title: t.kbItems.title, inPerson: t.kbItems.inPerson, data: t.kbItems.data })
    .from(t.kbItems)
    .where(and(eq(t.kbItems.workspaceId, ws.id), eq(t.kbItems.kind, "service"), eq(t.kbItems.active, true)))
    .orderBy(asc(t.kbItems.sort));
  const res: StaffResponse = {
    timezone: ws.timezone, assignment: appointmentSettings(ws).assignment, me: { userId: s.userId, role: s.role }, staff: await staffViews(ws.id),
    services: services.map((x) => ({ id: x.id, title: x.title, inPerson: x.inPerson, durationMinutes: Number(x.data?.durationMinutes) || null })),
    openingHours: await loadHours(db, ws.id),
  };
  return ok(res);
});
