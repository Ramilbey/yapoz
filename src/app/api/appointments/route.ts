import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { calendar, sendDueReminders, staffViews } from "@/lib/appointments";
import type { CalendarResponse } from "@/lib/appointment-types";
import { appointmentSettings } from "@/lib/schedule";
import { expireDueOrders } from "@/lib/stock";
import { addLocalDays, localDate, localWeekday, WEEKDAYS } from "@/lib/time";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The calendar: bookings between two local dates (default this week, Monday first) and the team. Owner and service desks. */
export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner", "service"]);
  // Like the Orders page: opening it expires unpaid bookings and sends due reminders (exactly once each).
  await expireDueOrders(s.workspaceId).catch((e) => log.error("stock.expiry_failed", { workspaceId: s.workspaceId, err: e }));
  await sendDueReminders(s.workspaceId).catch((e) => log.error("appointments.reminders_failed", { workspaceId: s.workspaceId, err: e }));
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const q = new URL(req.url).searchParams;
  const now = new Date();
  const today = localDate(now, ws.timezone);
  const monday = addLocalDays(today, -((WEEKDAYS.indexOf(localWeekday(now, ws.timezone)) + 6) % 7));
  const from = q.get("from") ?? monday;
  const to = q.get("to") ?? addLocalDays(from, 6);
  if (!DATE.test(from) || !DATE.test(to) || to < from) throw new HttpError(400, "Use from and to as YYYY-MM-DD, with to on or after from.");
  if (to > addLocalDays(from, 62)) throw new HttpError(400, "Ask for at most two months at a time.");
  const res: CalendarResponse = { timezone: ws.timezone, now: now.toISOString(), from, to, settings: appointmentSettings(ws), staff: await staffViews(ws.id), appointments: await calendar(ws, from, to) };
  return ok(res);
});
