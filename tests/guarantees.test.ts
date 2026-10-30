// The promises the order desk makes, checked against a real database:
// - approval and rejection: only the order's own business can act, a rejected order stops, stock moves exactly once
// - no duplicates: double clicks, two staff at once, retried webhooks and repeated customer messages
// - asking for another receipt: the chat waits for it, it's checked against what was asked, then confirming works again
// - explanations: why an order needs attention, in numbers
// - delivery feedback: "confirmed" and "customer told" are separate, failures are kept and can be retried
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { and, eq, sql } from "drizzle-orm";
import { db, t, sql as pg } from "../src/db";
import type { PayAccount, ReceiptReading } from "../src/db/schema";
import { createWorkspace } from "../src/lib/workspace";
import { placeOrder, transitionOrder, requestReceipt, loadOrders } from "../src/lib/orders";
import { receiptIntake, setReceiptReader, type Reader } from "../src/lib/receipts";
import { notifyCustomer, retryNotification } from "../src/lib/notify";
import { ingest } from "../src/agent/pipeline";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";
import { applyWhatsAppStatuses } from "../src/channels/whatsapp";

const TZ = "Asia/Kuala_Lumpur";
const ACCOUNTS: PayAccount[] = [{ id: "a", type: "bank_transfer", provider: "Sample Bank", accountName: "Guarantee Bakes", accountNumber: "1111 2222 3333" }];
const workspaces: string[] = [];
let ws: typeof t.workspaces.$inferSelect;
let other: typeof t.workspaces.$inferSelect;
let OWNER = "";
let variantId = "";
let itemId = "";

before(async () => {
  const mk = (name: string) => createWorkspace({ name, timezone: TZ, owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  const a = await mk("Guarantee Bakes");
  const b = await mk("Someone Else");
  workspaces.push(a.workspaceId, b.workspaceId);
  OWNER = a.user.id;
  const [row] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, a.workspaceId));
  await db.update(t.workspaces).set({ currency: "MYR", settings: { ...row.settings, live: true, payments: { enabled: true, requireReceipt: true, accounts: ACCOUNTS } } }).where(eq(t.workspaces.id, a.workspaceId));
  [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, a.workspaceId));
  [other] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, b.workspaceId));
  const [item] = await db.insert(t.kbItems).values({ workspaceId: ws.id, kind: "product", category: "cakes", slug: "lemon-cake", title: "Lemon Cake", body: "Whole cake" }).returning();
  itemId = item.id;
  const [v] = await db.insert(t.kbVariants).values({ workspaceId: ws.id, itemId: item.id, size: "Whole", priceMinor: 4000, stock: 5 }).returning();
  variantId = v.id;
});
after(async () => {
  setReceiptReader(null);
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await pg.end();
});

const stock = async () => (await db.select({ s: t.kbVariants.stock }).from(t.kbVariants).where(eq(t.kbVariants.id, variantId)))[0].s;
// Placing an order holds its stock, so each test starts with the holds of earlier orders released.
const setStock = async (n: number) => {
  await db.update(t.stockHolds).set({ status: "released" }).where(eq(t.stockHolds.workspaceId, ws.id));
  await db.update(t.kbVariants).set({ stock: n }).where(eq(t.kbVariants.id, variantId));
};
// The shelf count drops after orders were placed and their holds have lapsed (so confirming re-checks against what's left).
const dropStock = async (n: number) => {
  await db.update(t.stockHolds).set({ expiresAt: new Date(Date.now() - 60_000) }).where(and(eq(t.stockHolds.workspaceId, ws.id), eq(t.stockHolds.status, "held")));
  await db.update(t.kbVariants).set({ stock: n }).where(eq(t.kbVariants.id, variantId));
};

async function chat(channel: "simulator" | "whatsapp" = "simulator") {
  const [customer] = await db.insert(t.customers).values({ workspaceId: ws.id, channel, externalId: `g-${Math.random()}`, displayName: "Mei" }).returning();
  const [thread] = await db
    .insert(t.threads)
    .values({ workspaceId: ws.id, channel, externalThreadId: `g-${Math.random()}`, customerId: customer.id, routing: channel === "whatsapp" ? { waId: "60123456789" } : {}, lastInboundAt: new Date() })
    .returning();
  return { thread, customer };
}
async function order(qty = 2, opts: { receipt?: boolean } = { receipt: true }) {
  const { thread, customer } = await chat();
  const r = await placeOrder(ws, { lines: [{ itemId, variantId, name: "Whole Lemon Cake", quantity: qty, unitPriceMinor: 4000, note: null }], customerName: "Mei", fulfilment: "pickup", threadId: thread.id, customerId: customer.id, channel: "simulator" });
  if (opts.receipt) await db.insert(t.orderReceipts).values({ workspaceId: ws.id, orderId: r.order.id, threadId: thread.id, mime: "image/png", sha256: `g-${Math.random()}`, bytes: Buffer.from("x"), verdict: "consistent" });
  return { ...r, thread, customer };
}
const events = (orderId: string, type: string) => db.select().from(t.events).where(and(eq(t.events.workspaceId, ws.id), eq(t.events.type, type), sql`${t.events.props}->>'orderId' = ${orderId}`));

// ───────────────────────────── approval and rejection

test("another business can't see or act on an order: every action answers 404 and nothing changes", async () => {
  await setStock(5);
  const o = await order();
  for (const action of ["confirm", "reject", "cancel", "paid", "ready"] as const) {
    const r = await transitionOrder({ workspaceId: other.id, orderId: o.order.id, action, userId: OWNER });
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.status, 404, action);
  }
  assert.equal(await stock(), 5);
  const [row] = await db.select().from(t.orders).where(eq(t.orders.id, o.order.id));
  assert.equal(row.status, "pending");
});

test("rejecting a pending order stops it: no stock moves, the customer is told 'rejected', and it can't be confirmed afterwards", async () => {
  await setStock(5);
  const o = await order();
  const r = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "reject", userId: OWNER, reason: "Sold out of lemons" });
  assert.ok(r.ok);
  assert.equal(r.ok && r.notify, "rejected");
  assert.equal(r.ok && r.order.status, "cancelled");
  assert.equal(await stock(), 5, "nothing was taken, so nothing comes back");
  assert.equal((await events(o.order.id, "order.rejected")).length, 1);
  const again = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER });
  assert.equal(again.ok, false);
  assert.match(!again.ok ? again.error : "", /rejected or cancelled/);
  const reject = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "reject", userId: OWNER });
  assert.match(!reject.ok ? reject.error : "", /already rejected/);
});

test("confirm takes stock once; cancelling a confirmed order puts it back once; reject is refused once confirmed", async () => {
  await setStock(5);
  const o = await order(2);
  assert.ok((await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER })).ok);
  assert.equal(await stock(), 3);
  const reject = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "reject", userId: OWNER });
  assert.match(!reject.ok ? reject.error : "", /cancel it instead/);
  const c = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "cancel", userId: OWNER });
  assert.equal(c.ok && c.notify, "cancelled");
  assert.equal(await stock(), 5);
  await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "cancel", userId: OWNER });
  assert.equal(await stock(), 5, "a second cancel doesn't add stock again");
});

test("confirming more than is in stock is refused and leaves stock alone", async () => {
  await setStock(5);
  const o = await order(2);
  await dropStock(1);
  const r = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER });
  assert.match(!r.ok ? r.error : "", /We can do at most 1 of Whole Lemon Cake/);
  assert.equal(await stock(), 1);
});

// ───────────────────────────── duplicates

test("double-clicking Confirm (two requests at once) confirms once, deducts stock once, and the second says who already did it", async () => {
  await setStock(5);
  const o = await order(2);
  const rs = await Promise.all([1, 2, 3].map(() => transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER })));
  assert.equal(rs.filter((r) => r.ok).length, 1);
  assert.equal(await stock(), 3);
  assert.equal((await events(o.order.id, "order.confirmed")).length, 1);
  for (const r of rs.filter((x) => !x.ok)) assert.match(!r.ok ? r.error : "", /already confirmed \(by Owner\)/);
});

test("two cancels at once return stock once", async () => {
  await setStock(5);
  const o = await order(2);
  await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER });
  const rs = await Promise.all([1, 2].map(() => transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "cancel", userId: OWNER })));
  assert.equal(rs.filter((r) => r.ok).length, 1);
  assert.equal(await stock(), 5);
});

test("the same order placed twice at once from one chat (two quick messages) is saved once", async () => {
  const { thread, customer } = await chat();
  const input = { lines: [{ itemId, variantId, name: "Whole Lemon Cake", quantity: 1, unitPriceMinor: 4000, note: null }], customerName: "Mei", fulfilment: "pickup" as const, threadId: thread.id, customerId: customer.id };
  const [a, b] = await Promise.all([placeOrder(ws, input), placeOrder(ws, input)]);
  assert.equal(a.order.id, b.order.id);
  assert.deepEqual([a.duplicate, b.duplicate].sort(), [false, true]);
  const rows = await db.select().from(t.orders).where(eq(t.orders.threadId, thread.id));
  assert.equal(rows.length, 1);
});

test("a webhook delivered twice at the same moment saves the customer's message once, and only one copy is answered", async () => {
  const e = { workspaceId: ws.id, channel: "whatsapp" as const, externalThreadId: `wa:dup-${Math.random()}`, customer: { externalId: "601" }, text: "hi", attachments: [], receivedAt: new Date(), externalMessageId: `wamid.${Math.random()}` };
  const rs = await Promise.all([ingest(e), ingest(e), ingest(e)]);
  assert.equal(rs.filter((r) => !r.duplicate).length, 1, "exactly one caller goes on to answer it");
  assert.equal(new Set(rs.map((r) => r.messageId)).size, 1);
  const msgs = await db.select().from(t.messages).where(and(eq(t.messages.threadId, rs[0].thread.id), eq(t.messages.direction, "in")));
  assert.equal(msgs.length, 1);
});

// ───────────────────────────── asking for another receipt

const reads = (reading: Partial<ReceiptReading>): Reader => async () => ({
  model: "test",
  reading: { looksLikeReceipt: true, amount: null, currency: "MYR", paidAt: null, payeeName: "Guarantee Bakes", payeeAccount: "1111 2222 3333", payerName: null, reference: `T${Math.random()}`, method: null, status: "successful", legibility: "clear", oddities: [], ...reading },
});
const PNG = (n: string) => Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.from(`g ${n} ${Math.random()}`)]);
const fileMsg = async (thread: typeof t.threads.$inferSelect, n: string) => {
  const r = await ingest({ workspaceId: ws.id, channel: "simulator", externalThreadId: thread.externalThreadId, customer: { externalId: "x" }, text: "", attachments: [{ kind: "image", ref: `data:image/png;base64,${PNG(n).toString("base64")}` }], receivedAt: new Date() });
  return (await db.select().from(t.messages).where(eq(t.messages.id, r.messageId)))[0];
};
const localNow = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 16);

test("short payment → staff ask for the difference → the chat waits → the top-up is checked against what's still owed → confirm works", async () => {
  await setStock(5);
  const o = await order(2, { receipt: false }); // RM 80
  setReceiptReader(reads({ amount: 70, paidAt: localNow() }));
  const first = await receiptIntake(ws, o.thread, await fileMsg(o.thread, "first"));
  assert.equal(first?.verdict, "mismatch");

  const preview = await requestReceipt({ workspaceId: ws.id, orderId: o.order.id, userId: OWNER, reason: "You paid RM 70 and the cakes are RM 80", kind: "top_up", dryRun: true });
  assert.ok(preview.ok);
  assert.equal(preview.ok && preview.request.expectedMinor, 1000, "only the RM 10 still owed");
  assert.match(preview.ok ? preview.message : "", /remaining RM 10[\s\S]*1111 2222 3333/);
  const [still] = await db.select().from(t.orders).where(eq(t.orders.id, o.order.id));
  assert.equal(still.receiptRequest, null, "a preview changes nothing");

  const r = await requestReceipt({ workspaceId: ws.id, orderId: o.order.id, userId: OWNER, reason: "You paid RM 70 and the cakes are RM 80", kind: "top_up" });
  assert.ok(r.ok);
  const blocked = await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER });
  assert.match(!blocked.ok ? blocked.error : "", /asked the customer for another receipt/);

  setReceiptReader(reads({ amount: 10, paidAt: localNow() }));
  const second = await receiptIntake(ws, o.thread, await fileMsg(o.thread, "second"));
  assert.equal(second?.verdict, "consistent");
  assert.match(second?.reply ?? "", /new payment receipt/);
  const receipts = await db.select().from(t.orderReceipts).where(eq(t.orderReceipts.orderId, o.order.id));
  const latest = receipts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  assert.match(latest.checks.find((c) => c.code === "amount")!.message, /matches the RM 10 still owed/);
  const [done] = await db.select().from(t.orders).where(eq(t.orders.id, o.order.id));
  assert.ok(done.receiptRequest?.fulfilledAt, "the request is fulfilled");
  assert.ok((await transitionOrder({ workspaceId: ws.id, orderId: o.order.id, action: "confirm", userId: OWNER })).ok);
});

test("asking for a replacement turns earlier receipts down: they stop counting, and confirming waits for the new one", async () => {
  const o = await order(1, { receipt: true });
  const r = await requestReceipt({ workspaceId: ws.id, orderId: o.order.id, userId: OWNER, reason: "This receipt is for a different payment", kind: "replace" });
  assert.ok(r.ok);
  assert.equal(r.ok && r.request.expectedMinor, 4000);
  const rows = await db.select().from(t.orderReceipts).where(eq(t.orderReceipts.orderId, o.order.id));
  assert.ok(rows.every((x) => x.rejectedAt && x.rejectedReason === "This receipt is for a different payment"));
  assert.equal((await events(o.order.id, "receipt.requested")).length, 1);
  const top = await requestReceipt({ workspaceId: ws.id, orderId: o.order.id, userId: OWNER, reason: "x x x", kind: "top_up" });
  assert.ok(top.ok, "nothing counts any more, so the whole total is still owed");
  assert.equal(top.ok && top.request.expectedMinor, 4000);
});

test("two unreadable receipts for one order hand the chat to a person instead of asking a third time", async () => {
  const o = await order(1, { receipt: false });
  setReceiptReader(reads({ legibility: "poor" }));
  const a = await receiptIntake(ws, o.thread, await fileMsg(o.thread, "u1"));
  assert.match(a?.reply ?? "", /clear photo/);
  const b = await receiptIntake(ws, o.thread, await fileMsg(o.thread, "u2"));
  assert.match(b?.reply ?? "", /asked the team/);
  const esc = await db.select().from(t.escalations).where(eq(t.escalations.threadId, o.thread.id));
  assert.equal(esc.length, 1);
  assert.equal(esc[0].category, "receipt_problem");
});

// ───────────────────────────── explanations

test("the Orders page explains each pending order in numbers and suggests what to do", async () => {
  await setStock(5);
  const o = await order(2, { receipt: false });
  setReceiptReader(reads({ amount: 70, paidAt: localNow() }));
  await receiptIntake(ws, o.thread, await fileMsg(o.thread, "explain"));
  await dropStock(1);
  const row = (await loadOrders(ws.id)).find((x) => x.id === o.order.id)!;
  const text = row.attention.map((a) => `${a.level}: ${a.text}`).join("\n");
  assert.match(text, /block: Paid RM 70, RM 10 short of the RM 80 total/);
  assert.match(text, /block: Only 1 left of Whole Lemon Cake \(ordered 2\)/);
  assert.match(row.recommendation ?? "", /pay the difference/);
  await setStock(5);
});

test("a stock problem when the AI tries to order goes to Needs you once, with what the customer wanted", async () => {
  await setStock(1);
  const { thread, customer } = await chat();
  const kb = await knowledge(ws);
  const ctx: ToolContext = { ws, catalog: kb.catalog, threadId: thread.id, customerId: customer.id, customerName: "Mei", channel: "simulator", escalations: [], orders: [] };
  for (let i = 0; i < 2; i++) {
    const r = await runTool(ctx, "create_order", { items: [{ product: "Lemon Cake", size: "Whole", quantity: 3 }], fulfilment: "pickup" }, "3 lemon cakes");
    assert.equal(r.ok, false);
  }
  const esc = await db.select().from(t.escalations).where(eq(t.escalations.threadId, thread.id));
  assert.equal(esc.length, 1, "repeating it doesn't stack cards");
  assert.equal(esc[0].category, "out_of_stock");
  assert.match(esc[0].summary, /We can do at most 1 of Whole Lemon Cake \(asked for 3\)/);
  await setStock(5);
});

// ───────────────────────────── delivery feedback

test("confirming and telling the customer are separate: a failed message is recorded, shown, and a retry doesn't duplicate it", async () => {
  const { thread, customer } = await chat("whatsapp"); // no WhatsApp connected for this business: sending fails
  const r = await placeOrder(ws, { lines: [{ itemId, variantId, name: "Whole Lemon Cake", quantity: 1, unitPriceMinor: 4000, note: null }], customerName: "Mei", fulfilment: "pickup", threadId: thread.id, customerId: customer.id });
  const n = await notifyCustomer(r.order, "confirmed", "Your order is confirmed", OWNER);
  assert.equal(n.status, "failed");
  assert.match(n.error ?? "", /WhatsApp isn't connected/);
  const view = (await loadOrders(ws.id)).find((x) => x.id === r.order.id)!;
  assert.equal(view.notificationsView.at(-1)?.status, "failed");
  assert.ok(view.attention.some((a) => /wasn't told the order was confirmed/.test(a.text)));
  assert.equal((await events(r.order.id, "order.notify_failed")).length, 1);

  const [again, twice] = await Promise.all([retryNotification(ws.id, r.order.id, OWNER), retryNotification(ws.id, r.order.id, OWNER)]);
  assert.equal([again, twice].filter((x) => "code" in x).length, 1, "only one retry runs at a time");
  const outbound = await db.select().from(t.messages).where(and(eq(t.messages.threadId, thread.id), eq(t.messages.direction, "out")));
  assert.equal(outbound.length, 1, "the same message row is resent, not a new one");
});

test("WhatsApp delivery receipts mark messages delivered and read, and a later failure marks them failed with the reason", async () => {
  const { thread } = await chat("whatsapp");
  const [m] = await db.insert(t.messages).values({ workspaceId: ws.id, threadId: thread.id, direction: "out", author: "staff", text: "hi", status: "sent", externalMessageId: "wamid.OK" }).returning();
  const [f] = await db.insert(t.messages).values({ workspaceId: ws.id, threadId: thread.id, direction: "out", author: "staff", text: "hi", status: "sent", externalMessageId: "wamid.BAD" }).returning();
  const st = (id: string, status: string, extra = {}) => ({ entry: [{ id: "", changes: [{ field: "messages", value: { statuses: [{ id, status, timestamp: String(Math.floor(Date.now() / 1000)), ...extra }] } }] }] });
  await applyWhatsAppStatuses(ws.id, st("wamid.OK", "delivered"));
  await applyWhatsAppStatuses(ws.id, st("wamid.OK", "read"));
  await applyWhatsAppStatuses(ws.id, st("wamid.BAD", "failed", { errors: [{ code: 131026, message: "Message undeliverable" }] }));
  await applyWhatsAppStatuses(other.id, st("wamid.OK", "failed"));
  const [ok] = await db.select().from(t.messages).where(eq(t.messages.id, m.id));
  const [bad] = await db.select().from(t.messages).where(eq(t.messages.id, f.id));
  assert.ok(ok.deliveredAt && ok.readAt);
  assert.equal(ok.status, "sent", "another business's webhook can't touch it");
  assert.equal(bad.status, "failed");
  assert.match(bad.error ?? "", /131026.*undeliverable/);
});
