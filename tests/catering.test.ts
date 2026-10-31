// A business of a different shape (catering: per-portion prices, minimum quantities, days of lead time, nothing counted in
// stock), built through setup code only, with no business-specific code anywhere. It must complete an order. The two
// things it can't express are pinned as GAP tests: each fails the day that gap is closed, which is the cue to update
// docs/third-business-gaps.md.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db, t, sql as pg } from "../src/db";
import { createWorkspace } from "../src/lib/workspace";
import { importDraft } from "../src/setup/import";
import { setupChecks, setupSelling } from "../src/setup/checks";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";
import { transitionOrder } from "../src/lib/orders";
import { measureBenefit } from "../src/lib/benefit";
import { addLocalDays, localDate } from "../src/lib/time";
import { CATERER, CATERING_DRAFT, seedCatering } from "../src/seed/catering";

const workspaces: string[] = [];
after(async () => {
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await pg.end();
});

/** A new owner's path and nothing else: sign up, import the setup draft. No inserts into the catalogue by hand. */
async function viaSetup() {
  const stamp = Math.random().toString(36).slice(2, 8);
  const { workspaceId, user } = await createWorkspace({ name: `Catering ${stamp}`, timezone: CATERER.timezone, owner: { name: "Owner", email: `cat-${stamp}@example.com`, passwordHash: "x" } });
  workspaces.push(workspaceId);
  await importDraft(workspaceId, CATERING_DRAFT, { replace: true });
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  const kb = await knowledge(ws);
  const [customer] = await db.insert(t.customers).values({ workspaceId, channel: "simulator", externalId: `c-${stamp}`, displayName: "Puan Rohani" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId, channel: "simulator", externalThreadId: `t-${stamp}`, customerId: customer.id }).returning();
  await db.insert(t.messages).values({ workspaceId, threadId: thread.id, direction: "in", author: "customer", text: "nak order nasi impit", status: "received" });
  const ctx: ToolContext = { ws, catalog: kb.catalog, threadId: thread.id, customerId: customer.id, customerName: "Puan Rohani", channel: "simulator", escalations: [], orders: [] };
  return { ws, ownerId: user.id, ctx };
}

type Placed = { ok: boolean; refCode?: string; total?: string; problems?: string[] };
const place = async (ctx: ToolContext, input: Record<string, unknown>) => (await runTool(ctx, "create_order", { fulfilment: "pickup", customer_name: "Puan Rohani", ...input }, "")).output as Placed;

test("a caterer set up through the import alone is ready to sell, and completes an order", async () => {
  const { ws, ownerId, ctx } = await viaSetup();
  const checks = setupChecks(await setupSelling(ws, ownerId));
  assert.equal(checks.hasHours, true);
  assert.equal(checks.hasAddress, false, "setup flags the missing address; it isn't invented");
  assert.equal(checks.stockMode, "none", "a caterer isn't asked to count stock");
  assert.equal(checks.services, 0);

  const placed = await place(ctx, { items: [{ product: "Nasi impit set", quantity: 40 }], when: "Saturday 12pm" });
  assert.ok(placed.ok, JSON.stringify(placed));
  assert.equal(placed.total, "RM 720", "40 portions at RM18, priced from the catalogue");
  const [order] = await db.select().from(t.orders).where(eq(t.orders.refCode, placed.refCode!));
  assert.equal(order.status, "pending");

  for (const action of ["confirm", "ready", "complete"] as const) {
    const r = await transitionOrder({ workspaceId: ws.id, orderId: order.id, action, userId: ownerId });
    assert.ok(r.ok, `${action}: ${r.ok ? "" : r.error}`);
  }
  const [done] = await db.select().from(t.orders).where(eq(t.orders.id, order.id));
  assert.equal(done.status, "completed");
  const m = await measureBenefit(ws.id);
  assert.equal(m.orders.total, 1);
  assert.equal(m.orders.pricedAndChecked, 1, "priced from the catalogue; nothing to count counts as checked");
});

test("a variant and a per-option price are chosen by name, and a dish nothing like the menu is refused", async () => {
  const { ctx } = await viaSetup();
  const ok = await place(ctx, { items: [{ product: "Satay", option: "Beef, 10 sticks", quantity: 12 }] });
  assert.ok(ok.ok, JSON.stringify(ok));
  assert.equal(ok.total, "RM 216");
  const no = await place(ctx, { items: [{ product: "Pizza", quantity: 20 }] });
  assert.ok(!no.ok);
});

test("GAP 1: a minimum quantity written in the policy is not enforced; one portion of a 20-portion set is accepted", async () => {
  const { ctx } = await viaSetup();
  const r = await place(ctx, { items: [{ product: "Nasi impit set", quantity: 1 }] });
  assert.ok(r.ok, "if this fails, minimum quantities are now enforced: delete this test and update docs/third-business-gaps.md");
  assert.equal(r.total, "RM 18");
});

test("GAP 2: lead time written in the policy is not enforced; an order for tomorrow is accepted", async () => {
  const { ws, ctx } = await viaSetup();
  const tomorrow = addLocalDays(localDate(new Date(), ws.timezone), 1);
  const r = await place(ctx, { items: [{ product: "Nasi impit set", quantity: 40 }], date: tomorrow });
  assert.ok(r.ok, "if this fails, lead time is now enforced: delete this test and update docs/third-business-gaps.md");
  const [o] = await db.select().from(t.orders).where(and(eq(t.orders.workspaceId, ws.id), eq(t.orders.refCode, r.refCode!)));
  assert.equal(o.wantedDate, tomorrow);
});

test("GAP 3: an unlisted dish that shares one word with a listed one is matched to it (Sushi platter becomes Kuih platter)", async () => {
  const { ctx } = await viaSetup();
  const r = await runTool(ctx, "create_order", { fulfilment: "pickup", customer_name: "Puan Rohani", items: [{ product: "Sushi platter", quantity: 20 }] }, "");
  const out = r.output as { ok: boolean; items?: { name: string }[] };
  assert.ok(out.ok, "if this fails, partial-word matching was tightened: delete this test and update docs/third-business-gaps.md");
  assert.match(out.items![0].name, /Kuih platter/);
});

test("GAP 4: a line is capped at 50, so a 150-portion kenduri can't be ordered in chat and goes to a person", async () => {
  const { ctx } = await viaSetup();
  const r = await place(ctx, { items: [{ product: "Nasi impit set", quantity: 150 }] });
  assert.ok(!r.ok);
  assert.match(r.problems!.join(" "), /escalate \(large_group\)/, "the failure is safe (nothing is saved) but every large order needs a human");
});

test("the policy text does reach the assistant, so it can quote the minimum and the lead time", async () => {
  const { ws } = await viaSetup();
  const kb = await knowledge(ws);
  const all = JSON.stringify(kb);
  assert.match(all, /3 days ahead/);
  assert.match(all, /20 portions/);
});

test("the seeded caterer loads through the same import", async () => {
  await seedCatering();
  const items = await db.select().from(t.kbItems).where(and(eq(t.kbItems.workspaceId, CATERER.id), eq(t.kbItems.kind, "product")));
  assert.equal(items.length, CATERING_DRAFT.items.length);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, CATERER.id));
  assert.equal(ws.settings.sample, true);
});
