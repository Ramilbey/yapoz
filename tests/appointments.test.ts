// Appointments, checked against a real database:
// - free times on the grid inside opening hours ∩ staff hours, a busy person's "delay N minutes" and others free then
// - who qualifies (anyone vs specific services), and auto-assign to the person with the fewest bookings that day
// - two customers after the same person and time: exactly one booking; a repeat in the same chat is the same booking
// - approve puts it on the calendar; expiry frees the time; confirm and a late receipt re-check it
// - customer changes: inside the cutoff goes to staff, a moved confirmed booking needs approval again, a paid cancel asks for a refund
// - reminders exactly once, attendance completes the order, online link vs in-person address
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { and, eq, sql } from "drizzle-orm";
import { db, t, sql as pg } from "../src/db";
import type { AppointmentSettings, PayAccount, StaffSchedule } from "../src/db/schema";
import { createWorkspace } from "../src/lib/workspace";
import { bookingMessage, loadOrders, transitionOrder } from "../src/lib/orders";
import { bookAppointment, calendar, changeAppointment, markAttendance, reminderMessage, sendDueReminders } from "../src/lib/appointments";
import { bookingFacts, checkTime, freeTimes, slotTaken } from "../src/lib/schedule";
import { expireDueOrders, expiryMessage, reopenExpired } from "../src/lib/stock";
import { addLocalDays, localDate, zoned } from "../src/lib/time";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";

const TZ = "Asia/Kuala_Lumpur";
const ACCOUNTS: PayAccount[] = [{ id: "a", type: "bank_transfer", provider: "Sample Bank", accountName: "Appt Studio", accountNumber: "1111 2222 3333" }];
const BASE: AppointmentSettings = { slotMinutes: 30, assignment: "anyone", bookingDays: 30, minNoticeMinutes: 120, changeCutoffHours: 24, reminderMinutes: 60, bufferMinutes: 0, meetBase: "https://meet.jit.si", whatsappTemplate: null };
const workspaces: string[] = [];
type Ws = typeof t.workspaces.$inferSelect;

after(async () => {
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await pg.end();
});

const rand = () => Math.random().toString(36).slice(2, 8);
const today = () => localDate(new Date(), TZ);
/** A day comfortably inside the booking window and outside the change cutoff. */
const DAY = () => addLocalDays(today(), 3);
const at = (time: string, date = DAY()) => zoned(date, time, TZ);

/** A business open 09:00–18:00 every day, with two people taking appointments and one online service of 40 minutes. */
async function setup(o: { payments?: boolean; settings?: Partial<AppointmentSettings>; bSchedule?: StaffSchedule | null } = {}) {
  const w = await createWorkspace({ name: `Appt ${rand()}`, timezone: TZ, owner: { name: "Owner", email: `${rand()}@example.com`, passwordHash: "x" } });
  workspaces.push(w.workspaceId);
  const [row] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, w.workspaceId));
  await db.update(t.workspaces).set({ currency: "MYR", settings: { ...row.settings, live: true, business: { ...row.settings.business, address: "12 Jalan Test, KL" }, appointments: { ...BASE, ...o.settings }, ...(o.payments ? { payments: { enabled: true, requireReceipt: true, accounts: ACCOUNTS } } : {}) } }).where(eq(t.workspaces.id, w.workspaceId));
  const day: [string, string][] = [["09:00", "18:00"]];
  await db.insert(t.kbItems).values({ workspaceId: w.workspaceId, kind: "hours", category: "hours", slug: "hours", title: "Opening hours", data: { weekly: { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day }, lastOrdersMinutesBeforeClose: 0, exceptions: [] } });
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, w.workspaceId));
  const svc = await service(ws, { minutes: 40, title: "Tutoring" });
  const A = await person(ws, "Aina", { serviceIds: [svc.item.id] });
  const B = await person(ws, "Bala", { schedule: o.bSchedule ?? null });
  return { ws, svc, A, B, owner: w.user.id };
}

async function service(ws: Ws, o: { minutes?: number; inPerson?: boolean; title?: string } = {}) {
  const tag = rand();
  const [item] = await db.insert(t.kbItems).values({ workspaceId: ws.id, kind: "service", category: "services", slug: `svc-${tag}`, title: o.title ?? `Service ${tag}`, inPerson: Boolean(o.inPerson), data: o.minutes ? { durationMinutes: o.minutes } : {} }).returning();
  const [variant] = await db.insert(t.kbVariants).values({ workspaceId: ws.id, itemId: item.id, priceMinor: 5000 }).returning();
  return { item, variant };
}

async function person(ws: Ws, name: string, o: { schedule?: StaffSchedule | null; serviceIds?: string[] } = {}) {
  const [u] = await db.insert(t.users).values({ workspaceId: ws.id, email: `${name.toLowerCase()}-${rand()}@example.com`, name, passwordHash: "x", role: "service" }).returning();
  await db.insert(t.staff).values({ userId: u.id, workspaceId: ws.id, takesAppointments: true, schedule: o.schedule ?? null, serviceIds: o.serviceIds ?? [] });
  return u;
}

async function chat(ws: Ws) {
  const [customer] = await db.insert(t.customers).values({ workspaceId: ws.id, channel: "simulator", externalId: `s-${Math.random()}`, displayName: "Mei" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: ws.id, channel: "simulator", externalThreadId: `s-${Math.random()}`, customerId: customer.id, lastInboundAt: new Date() }).returning();
  return { thread, customer };
}

type Svc = Awaited<ReturnType<typeof service>>;
async function book(ws: Ws, svc: Svc, start: Date, staffId?: string | null, c?: Awaited<ReturnType<typeof chat>>) {
  const { thread, customer } = c ?? (await chat(ws));
  const r = await bookAppointment(ws, { itemId: svc.item.id, variantId: svc.variant.id, name: svc.item.title, staffId, start, customerName: "Mei", threadId: thread.id, customerId: customer.id, channel: "simulator" });
  return { r, thread, customer };
}
function booked(x: Awaited<ReturnType<typeof book>>) {
  assert.ok(x.r.ok, `expected a booking, got: ${!x.r.ok ? x.r.problem : ""}`);
  return x.r;
}
const clock = (d: Date) => d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const orderRow = async (id: string) => (await db.select().from(t.orders).where(eq(t.orders.id, id)))[0];
const apptOf = async (orderId: string) => (await db.select().from(t.appointments).where(eq(t.appointments.orderId, orderId)))[0];
const confirm = (ws: Ws, orderId: string, userId: string) => transitionOrder({ workspaceId: ws.id, orderId, action: "confirm", userId });

test("free times sit on the grid inside opening hours ∩ the person's hours; a busy person offers a short delay and others free then", async () => {
  const half: StaffSchedule = { weekly: Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, [["13:00", "20:00"]]])), exceptions: [{ date: addLocalDays(DAY(), 1), hours: [], note: "Off" }] };
  const { ws, svc, A, B } = await setup({ bSchedule: half });
  // Bala works 13:00–20:00 but the business closes at 18:00, and he's off the next day.
  const bTimes = await freeTimes(db, ws, { itemId: svc.item.id, minutes: 40, staffId: B.id, date: DAY(), limit: 50 });
  assert.equal(clock(bTimes[0].start), "13:00");
  assert.equal(clock(bTimes[bTimes.length - 1].start), "17:00", "the last 40-minute slot ends before closing");
  assert.ok(bTimes.every((o) => [0, 30].includes(o.start.getUTCMinutes())), "on the 30-minute grid");
  assert.equal((await freeTimes(db, ws, { itemId: svc.item.id, minutes: 40, staffId: B.id, date: addLocalDays(DAY(), 1) })).length, 0);
  // Earliest first, across the team.
  const all = await freeTimes(db, ws, { itemId: svc.item.id, minutes: 40, date: DAY(), limit: 3 });
  assert.deepEqual(all.map((o) => clock(o.start)), ["09:00", "09:30", "10:00"]);
  assert.equal(all[0].staffName, "Aina");

  booked(await book(ws, svc, at("10:00"), A.id));
  // Aina's 10:00 runs to 10:40: asked for 10:30, she's free 10 minutes later.
  const c = await checkTime(db, ws, { itemId: svc.item.id, minutes: 40, start: at("10:30"), staffId: A.id });
  assert.ok(!c.ok);
  assert.equal(c.delay?.minutes, 10);
  assert.equal(clock(c.delay!.start), "10:40");
  assert.match(c.problem, /Aina is busy at 10:30am: the appointment before runs until 10:40am/);
  assert.ok(!/Mei/.test(c.problem), "never another customer's details");
  assert.ok(c.nextTimes.length > 0);
  // Bala doesn't start until 13:00, so nobody else is free at 10:30; at 14:00 he would be.
  assert.deepEqual(c.otherStaff, []);
  const pm = await checkTime(db, ws, { itemId: svc.item.id, minutes: 40, start: at("10:00"), staffId: A.id });
  assert.ok(!pm.ok);
  assert.equal(pm.delay?.minutes, 40, "the whole booking is in the way: 40 minutes later");
  // Off-grid times are fine when free; outside hours and too soon are refused with the reason.
  assert.ok((await checkTime(db, ws, { itemId: svc.item.id, minutes: 40, start: at("11:10"), staffId: A.id })).ok);
  const late = await checkTime(db, ws, { itemId: svc.item.id, minutes: 40, start: at("17:45") });
  assert.ok(!late.ok && /outside opening hours/.test(late.problem));
  const soon = await checkTime(db, ws, { itemId: svc.item.id, minutes: 40, start: new Date(Date.now() + 30 * 60_000) });
  assert.ok(!soon.ok && /at least 2 hours notice/.test(soon.problem));
  const far = await checkTime(db, ws, { itemId: svc.item.id, minutes: 40, start: at("10:00", addLocalDays(today(), 40)) });
  assert.ok(!far.ok && /up to 30 days ahead/.test(far.problem));
});

test("who qualifies: specific services, and auto-assign picks the free person with the fewest bookings that day", async () => {
  const { ws, svc, A, B } = await setup();
  // Anyone: Aina has one booking that day, so the next one without a preference goes to Bala.
  booked(await book(ws, svc, at("10:00"), A.id));
  const next = booked(await book(ws, svc, at("14:00")));
  assert.equal(next.facts.staffName, "Bala");
  // Specific: only Aina does this service.
  await db.update(t.workspaces).set({ settings: { ...ws.settings, appointments: { ...BASE, assignment: "specific" } } }).where(eq(t.workspaces.id, ws.id));
  const [specific] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, ws.id));
  const asked = await checkTime(db, specific, { itemId: svc.item.id, minutes: 40, start: at("15:00"), staffId: B.id });
  assert.ok(!asked.ok && /doesn't do this service/.test(asked.problem));
  assert.deepEqual(asked.otherStaff.map((p) => p.staffName), ["Aina"]);
  const auto = booked(await book(specific, svc, at("15:00")));
  assert.equal(auto.facts.staffName, "Aina");
  // Nobody does a service: the tool hands it to staff instead of offering times.
  const other = await service(specific, { title: "Massage" });
  const none = await checkTime(db, specific, { itemId: other.item.id, minutes: 30, start: at("15:00") });
  assert.ok(!none.ok && none.noStaff);
});

test("two customers after the same person and time at once: exactly one booking; the same chat repeating itself gets the same booking", async () => {
  const { ws, svc, A } = await setup();
  const results = await Promise.all(Array.from({ length: 4 }, () => book(ws, svc, at("11:00"), A.id)));
  const ok = results.filter((x) => x.r.ok);
  assert.equal(ok.length, 1, "exactly one wins");
  for (const x of results.filter((y) => !y.r.ok)) assert.ok(!x.r.ok && /taken|busy/.test(x.r.problem));
  const [n] = await db.select({ n: sql<number>`count(*)::int` }).from(t.appointments).where(and(eq(t.appointments.workspaceId, ws.id), eq(t.appointments.staffId, A.id)));
  assert.equal(n.n, 1);
  // Without a preference, the others at that time go to whoever else is free.
  const anyone = await Promise.all([book(ws, svc, at("12:00")), book(ws, svc, at("12:00")), book(ws, svc, at("12:00"))]);
  const staffed = anyone.filter((x) => x.r.ok).map((x) => (x.r.ok ? x.r.facts.staffName : null)).sort();
  assert.deepEqual(staffed, ["Aina", "Bala"], "two people, two bookings; the third finds nobody free");

  const first = await book(ws, svc, at("15:30"));
  const again = await book(ws, svc, at("15:30"), null, { thread: first.thread, customer: first.customer });
  const a = booked(first);
  const b = booked(again);
  assert.equal(b.duplicate, true);
  assert.equal(b.order.id, a.order.id);
  assert.match(a.order.refCode, /^APT-/);
  assert.equal(a.order.kind, "appointment");
});

test("approve puts it on the calendar; with payments on, expiry frees the time, and confirm and a late receipt re-check it", async () => {
  const { ws, svc, A, owner } = await setup({ payments: true });
  const x = booked(await book(ws, svc, at("10:00"), A.id));
  assert.ok(x.order.holdExpiresAt, "the same payment timer as orders");
  assert.ok(await slotTaken(db, ws, A.id, at("10:00"), at("10:40")));
  // Expired: status, the time is free again, and the customer is told it was a booking.
  await db.update(t.orders).set({ holdExpiresAt: sql`now() - interval '1 minute'` }).where(eq(t.orders.id, x.order.id));
  assert.ok(!(await slotTaken(db, ws, A.id, at("10:00"), at("10:40"))), "free as soon as the timer runs out, before any sweep");
  assert.equal(await expireDueOrders(ws.id), 1);
  assert.equal((await orderRow(x.order.id)).status, "expired");
  const msgs = await db.select().from(t.messages).where(and(eq(t.messages.threadId, x.order.threadId!), eq(t.messages.direction, "out")));
  assert.deepEqual(msgs.map((m) => m.text), [expiryMessage(x.order.refCode, 20, "appointment")]);
  assert.match(msgs[0].text, /Your booking APT-.* the time is free again/);
  // Someone else books it; the late receipt can't reopen the first one.
  const y = booked(await book(ws, svc, at("10:00"), A.id));
  const reopened = await reopenExpired(ws, x.order.id);
  assert.ok(!reopened.ok && /booked by someone else/.test(reopened.problems[0]));
  // Confirm needs a receipt (payments on), then puts it on the calendar.
  assert.ok(!(await confirm(ws, y.order.id, owner)).ok);
  await db.insert(t.orderReceipts).values({ workspaceId: ws.id, orderId: y.order.id, mime: "image/png", sha256: `s-${Math.random()}`, bytes: Buffer.from("x"), verdict: "consistent" });
  const ok = await confirm(ws, y.order.id, owner);
  assert.ok(ok.ok);
  const cal = await calendar(ws, DAY(), DAY());
  const mine = cal.find((c) => c.orderId === y.order.id)!;
  assert.equal(mine.status, "confirmed");
  assert.equal(mine.staffName, "Aina");
  assert.equal(mine.taken, true);
  assert.equal(cal.find((c) => c.orderId === x.order.id)?.taken, false);
  // A pending booking whose timer lapsed while someone else took the time can't be confirmed.
  const z = booked(await book(ws, svc, at("14:00"), A.id));
  await db.update(t.orders).set({ holdExpiresAt: sql`now() - interval '1 minute'` }).where(eq(t.orders.id, z.order.id));
  const w2 = booked(await book(ws, svc, at("14:00"), A.id));
  await db.insert(t.orderReceipts).values({ workspaceId: ws.id, orderId: z.order.id, mime: "image/png", sha256: `s-${Math.random()}`, bytes: Buffer.from("x"), verdict: "consistent" });
  const refused = await confirm(ws, z.order.id, owner);
  assert.ok(!refused.ok && /no longer free/.test(refused.error));
  const page = await loadOrders(ws.id);
  assert.equal(page.find((o) => o.id === w2.order.id)?.appointment?.staffName, "Aina");
  assert.equal((await transitionOrder({ workspaceId: ws.id, orderId: y.order.id, action: "ready", userId: owner })).ok, false, "bookings have no ready step");
});

test("customer changes: inside the cutoff goes to staff; a moved confirmed booking needs approval again; a paid cancel asks for a refund", async () => {
  const { ws, svc, A, B, owner } = await setup();
  const x = booked(await book(ws, svc, at("10:00"), A.id));
  assert.ok((await confirm(ws, x.order.id, owner)).ok);
  // Move it: same person if free, and it goes back to Pending with no timer.
  const moved = await changeAppointment(ws, { threadId: x.order.threadId!, orderId: x.order.id, action: "reschedule", start: at("15:00") });
  assert.ok(moved.ok && moved.action === "rescheduled");
  assert.equal(moved.facts.staffName, "Aina");
  const row = await orderRow(x.order.id);
  assert.equal(row.status, "pending");
  assert.equal(row.holdExpiresAt, null);
  assert.match(row.notes ?? "", /Rescheduled by the customer from/);
  assert.ok(!(await slotTaken(db, ws, A.id, at("10:00"), at("10:40"))), "the old time is free");
  // Aina is busy at 11:00 with someone else: moving there falls to Bala.
  booked(await book(ws, svc, at("11:00"), A.id));
  const toBala = await changeAppointment(ws, { threadId: x.order.threadId!, orderId: x.order.id, action: "reschedule", start: at("11:00") });
  assert.ok(toBala.ok && toBala.action === "rescheduled" && toBala.facts.staffId === B.id);
  // Paid, then cancelled: a refund card.
  assert.ok((await confirm(ws, x.order.id, owner)).ok);
  await db.update(t.orders).set({ paid: true }).where(eq(t.orders.id, x.order.id));
  const cancelled = await changeAppointment(ws, { threadId: x.order.threadId!, orderId: x.order.id, action: "cancel" });
  assert.ok(cancelled.ok && cancelled.action === "cancelled" && cancelled.paid);
  assert.equal((await orderRow(x.order.id)).status, "cancelled");
  const cards = await db.select().from(t.escalations).where(and(eq(t.escalations.threadId, x.order.threadId!), eq(t.escalations.category, "refund")));
  assert.equal(cards.length, 1);
  // Inside the 24-hour cutoff: nothing changes, staff get a card.
  const y = booked(await book(ws, svc, at("16:00"), A.id));
  await db.update(t.appointments).set({ startsAt: new Date(Date.now() + 5 * 3600_000), endsAt: new Date(Date.now() + 5 * 3600_000 + 40 * 60_000) }).where(eq(t.appointments.orderId, y.order.id));
  const tooLate = await changeAppointment(ws, { threadId: y.order.threadId!, orderId: y.order.id, action: "cancel" });
  assert.ok(!tooLate.ok && tooLate.tooLate);
  assert.equal((await orderRow(y.order.id)).status, "pending");
  const [card] = await db.select().from(t.escalations).where(and(eq(t.escalations.threadId, y.order.threadId!), eq(t.escalations.category, "appointment_change")));
  assert.match(card.summary, /inside your 24-hour cutoff/);
});

test("reminders go once, however many sweeps run at once; attendance after the start completes the booking", async () => {
  const { ws, svc, A, owner } = await setup();
  const x = booked(await book(ws, svc, at("10:00"), A.id));
  assert.ok((await confirm(ws, x.order.id, owner)).ok);
  const pending = booked(await book(ws, svc, at("12:00"), A.id));
  // Both start in 50 minutes; only the confirmed one is reminded.
  for (const id of [x.order.id, pending.order.id]) await db.update(t.appointments).set({ startsAt: new Date(Date.now() + 50 * 60_000), endsAt: new Date(Date.now() + 90 * 60_000) }).where(eq(t.appointments.orderId, id));
  const runs = await Promise.all([sendDueReminders(ws.id), sendDueReminders(ws.id), sendDueReminders(ws.id)]);
  assert.equal(runs.reduce((a, b) => a + b, 0), 1);
  assert.equal(await sendDueReminders(ws.id), 0);
  const texts = (await db.select().from(t.messages).where(and(eq(t.messages.threadId, x.order.threadId!), eq(t.messages.direction, "out")))).map((m) => m.text);
  assert.equal(texts.filter((m) => m.startsWith("Reminder:")).length, 1);
  assert.match(texts.find((m) => m.startsWith("Reminder:"))!, /Join online: https:\/\/meet\.jit\.si\//);
  assert.equal((await db.select().from(t.messages).where(eq(t.messages.threadId, pending.order.threadId!))).filter((m) => m.text.startsWith("Reminder:")).length, 0);
  assert.equal((await orderRow(x.order.id)).notifications.at(-1)?.kind, "reminder");

  const a = await apptOf(x.order.id);
  const early = await markAttendance({ workspaceId: ws.id, appointmentId: a.id, attendance: "present", userId: owner });
  assert.ok(!early.ok && /hasn't started/.test(early.error));
  await db.update(t.appointments).set({ startsAt: new Date(Date.now() - 3600_000), endsAt: new Date(Date.now() - 1200_000) }).where(eq(t.appointments.id, a.id));
  assert.ok((await markAttendance({ workspaceId: ws.id, appointmentId: a.id, attendance: "late", userId: owner })).ok);
  assert.equal((await orderRow(x.order.id)).status, "completed");
  assert.ok((await markAttendance({ workspaceId: ws.id, appointmentId: a.id, attendance: "no_show", userId: owner })).ok, "can be corrected");
  assert.equal((await apptOf(x.order.id)).attendance, "no_show");
  const logged = await db.select().from(t.events).where(and(eq(t.events.workspaceId, ws.id), eq(t.events.type, "appointment.attended")));
  assert.equal(logged.length, 2);
  const p = await apptOf(pending.order.id);
  assert.ok(!(await markAttendance({ workspaceId: ws.id, appointmentId: p.id, attendance: "present", userId: owner })).ok, "pending: confirm first");
});

test("online bookings get a meeting room, in-person ones the address; the customer's messages say booking", async () => {
  const { ws, svc, A, owner } = await setup();
  const room = await service(ws, { minutes: 30, inPerson: true, title: "Haircut" });
  const online = booked(await book(ws, svc, at("10:00"), A.id));
  const inPerson = booked(await book(ws, room, at("14:00"), A.id));
  assert.match(online.facts.meetLink ?? "", /^https:\/\/meet\.jit\.si\/[A-Za-z0-9]{12}$/);
  assert.equal(inPerson.facts.meetLink, null);
  assert.equal(inPerson.facts.inPerson, true);
  const conf = await confirm(ws, online.order.id, owner);
  assert.ok(conf.ok);
  const [f1] = await bookingFacts(db, [online.order.id]);
  const [f2] = await bookingFacts(db, [inPerson.order.id]);
  assert.match(bookingMessage(ws, "confirmed", conf.order, f1), /Your booking APT-.* is confirmed ✅\nTutoring with Aina\n.*\nJoin online: https:\/\/meet\.jit\.si\//);
  assert.match(bookingMessage(ws, "confirmed", inPerson.order, f2), /Where: 12 Jalan Test, KL/);
  assert.match(bookingMessage(ws, "rejected", inPerson.order, f2), /can't accept your booking/);
  assert.match(reminderMessage(ws, inPerson.order, f2), /^Reminder: your booking/);
});

test("the assistant's tools: find_times lists and checks times, book_appointment books at the catalog price, change_appointment cancels", async () => {
  const { ws, A } = await setup();
  await db.update(t.users).set({ name: "Aina Sofea" }).where(eq(t.users.id, A.id));
  const { thread, customer } = await chat(ws);
  const ctx: ToolContext = { ws, catalog: (await knowledge(ws)).catalog, threadId: thread.id, customerId: customer.id, customerName: "Mei", channel: "simulator", escalations: [], orders: [] };
  const list = await runTool(ctx, "find_times", { service: "tutoring", date: DAY() }, "free times?");
  const times = (list.output as { freeTimes: { time: string }[] }).freeTimes;
  assert.equal(times[0].time, "09:00");
  const booked1 = await runTool(ctx, "book_appointment", { service: "tutoring", staff: "aina", date: DAY(), time: "10am" }, "book 10am with aina");
  const out = booked1.output as { ok: boolean; refCode: string; price: string; with: string; time: string };
  assert.ok(out.ok, JSON.stringify(booked1.output));
  assert.equal(out.price, "RM 50");
  assert.equal(out.with, "Aina Sofea");
  assert.equal(out.time, "10:00");
  const clash = await runTool(ctx, "find_times", { service: "tutoring", staff: "Aina", date: DAY(), time: "10:30" }, "10:30?");
  assert.equal((clash.output as { delay: { minutes: number } }).delay.minutes, 10);
  const nobody = await runTool(ctx, "find_times", { service: "tutoring", staff: "Zed", date: DAY() }, "with Zed?");
  assert.match((nobody.output as { problem: string }).problem, /Nobody called “Zed”/);
  const cancel = await runTool(ctx, "change_appointment", { action: "cancel" }, "cancel please");
  assert.ok((cancel.output as { cancelled: boolean }).cancelled);
  assert.equal((await db.select().from(t.orders).where(eq(t.orders.refCode, out.refCode)))[0].status, "cancelled");
});
