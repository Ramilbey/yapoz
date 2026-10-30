// Setup for how a new business sells, checked against a real database:
// - imported services are in person or online from the business type; a counted option keeps its count
// - a new workspace has the owner's staff row, switched off; old setup steps move up one for "How you sell", once
// - the Go live checks see services nobody takes, missing hours and a missing address
// - once the owner is switched on, the assistant's find_times offers real times
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db, t, sql as pg } from "../src/db";
import { createWorkspace, ensureOnboarding, onboardingOf } from "../src/lib/workspace";
import { Draft } from "../src/setup/types";
import { importDraft } from "../src/setup/import";
import { setupChecks, setupSelling } from "../src/setup/checks";
import { guessInPerson } from "../src/lib/schedule";
import { addLocalDays, localDate } from "../src/lib/time";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";

const TZ = "Asia/Kuala_Lumpur";
const workspaces: string[] = [];
const rand = () => Math.random().toString(36).slice(2, 8);

after(async () => {
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await pg.end();
});

async function fresh(name = `Setup ${rand()}`) {
  const w = await createWorkspace({ name, timezone: TZ, owner: { name: "Owner", email: `${rand()}@example.com`, passwordHash: "x" } });
  workspaces.push(w.workspaceId);
  return w;
}
const load = async (id: string) => (await db.select().from(t.workspaces).where(eq(t.workspaces.id, id)))[0];
const day: [string, string][] = [["09:00", "18:00"]];
const HOURS = { weekly: { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day }, lastOrdersMinutesBeforeClose: 0, notes: "" };

test("where services happen, guessed from the business type", () => {
  for (const b of ["hair salon", "Day spa", "dental clinic", "barber", "yoga studio", "gym", "nail bar"]) assert.equal(guessInPerson(b), true, b);
  for (const b of ["tutoring", "business coaching", "consulting", "online therapy", "guitar lessons"]) assert.equal(guessInPerson(b), false, b);
  assert.equal(guessInPerson(""), true, "unknown: in person, so nobody gets a stray meeting link");
});

test("a hair salon's imported services are in person; a tutor's are online", async () => {
  const salon = await fresh();
  await importDraft(salon.workspaceId, Draft.parse({ businessType: "hair salon", hours: HOURS, items: [{ kind: "service", name: "Haircut", options: [{ label: null, price: 45 }], durationMinutes: 45 }] }), { replace: true });
  const tutor = await fresh();
  await importDraft(tutor.workspaceId, Draft.parse({ businessType: "tutoring", items: [{ kind: "service", name: "Maths lesson", options: [{ label: null, price: 80 }] }] }), { replace: true });
  const svc = async (id: string) => (await db.select().from(t.kbItems).where(and(eq(t.kbItems.workspaceId, id), eq(t.kbItems.kind, "service"))))[0];
  assert.equal((await svc(salon.workspaceId)).inPerson, true);
  assert.equal((await svc(tutor.workspaceId)).inPerson, false);
});

test("a restaurant's option with a stock count gets counted (tracked) even though the business makes to order", async () => {
  const w = await fresh();
  await importDraft(w.workspaceId, Draft.parse({ businessType: "restaurant", items: [{ kind: "product", name: "Nasi lemak", options: [{ label: null, price: 12 }] }, { kind: "product", name: "Logo T-shirt", options: [{ label: "M", price: 40, stock: 12 }, { label: "L", price: 40 }] }] }), { replace: true });
  const items = await db.select().from(t.kbItems).where(eq(t.kbItems.workspaceId, w.workspaceId));
  assert.equal(items.find((i) => i.title === "Logo T-shirt")?.stockMode, "tracked");
  assert.equal(items.find((i) => i.title === "Nasi lemak")?.stockMode, null, "the rest follow the business default");
  const shop = await fresh();
  await importDraft(shop.workspaceId, Draft.parse({ businessType: "phone shop", items: [{ kind: "product", name: "Case", options: [{ label: null, price: 20, stock: 5 }] }] }), { replace: true });
  assert.equal((await db.select().from(t.kbItems).where(eq(t.kbItems.workspaceId, shop.workspaceId)))[0].stockMode, null, "already tracked by default: no override");
});

test("a new workspace has the owner's staff row, switched off, and the new step numbering", async () => {
  const w = await fresh();
  const rows = await db.select().from(t.staff).where(eq(t.staff.workspaceId, w.workspaceId));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].userId, w.user.id);
  assert.equal(rows[0].takesAppointments, false);
  assert.deepEqual((await load(w.workspaceId)).settings.onboarding, { step: 1, completedAt: null, version: 2 });
});

test("an unfinished workspace from before 'How you sell' moves from Channels (old 4) to Channels (new 5), exactly once", async () => {
  const w = await fresh();
  const ws = await load(w.workspaceId);
  await db.update(t.workspaces).set({ settings: { ...ws.settings, onboarding: { step: 4, completedAt: null } } }).where(eq(t.workspaces.id, w.workspaceId));
  const first = await ensureOnboarding(await load(w.workspaceId));
  assert.equal(first.settings.onboarding.step, 5);
  const again = await ensureOnboarding(await load(w.workspaceId));
  assert.equal(again.settings.onboarding.step, 5, "saved with version 2, so no second bump");
  assert.equal((await load(w.workspaceId)).settings.onboarding.version, 2);
  assert.equal(onboardingOf({ onboarding: { step: 3, completedAt: null } }).step, 3, "before the new step: unchanged");
  const done = { step: 6, completedAt: "2026-10-01T00:00:00.000Z" };
  assert.equal(onboardingOf({ onboarding: done }), done, "finished workspaces are untouched");
});

test("the setup checks report services with nobody taking them, no hours and no address", async () => {
  const w = await fresh();
  await importDraft(w.workspaceId, Draft.parse({ businessType: "hair salon", items: [{ kind: "service", name: "Haircut", options: [{ label: null, price: 45 }] }] }), { replace: true });
  const c = setupChecks(await setupSelling(await load(w.workspaceId), w.user.id));
  assert.equal(c.services, 1);
  assert.equal(c.inPersonServices, 1);
  assert.equal(c.bookers, 0);
  assert.equal(c.hasHours, false);
  assert.equal(c.hasAddress, false);
  assert.equal(c.paymentsOn, false);
  assert.equal(c.firstService, "Haircut");
});

test("after Bookings switches the owner on, find_times offers times for an imported service", async () => {
  const w = await fresh();
  await importDraft(w.workspaceId, Draft.parse({ businessType: "hair salon", hours: HOURS, items: [{ kind: "service", name: "Haircut", options: [{ label: null, price: 45 }], durationMinutes: 45 }] }), { replace: true });
  const before = await setupSelling(await load(w.workspaceId), w.user.id);
  assert.equal(before.owner.takesAppointments, false);
  // What PATCH /api/staff/{owner} { takesAppointments: true } does.
  await db.insert(t.staff).values({ userId: w.user.id, workspaceId: w.workspaceId, takesAppointments: true }).onConflictDoUpdate({ target: t.staff.userId, set: { takesAppointments: true, updatedAt: new Date() } });
  const ws = await load(w.workspaceId);
  const s = await setupSelling(ws, w.user.id);
  assert.equal(s.owner.takesAppointments, true);
  assert.equal(setupChecks(s).bookers, 1);

  const [customer] = await db.insert(t.customers).values({ workspaceId: ws.id, channel: "simulator", externalId: `s-${rand()}`, displayName: "Mei" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: ws.id, channel: "simulator", externalThreadId: `s-${rand()}`, customerId: customer.id, lastInboundAt: new Date() }).returning();
  const ctx: ToolContext = { ws, catalog: (await knowledge(ws)).catalog, threadId: thread.id, customerId: customer.id, customerName: "Mei", channel: "simulator", escalations: [], orders: [] };
  const date = addLocalDays(localDate(new Date(), TZ), 3);
  const r = await runTool(ctx, "find_times", { service: "haircut", date }, "free times?");
  const out = r.output as { freeTimes: { time: string }[]; online: boolean };
  assert.ok(out.freeTimes.length > 0, JSON.stringify(r.output));
  assert.equal(out.freeTimes[0].time, "09:00");
  assert.equal(out.online, false, "a salon's haircut is in person");
});
