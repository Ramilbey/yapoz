import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { staffViews } from "@/lib/appointments";
import { minutesOf } from "@/lib/time";

export const dynamic = "force-dynamic";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const Range = z.tuple([z.string().regex(TIME, "Use times like 09:30"), z.string().regex(TIME, "Use times like 18:00")]).refine(([a, b]) => minutesOf(a) < minutesOf(b), "Each range has to start before it ends");
const Day = z.array(Range).max(4);
const Schedule = z.object({
  weekly: z.partialRecord(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]), Day),
  exceptions: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), hours: Day, note: z.string().trim().max(80).default("") })).max(120),
});
const Patch = z.object({ takesAppointments: z.boolean().optional(), schedule: Schedule.nullable().optional(), serviceIds: z.array(z.uuid()).max(200).optional() });

/** Owners set anyone's appointment hours and services; service staff only their own. Hours always sit inside opening hours. */
export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ userId: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { userId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(userId)) throw new HttpError(404, "Not found.");
  if (s.role !== "owner" && userId !== s.userId) throw new HttpError(403, "You can only change your own hours.");
  const [u] = await db.select({ id: t.users.id, name: t.users.name }).from(t.users).where(and(eq(t.users.id, userId), eq(t.users.workspaceId, s.workspaceId)));
  if (!u) throw new HttpError(404, "Not found.");
  const b = await body(req, Patch);
  let serviceIds = b.serviceIds;
  if (serviceIds?.length) {
    const real = await db.select({ id: t.kbItems.id }).from(t.kbItems).where(and(eq(t.kbItems.workspaceId, s.workspaceId), eq(t.kbItems.kind, "service"), inArray(t.kbItems.id, serviceIds)));
    serviceIds = real.map((r) => r.id);
  }
  const set = { ...(b.takesAppointments !== undefined ? { takesAppointments: b.takesAppointments } : {}), ...(b.schedule !== undefined ? { schedule: b.schedule as never } : {}), ...(serviceIds ? { serviceIds } : {}), updatedAt: new Date() };
  await db.insert(t.staff).values({ userId, workspaceId: s.workspaceId, ...set }).onConflictDoUpdate({ target: t.staff.userId, set });
  await audit(s, "appointment.staff_updated", { userId, name: u.name, fields: Object.keys(b) });
  return ok({ staff: (await staffViews(s.workspaceId)).find((x) => x.userId === userId) });
});
