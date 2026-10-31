// Cross-workspace isolation: workspace A, holding workspace B's record ids, can't read, change or even detect them.
// Route handlers authenticate with a cookie session, so each one is covered two ways: a source audit that every
// session-scoped route filters by the session's workspace, and direct calls to the lib functions those routes delegate to.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { db, t, sql as pg } from "../src/db";
import { createWorkspace } from "../src/lib/workspace";
import { transitionOrder, requestReceipt, loadOrders, type OrderAction } from "../src/lib/orders";
import { retryNotification } from "../src/lib/notify";
import { loadApprovedOrderEvent } from "../src/lib/orbyte";
import { markAttendance, staffViews, calendar } from "../src/lib/appointments";
import { resolveCards } from "../src/lib/receipts";
import { expireDueOrders, lowStockList, dailyBoard } from "../src/lib/stock";
import { exportWorkspace } from "../src/lib/export";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";
import { ingest } from "../src/agent/pipeline";
import { businessDate } from "../src/lib/stock";
import { simulatorWorkspace } from "../src/lib/samples";

const TZ = "Asia/Kuala_Lumpur";
const SECRET = "Zebra Secret Cake";
const workspaces: string[] = [];
type Ws = typeof t.workspaces.$inferSelect;
let A: Ws;
let B: Ws;
let ownerA = "";
let ownerB = "";
const b = {} as { customerId: string; threadId: string; externalThreadId: string; messageId: string; draftId: string; orderId: string; refCode: string; receiptId: string; escalationId: string; itemId: string; variantId: string; gapId: string; apptId: string };

before(async () => {
  const mk = (name: string) => createWorkspace({ name, timezone: TZ, owner: { name: `Owner of ${name}`, email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  const [a, bb] = [await mk("Isolation Alpha"), await mk("Isolation Beta")];
  workspaces.push(a.workspaceId, bb.workspaceId);
  ownerA = a.user.id;
  ownerB = bb.user.id;
  [A] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, a.workspaceId));
  [B] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, bb.workspaceId));

  // Workspace B's data, one of everything the dashboard shows.
  const [item] = await db.insert(t.kbItems).values({ workspaceId: B.id, kind: "product", category: "cakes", slug: "zebra-cake", title: SECRET, body: "Striped" }).returning();
  const [v] = await db.insert(t.kbVariants).values({ workspaceId: B.id, itemId: item.id, size: "Whole", priceMinor: 9900, stock: 3, lowStockAt: 10 }).returning();
  const [customer] = await db.insert(t.customers).values({ workspaceId: B.id, channel: "simulator", externalId: `iso-${Math.random()}`, displayName: "Beta Customer" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: B.id, channel: "simulator", externalThreadId: `iso-${Math.random()}`, customerId: customer.id }).returning();
  const [msg] = await db.insert(t.messages).values({ workspaceId: B.id, threadId: thread.id, direction: "in", author: "customer", text: "beta secret message", status: "received" }).returning();
  const [draft] = await db.insert(t.messages).values({ workspaceId: B.id, threadId: thread.id, direction: "out", author: "ai", text: "beta draft", status: "pending_approval" }).returning();
  const [order] = await db.insert(t.orders).values({ workspaceId: B.id, threadId: thread.id, customerId: customer.id, refCode: `ORD-ISO${Math.random().toString(36).slice(2, 5).toUpperCase()}`, customerName: "Beta Customer", fulfilment: "pickup", totalMinor: 9900, currency: "MYR", channel: "simulator", holdExpiresAt: new Date(Date.now() - 60_000) }).returning();
  await db.insert(t.orderItems).values({ workspaceId: B.id, orderId: order.id, itemId: item.id, variantId: v.id, name: SECRET, quantity: 1, unitPriceMinor: 9900 });
  await db.insert(t.events).values({ workspaceId: B.id, type: "order.confirmed", props: { orderId: order.id, by: ownerB } });
  const [receipt] = await db.insert(t.orderReceipts).values({ workspaceId: B.id, orderId: order.id, threadId: thread.id, mime: "image/png", sha256: `iso-${Math.random()}`, bytes: Buffer.from("x"), verdict: "consistent" }).returning();
  const [esc] = await db.insert(t.escalations).values({ workspaceId: B.id, threadId: thread.id, reason: "beta reason", category: "other", summary: "beta escalation", status: "open" }).returning();
  const [gap] = await db.insert(t.knowledgeGaps).values({ workspaceId: B.id, key: "beta gap", question: "beta question?" }).returning();
  const [apptOrder] = await db.insert(t.orders).values({ workspaceId: B.id, kind: "appointment", refCode: `APT-ISO${Math.random().toString(36).slice(2, 5).toUpperCase()}`, customerName: "Beta Customer", fulfilment: "pickup", status: "confirmed", totalMinor: 5000, currency: "MYR" }).returning();
  const starts = new Date(Date.now() - 3 * 3600_000);
  const [appt] = await db.insert(t.appointments).values({ workspaceId: B.id, orderId: apptOrder.id, staffId: ownerB, startsAt: starts, endsAt: new Date(starts.getTime() + 3600_000) }).returning();
  Object.assign(b, { customerId: customer.id, threadId: thread.id, externalThreadId: thread.externalThreadId, messageId: msg.id, draftId: draft.id, orderId: order.id, refCode: order.refCode, receiptId: receipt.id, escalationId: esc.id, itemId: item.id, variantId: v.id, gapId: gap.id, apptId: appt.id });
});
after(async () => {
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await pg.end();
});

const orderRow = async () => (await db.select().from(t.orders).where(eq(t.orders.id, b.orderId)))[0];

// ───────────────────────────── every route is scoped

const API = join(process.cwd(), "src/app/api");
const routes = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? routes(p) : n === "route.ts" ? [p] : []; });
// Routes with no workspace session on purpose: public (health, login, signup, invites by token, QR, webhooks keyed by channel secrets), or about the
// signed-in user rather than a workspace's records.
const NOT_SESSION_SCOPED = /\/api\/(health|auth\/|webhooks\/|invites\/|qr|demo\/|jobs\/sweep|account|stream|simulator\/)/;

test("every API route that uses a session filters its data by the session's workspace (and none takes a workspace id from the request)", () => {
  const files = routes(API);
  assert.ok(files.length > 40, "found the routes");
  const unscoped: string[] = [];
  const trusting: string[] = [];
  for (const f of files) {
    const rel = f.slice(f.indexOf("/api/"));
    const src = readFileSync(f, "utf8");
    if (NOT_SESSION_SCOPED.test(rel)) continue;
    if (!/apiSession\(|pageSession\(|requireSession\(|sessionOrNull\(/.test(src)) { unscoped.push(`${rel}: no session check`); continue; }
    if (!/\bs\.workspaceId|session\.workspaceId|\.workspaceId\b/.test(src)) unscoped.push(`${rel}: never uses the session's workspaceId`);
    if (/searchParams\.get\(["'](workspace|workspaceId|ws)["']\)|\bbody\.workspaceId\b|\bb\.workspaceId\b|params\.workspaceId/.test(src)) trusting.push(rel);
  }
  assert.deepEqual(unscoped, [], "routes that don't scope by workspace");
  assert.deepEqual(trusting, [], "routes that read a workspace id from the request");
});

test("every route that loads a record by id from the URL also filters it by workspace (directly or through a lib function that does)", () => {
  const byId = routes(API).filter((f) => /\[[a-zA-Z]+\]/.test(f) && !NOT_SESSION_SCOPED.test(f.slice(f.indexOf("/api/"))));
  const bad: string[] = [];
  for (const f of byId) {
    const src = readFileSync(f, "utf8");
    // Every select/update/delete keyed on a bare id needs a workspace filter in the same statement, unless it follows a scoped load of its parent.
    for (const m of src.matchAll(/\.(from|update|delete)\((t\.\w+)\)[^;]*?\.where\(([^;]*?)\);/gs)) {
      const clause = m[3];
      if (/params|\bid\b/.test(clause) && /eq\(t\.\w+\.id, id\)/.test(clause) && !/workspaceId/.test(clause)) bad.push(`${f.slice(f.indexOf("/api/"))}: ${m[2]} by id without workspace`);
    }
  }
  // These act on a row that an earlier statement in the same handler already loaded with a workspace filter.
  const afterScopedLoad = [/inbox\/threads\/\[id\]/, /inbox\/messages\/\[id\]/, /knowledge\/gaps\/\[id\]/, /team\/members\/\[id\]/, /appointments\/\[id\]/];
  const real = bad.filter((x) => !afterScopedLoad.some((r) => r.test(x)));
  assert.deepEqual(real, []);
});

// ───────────────────────────── orders, receipts, notifications

test("orders: A can't confirm, reject, cancel, mark paid, ready or complete B's order; nothing changes", async () => {
  const before = await orderRow();
  for (const action of ["confirm", "reject", "cancel", "paid", "unpaid", "ready", "complete", "keep_reserved"] as OrderAction[]) {
    const r = await transitionOrder({ workspaceId: A.id, orderId: b.orderId, action, userId: ownerA });
    assert.equal(r.ok, false, action);
    assert.equal(!r.ok && r.status, 404, action);
  }
  const after = await orderRow();
  assert.equal(after.status, before.status);
  assert.equal(after.paid, before.paid);
  assert.equal(after.confirmedAt, before.confirmedAt);
});

test("orders: A can't ask B's customer for another receipt, retry B's notifications or read B's approved-order event", async () => {
  const r = await requestReceipt({ workspaceId: A.id, orderId: b.orderId, userId: ownerA, reason: "nope", kind: "replace" });
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.status, 404);
  assert.equal((await orderRow()).receiptRequest, null);
  const n = await retryNotification(A.id, b.orderId, ownerA);
  assert.ok("error" in n && "code" in n && n.code === 404);
  assert.equal(await loadApprovedOrderEvent(A.id, b.orderId), null, "B's order has a recorded approval, but A gets nothing");
});

test("orders: A's Orders page and B's are disjoint", async () => {
  const mine = await loadOrders(A.id);
  assert.ok(!mine.some((o) => o.id === b.orderId || o.workspaceId === B.id));
  assert.ok(!JSON.stringify(mine).includes(b.refCode));
  assert.ok((await loadOrders(B.id)).some((o) => o.id === b.orderId), "control: B sees its own order");
});

test("receipts: only the owning workspace's query finds a receipt (what the receipt route filters on)", async () => {
  const rows = (ws: string) => db.select({ id: t.orderReceipts.id }).from(t.orderReceipts).where(and(eq(t.orderReceipts.id, b.receiptId), eq(t.orderReceipts.orderId, b.orderId), eq(t.orderReceipts.workspaceId, ws)));
  assert.equal((await rows(A.id)).length, 0);
  assert.equal((await rows(B.id)).length, 1);
});

test("the payment-timer sweep for A doesn't expire B's overdue order", async () => {
  await expireDueOrders(A.id);
  assert.equal((await orderRow()).status, "pending");
});

// ───────────────────────────── Needs you, inbox, activity

test("escalations: A resolving B's card changes nothing", async () => {
  assert.equal(await resolveCards(A.id, { id: b.escalationId }, ownerA), 0);
  const [e] = await db.select().from(t.escalations).where(eq(t.escalations.id, b.escalationId));
  assert.equal(e.status, "open");
  assert.equal(e.resolvedBy, null);
});

test("inbox: A sending a message on B's thread (even by B's external thread id) starts A's own thread and leaves B's untouched", async () => {
  const countB = async () => (await db.select().from(t.messages).where(eq(t.messages.threadId, b.threadId))).length;
  const before = await countB();
  const r = await ingest({ workspaceId: A.id, channel: "simulator", externalThreadId: b.externalThreadId, customer: { externalId: "iso-a" }, text: "hello from A", attachments: [], receivedAt: new Date() });
  assert.equal(r.thread.workspaceId, A.id);
  assert.notEqual(r.thread.id, b.threadId);
  assert.equal(await countB(), before);
  const [msg] = await db.select().from(t.messages).where(eq(t.messages.id, r.messageId));
  assert.equal(msg.workspaceId, A.id);
});

test("inbox: the thread, draft and customer queries the inbox routes use find nothing for A", async () => {
  const thread = await db.select().from(t.threads).where(and(eq(t.threads.id, b.threadId), eq(t.threads.workspaceId, A.id)));
  const draft = await db.select().from(t.messages).where(and(eq(t.messages.id, b.draftId), eq(t.messages.workspaceId, A.id)));
  const msg = await db.select().from(t.messages).where(and(eq(t.messages.id, b.messageId), eq(t.messages.workspaceId, A.id)));
  assert.equal(thread.length + draft.length + msg.length, 0);
  const customers = await db.select().from(t.customers).where(eq(t.customers.workspaceId, A.id));
  assert.ok(!customers.some((c) => c.id === b.customerId));
  const events = await db.select().from(t.events).where(eq(t.events.workspaceId, A.id));
  assert.ok(!events.some((e) => JSON.stringify(e.props).includes(b.orderId)), "A's activity feed never mentions B's order");
});

// ───────────────────────────── knowledge and stock

test("knowledge: A's catalog and the prompt's KNOWLEDGE block never contain B's products", async () => {
  const kb = await knowledge(A);
  assert.ok(!kb.catalog.items.some((i) => i.id === b.itemId) && !kb.catalog.all.some((i) => i.id === b.itemId));
  assert.ok(!kb.block.includes(SECRET));
  assert.ok((await knowledge(B)).block.includes(SECRET), "control: B's own block has it");
});

test("knowledge: the item, variant and gap rows are invisible to A's workspace-filtered queries", async () => {
  assert.equal((await db.select().from(t.kbItems).where(and(eq(t.kbItems.id, b.itemId), eq(t.kbItems.workspaceId, A.id)))).length, 0);
  assert.equal((await db.select().from(t.kbVariants).where(and(eq(t.kbVariants.id, b.variantId), eq(t.kbVariants.workspaceId, A.id)))).length, 0);
  assert.equal((await db.select().from(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.id, b.gapId), eq(t.knowledgeGaps.workspaceId, A.id)))).length, 0);
});

test("stock: A's low-stock list and daily board don't include B's variants", async () => {
  assert.ok(!(await lowStockList(A)).some((x) => x.variantId === b.variantId));
  const board = await dailyBoard(A, businessDate(A));
  assert.ok(!JSON.stringify(board).includes(b.variantId));
});

test("the assistant for A can't find, price or order B's product", async () => {
  const kb = await knowledge(A);
  const [customer] = await db.insert(t.customers).values({ workspaceId: A.id, channel: "simulator", externalId: `iso-${Math.random()}`, displayName: "Alpha Customer" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: A.id, channel: "simulator", externalThreadId: `iso-${Math.random()}`, customerId: customer.id }).returning();
  const ctx: ToolContext = { ws: A, catalog: kb.catalog, threadId: thread.id, customerId: customer.id, customerName: "Alpha Customer", channel: "simulator", escalations: [] };
  const found = await runTool(ctx, "search_catalog", { query: "zebra" }, "");
  assert.ok(!JSON.stringify(found.output).includes(SECRET));
  const order = await runTool(ctx, "create_order", { items: [{ product: SECRET, quantity: 1 }], fulfilment: "pickup", customer_name: "Alpha Customer" }, "");
  assert.equal(order.ok, false);
  assert.equal((await db.select().from(t.orders).where(eq(t.orders.threadId, thread.id))).length, 0);
  const [v] = await db.select().from(t.kbVariants).where(eq(t.kbVariants.id, b.variantId));
  assert.equal(v.stock, 3, "B's stock untouched");
});

// ───────────────────────────── appointments, team, export

test("appointments: A can't mark B's booking attended; A's calendar and team lists omit B's", async () => {
  const r = await markAttendance({ workspaceId: A.id, appointmentId: b.apptId, attendance: "present", userId: ownerA });
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.status, 404);
  const [a] = await db.select().from(t.appointments).where(eq(t.appointments.id, b.apptId));
  assert.equal(a.attendance, null);
  const today = businessDate(A);
  const cal = await calendar(A, "2000-01-01", "2100-01-01");
  assert.ok(!cal.some((x) => x.id === b.apptId), today);
  const staff = await staffViews(A.id);
  assert.ok(staff.every((s) => s.userId !== ownerB));
  assert.ok(staff.some((s) => s.userId === ownerA));
});

test("export: A's data export contains none of B's records", async () => {
  const dump = JSON.stringify(await exportWorkspace(A.id));
  for (const needle of [b.customerId, b.threadId, b.orderId, b.refCode, "beta secret message", "Beta Customer", SECRET, "beta escalation"]) assert.ok(!dump.includes(needle), needle);
  assert.ok(JSON.stringify(await exportWorkspace(B.id)).includes(b.orderId), "control: B's export has its order");
});

test("simulator: a visitor or another business asking for B by id is refused; only sample businesses are reachable", async () => {
  assert.equal(await simulatorWorkspace(B.id, null), null, "signed out");
  assert.equal(await simulatorWorkspace(B.id, A.id), null, "signed in as A");
  assert.equal(await simulatorWorkspace(A.id, A.id), A.id, "control: your own business");
});
