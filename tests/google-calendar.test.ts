// Google Calendar sync against a real database and a fake Google that behaves like the real one where it matters: it
// checks the signed token, refuses a taken event id with 409, and keeps deleted ids (410, and 409 when reinserted).
// - only a confirmed booking makes an event, with no customer details, and nobody is invited
// - moves update the event, cancelling, rejecting and expiring remove it, and retries never make a second one
// - missing settings skip quietly; Google failing or hanging never touches the booking, and the reason is logged
import "../scripts/env";
import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { importSPKI, jwtVerify } from "jose";
import { db, t, sql as pg } from "../src/db";
import { createWorkspace } from "../src/lib/workspace";
import { describe as line } from "../src/lib/activity";
import { bookAppointment, changeAppointment } from "../src/lib/appointments";
import { calendarEventId, calendarIdFor } from "../src/lib/google-calendar";
import { runJob } from "../src/lib/jobs";
import { transitionOrder, requestReceipt } from "../src/lib/orders";
import { expireDueOrders } from "../src/lib/stock";
import { addLocalDays, localDate, zoned } from "../src/lib/time";

const TZ = "Asia/Kuala_Lumpur";
const EMAIL = "yapoz-sync@synthetic-project.iam.gserviceaccount.com";
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });

type Call = { method: string; url: string; body: Record<string, unknown> | null };
type Stored = Record<string, unknown> & { status: string };
const google = {
  events: new Map<string, Stored>(),
  calls: [] as Call[],
  /** Answer the next calendar calls with this instead (a status, or "offline" to fail the connection). */
  fail: [] as (number | "offline")[],
  /** Save the write, then answer with an error anyway: the reply got lost on the way back. */
  loseReply: false,
  /** Never answer until released. */
  hang: null as Promise<void> | null,
  tokenStatus: 200,
};
const json = (status: number, body: unknown = {}) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function fakeCalendar(method: string, url: URL, body: Record<string, unknown> | null, auth: string | null): Promise<Response> {
  assert.equal(auth, "Bearer fake-token");
  assert.equal(url.searchParams.get("sendUpdates"), "none", "nobody is ever emailed");
  const id = decodeURIComponent(url.pathname.split("/events/")[1] ?? "");
  const stored = google.events.get(id);
  if (method === "POST") {
    if (google.events.has(String(body!.id))) return json(409, { error: { message: "The requested identifier already exists." } });
    google.events.set(String(body!.id), { ...body!, status: "confirmed" });
    return json(200, body);
  }
  if (!stored) return json(404, { error: { message: "Not Found" } });
  if (method === "DELETE") {
    if (stored.status === "cancelled") return json(410, { error: { message: "Resource has been deleted" } });
    stored.status = "cancelled";
    return json(204);
  }
  if (method === "PUT") google.events.set(id, { ...body!, status: String(body!.status ?? "confirmed") });
  else google.events.set(id, { ...stored, ...body! });
  return json(200, body);
}

const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  if (url.hostname === "oauth2.googleapis.com") {
    const assertion = new URLSearchParams(String(init?.body)).get("assertion")!;
    const { payload } = await jwtVerify(assertion, await importSPKI(publicKey, "RS256"), { issuer: EMAIL, audience: "https://oauth2.googleapis.com/token" });
    assert.equal(payload.scope, "https://www.googleapis.com/auth/calendar.events");
    return google.tokenStatus === 200 ? json(200, { access_token: "fake-token" }) : json(google.tokenStatus, { error: "invalid_grant", error_description: "Invalid JWT Signature." });
  }
  if (url.hostname !== "www.googleapis.com") return realFetch(input, init);
  const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
  google.calls.push({ method, url: url.pathname, body });
  if (google.hang) await google.hang;
  const failure = google.fail.shift();
  if (failure === "offline") throw new TypeError("fetch failed");
  if (failure) return json(failure, { error: { message: failure === 403 ? "You need to have writer access to this calendar." : "Backend Error" } });
  const res = await fakeCalendar(method, url, body, new Headers(init?.headers).get("authorization"));
  if (google.loseReply) {
    google.loseReply = false;
    return json(503, { error: { message: "Backend Error" } });
  }
  return res;
}) as typeof fetch;

const workspaces: string[] = [];
after(async () => {
  globalThis.fetch = realFetch;
  for (const id of workspaces) {
    await db.delete(t.jobs).where(eq(t.jobs.workspaceId, id));
    await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  }
  await pg.end();
});

const connect = () => {
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = EMAIL;
  // As Vercel holds it: one line with \n written out.
  process.env.GOOGLE_PRIVATE_KEY = privateKey.replace(/\n/g, "\\n");
  process.env.GOOGLE_CALENDAR_ID = "team@group.calendar.google.com";
};

beforeEach(() => {
  connect();
  google.events.clear();
  google.calls = [];
  google.fail = [];
  google.loseReply = false;
  google.hang = null;
  google.tokenStatus = 200;
});

const rand = () => Math.random().toString(36).slice(2, 8);
const day = () => addLocalDays(localDate(new Date(), TZ), 3);
const at = (time: string) => zoned(day(), time, TZ);

async function setup() {
  const w = await createWorkspace({ name: `Cal ${rand()}`, timezone: TZ, owner: { name: "Owner", email: `${rand()}@example.com`, passwordHash: "x" } });
  workspaces.push(w.workspaceId);
  // Workspace ids are short and get reused, and jobs outlive their workspace: don't read an earlier run's.
  await db.delete(t.jobs).where(eq(t.jobs.workspaceId, w.workspaceId));
  const open: [string, string][] = [["09:00", "18:00"]];
  await db.insert(t.kbItems).values({ workspaceId: w.workspaceId, kind: "hours", category: "hours", slug: "hours", title: "Opening hours", data: { weekly: { mon: open, tue: open, wed: open, thu: open, fri: open, sat: open, sun: open }, lastOrdersMinutesBeforeClose: 0, exceptions: [] } });
  const [item] = await db.insert(t.kbItems).values({ workspaceId: w.workspaceId, kind: "service", category: "services", slug: "tutoring", title: "Tutoring", inPerson: false, data: { durationMinutes: 40 } }).returning();
  const [variant] = await db.insert(t.kbVariants).values({ workspaceId: w.workspaceId, itemId: item.id, priceMinor: 5000 }).returning();
  const [u] = await db.insert(t.users).values({ workspaceId: w.workspaceId, email: `aina-${rand()}@example.com`, name: "Aina", passwordHash: "x", role: "service" }).returning();
  await db.insert(t.staff).values({ userId: u.id, workspaceId: w.workspaceId, takesAppointments: true, serviceIds: [] });
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, w.workspaceId));
  return { ws, item, variant, staff: u, owner: w.user.id };
}
type Setup = Awaited<ReturnType<typeof setup>>;

async function book(s: Setup, start: Date) {
  const [customer] = await db.insert(t.customers).values({ workspaceId: s.ws.id, channel: "simulator", externalId: `s-${Math.random()}`, displayName: "Mei" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: s.ws.id, channel: "simulator", externalThreadId: `s-${Math.random()}`, customerId: customer.id, lastInboundAt: new Date() }).returning();
  const r = await bookAppointment(s.ws, { itemId: s.item.id, variantId: s.variant.id, name: "Tutoring", staffId: s.staff.id, start, customerName: "Mei Ling", phone: "+60 12-345 6789", notes: "Allergic to cats", threadId: thread.id, customerId: customer.id, channel: "simulator" });
  assert.ok(r.ok, r.ok ? "" : r.problem);
  return { order: r.order, threadId: thread.id };
}
const act = (s: Setup, orderId: string, action: "confirm" | "reject" | "cancel") => transitionOrder({ workspaceId: s.ws.id, orderId, action, userId: s.owner });
const move = (s: Setup, b: Awaited<ReturnType<typeof book>>, start: Date) => changeAppointment(s.ws, { threadId: b.threadId, orderId: b.order.id, action: "reschedule", start });
const statusOf = async (id: string) => (await db.select({ s: t.orders.status }).from(t.orders).where(eq(t.orders.id, id)))[0].s;

/** Wait for every job that hasn't had its first run yet (the ones behind a retry wait stay queued). */
async function settled(workspaceId: string) {
  for (let i = 0; i < 300; i++) {
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(t.jobs).where(and(eq(t.jobs.workspaceId, workspaceId), sql`(status = 'running' or (status = 'queued' and attempts = 0))`));
    if (!r.n) return;
    await new Promise((x) => setTimeout(x, 10));
  }
  assert.fail("jobs didn't finish");
}
const jobs = (workspaceId: string) => db.select().from(t.jobs).where(eq(t.jobs.workspaceId, workspaceId)).orderBy(t.jobs.createdAt);
const logged = async (workspaceId: string, type: string) => (await db.select().from(t.events).where(and(eq(t.events.workspaceId, workspaceId), eq(t.events.type, type))).orderBy(t.events.createdAt)).map((e) => e.props as Record<string, unknown>);
const event = (orderId: string) => google.events.get(calendarEventId(orderId));

test("a pending booking makes no event; confirming makes one with the facts, and no customer details or invitations", async () => {
  const s = await setup();
  const b = await book(s, at("10:00"));
  await settled(s.ws.id);
  assert.equal(google.calls.length, 0, "not even a call to Google before a person confirms");
  assert.equal((await jobs(s.ws.id)).length, 0);

  assert.ok((await act(s, b.order.id, "confirm")).ok);
  await settled(s.ws.id);
  assert.match(calendarEventId(b.order.id), /^[0-9a-f]{32}$/);
  const e = event(b.order.id)!;
  assert.equal(e.summary, `Tutoring (${b.order.refCode})`);
  assert.deepEqual(e.start, { dateTime: at("10:00").toISOString(), timeZone: TZ });
  assert.deepEqual(e.end, { dateTime: at("10:40").toISOString(), timeZone: TZ });
  assert.match(String(e.description), /Staff: Aina/);
  assert.match(String(e.description), new RegExp(`Time zone: ${TZ}`));
  assert.match(google.calls[0].url, /\/calendars\/team%40group\.calendar\.google\.com\/events$/);
  const sent = JSON.stringify(google.calls);
  for (const secret of ["Mei", "+60", "345", "Allergic"]) assert.ok(!sent.includes(secret), `${secret} never reaches Google`);
  assert.ok(!("attendees" in e), "nobody is invited");
  const [ok] = await logged(s.ws.id, "appointment.calendar_synced");
  assert.equal(ok.outcome, "added");
  assert.equal(line("appointment.calendar_synced", ok, "MYR").text, `Google Calendar: added ${b.order.refCode}`);
});

test("a rejected booking never makes an event, and an ordinary order never touches the calendar", async () => {
  const s = await setup();
  const b = await book(s, at("10:00"));
  assert.ok((await act(s, b.order.id, "reject")).ok);
  await settled(s.ws.id);
  assert.equal(google.events.size, 0);
  assert.deepEqual(await logged(s.ws.id, "appointment.calendar_synced"), [], "nothing was there to remove");

  const [order] = await db.insert(t.orders).values({ workspaceId: s.ws.id, refCode: `ORD-${rand()}`, customerName: "Mei", totalMinor: 100, currency: "MYR" }).returning();
  assert.ok((await act(s, order.id, "confirm")).ok);
  await settled(s.ws.id);
  assert.equal(google.calls.filter((c) => c.method !== "DELETE").length, 0);
});

test("moving a confirmed booking updates its event, approving again keeps one event, and a booking never confirmed gets none", async () => {
  const s = await setup();
  const b = await book(s, at("10:00"));
  await act(s, b.order.id, "confirm");
  await settled(s.ws.id);
  const moved = await move(s, b, at("15:00"));
  assert.ok(moved.ok && moved.action === "rescheduled" && moved.reconfirm);
  await settled(s.ws.id);
  assert.equal((event(b.order.id)!.start as { dateTime: string }).dateTime, at("15:00").toISOString());
  assert.equal(await statusOf(b.order.id), "pending", "the booking still waits for staff, whatever the calendar did");

  // Moved again while it waits: still follows.
  await move(s, b, at("16:00"));
  await settled(s.ws.id);
  assert.equal((event(b.order.id)!.start as { dateTime: string }).dateTime, at("16:00").toISOString());

  assert.ok((await act(s, b.order.id, "confirm")).ok);
  await settled(s.ws.id);
  assert.equal(google.events.size, 1);
  assert.deepEqual((await logged(s.ws.id, "appointment.calendar_synced")).map((p) => p.outcome), ["added", "updated", "updated", "updated"]);

  const never = await book(s, at("11:00"));
  await move(s, never, at("12:00"));
  await settled(s.ws.id);
  assert.equal(google.events.size, 1, "a pending booking moved before anyone confirmed it still has no event");
});

test("staff cancelling, the customer cancelling, rejecting a moved booking and expiry all remove the event", async () => {
  const s = await setup();
  const gone = async (orderId: string) => {
    await settled(s.ws.id);
    assert.equal(event(orderId)!.status, "cancelled");
  };
  const staff = await book(s, at("10:00"));
  await act(s, staff.order.id, "confirm");
  await settled(s.ws.id);
  await act(s, staff.order.id, "cancel");
  await gone(staff.order.id);

  const customer = await book(s, at("11:00"));
  await act(s, customer.order.id, "confirm");
  await settled(s.ws.id);
  assert.ok((await changeAppointment(s.ws, { threadId: customer.threadId, orderId: customer.order.id, action: "cancel" })).ok);
  await gone(customer.order.id);

  const rejected = await book(s, at("12:00"));
  await act(s, rejected.order.id, "confirm");
  await settled(s.ws.id);
  await move(s, rejected, at("12:30"));
  await settled(s.ws.id);
  assert.ok((await act(s, rejected.order.id, "reject")).ok);
  await gone(rejected.order.id);

  const expired = await book(s, at("14:00"));
  await act(s, expired.order.id, "confirm");
  await settled(s.ws.id);
  await move(s, expired, at("14:30"));
  await settled(s.ws.id);
  await db.update(t.workspaces).set({ settings: { ...s.ws.settings, payments: { enabled: true, requireReceipt: true, accounts: [{ id: "a", type: "bank_transfer", provider: "Sample Bank", accountName: "Cal", accountNumber: "1111" }] } } }).where(eq(t.workspaces.id, s.ws.id));
  assert.ok((await requestReceipt({ workspaceId: s.ws.id, orderId: expired.order.id, userId: s.owner, reason: "Wrong amount", kind: "replace" })).ok);
  await db.update(t.orders).set({ holdExpiresAt: sql`now() - interval '1 minute'` }).where(eq(t.orders.id, expired.order.id));
  assert.equal(await expireDueOrders(s.ws.id), 1);
  await gone(expired.order.id);
  assert.equal((await logged(s.ws.id, "appointment.calendar_synced")).filter((p) => p.outcome === "removed").length, 4);
});

test("retries: a failed sync runs again, a lost reply can't make a second event, and a late retry follows the booking as it is now", async () => {
  const s = await setup();
  // Google is down once: logged, then the retry makes the event.
  google.fail = [503];
  const a = await book(s, at("10:00"));
  await act(s, a.order.id, "confirm");
  await settled(s.ws.id);
  assert.equal(google.events.size, 0);
  const [first] = await jobs(s.ws.id);
  assert.equal(first.status, "queued");
  const [failure] = await logged(s.ws.id, "appointment.calendar_failed");
  assert.equal(failure.willRetry, true);
  assert.match(String(failure.reason), /refused to add the event \(503\): Backend Error/);
  assert.ok(await runJob(first.id));
  assert.ok(event(a.order.id));

  // Google saved it but the reply was lost: the retry is told the id is taken, so nothing is duplicated.
  const b = await book(s, at("11:00"));
  google.loseReply = true;
  await act(s, b.order.id, "confirm");
  await settled(s.ws.id);
  assert.equal(google.events.size, 2);
  const lost = (await jobs(s.ws.id)).at(-1)!;
  assert.ok(await runJob(lost.id));
  assert.equal(google.events.size, 2);
  assert.equal(google.calls.filter((c) => c.method === "POST" && (c.body as { id: string }).id === calendarEventId(b.order.id)).length, 2);
  assert.equal(google.calls.at(-1)!.method, "PUT");

  // The add failed and the booking was cancelled before its retry: the retry mustn't create it.
  google.fail = [503];
  const c = await book(s, at("12:00"));
  await act(s, c.order.id, "confirm");
  await settled(s.ws.id);
  const stale = (await jobs(s.ws.id)).at(-1)!;
  await act(s, c.order.id, "cancel");
  await settled(s.ws.id);
  assert.ok(await runJob(stale.id));
  assert.equal(event(c.order.id), undefined);

  // Deleted events keep their id at Google; the same booking confirmed again (a reopened one) brings it back.
  await act(s, b.order.id, "cancel");
  await settled(s.ws.id);
  await db.update(t.orders).set({ status: "pending", cancelledAt: null }).where(eq(t.orders.id, b.order.id));
  assert.ok((await act(s, b.order.id, "confirm")).ok);
  await settled(s.ws.id);
  assert.equal(event(b.order.id)!.status, "confirmed");
  assert.deepEqual((await logged(s.ws.id, "appointment.calendar_synced")).at(-1)!.outcome, "updated");
});

test("missing settings: nothing is queued or sent or logged, and bookings work as usual", async () => {
  for (const name of ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_CALENDAR_ID"]) {
    connect();
    delete process.env[name];
    const s = await setup();
    const b = await book(s, at("10:00"));
    assert.ok((await act(s, b.order.id, "confirm")).ok);
    await move(s, b, at("11:00"));
    assert.ok((await act(s, b.order.id, "reject")).ok);
    await settled(s.ws.id);
    assert.equal(google.calls.length, 0, name);
    assert.equal((await jobs(s.ws.id)).length, 0, name);
    assert.deepEqual(await logged(s.ws.id, "appointment.calendar_failed"), [], name);
  }
  delete process.env.GOOGLE_CALENDAR_ID;
  assert.equal(await calendarIdFor("any"), null);
  process.env.GOOGLE_CALENDAR_ID = "team@group.calendar.google.com";
  assert.equal(await calendarIdFor("any"), "team@group.calendar.google.com");
});

test("Google offline or hanging never blocks, undoes or delays a booking, and the reason is logged", async () => {
  const s = await setup();
  const b = await book(s, at("10:00"));
  // Hanging: confirm comes back while the call to Google is still waiting.
  let release = () => {};
  google.hang = new Promise((r) => (release = r));
  assert.ok((await act(s, b.order.id, "confirm")).ok);
  assert.equal(await statusOf(b.order.id), "confirmed");
  release();
  google.hang = null;
  await settled(s.ws.id);

  // Offline for confirm, move and cancel alike.
  google.fail = Array(20).fill("offline");
  const c = await book(s, at("11:00"));
  assert.ok((await act(s, c.order.id, "confirm")).ok);
  await settled(s.ws.id);
  assert.ok((await move(s, c, at("12:00"))).ok);
  await settled(s.ws.id);
  assert.equal(await statusOf(c.order.id), "pending");
  assert.ok((await changeAppointment(s.ws, { threadId: c.threadId, orderId: c.order.id, action: "cancel" })).ok);
  await settled(s.ws.id);
  assert.equal(await statusOf(c.order.id), "cancelled");
  const failures = await logged(s.ws.id, "appointment.calendar_failed");
  assert.equal(failures.length, 3);
  assert.ok(failures.every((f) => /Couldn't reach Google Calendar: fetch failed/.test(String(f.reason))));
  assert.match(line("appointment.calendar_failed", failures[0], "MYR").text, /NOT updated .*trying again\. The booking itself is fine\./);

  // Still down after every attempt: the job gives up and the last line says so.
  const job = (await jobs(s.ws.id)).at(-1)!;
  await runJob(job.id);
  await runJob(job.id);
  const [done] = (await jobs(s.ws.id)).filter((j) => j.id === job.id);
  assert.equal(done.status, "failed");
  assert.equal((await logged(s.ws.id, "appointment.calendar_failed")).at(-1)!.willRetry, false);
});

test("a problem only a person can fix is logged once with its reason, not retried", async () => {
  const s = await setup();
  const b = await book(s, at("10:00"));
  google.fail = [403];
  await act(s, b.order.id, "confirm");
  await settled(s.ws.id);
  const [noAccess] = await jobs(s.ws.id);
  assert.equal(noAccess.status, "done");
  assert.match(String((await logged(s.ws.id, "appointment.calendar_failed"))[0].reason), /\(403\): You need to have writer access/);

  const c = await book(s, at("11:00"));
  google.tokenStatus = 400;
  await act(s, c.order.id, "confirm");
  await settled(s.ws.id);
  assert.match(String((await logged(s.ws.id, "appointment.calendar_failed"))[1].reason), /sign in \(400\): Invalid JWT Signature/);

  const d = await book(s, at("12:00"));
  process.env.GOOGLE_PRIVATE_KEY = "not a key";
  await act(s, d.order.id, "confirm");
  await settled(s.ws.id);
  const reasons = (await logged(s.ws.id, "appointment.calendar_failed")).map((f) => String(f.reason));
  assert.match(reasons[2], /GOOGLE_PRIVATE_KEY couldn't be read/);
  assert.ok(!reasons.join(" ").includes("BEGIN"), "the key never reaches the log");
  assert.equal(await statusOf(d.order.id), "confirmed");
});
