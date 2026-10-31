// Bookings copied one way to Google Calendar: Yapoz stays the source of truth and nothing is read back. A change only
// queues a job, after its transaction, so Google can never block or slow it. The job then looks at the booking as it is
// now rather than at what changed, so a late retry can't bring back an event for a booking that has since been cancelled.
import { eq } from "drizzle-orm";
import { importPKCS8, SignJWT } from "jose";
import { db, t } from "@/db";
import { audit } from "./audit";
import { enqueue, MAX_ATTEMPTS, type JobHandler } from "./jobs";
import { bookingFacts, type BookingFacts } from "./schedule";
import { log } from "./log";

const API = "https://www.googleapis.com/calendar/v3";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TIMEOUT_MS = 8_000;
/** Told on every write, so Google never emails anyone. The events have no attendees either. */
const QUIET = "?sendUpdates=none";

type Order = typeof t.orders.$inferSelect;
type Settings = { email: string; privateKey: string; calendarId: string };
type Outcome = "added" | "updated" | "removed" | null;

class CalendarError extends Error {
  constructor(message: string, readonly retry: boolean) {
    super(message);
  }
}

/** The calendar a business's bookings go to. One shared calendar for now; a per-business setting belongs here. */
export async function calendarIdFor(_workspaceId: string): Promise<string | null> {
  return process.env.GOOGLE_CALENDAR_ID || null;
}

async function settingsFor(workspaceId: string): Promise<Settings | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = await calendarIdFor(workspaceId);
  return email && privateKey && calendarId ? { email, privateKey, calendarId } : null;
}

/** Google's id for a booking's event: the same every time, so a retry finds the event instead of making a second one. */
export const calendarEventId = (orderId: string) => orderId.replace(/-/g, "");

/** What goes on the calendar. Deliberately no customer name, phone, address or notes: the calendar is shared with staff. */
export function calendarEvent(order: Pick<Order, "id" | "refCode">, b: Pick<BookingFacts, "service" | "staffName" | "startsAt" | "endsAt">, timeZone: string) {
  return {
    id: calendarEventId(order.id),
    summary: `${b.service} (${order.refCode})`,
    description: [`Reference: ${order.refCode}`, `Staff: ${b.staffName ?? "Not assigned"}`, `Time zone: ${timeZone}`].join("\n"),
    start: { dateTime: b.startsAt.toISOString(), timeZone },
    end: { dateTime: b.endsAt.toISOString(), timeZone },
  };
}

async function request(url: string, init: RequestInit) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new CalendarError(`Couldn't reach Google Calendar: ${e instanceof Error ? e.message : String(e)}`, true);
  }
}

/** Google's own wording for a refused call. Rate limits come back as 403 too, and those pass with time. */
async function refused(res: Response, doing: string) {
  const body = (await res.json().catch(() => null)) as { error?: { message?: string } | string; error_description?: string } | null;
  const said = typeof body?.error === "string" ? body.error_description ?? body.error : body?.error?.message;
  const message = said ? `: ${said}` : "";
  const retry = res.status === 429 || res.status >= 500 || (res.status === 403 && /rate|quota/i.test(said ?? ""));
  return new CalendarError(`Google Calendar refused to ${doing} (${res.status})${message}`.slice(0, 300), retry);
}

async function accessToken(s: Settings) {
  const key = await importPKCS8(s.privateKey, "RS256").catch(() => {
    throw new CalendarError("GOOGLE_PRIVATE_KEY couldn't be read as a private key.", false);
  });
  const assertion = await new SignJWT({ scope: SCOPE }).setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuer(s.email).setAudience(TOKEN_URL).setIssuedAt().setExpirationTime("1h").sign(key);
  const res = await request(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!res.ok) throw await refused(res, "sign in");
  return ((await res.json()) as { access_token: string }).access_token;
}

/** Bring Google in line with the booking as it stands. null: nothing was there to change. */
async function apply(s: Settings, order: Order, facts: BookingFacts | undefined, timeZone: string): Promise<Outcome> {
  const token = await accessToken(s);
  const events = `${API}/calendars/${encodeURIComponent(s.calendarId)}/events`;
  const id = calendarEventId(order.id);
  const call = (method: string, url: string, body?: unknown) =>
    request(url, { method, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });

  if (order.status === "cancelled" || order.status === "expired") {
    const res = await call("DELETE", `${events}/${id}${QUIET}`);
    if (res.status === 404 || res.status === 410) return null;
    if (!res.ok) throw await refused(res, "remove the event");
    return "removed";
  }
  if (!facts) return null;
  const event = calendarEvent(order, facts, timeZone);

  // Moved back to Pending for approval: an event it already has follows the new time, but this never makes one.
  if (order.status === "pending") {
    const res = await call("PATCH", `${events}/${id}${QUIET}`, event);
    if (res.status === 404 || res.status === 410) return null;
    if (!res.ok) throw await refused(res, "update the event");
    return "updated";
  }

  const created = await call("POST", `${events}${QUIET}`, { ...event, status: "confirmed" });
  if (created.ok) return "added";
  if (created.status !== 409) throw await refused(created, "add the event");
  // The id is taken: an earlier attempt got through, or it's a deleted event, which Google keeps and this brings back.
  const res = await call("PUT", `${events}/${id}${QUIET}`, { ...event, status: "confirmed" });
  if (!res.ok) throw await refused(res, "update the event");
  return "updated";
}

/** Queue the sync for a booking whose transaction has finished. Never throws: the calendar can't get in a booking's way. */
export async function queueBookingSync(order: Pick<Order, "id" | "workspaceId" | "kind">) {
  if (order.kind !== "appointment") return;
  try {
    if (await settingsFor(order.workspaceId)) await enqueue("calendar.sync", { orderId: order.id }, { workspaceId: order.workspaceId });
  } catch (e) {
    log.error("calendar.queue_sync_failed", { workspaceId: order.workspaceId, orderId: order.id, err: e });
  }
}

export const syncBookingJob: JobHandler = async (payload, job) => {
  const [row] = await db.select({ order: t.orders, timeZone: t.workspaces.timezone }).from(t.orders).innerJoin(t.workspaces, eq(t.workspaces.id, t.orders.workspaceId)).where(eq(t.orders.id, String(payload.orderId)));
  if (!row) return;
  const { order, timeZone } = row;
  const s = await settingsFor(order.workspaceId);
  if (!s) return;
  const system = { workspaceId: order.workspaceId, userId: null };
  const about = { orderId: order.id, refCode: order.refCode, threadId: order.threadId };
  const [facts] = await bookingFacts(db, [order.id]);
  try {
    const outcome = await apply(s, order, facts, timeZone);
    if (outcome) await audit(system, "appointment.calendar_synced", { ...about, outcome }, order.isDemo);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    const retry = e instanceof CalendarError ? e.retry : true;
    await audit(system, "appointment.calendar_failed", { ...about, reason, attempt: job.attempts, willRetry: retry && job.attempts < MAX_ATTEMPTS }, order.isDemo);
    if (retry) throw e;
  }
};
