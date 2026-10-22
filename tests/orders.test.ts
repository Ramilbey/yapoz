// Orders taken in chat: the agent's create_order tool (priced from the catalog, stock-checked, never confirmed by the AI),
// the owner's approval flow (stock off on confirm, back on cancel, one chat message per step), workspace scoping,
// the activity log, and the whole thing through the agent pipeline with a stubbed AI.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { db, t, sql } from "../src/db";
import { and, eq, desc } from "drizzle-orm";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";
import { transitionOrder, orderMessage, loadOrders, placeOrder } from "../src/lib/orders";
import { ingest, respond } from "../src/agent/pipeline";
import { acknowledgement } from "../src/agent/acknowledge";
import { addLocalDays, localDate, localWeekday, zoned } from "../src/lib/time";

const OWNER = "00000000-0000-4000-8000-000000000001";

async function ctx(wsId = "FORNO7", customerName = "Test Guest"): Promise<ToolContext> {
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, wsId));
  const [customer] = await db.insert(t.customers).values({ workspaceId: ws.id, channel: "simulator", externalId: `ord-${Math.random()}`, displayName: customerName || null }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: ws.id, channel: "simulator", externalThreadId: `ord-${Math.random()}`, customerId: customer.id }).returning();
  const kb = await knowledge(ws);
  return { ws, catalog: kb.catalog, threadId: thread.id, customerId: customer.id, customerName, channel: "simulator", escalations: [], bookings: [], orders: [] };
}

const variant = async (slug: string, size: string, color?: string) => {
  const [r] = await db
    .select({ v: t.kbVariants })
    .from(t.kbVariants)
    .innerJoin(t.kbItems, eq(t.kbItems.id, t.kbVariants.itemId))
    .where(and(eq(t.kbItems.workspaceId, "FORNO7"), eq(t.kbItems.slug, slug), eq(t.kbVariants.size, size)));
  if (color) {
    const rows = await db.select({ v: t.kbVariants }).from(t.kbVariants).innerJoin(t.kbItems, eq(t.kbItems.id, t.kbVariants.itemId)).where(and(eq(t.kbItems.workspaceId, "FORNO7"), eq(t.kbItems.slug, slug), eq(t.kbVariants.size, size), eq(t.kbVariants.color, color)));
    return rows[0].v;
  }
  return r.v;
};
/** FORNO7 asks for payment, so an order can only be confirmed once a receipt is on it. */
const addReceipt = (orderId: string) => db.insert(t.orderReceipts).values({ workspaceId: "FORNO7", orderId, mime: "image/png", sha256: `t-${Math.random()}`, bytes: Buffer.from("x"), verdict: "consistent" });
const orderCount = async () => (await db.select({ id: t.orders.id }).from(t.orders).where(eq(t.orders.workspaceId, "FORNO7"))).length;

type Placed = { ok: boolean; refCode?: string; duplicate?: boolean; total?: string; problems?: string[]; items?: { name: string; quantity: number; lineTotal: string; note: string | null }[]; instruction?: string };
const create = async (c: ToolContext, input: Record<string, unknown>) => {
  const r = await runTool(c, "create_order", input, "");
  return { r, out: r.output as Placed };
};

before(async () => {
  // Stock the tests rely on: an apron in Brick Red size S with exactly 2 left.
  const v = await variant("apron", "S", "Brick Red");
  await db.update(t.kbVariants).set({ stock: 2 }).where(eq(t.kbVariants.id, v.id));
});
after(async () => {
  await sql.end();
});

test("an order is priced from the catalog, whatever price the model sends, and waits as pending", async () => {
  const c = await ctx();
  const large = await variant("margherita", "L");
  const diavolaM = await variant("diavola", "M");
  const { r, out } = await create(c, {
    items: [{ product: "margherita", size: "large", quantity: 2, price: 1, note: "extra basil" }, { product: "Diavola", size: "M", quantity: 1 }],
    fulfilment: "pickup", when: "7:30pm tonight", total: 1,
  });
  assert.equal(out.ok, true, JSON.stringify(out));
  assert.match(out.refCode ?? "", /^ORD-[A-Z0-9]{4}$/);
  assert.deepEqual(out.items?.map((i) => [i.name, i.quantity, i.note]), [["Large Margherita", 2, "extra basil"], ["Medium Diavola", 1, null]]);
  const expected = 2 * large.priceMinor + diavolaM.priceMinor;
  const [o] = await db.select().from(t.orders).where(eq(t.orders.refCode, out.refCode!));
  assert.equal(o.totalMinor, expected);
  assert.equal(o.status, "pending");
  assert.equal(o.fulfilment, "pickup");
  assert.equal(o.customerName, "Test Guest");
  assert.equal(o.wanted, "7:30pm tonight");
  assert.equal(o.channel, "simulator");
  assert.match(out.instruction ?? "", /Do NOT say it is confirmed/);
  assert.match(r.label, /^ordered: 3 items · RM \d+ · ORD-/);
  assert.deepEqual(c.orders?.map((x) => x.refCode), [out.refCode]);
  const [created] = await db.select().from(t.events).where(and(eq(t.events.workspaceId, "FORNO7"), eq(t.events.type, "order.created"))).orderBy(desc(t.events.id)).limit(1);
  assert.equal((created.props as { orderId: string }).orderId, o.id);
});

test("what can't be ordered is explained, all at once, and nothing is saved", async () => {
  const c = await ctx();
  const before = await orderCount();
  const ambiguous = await create(c, { items: [{ product: "margherita", quantity: 1 }], fulfilment: "pickup" });
  assert.equal(ambiguous.out.ok, false);
  assert.match(ambiguous.out.problems!.join(" "), /which option\? .*Small.*RM 28.*Large.*RM 52/);
  const soldOut = await create(c, { items: [{ product: "truffle", size: "L", quantity: 1 }], fulfilment: "pickup" });
  assert.match(soldOut.out.problems!.join(" "), /isn't available today.*sold out/i);
  const noStock = await create(c, { items: [{ product: "apron", size: "S", color: "Brick Red", quantity: 3 }, { product: "t-shirt", size: "XL", color: "Brick Red", quantity: 1 }], fulfilment: "pickup" });
  assert.equal(noStock.out.problems!.length, 2);
  assert.match(noStock.out.problems![0], /Only 2 left of Forno Sette canvas apron/);
  assert.match(noStock.out.problems![1], /out of stock/);
  const unknown = await create(c, { items: [{ product: "sushi platter", quantity: 1 }], fulfilment: "pickup" });
  assert.match(unknown.out.problems![0], /isn't in the catalog/);
  const silly = await create(c, { items: [{ product: "margherita", size: "L", quantity: 500 }, { product: "marinara", size: "S", quantity: 1.5 }], fulfilment: "pickup" });
  assert.equal(silly.out.problems!.length, 2);
  const empty = await create(c, { items: [], fulfilment: "pickup" });
  assert.match(empty.out.problems![0], /No items/);
  assert.equal(await orderCount(), before, "no order was saved");
  assert.equal(ambiguous.r.ok, false);
});

test("delivery needs an address and every order needs a name; services are booked, not ordered", async () => {
  const c = await ctx("FORNO7", "");
  const noAddress = await create(c, { items: [{ product: "marinara", size: "S", quantity: 1 }], fulfilment: "delivery" });
  assert.deepEqual(noAddress.out.problems, ["Delivery needs the customer's address. Ask for it.", "Who is the order for? Ask for a name."]);
  const ok = await create(c, { items: [{ product: "marinara", size: "S", quantity: 1 }], fulfilment: "delivery", address: "12 Jalan Telawi 3, Bangsar", customer_name: "Hana" });
  assert.equal(ok.out.ok, true, JSON.stringify(ok.out));
  const [o] = await db.select().from(t.orders).where(eq(t.orders.refCode, ok.out.refCode!));
  assert.equal(o.address, "12 Jalan Telawi 3, Bangsar");
  assert.match(ok.r.label, /^ordered:/);
  assert.match((ok.r.output as { note?: string }).note ?? "", /delivery fee is confirmed by the team/);
  // Pickup orders don't keep an address.
  const pickup = await create(await ctx(), { items: [{ product: "marinara", size: "S", quantity: 1 }], fulfilment: "pickup", address: "ignored" });
  const [p] = await db.select().from(t.orders).where(eq(t.orders.refCode, pickup.out.refCode!));
  assert.equal(p.address, null);

  const salon = await ctx("KASIH1");
  const [svc] = await db.select().from(t.kbItems).where(and(eq(t.kbItems.workspaceId, "KASIH1"), eq(t.kbItems.kind, "service")));
  const service = await create(salon, { items: [{ product: svc.title, quantity: 1 }], fulfilment: "pickup" });
  assert.match(service.out.problems![0], /is a service: book it with create_booking/);
});

test("an option the menu doesn't have becomes a note for the kitchen; repeating the same order doesn't make a second one", async () => {
  const c = await ctx();
  const input = { items: [{ product: "margherita", size: "L", option: "extra sauce", quantity: 1 }], fulfilment: "pickup" };
  const first = await create(c, input);
  assert.equal(first.out.ok, true, JSON.stringify(first.out));
  assert.equal(first.out.items![0].note, "extra sauce");
  const before = await orderCount();
  const again = await create(c, input);
  assert.equal(again.out.duplicate, true);
  assert.equal(again.out.refCode, first.out.refCode);
  assert.match(again.out.instruction ?? "", /already placed/);
  assert.equal(await orderCount(), before);
  assert.match(again.r.label, /already placed/);
  // A different order in the same chat is a new order.
  const other = await create(c, { items: [{ product: "margherita", size: "L", quantity: 2 }], fulfilment: "pickup" });
  assert.notEqual(other.out.refCode, first.out.refCode);
});

test("confirming takes stock off, refuses when it's gone, and cancelling gives it back; each step is logged", async () => {
  const apron = await variant("apron", "S", "Brick Red");
  const stock = async () => (await db.select().from(t.kbVariants).where(eq(t.kbVariants.id, apron.id)))[0].stock;
  const a = await create(await ctx(), { items: [{ product: "apron", size: "S", color: "Brick Red", quantity: 2 }], fulfilment: "pickup" });
  const b = await create(await ctx(), { items: [{ product: "apron", size: "S", color: "Brick Red", quantity: 2 }], fulfilment: "pickup" });
  assert.equal(a.out.ok && b.out.ok, true, "stock isn't reserved until staff confirm");
  const idOf = async (ref: string) => (await db.select().from(t.orders).where(eq(t.orders.refCode, ref)))[0].id;
  const [aId, bId] = [await idOf(a.out.refCode!), await idOf(b.out.refCode!)];

  assert.equal(await stock(), 2);
  await addReceipt(aId);
  await addReceipt(bId);
  const first = await transitionOrder({ workspaceId: "FORNO7", orderId: aId, action: "confirm", userId: OWNER });
  assert.ok(first.ok && first.notify === "confirmed" && first.order.stockTaken && first.order.status === "confirmed" && first.order.handledBy === OWNER);
  assert.equal(await stock(), 0);

  const second = await transitionOrder({ workspaceId: "FORNO7", orderId: bId, action: "confirm", userId: OWNER });
  assert.ok(!second.ok && second.status === 409);
  assert.match(!second.ok ? second.error : "", /Small Forno Sette canvas apron, Brick Red is out of stock now/);
  assert.equal((await db.select().from(t.orders).where(eq(t.orders.id, bId)))[0].status, "pending", "a refused confirm changes nothing");
  assert.equal(await stock(), 0);

  const cancelled = await transitionOrder({ workspaceId: "FORNO7", orderId: aId, action: "cancel", userId: OWNER, reason: "Oven broke down" });
  assert.ok(cancelled.ok && cancelled.notify === "cancelled" && cancelled.order.cancelReason === "Oven broke down" && !cancelled.order.stockTaken);
  assert.equal(await stock(), 2, "cancelling puts the stock back");

  const retry = await transitionOrder({ workspaceId: "FORNO7", orderId: bId, action: "confirm", userId: OWNER });
  assert.ok(retry.ok);
  assert.equal(await stock(), 0);
  const ready = await transitionOrder({ workspaceId: "FORNO7", orderId: bId, action: "ready", userId: OWNER });
  assert.ok(ready.ok && ready.notify === "ready" && ready.order.readyAt);
  const done = await transitionOrder({ workspaceId: "FORNO7", orderId: bId, action: "complete", userId: OWNER });
  assert.ok(done.ok && done.notify === null && done.order.completedAt && done.order.stockTaken, "completing keeps the stock taken");
  assert.equal(await stock(), 0);

  const log = await db.select().from(t.events).where(and(eq(t.events.workspaceId, "FORNO7"), eq(t.events.type, "order.confirmed")));
  assert.ok(log.some((e) => (e.props as { orderId: string; by: string }).orderId === aId && (e.props as { by: string }).by === OWNER));
  const cancelLog = await db.select().from(t.events).where(and(eq(t.events.workspaceId, "FORNO7"), eq(t.events.type, "order.cancelled")));
  assert.ok(cancelLog.some((e) => (e.props as { reason?: string }).reason === "Oven broke down"));
});

test("steps happen in order, finished orders stay finished, paid is a separate tick, and another business can't touch the order", async () => {
  const o = await create(await ctx(), { items: [{ product: "marinara", size: "S", quantity: 1 }], fulfilment: "pickup" });
  const id = (await db.select().from(t.orders).where(eq(t.orders.refCode, o.out.refCode!)))[0].id;
  const step = (action: Parameters<typeof transitionOrder>[0]["action"], workspaceId = "FORNO7") => transitionOrder({ workspaceId, orderId: id, action, userId: OWNER });

  const early = await step("ready");
  assert.ok(!early.ok && early.status === 409 && /Confirm the order first/.test(early.error));
  const earlyDone = await step("complete");
  assert.ok(!earlyDone.ok && earlyDone.status === 409);
  const foreign = await step("confirm", "KASIH1");
  assert.ok(!foreign.ok && foreign.status === 404, "another business gets 'not found'");
  assert.equal((await db.select().from(t.orders).where(eq(t.orders.id, id)))[0].status, "pending");

  const paid = await step("paid");
  assert.ok(paid.ok && paid.order.paid && paid.order.status === "pending" && paid.notify === null);
  assert.ok((await step("unpaid")).ok);
  const noReceipt = await step("confirm");
  assert.ok(!noReceipt.ok && noReceipt.status === 409 && /No payment receipt yet/.test(noReceipt.error), "payments are on: no receipt, no confirm");
  await addReceipt(id);
  assert.ok((await step("confirm")).ok);
  const again = await step("confirm");
  assert.ok(!again.ok && /already confirmed/.test(again.error));
  assert.ok((await step("complete")).ok, "pickup can be completed without the ready step");
  const reopen = await step("cancel");
  assert.ok(!reopen.ok && /already completed/.test(reopen.error));
});

test("the customer is told what happened, in words that match pickup or delivery", async () => {
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, "FORNO7"));
  const mk = async (fulfilment: "pickup" | "delivery") => {
    const line = { itemId: (await db.select().from(t.kbItems).where(and(eq(t.kbItems.workspaceId, "FORNO7"), eq(t.kbItems.slug, "marinara"))))[0].id, variantId: (await variant("marinara", "S")).id, name: "Small Marinara", quantity: 2, unitPriceMinor: 2400, note: "no oregano" };
    const r = await placeOrder(ws, { lines: [line], customerName: "Hana", fulfilment, address: fulfilment === "delivery" ? "1 Jalan Test" : null });
    return r;
  };
  const pickup = await mk("pickup");
  const delivery = await mk("delivery");
  const confirmed = orderMessage(ws, "confirmed", pickup.order, pickup.items);
  assert.match(confirmed, new RegExp(`Your order ${pickup.order.refCode} is confirmed`));
  assert.match(confirmed, /2 × Small Marinara \(no oregano\)/);
  assert.match(confirmed, /Total RM 48\. We'll let you know when it's ready for pickup\./);
  assert.match(orderMessage(ws, "confirmed", delivery.order, delivery.items), /RM 48 plus delivery\. We'll let you know when it's on its way/);
  assert.match(orderMessage(ws, "ready", pickup.order, pickup.items), /ready for pickup at Forno Sette/);
  assert.match(orderMessage(ws, "ready", delivery.order, delivery.items), /on its way/);
  assert.match(orderMessage(ws, "cancelled", { ...pickup.order, cancelReason: "we ran out of dough" }, pickup.items), /can't make your order .*: we ran out of dough\./);
  assert.ok(!/confirmed|paid/.test(orderMessage(ws, "cancelled", pickup.order, pickup.items)));
});

test("the Orders page lists waiting orders first, with their items, for the right business only", async () => {
  const orders = await loadOrders("FORNO7");
  assert.ok(orders.length >= 5);
  const firstDone = orders.findIndex((o) => o.status !== "pending");
  assert.ok(firstDone > 0 && orders.slice(0, firstDone).every((o) => o.status === "pending") && orders.slice(firstDone).every((o) => o.status !== "pending"), "pending first");
  assert.ok(orders.every((o) => o.workspaceId === "FORNO7" && o.items.length > 0));
  const sample = orders.find((o) => o.refCode === "ORD-DEMA");
  assert.ok(sample?.isDemo && sample.fulfilment === "delivery" && sample.address && sample.items.reduce((n, i) => n + i.quantity * i.unitPriceMinor, 0) === sample.totalMinor);
  assert.equal((await loadOrders("KASIH1")).filter((o) => o.workspaceId !== "KASIH1").length, 0);
});

test("through the agent: a chat order becomes a pending order, the run is 'ordered', and the customer isn't told it's confirmed", async () => {
  process.env.GROQ_API_KEY = "test-groq";
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const realFetch = globalThis.fetch;
  const seen: { tools: number }[] = [];
  const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
  const reply = (message: unknown, finish: string) => json({ id: "x", object: "chat.completion", created: 0, model: "m", choices: [{ index: 0, finish_reason: finish, message }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } });
  const call = (name: string, args: unknown) => ({ role: "assistant", content: null, tool_calls: [{ id: `call_${name}`, type: "function", function: { name, arguments: JSON.stringify(args) } }] });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith("/models")) return new Response("no", { status: 503 });
    const body = JSON.parse(String(init?.body ?? "{}"));
    if (body.tool_choice?.function?.name === "classify") return reply(call("classify", { intent: "order", topic: "pizza order", language: "en", sentiment: "positive", confidence: 0.95, must_escalate: false, escalate_category: null, summary: "wants 2 large margheritas", holding_reply: "One moment" }), "tool_calls");
    seen.push({ tools: body.tools?.length ?? 0 });
    const last = body.messages.at(-1);
    if (last.role === "tool") {
      const result = JSON.parse(last.content);
      return reply({ role: "assistant", content: `Got it! Order ${result.refCode} is in: 2 × Large Margherita, total ${result.total}. The team will confirm it shortly.` }, "stop");
    }
    return reply(call("create_order", { items: [{ product: "margherita", size: "large", quantity: 2 }], fulfilment: "pickup", customer_name: "Hana" }), "tool_calls");
  }) as typeof fetch;
  try {
    const sid = `orderflow${Date.now()}`;
    const r = await ingest({ workspaceId: "FORNO7", channel: "simulator", externalThreadId: `sim:${sid}`, customer: { externalId: sid, displayName: "Hana" }, text: "2 large margherita for pickup please, I'm Hana", attachments: [], receivedAt: new Date() });
    const out = await respond(r.thread.id, r.messageId);
    assert.equal(out.error, undefined);
    assert.equal(out.outcome, "ordered");
    assert.ok(out.order?.refCode.startsWith("ORD-"));
    assert.ok(seen.some((s) => s.tools >= 7), "the agent is offered create_order alongside the other tools");
    assert.match(out.reply ?? "", /is in: 2 × Large Margherita/);
    assert.ok(!/confirmed (and|!)|on its way|ready for pickup/i.test(out.reply ?? ""));
    const [order] = await db.select().from(t.orders).where(eq(t.orders.threadId, r.thread.id));
    assert.equal(order.refCode, out.order?.refCode);
    assert.equal(order.status, "pending");
    assert.equal(order.channel, "simulator");
    const [run] = await db.select().from(t.agentRuns).where(eq(t.agentRuns.threadId, r.thread.id));
    assert.equal(run.outcome, "ordered");
    assert.equal(await db.select().from(t.escalations).where(eq(t.escalations.threadId, r.thread.id)).then((x) => x.length), 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

/** An AI that saves what the customer asked for with one tool call, then fails on every later call. */
async function chatWhereAiDiesAfter(tool: string, args: unknown, text: string) {
  process.env.GROQ_API_KEY = "test-groq";
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const realFetch = globalThis.fetch;
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
  const call = (name: string, a: unknown) => ({ role: "assistant", content: null, tool_calls: [{ id: `call_${name}`, type: "function", function: { name, arguments: JSON.stringify(a) } }] });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith("/models")) return new Response("no", { status: 503 });
    const body = JSON.parse(String(init?.body ?? "{}"));
    if (body.tool_choice?.function?.name === "classify") {
      return json({ id: "x", object: "chat.completion", created: 0, model: "m", choices: [{ index: 0, finish_reason: "tool_calls", message: call("classify", { intent: "order", topic: "order", language: "en", sentiment: "positive", confidence: 0.95, must_escalate: false, escalate_category: null, summary: "s", holding_reply: "One moment" }) }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
    }
    // After the tool has run, every provider is out of tokens.
    if (body.messages.at(-1).role === "tool") return json({ error: { message: "Rate limit reached on tokens per minute (TPM)" } }, 429);
    return json({ id: "x", object: "chat.completion", created: 0, model: "m", choices: [{ index: 0, finish_reason: "tool_calls", message: call(tool, args) }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } });
  }) as typeof fetch;
  try {
    const sid = `acktest${Math.random().toString(36).slice(2, 10)}`;
    const r = await ingest({ workspaceId: "FORNO7", channel: "simulator", externalThreadId: `sim:${sid}`, customer: { externalId: sid, displayName: "Hana" }, text, attachments: [], receivedAt: new Date() });
    const out = await respond(r.thread.id, r.messageId);
    const escalations = await db.select().from(t.escalations).where(eq(t.escalations.threadId, r.thread.id));
    const [run] = await db.select().from(t.agentRuns).where(eq(t.agentRuns.threadId, r.thread.id));
    return { out, escalations, run, threadId: r.thread.id };
  } finally {
    globalThis.fetch = realFetch;
  }
}

test("the AI dies after saving an order: the customer is told their order is in, not 'passed to our team'", async () => {
  const { out, escalations, run, threadId } = await chatWhereAiDiesAfter("create_order", { items: [{ product: "margherita", size: "large", quantity: 1 }], fulfilment: "pickup", customer_name: "Hana" }, "1 large margherita for pickup, I'm Hana");
  assert.match(out.reply ?? "", /^Got it! Your order ORD-[A-Z0-9]{4} is in:\n• 1 × Large Margherita\nTotal RM 52\.\nTo place it, please pay RM 52 to:\n• Bank transfer: Sample Bank, 1234 5678 9012 \(Forno Sette Sdn Bhd\)\n• DuitNow: DuitNow, 012-345 6789 \(Forno Sette Sdn Bhd\)\nPlease put your order code in the payment reference\.\nThen send a photo or screenshot of the payment receipt here\. The team confirms your order after they check it\.$/);
  assert.ok(!/passed this to our team/.test(out.reply ?? ""));
  assert.ok(!/confirmed (and|!)|on its way|paid/i.test(out.reply ?? ""), "never claims more than 'received'");
  assert.equal(out.outcome, "ordered");
  assert.equal(out.order?.refCode, (out.reply ?? "").match(/ORD-[A-Z0-9]{4}/)?.[0]);
  assert.equal(escalations.length, 0, "the order is already in the team's queue; no second card");
  assert.match(run.error ?? "", /AI generation failed/, "the failure is still recorded on the run");
  assert.equal(run.outcome, "ordered");
  const [order] = await db.select().from(t.orders).where(eq(t.orders.threadId, threadId));
  assert.equal(order.status, "pending");
});

test("the AI dies after saving a booking: the customer gets the booking and its reference", async () => {
  const today = localDate(new Date(), "Asia/Kuala_Lumpur");
  let fri = "";
  for (let i = 1; i <= 7 && !fri; i++) {
    const d = addLocalDays(today, i);
    if (localWeekday(zoned(d, "12:00", "Asia/Kuala_Lumpur"), "Asia/Kuala_Lumpur") === "fri") fri = d;
  }
  const { out, escalations, run } = await chatWhereAiDiesAfter("create_booking", { customer_name: "Hana", date: fri, time: "19:00", party_size: 2 }, "table for 2 on friday at 7pm, I'm Hana");
  assert.match(out.reply ?? "", /^You're booked: .*Your reference is [A-Z0-9]{2}-[A-Z0-9]{4}\.$/);
  assert.equal(out.outcome, "booked");
  assert.equal(escalations.length, 0);
  assert.match(run.error ?? "", /AI generation failed/);
  await db.delete(t.bookings).where(eq(t.bookings.refCode, out.booking!.refCode));
});

test("if the AI dies before saving anything, the holding reply and the staff card are unchanged", async () => {
  const { out, escalations } = await chatWhereAiDiesAfter("search_catalog", { query: "pizza" }, "what pizzas do you have?");
  assert.match(out.reply ?? "", /passed this to our team/);
  assert.equal(out.outcome, "error");
  assert.equal(escalations.length, 1);
  assert.match(escalations[0].summary, /^AI couldn't answer \(/);
});

test("acknowledgement(): delivery orders say 'plus delivery', failed tool calls are ignored, nothing saved means null", () => {
  const log = (name: string, output: unknown, ok = true) => ({ name, input: {}, output, ms: 1, ok, label: "" });
  assert.equal(acknowledgement([log("check_variant", { found: true })]), null);
  assert.equal(acknowledgement([log("create_order", { ok: false, problems: ["x"] }, false)]), null);
  const text = acknowledgement([log("create_order", { refCode: "ORD-AAAA", fulfilment: "delivery", total: "RM 48", items: [{ name: "Small Marinara", quantity: 2, note: "no oregano" }] })])!;
  assert.match(text, /order ORD-AAAA is in:\n• 2 × Small Marinara \(no oregano\)\nTotal RM 48 plus delivery\. The team will confirm it shortly\./);
  const pay = acknowledgement([log("create_order", { refCode: "ORD-CCCC", total: "RM 10", howToPay: "To place it, please pay RM 10 to:\n• Bank", items: [] })])!;
  assert.match(pay, /Total RM 10\.\nTo place it, please pay RM 10 to:/);
  const both = acknowledgement([log("create_booking", { refCode: "F7-ZZZZ", when: "Fri 24 Oct, 7:00 PM", bookingType: "Table", quantity: 4 }), log("create_order", { refCode: "ORD-BBBB", total: "RM 10", items: [] })])!;
  assert.match(both, /^You're booked: Table for 4, Fri 24 Oct, 7:00 PM\. Your reference is F7-ZZZZ\.\n\nGot it! Your order ORD-BBBB is in\./);
});
