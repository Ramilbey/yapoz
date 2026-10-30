// Stock modes, holds and expiry, checked against a real database:
// - availability per mode (made to order, daily, tracked), always base minus active holds
// - daily stock resets by date, per-day overrides, pre-orders held on the wanted day, the window and closed days
// - two customers after the last one: exactly one hold
// - a passing receipt firms the hold, a failing one goes to staff while the clock runs, staff can restart or keep it
// - expiry: status, stock back and exactly one customer message, however many sweeps run at once
// - confirm consumes, reject/cancel release, "at most N" comes from the database, low stock makes one card
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { and, eq, sql } from "drizzle-orm";
import { db, t, sql as pg } from "../src/db";
import type { PayAccount, ReceiptCheck, ReceiptReading, StockMode } from "../src/db/schema";
import { createWorkspace } from "../src/lib/workspace";
import { placeOrder, transitionOrder, requestReceipt, loadOrders, StockProblem } from "../src/lib/orders";
import { receiptFirms, receiptIntake, setReceiptReader, type Reader } from "../src/lib/receipts";
import { availability, availKey, businessDate, checkLowStock, dailyBoard, expireDueOrders, expiryMessage } from "../src/lib/stock";
import { addLocalDays } from "../src/lib/time";
import { ingest } from "../src/agent/pipeline";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";

const TZ = "Asia/Kuala_Lumpur";
const ACCOUNTS: PayAccount[] = [{ id: "a", type: "bank_transfer", provider: "Sample Bank", accountName: "Stock Bakes", accountNumber: "5555 6666 7777" }];
const STOCK = { defaultMode: "tracked" as StockMode, dayStartsAt: "00:00", holdMinutes: 20, preorderDays: 7, lowStockDefault: 5 };
const workspaces: string[] = [];
let ws: typeof t.workspaces.$inferSelect;
let off: typeof t.workspaces.$inferSelect;
let OWNER = "";
let today = "";

before(async () => {
  const mk = (name: string) => createWorkspace({ name, timezone: TZ, owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  const a = await mk("Stock Bakes");
  const b = await mk("Pay Later Shop");
  workspaces.push(a.workspaceId, b.workspaceId);
  OWNER = a.user.id;
  for (const [id, payments] of [[a.workspaceId, { enabled: true, requireReceipt: true, accounts: ACCOUNTS }], [b.workspaceId, undefined]] as const) {
    const [row] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, id));
    await db.update(t.workspaces).set({ currency: "MYR", settings: { ...row.settings, live: true, stock: STOCK, ...(payments ? { payments } : {}) } }).where(eq(t.workspaces.id, id));
  }
  [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, a.workspaceId));
  [off] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, b.workspaceId));
  today = businessDate(ws);
  // Open every day, except a holiday three days from now.
  const day: [string, string][] = [["08:00", "20:00"]];
  await db.insert(t.kbItems).values({
    workspaceId: ws.id, kind: "hours", category: "hours", slug: "hours", title: "Opening hours",
    data: { weekly: { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day }, lastOrdersMinutesBeforeClose: 0, exceptions: [{ date: addLocalDays(today, 3), hours: [], note: "Holiday" }] },
  });
});
after(async () => {
  setReceiptReader(null);
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await pg.end();
});

let n = 0;
/** A fresh product with one option, so tests don't share stock. */
async function product(mode: StockMode, v: { stock?: number | null; dailyQty?: number | null; lowStockAt?: number | null } = {}, w = ws) {
  const tag = `${mode}${++n}x${Math.random().toString(36).slice(2, 6)}`;
  const [item] = await db.insert(t.kbItems).values({ workspaceId: w.id, kind: "product", category: "test", slug: tag, title: `Item ${tag}`, stockMode: mode }).returning();
  const [variant] = await db.insert(t.kbVariants).values({ workspaceId: w.id, itemId: item.id, priceMinor: 1000, stock: v.stock ?? null, dailyQty: v.dailyQty ?? null, lowStockAt: v.lowStockAt ?? null }).returning();
  return { item, variant };
}
async function chat(w = ws) {
  const [customer] = await db.insert(t.customers).values({ workspaceId: w.id, channel: "simulator", externalId: `s-${Math.random()}`, displayName: "Mei" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: w.id, channel: "simulator", externalThreadId: `s-${Math.random()}`, customerId: customer.id, lastInboundAt: new Date() }).returning();
  return { thread, customer };
}
async function place(p: Awaited<ReturnType<typeof product>>, qty: number, o: { date?: string; w?: typeof ws } = {}) {
  const w = o.w ?? ws;
  const { thread, customer } = await chat(w);
  const r = await placeOrder(w, { lines: [{ itemId: p.item.id, variantId: p.variant.id, name: p.item.title, quantity: qty, unitPriceMinor: 1000, note: null }], customerName: "Mei", fulfilment: "pickup", wantedDate: o.date ?? null, threadId: thread.id, customerId: customer.id, channel: "simulator" });
  return { ...r, thread, customer };
}
const left = async (variantId: string, date = today, w = ws) => (await availability(db, w, [{ variantId, date }])).get(availKey(variantId, date))!.left;
const holdsOf = (orderId: string) => db.select().from(t.stockHolds).where(eq(t.stockHolds.orderId, orderId));
const orderRow = async (id: string) => (await db.select().from(t.orders).where(eq(t.orders.id, id)))[0];
const stockOf = async (variantId: string) => (await db.select().from(t.kbVariants).where(eq(t.kbVariants.id, variantId)))[0].stock;
const addReceipt = (orderId: string) => db.insert(t.orderReceipts).values({ workspaceId: ws.id, orderId, mime: "image/png", sha256: `s-${Math.random()}`, bytes: Buffer.from("x"), verdict: "consistent" });
/** The payment window ran out (as if 20 minutes passed), without anything having run since. */
const lapse = async (orderId: string) => {
  await db.update(t.orders).set({ holdExpiresAt: sql`now() - interval '1 minute'` }).where(eq(t.orders.id, orderId));
  await db.update(t.stockHolds).set({ expiresAt: sql`now() - interval '1 minute'` }).where(and(eq(t.stockHolds.orderId, orderId), eq(t.stockHolds.status, "held")));
};
async function tools(w = ws) {
  const { thread, customer } = await chat(w);
  const c: ToolContext = { ws: w, catalog: (await knowledge(w)).catalog, threadId: thread.id, customerId: customer.id, customerName: "Mei", channel: "simulator", escalations: [], orders: [] };
  return c;
}
type OrderOut = { ok: boolean; problems?: string[]; refCode?: string; heldForMinutes?: number; instruction?: string };

const reads = (reading: Partial<ReceiptReading>): Reader => async () => ({
  model: "test",
  reading: { looksLikeReceipt: true, amount: null, currency: "MYR", paidAt: null, payeeName: "Stock Bakes", payeeAccount: "5555 6666 7777", payerName: null, reference: `S${Math.random()}`, method: null, status: "successful", legibility: "clear", oddities: [], ...reading },
});
const PNG = () => Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.from(`s ${Math.random()}`)]);
const fileMsg = async (thread: typeof t.threads.$inferSelect) => {
  const r = await ingest({ workspaceId: ws.id, channel: "simulator", externalThreadId: thread.externalThreadId, customer: { externalId: "x" }, text: "", attachments: [{ kind: "image", ref: `data:image/png;base64,${PNG().toString("base64")}` }], receivedAt: new Date() });
  return (await db.select().from(t.messages).where(eq(t.messages.id, r.messageId)))[0];
};
const localNow = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 16);

// ───────────────────────────── availability

test("each mode: made to order is on or off, daily counts per day, tracked counts on hand minus holds", async () => {
  const pizza = await product("none");
  assert.equal(await left(pizza.variant.id), null, "made to order: no limit");
  await db.update(t.kbItems).set({ unavailableUntil: addLocalDays(today, 1) }).where(eq(t.kbItems.id, pizza.item.id));
  assert.equal(await left(pizza.variant.id), 0, "sold out today");
  assert.equal(await left(pizza.variant.id, addLocalDays(today, 1)), null, "back on by itself the next business day");
  await db.update(t.kbItems).set({ unavailableUntil: null, available: false }).where(eq(t.kbItems.id, pizza.item.id));
  assert.equal(await left(pizza.variant.id, addLocalDays(today, 5)), 0, "off until the owner turns it on");

  const bun = await product("daily", { dailyQty: 3 });
  assert.equal(await left(bun.variant.id), 3);
  const shirt = await product("tracked", { stock: 4 });
  assert.equal(await left(shirt.variant.id), 4);
  const o = await place(shirt, 1);
  assert.equal(await left(shirt.variant.id), 3, "a pending order holds its stock");
  assert.equal(await stockOf(shirt.variant.id), 4, "nothing comes off the shelf until confirm");
  assert.equal((await holdsOf(o.order.id))[0].status, "held");
  assert.ok(o.order.holdExpiresAt && o.order.holdExpiresAt.getTime() > Date.now() + 19 * 60_000, "payments on: a 20-minute window");
  await place(pizza, 2).then(
    () => assert.fail("a switched-off item can't be held"),
    (e) => assert.ok(e instanceof StockProblem),
  );
});

test("daily stock resets by date, takes per-day overrides, and pre-orders are held on the day they're for", async () => {
  const bun = await product("daily", { dailyQty: 3 });
  const tomorrow = addLocalDays(today, 1);
  await place(bun, 2);
  assert.equal(await left(bun.variant.id), 1);
  assert.equal(await left(bun.variant.id, tomorrow), 3, "a new day starts at the usual quantity");
  await db.insert(t.dailyStock).values({ workspaceId: ws.id, variantId: bun.variant.id, date: tomorrow, qty: 5 });
  assert.equal(await left(bun.variant.id, tomorrow), 5, "the owner planned more for tomorrow");
  const pre = await place(bun, 2, { date: tomorrow });
  assert.equal((await holdsOf(pre.order.id))[0].date, tomorrow);
  assert.equal(pre.order.wantedDate, tomorrow);
  assert.equal(await left(bun.variant.id, tomorrow), 3);
  assert.equal(await left(bun.variant.id), 1, "today is untouched");
  const board = await dailyBoard(ws, tomorrow);
  const row = board.find((r) => r.variantId === bun.variant.id)!;
  assert.deepEqual({ usual: row.usualQty, qty: row.qty, held: row.held, left: row.left }, { usual: 3, qty: 5, held: 2, left: 3 });

  // Through the assistant: beyond the pre-order window or on a closed day, nothing is saved.
  const c = await tools();
  const far = await runTool(c, "create_order", { items: [{ product: bun.item.title, quantity: 1 }], fulfilment: "pickup", date: addLocalDays(today, 8) }, "");
  assert.match((far.output as OrderOut).problems!.join(" "), /up to 7 days ahead/);
  const closed = await runTool(c, "create_order", { items: [{ product: bun.item.title, quantity: 1 }], fulfilment: "pickup", date: addLocalDays(today, 3) }, "");
  assert.match((closed.output as OrderOut).problems!.join(" "), /closed on/);
  const ok = await runTool(c, "create_order", { items: [{ product: bun.item.title, quantity: 1 }], fulfilment: "pickup", date: tomorrow }, "");
  assert.equal((ok.output as OrderOut).ok, true);
  assert.equal(await left(bun.variant.id, tomorrow), 2);
});

test("two customers ordering the last one at the same moment: exactly one hold", async () => {
  const shirt = await product("tracked", { stock: 1 });
  const results = await Promise.allSettled([place(shirt, 1), place(shirt, 1), place(shirt, 1)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  for (const r of results) if (r.status === "rejected") assert.ok(r.reason instanceof StockProblem && /sold out/.test(r.reason.message));
  const holds = await db.select().from(t.stockHolds).where(eq(t.stockHolds.variantId, shirt.variant.id));
  assert.equal(holds.length, 1);
  assert.equal(await left(shirt.variant.id), 0);
});

test("'at most N' is the database's number, after holds; the assistant never sees a stock count", async () => {
  const shirt = await product("tracked", { stock: 5 });
  await place(shirt, 3);
  const c = await tools();
  const r = await runTool(c, "create_order", { items: [{ product: shirt.item.title, quantity: 4 }], fulfilment: "pickup" }, "");
  assert.match((r.output as OrderOut).problems![0], /We can do at most 2 of/);
  const check = await runTool(c, "check_variant", { product: shirt.item.title, quantity: 4 }, "");
  const out = check.output as { variants: { inStock: boolean; maxQuantity?: number }[] };
  assert.equal(out.variants[0].inStock, true);
  assert.equal(out.variants[0].maxQuantity, 2);
  assert.ok(!/"stock"|"left"/.test(JSON.stringify(check.output)), "no counts go to the model");
  const plain = await runTool(c, "check_variant", { product: shirt.item.title }, "");
  assert.equal((plain.output as { variants: { maxQuantity?: number }[] }).variants[0].maxQuantity, undefined);
  assert.match(plain.label, /2 left/, "the staff-facing label can say it");
});

// ───────────────────────────── receipts and the payment window

test("which receipts firm the hold: consistent, or a look where only minor things are missing", () => {
  const c = (code: string, level: ReceiptCheck["level"]): ReceiptCheck => ({ code, level, message: code });
  const good = [c("amount", "pass"), c("payee", "pass"), c("date", "pass")];
  assert.equal(receiptFirms("consistent", good), true);
  assert.equal(receiptFirms("review", [...good, c("reference", "warn"), c("legibility", "warn"), c("date_early", "warn")]), true);
  assert.equal(receiptFirms("review", [...good, c("oddities", "warn")]), false, "something looks edited");
  assert.equal(receiptFirms("review", [c("amount", "warn"), c("payee", "pass")]), false, "paid a different amount");
  assert.equal(receiptFirms("review", [c("amount", "pass"), c("payee", "warn")]), false, "payee not shown");
  assert.equal(receiptFirms("review", [...good, c("date", "warn")]), false, "no date could be read");
  assert.equal(receiptFirms("mismatch", [...good, c("duplicate", "fail")]), false);
  assert.equal(receiptFirms("unreadable", []), false);
});

test("a passing receipt firms the hold: the timer stops and the stock stays until staff act", async () => {
  const shirt = await product("tracked", { stock: 3 });
  const o = await place(shirt, 2); // RM 20
  setReceiptReader(reads({ amount: 20, paidAt: localNow() }));
  const r = await receiptIntake(ws, o.thread, await fileMsg(o.thread));
  assert.equal(r?.firmed, true);
  const row = await orderRow(o.order.id);
  assert.equal(row.firmedBy, "receipt");
  assert.equal(row.holdExpiresAt, null);
  const [h] = await holdsOf(o.order.id);
  assert.deepEqual([h.status, h.expiresAt], ["firm", null]);
  assert.equal(await expireDueOrders(ws.id), 0);
  assert.equal(await left(shirt.variant.id), 1);
  const [ev] = await db.select().from(t.events).where(and(eq(t.events.type, "stock.firmed"), sql`${t.events.props}->>'orderId' = ${o.order.id}`));
  assert.ok(ev);
});

test("a failing receipt doesn't firm: staff get a card with the reason and the deadline; asking again restarts the window; Keep reserved firms it", async () => {
  const shirt = await product("tracked", { stock: 3 });
  const o = await place(shirt, 2); // RM 20
  setReceiptReader(reads({ amount: 15, paidAt: localNow() }));
  const r = await receiptIntake(ws, o.thread, await fileMsg(o.thread));
  assert.equal(r?.verdict, "mismatch");
  assert.ok(!r?.firmed);
  const before = await orderRow(o.order.id);
  assert.equal(before.firmedBy, null);
  assert.ok(before.holdExpiresAt);
  const [card] = await db.select().from(t.escalations).where(and(eq(t.escalations.threadId, o.thread.id), eq(t.escalations.category, "receipt_problem")));
  assert.match(card.summary, new RegExp(`Receipt for ${before.refCode}: Paid RM 15, RM 5 short.*expires at \\d{1,2}:\\d{2}(am|pm) unless you act`));

  // Staff ask for another receipt after the window ran out (nothing expired it yet): a fresh 20 minutes, stock taken again.
  await lapse(o.order.id);
  assert.equal(await left(shirt.variant.id), 3, "a lapsed hold stops counting straight away");
  const again = await requestReceipt({ workspaceId: ws.id, orderId: o.order.id, userId: OWNER, reason: "Short by RM 5", kind: "replace" });
  assert.ok(again.ok);
  assert.match(again.ok ? again.message : "", /keep your order for another 20 minutes/);
  const restarted = await orderRow(o.order.id);
  assert.ok(restarted.holdExpiresAt!.getTime() > Date.now() + 19 * 60_000);
  assert.equal(await left(shirt.variant.id), 1);

  const keep = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "keep_reserved", userId: OWNER });
  assert.ok(keep.ok);
  const kept = await orderRow(o.order.id);
  assert.deepEqual([kept.firmedBy, kept.holdExpiresAt], ["staff", null]);
  assert.equal((await holdsOf(o.order.id))[0].status, "firm");
  const twice = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "keep_reserved", userId: OWNER });
  assert.match(!twice.ok ? twice.error : "", /already kept reserved/);
  const [ev] = await db.select().from(t.events).where(and(eq(t.events.type, "order.kept_reserved"), sql`${t.events.props}->>'orderId' = ${o.order.id}`));
  assert.ok(ev);
});

test("the window runs out: expired, stock back, and the customer is told exactly once even when two sweeps race", async () => {
  const bun = await product("daily", { dailyQty: 2 });
  const o = await place(bun, 2);
  assert.equal(await left(bun.variant.id), 0);
  await lapse(o.order.id);
  assert.equal(await left(bun.variant.id), 2, "stock is right before anything has run");

  const counts = await Promise.all([expireDueOrders(ws.id), expireDueOrders(ws.id), expireDueOrders(ws.id)]);
  assert.equal(counts.reduce((a, b) => a + b, 0), 1);
  assert.equal(await expireDueOrders(ws.id), 0);
  const row = await orderRow(o.order.id);
  assert.equal(row.status, "expired");
  assert.ok(row.expiredAt);
  assert.equal((await holdsOf(o.order.id))[0].status, "released");
  const msgs = await db.select().from(t.messages).where(and(eq(t.messages.threadId, o.thread.id), eq(t.messages.direction, "out")));
  assert.deepEqual(msgs.map((m) => m.text), [expiryMessage(row.refCode, 20)]);
  assert.match(msgs[0].text, /^Your order ORD-\w+ expired because we didn't receive payment within 20 minutes\. Just message us to order again\.$/);
  assert.equal(row.notifications.length, 1);
  assert.equal(row.notifications[0].kind, "expired");
  const evs = await db.select().from(t.events).where(and(eq(t.events.type, "order.expired"), sql`${t.events.props}->>'orderId' = ${o.order.id}`));
  assert.equal(evs.length, 1);

  // Staff can't act on it any more; the Orders page explains it.
  const confirm = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER });
  assert.match(!confirm.ok ? confirm.error : "", /expired/);
  const view = (await loadOrders(ws.id)).find((x) => x.id === o.order.id)!;
  assert.match(view.attention.map((a) => a.text).join(" "), /^Expired at .*20 minutes/);

  // The customer pays anyway, with a receipt that passes: the order comes back, stock reserved, for staff to check.
  setReceiptReader(reads({ amount: 20, paidAt: localNow() }));
  const late = await receiptIntake(ws, o.thread, await fileMsg(o.thread));
  assert.match(late?.reply ?? "", /Your order is back with the team/);
  const back = await orderRow(o.order.id);
  assert.deepEqual([back.status, back.firmedBy, back.holdExpiresAt, back.expiredAt], ["pending", "receipt", null, null]);
  assert.equal(await left(bun.variant.id), 0, "its stock is reserved again");
  assert.equal(await expireDueOrders(ws.id), 0, "no timer: it waits for staff");
  const [card] = await db.select().from(t.escalations).where(and(eq(t.escalations.threadId, o.thread.id), eq(t.escalations.category, "receipt_problem")));
  assert.match(card.summary, /back in Pending with its stock reserved: check the payment and confirm it/);
  await addReceipt(o.order.id);
  assert.ok((await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER })).ok);
});

test("a late payment when the stock has gone since: the order stays expired and staff are asked to refund or offer something else", async () => {
  const shirt = await product("tracked", { stock: 1 });
  const o = await place(shirt, 1);
  await lapse(o.order.id);
  await expireDueOrders(ws.id);
  await place(shirt, 1); // someone else bought it meanwhile
  setReceiptReader(reads({ amount: 10, paidAt: localNow() }));
  const late = await receiptIntake(ws, o.thread, await fileMsg(o.thread));
  assert.match(late?.reply ?? "", /had already expired, so I've passed this to the team/);
  assert.equal((await orderRow(o.order.id)).status, "expired");
  const [card] = await db.select().from(t.escalations).where(and(eq(t.escalations.threadId, o.thread.id), eq(t.escalations.category, "receipt_problem")));
  assert.equal(card.priority, "high");
  assert.match(card.summary, /can't be reopened: .*sold out\. Refund the customer, or offer them something else/);
});

test("payments off: the hold never expires", async () => {
  const shirt = await product("tracked", { stock: 2 }, off);
  const o = await place(shirt, 1, { w: off });
  assert.equal(o.order.holdExpiresAt, null);
  assert.equal((await holdsOf(o.order.id))[0].expiresAt, null);
  await db.update(t.orders).set({ createdAt: sql`now() - interval '3 hours'` }).where(eq(t.orders.id, o.order.id));
  assert.equal(await expireDueOrders(off.id), 0);
  assert.equal((await orderRow(o.order.id)).status, "pending");
  assert.equal(await left(shirt.variant.id, today, off), 1);
});

// ───────────────────────────── confirm, reject, cancel

test("confirm consumes the hold, cancel after confirm restocks, reject releases; daily sales count as sold", async () => {
  const shirt = await product("tracked", { stock: 4 });
  const a = await place(shirt, 2);
  await addReceipt(a.order.id);
  assert.ok((await transitionOrder({ workspaceId: ws.id, orderId: a.order.id, action: "confirm", userId: OWNER })).ok);
  assert.equal(await stockOf(shirt.variant.id), 2, "consumed: off the shelf");
  assert.equal((await holdsOf(a.order.id))[0].status, "consumed");
  assert.equal(await left(shirt.variant.id), 2);
  assert.equal((await orderRow(a.order.id)).holdExpiresAt, null);
  assert.ok((await transitionOrder({ workspaceId: ws.id, orderId: a.order.id, action: "cancel", userId: OWNER })).ok);
  assert.equal(await stockOf(shirt.variant.id), 4, "cancelled after confirm: back on the shelf");
  assert.equal((await holdsOf(a.order.id))[0].status, "released");
  await transitionOrder({ workspaceId: ws.id, orderId: a.order.id, action: "cancel", userId: OWNER });
  assert.equal(await stockOf(shirt.variant.id), 4, "a second cancel changes nothing");

  const b = await place(shirt, 3);
  assert.equal(await left(shirt.variant.id), 1);
  assert.ok((await transitionOrder({ workspaceId: ws.id, orderId: b.order.id, action: "reject", userId: OWNER })).ok);
  assert.equal(await left(shirt.variant.id), 4);
  assert.equal(await stockOf(shirt.variant.id), 4);

  const bun = await product("daily", { dailyQty: 5 });
  const c = await place(bun, 2);
  await addReceipt(c.order.id);
  assert.ok((await transitionOrder({ workspaceId: ws.id, orderId: c.order.id, action: "confirm", userId: OWNER })).ok);
  const row = (await dailyBoard(ws, today)).find((r) => r.variantId === bun.variant.id)!;
  assert.deepEqual({ held: row.held, sold: row.sold, left: row.left }, { held: 0, sold: 2, left: 3 });
});

test("confirming an order whose hold lapsed re-checks what's left first", async () => {
  const shirt = await product("tracked", { stock: 1 });
  const a = await place(shirt, 1);
  await lapse(a.order.id);
  const b = await place(shirt, 1);
  await addReceipt(a.order.id);
  const r = await transitionOrder({ workspaceId: ws.id, orderId: a.order.id, action: "confirm", userId: OWNER });
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.error : "", /sold out\. Reject the order or restock it first/);
  assert.equal(await stockOf(shirt.variant.id), 1);
  await addReceipt(b.order.id);
  assert.ok((await transitionOrder({ workspaceId: ws.id, orderId: b.order.id, action: "confirm", userId: OWNER })).ok);
  assert.equal(await stockOf(shirt.variant.id), 0);
});

// ───────────────────────────── low stock

test("dropping below the alert level makes one Needs-you card per option, which closes itself after a restock", async () => {
  const shirt = await product("tracked", { stock: 6, lowStockAt: 5 });
  await place(shirt, 1);
  const cards = () => db.select().from(t.escalations).where(and(eq(t.escalations.workspaceId, ws.id), eq(t.escalations.dedupeKey, `low_stock:${shirt.variant.id}`)));
  assert.equal((await cards()).length, 0, "5 left isn't below 5");
  await Promise.all([place(shirt, 1), place(shirt, 1)]);
  await place(shirt, 1);
  const open = await cards();
  assert.equal(open.length, 1);
  assert.equal(open[0].threadId, null);
  assert.match(open[0].summary, /^Only 2 left of /, "the card shows the latest count");
  const evs = await db.select().from(t.events).where(and(eq(t.events.type, "stock.low"), sql`${t.events.props}->>'variantId' = ${shirt.variant.id}`));
  assert.equal(evs.length, 1);
  await db.update(t.kbVariants).set({ stock: 30 }).where(eq(t.kbVariants.id, shirt.variant.id));
  await checkLowStock(ws.id, [shirt.variant.id]);
  assert.equal((await cards())[0].status, "resolved");
});
