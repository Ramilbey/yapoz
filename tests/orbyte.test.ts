// The outgoing approved-order event: only for orders a person approved, and matching the example in the integration doc.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { approvedOrderEvent, loadApprovedOrderEvent, NotApproved } from "../src/lib/orbyte";
import { expireDueOrders } from "../src/lib/stock";
import { placeOrder, transitionOrder, type OrderItemRow, type OrderRow } from "../src/lib/orders";
import { createWorkspace } from "../src/lib/workspace";

const ORDER = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";
const order = (over: Partial<OrderRow> = {}) => ({
  id: ORDER, workspaceId: "SAMPLE1", refCode: "ORD-AB12", kind: "order", status: "confirmed", channel: "whatsapp", fulfilment: "pickup", wantedDate: null, currency: "MYR", totalMinor: 2850,
  paid: true, customerName: "Sample Customer", phone: null, address: null, isDemo: true, confirmedAt: new Date("2026-11-02T04:15:00.000Z"), ...over,
}) as OrderRow;
const item = (variantId: string, name: string, quantity: number, unitPriceMinor: number, note: string | null) => ({ variantId, name, quantity, unitPriceMinor, note }) as OrderItemRow;
const ITEMS = [item("33333333-3333-4333-8333-333333333333", "Large Sample Loaf", 2, 1200, null), item("44444444-4444-4444-8444-444444444444", "Sample Bun", 1, 450, "no sugar")];

const workspaces: string[] = [];
after(async () => {
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await sql.end();
});

test("the event is exactly the example in docs/orbyte-integration.md", () => {
  const doc = readFileSync("docs/orbyte-integration.md", "utf8").match(/```json orbyte-approved-order\n([\s\S]*?)```/)?.[1];
  assert.ok(doc, "the doc has the example");
  assert.deepEqual(approvedOrderEvent(order(), ITEMS, USER), JSON.parse(doc));
});

test("no event for an order nobody approved, or one that was cancelled afterwards", () => {
  assert.throws(() => approvedOrderEvent(order({ status: "pending", confirmedAt: null }), ITEMS, USER), /isn't approved/);
  assert.throws(() => approvedOrderEvent(order({ status: "cancelled", confirmedAt: null }), ITEMS, USER), /isn't approved/);
  assert.throws(() => approvedOrderEvent(order({ status: "expired", confirmedAt: null }), ITEMS, USER), /isn't approved/);
  assert.throws(() => approvedOrderEvent(order({ status: "cancelled" }), ITEMS, USER), /isn't approved/);
});

test("a booking is labelled as one, and a ready order is still approved", () => {
  assert.equal(approvedOrderEvent(order({ kind: "appointment" }), ITEMS, USER).order.type, "booking");
  assert.equal(approvedOrderEvent(order({ status: "ready" }), ITEMS, USER).order.status, "ready");
});

test("from the database: the event appears only after approval, names the approver, and stays in its own business", async () => {
  const { workspaceId, user } = await createWorkspace({ name: "Orbyte Sample", timezone: "Asia/Kuala_Lumpur", owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  workspaces.push(workspaceId);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  const [kb] = await db.insert(t.kbItems).values({ workspaceId, kind: "product", category: "sample", slug: "loaf", title: "Sample Loaf", stockMode: "none" }).returning();
  const [variant] = await db.insert(t.kbVariants).values({ workspaceId, itemId: kb.id, priceMinor: 1200 }).returning();
  const { order: placed } = await placeOrder(ws, { lines: [{ itemId: kb.id, variantId: variant.id, name: "Sample Loaf", quantity: 2, unitPriceMinor: 1200, note: null }], customerName: "Sample Customer", fulfilment: "pickup", isDemo: true });

  await assert.rejects(loadApprovedOrderEvent(workspaceId, placed.id), /no recorded approval/);
  assert.equal(await loadApprovedOrderEvent("SOMEONE-ELSE", placed.id), null);
  const decided = await transitionOrder({ workspaceId, orderId: placed.id, action: "confirm", userId: user.id });
  assert.ok(decided.ok);
  const event = await loadApprovedOrderEvent(workspaceId, placed.id);
  assert.equal(event?.approvedBy.userId, user.id);
  assert.equal(event?.order.totalMinor, 2400);
  assert.deepEqual(event?.order.lines.map((l) => l.lineTotalMinor), [2400]);

  // What the preview route refuses: pending, rejected, expired, and cancelled after approval.
  const place = async () => (await placeOrder(ws, { lines: [{ itemId: kb.id, variantId: variant.id, name: "Sample Loaf", quantity: 1, unitPriceMinor: 1200, note: null }], customerName: "Sample Customer", fulfilment: "pickup" })).order;
  const refused = (id: string) => assert.rejects(loadApprovedOrderEvent(workspaceId, id), NotApproved);
  const pending = await place();
  await refused(pending.id);
  await transitionOrder({ workspaceId, orderId: pending.id, action: "reject", userId: user.id });
  await refused(pending.id);
  const expired = await place();
  await db.update(t.orders).set({ holdExpiresAt: new Date(Date.now() - 60_000) }).where(eq(t.orders.id, expired.id));
  assert.equal(await expireDueOrders(workspaceId), 1);
  await refused(expired.id);
  await transitionOrder({ workspaceId, orderId: placed.id, action: "cancel", userId: user.id });
  await refused(placed.id);
});
