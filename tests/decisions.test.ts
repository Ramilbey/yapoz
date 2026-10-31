// How the owner's decisions are recorded and measured: correcting an order before approval (order.corrected, stock held
// again or the edit refused), rejection reason codes, time to decision, reply latency and after-hours chats, and the
// "what the AI did and didn't do" timeline.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { createWorkspace } from "../src/lib/workspace";
import { editOrder, placeOrder, transitionOrder } from "../src/lib/orders";
import { measureBenefit, outcomeRows, replyFacts } from "../src/lib/benefit";
import { orderTimeline, toolLine } from "../src/lib/order-timeline";
import type { HoursData } from "../src/lib/hours";

const created: string[] = [];
after(async () => {
  for (const id of created) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await sql.end();
});

/** A business with one counted item (5 on the shelf, RM10) and a chat for each order. */
async function shop() {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const { workspaceId, user } = await createWorkspace({ name: `Decisions ${stamp}`, timezone: "Asia/Kuala_Lumpur", owner: { name: "Owner", email: `dec-${stamp}@example.com`, passwordHash: "x" } });
  created.push(workspaceId);
  const [item] = await db.insert(t.kbItems).values({ workspaceId, kind: "product", category: "test", slug: "loaf", title: "Loaf", stockMode: "tracked" }).returning();
  const [variant] = await db.insert(t.kbVariants).values({ workspaceId, itemId: item.id, priceMinor: 1000, stock: 5 }).returning();
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  async function order(quantity: number, customerAt = new Date()) {
    const [customer] = await db.insert(t.customers).values({ workspaceId, channel: "simulator", externalId: `c-${Math.random()}`, displayName: "Sam" }).returning();
    const [thread] = await db.insert(t.threads).values({ workspaceId, channel: "simulator", externalThreadId: `t-${Math.random()}`, customerId: customer.id }).returning();
    await db.insert(t.messages).values({ workspaceId, threadId: thread.id, direction: "in", author: "customer", text: "hi", status: "received", createdAt: customerAt });
    const r = await placeOrder(ws, { lines: [{ itemId: item.id, variantId: variant.id, name: "Loaf", quantity, unitPriceMinor: 1000, note: null }], customerName: "Sam", fulfilment: "pickup", threadId: thread.id, customerId: customer.id, channel: "simulator" });
    return { ...r, thread };
  }
  const activeHold = async (orderId: string) => (await db.select().from(t.stockHolds).where(and(eq(t.stockHolds.orderId, orderId), eq(t.stockHolds.status, "held")))).reduce((n, h) => n + h.qty, 0);
  return { workspaceId, userId: user.id, variantId: variant.id, order, activeHold };
}

test("correcting an order changes its total and holds the new quantity; too many is refused and nothing changes", async () => {
  const s = await shop();
  const { order, items } = await s.order(2);
  assert.equal(await s.activeHold(order.id), 2);

  const up = await editOrder({ workspaceId: s.workspaceId, orderId: order.id, userId: s.userId, edit: { lines: [{ id: items[0].id, quantity: 4 }], notes: "no bag" } });
  assert.ok(up.ok);
  assert.equal(up.order.totalMinor, 4000);
  assert.equal(up.order.notes, "no bag");
  assert.equal(await s.activeHold(order.id), 4, "the hold follows the new quantity, not both");

  const tooMany = await editOrder({ workspaceId: s.workspaceId, orderId: order.id, userId: s.userId, edit: { lines: [{ id: items[0].id, quantity: 6 }] } });
  assert.ok(!tooMany.ok && tooMany.status === 409);
  const [after] = await db.select().from(t.orders).where(eq(t.orders.id, order.id));
  assert.equal(after.totalMinor, 4000, "a refused edit changes nothing");
  assert.equal(await s.activeHold(order.id), 4);

  const all = await editOrder({ workspaceId: s.workspaceId, orderId: order.id, userId: s.userId, edit: { lines: [{ id: items[0].id, quantity: 0 }] } });
  assert.ok(!all.ok, "removing every line is a rejection, not an edit");
  const same = await editOrder({ workspaceId: s.workspaceId, orderId: order.id, userId: s.userId, edit: { lines: [{ id: items[0].id, quantity: 4 }] } });
  assert.ok(!same.ok && same.status === 400, "an edit that changes nothing isn't logged as a correction");

  const events = await db.select().from(t.events).where(and(eq(t.events.workspaceId, s.workspaceId), eq(t.events.type, "order.corrected")));
  assert.equal(events.length, 1);
  assert.deepEqual((events[0].props as { fields: string[] }).fields.sort(), ["items", "notes"]);
});

test("only a waiting order of this business can be edited", async () => {
  const s = await shop();
  const other = await shop();
  const { order, items } = await s.order(1);
  const stranger = await editOrder({ workspaceId: other.workspaceId, orderId: order.id, userId: other.userId, edit: { notes: "x" } });
  assert.ok(!stranger.ok && stranger.status === 404);
  const done = await transitionOrder({ workspaceId: s.workspaceId, orderId: order.id, action: "confirm", userId: s.userId });
  assert.ok(done.ok);
  const late = await editOrder({ workspaceId: s.workspaceId, orderId: order.id, userId: s.userId, edit: { lines: [{ id: items[0].id, quantity: 2 }] } });
  assert.ok(!late.ok && late.status === 409);
});

test("time to decision, corrections, rejection reasons and unattended chats are measured from what was recorded", async () => {
  const s = await shop();
  const a = await s.order(1);
  const b = await s.order(2);
  await editOrder({ workspaceId: s.workspaceId, orderId: a.order.id, userId: s.userId, edit: { lines: [{ id: a.items[0].id, quantity: 2 }] } });
  assert.ok((await transitionOrder({ workspaceId: s.workspaceId, orderId: a.order.id, action: "confirm", userId: s.userId })).ok);
  assert.ok((await transitionOrder({ workspaceId: s.workspaceId, orderId: b.order.id, action: "reject", userId: s.userId, reason: "Sorry", reasonCode: "wrong_item" })).ok);
  const rejected = await db.select().from(t.events).where(and(eq(t.events.workspaceId, s.workspaceId), eq(t.events.type, "order.rejected")));
  assert.equal((rejected[0].props as { reasonCode: string }).reasonCode, "wrong_item");

  const m = await measureBenefit(s.workspaceId);
  assert.equal(m.time.decided, 2);
  assert.ok(m.time.medianMinutes !== null && m.time.medianMinutes >= 0);
  assert.deepEqual([m.errors.decided, m.errors.corrected, m.errors.rejected, m.errors.needed, m.errors.share], [2, 1, 1, 2, 1]);
  assert.deepEqual(m.errors.reasons, { wrong_item: 1 });
  assert.equal(m.reply.chats, 2);
  assert.equal(m.reply.unattended.orders, 2, "nobody on the team wrote in either chat");
  assert.equal(m.reply.hoursUnknown, 2, "no opening hours on file, so nothing is called after-hours");
  assert.equal(m.reply.afterHours.orders, 0);
  assert.equal(m.steps.mean, 1.5, "the correction is a manual step; the plain rejection is one");
  assert.ok(outcomeRows(m).every((r) => r.label && r.counted));
});

test("an order with no corrections and no rejections isn't counted as needing one; no orders is no data", async () => {
  const s = await shop();
  assert.equal((await measureBenefit(s.workspaceId)).errors.share, null);
  const a = await s.order(1);
  assert.ok((await transitionOrder({ workspaceId: s.workspaceId, orderId: a.order.id, action: "confirm", userId: s.userId })).ok);
  const m = await measureBenefit(s.workspaceId);
  assert.equal(m.errors.share, 0);
  assert.equal(m.errors.needed, 0);
});

test("first reply, first human reply and after-hours are worked out from one chat's messages", () => {
  const hours: HoursData = { weekly: Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, [["09:00", "18:00"] as [string, string]]])), lastOrdersMinutesBeforeClose: 0, exceptions: [] };
  const at = (iso: string) => new Date(iso);
  // 23:00 in Kuala Lumpur is 15:00 UTC.
  const night = [
    { author: "customer" as const, direction: "in" as const, at: at("2026-10-30T15:00:00Z") },
    { author: "ai" as const, direction: "out" as const, at: at("2026-10-30T15:00:30Z") },
    { author: "staff" as const, direction: "out" as const, at: at("2026-10-31T01:30:00Z") },
  ];
  const f = replyFacts(night, hours, "Asia/Kuala_Lumpur")!;
  assert.equal(f.firstReplyMinutes, 0.5);
  assert.equal(f.firstHumanMinutes, 630);
  assert.equal(f.afterHours, true);
  assert.equal(f.unattended, true);
  const noon = replyFacts([{ author: "customer", direction: "in", at: at("2026-10-30T04:00:00Z") }, { author: "staff", direction: "out", at: at("2026-10-30T04:03:00Z") }], hours, "Asia/Kuala_Lumpur")!;
  assert.deepEqual([noon.afterHours, noon.unattended, noon.firstHumanMinutes], [false, false, 3]);
  assert.equal(replyFacts(night, null, "Asia/Kuala_Lumpur")!.afterHours, null, "no hours on file: unknown, not after-hours");
  assert.equal(replyFacts([], hours, "Asia/Kuala_Lumpur"), undefined);
});

test("the timeline says what the AI did, what it refused to do, and what waits for a person", async () => {
  const s = await shop();
  const { order, items, thread } = await s.order(1);
  await db.insert(t.agentRuns).values({
    workspaceId: s.workspaceId, threadId: thread.id, channel: "simulator", model: "test", outcome: "ordered", latencyMs: 300,
    toolCalls: [
      { name: "check_variant", input: { product: "Loaf" }, output: { found: true, product: "Loaf", variants: [{ option: "", price: "RM10.00", inStock: true }] }, ms: 20, ok: true, label: "" },
      { name: "get_business_info", input: { topic: "halal" }, output: { found: false }, ms: 5, ok: false, label: "" },
      { name: "create_order", input: {}, output: { ok: true, refCode: order.refCode, total: "RM10.00" }, ms: 40, ok: true, label: "" },
    ],
  });
  await editOrder({ workspaceId: s.workspaceId, orderId: order.id, userId: s.userId, edit: { lines: [{ id: items[0].id, quantity: 2 }] } });
  const tl = (await orderTimeline(s.workspaceId, order.id))!;
  const text = tl.lines.map((l) => `${l.kind}|${l.text}`).join("\n");
  assert.match(text, /did\|AI quoted RM10\.00 for Loaf from your catalogue/);
  assert.match(text, /didnt\|AI had no saved answer for “halal” and did not make one up/);
  assert.match(text, new RegExp(`AI saved order ${order.refCode}`));
  assert.match(text, /Corrected .* Loaf 1 → 2/);
  assert.equal(tl.lines.at(-1)!.kind, "waiting");
  assert.match(tl.lines.at(-1)!.text, /has not confirmed/);
  assert.ok(tl.limits.some((x) => /never sets prices/.test(x)));
  assert.equal(await orderTimeline(s.workspaceId, "00000000-0000-4000-8000-0000000000ff"), null);
  const other = await shop();
  assert.equal(await orderTimeline(other.workspaceId, order.id), null, "another business can't read it");
  assert.equal(toolLine({ name: "unknown_tool", input: {}, output: {}, ms: 0, ok: true, label: "" }), null);
});
