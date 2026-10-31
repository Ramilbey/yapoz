// The Phase 2 measures: how they're worked out (pure), then a synthetic run of 20 orders read back from its own records.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { benefitReport, benefitRows, benefitSets, measureBenefit, missingChecks, summarise } from "../src/lib/benefit";
import { createWorkspace } from "../src/lib/workspace";
import { runSyntheticOrders } from "../scripts/synthetic-orders";

const workspaces: string[] = [];
after(async () => {
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await sql.end();
});

const codes = (...c: string[]) => c.map((code) => ({ code }));

test("a receipt counts only with a recorded result for amount, payee, date and reuse", () => {
  assert.deepEqual(missingChecks(codes("amount", "payee", "date", "reuse")), []);
  assert.deepEqual(missingChecks(codes("amount", "payee", "date_early", "duplicate")), []);
  assert.deepEqual(missingChecks(codes("amount", "payee", "date")), ["reuse"]);
  assert.deepEqual(missingChecks([]), ["amount", "payee", "date", "reuse"]);
});

test("nothing to measure is no data, never a zero or a hundred", () => {
  const b = summarise([], []);
  assert.equal(b.steps.mean, null);
  assert.equal(b.steps.met, null);
  assert.equal(b.orders.share, null);
  assert.equal(b.receipts.share, null);
  assert.match(benefitReport(b), /Manual steps per order: no data .* NO DATA/);
});

test("orders nobody decided stay out of the step count, and each target is checked against its own number", () => {
  const b = summarise(
    [{ steps: 1, priced: true, stockChecked: true }, { steps: 3, priced: true, stockChecked: false }, { steps: null, priced: false, stockChecked: true }],
    [{ checks: codes("amount", "payee", "date", "reuse") }, { checks: codes("amount") }],
  );
  assert.equal(b.steps.mean, 2);
  assert.equal(b.steps.decided, 2);
  assert.equal(b.steps.undecided, 1);
  assert.equal(b.steps.reduction, 0.6);
  assert.equal(b.steps.met, false);
  assert.equal(b.orders.pricedAndChecked, 1);
  assert.equal(b.orders.met, false);
  assert.equal(b.receipts.share, 0.5);
  assert.deepEqual(b.receipts.missing, { payee: 1, date: 1, reuse: 1 });
});

test("a synthetic run of 20 orders is labelled as demo data and measured from what it recorded", async () => {
  const id = await runSyntheticOrders();
  workspaces.push(id);
  const orders = await db.select().from(t.orders).where(eq(t.orders.workspaceId, id));
  assert.equal(orders.length, 20);
  assert.ok(orders.every((o) => o.isDemo), "every order is labelled");
  assert.deepEqual(orders.map((o) => o.status).sort().filter((s, i, a) => a.indexOf(s) === i), ["cancelled", "confirmed"], "each one was decided by a person");
  assert.equal(orders.filter((o) => o.status === "cancelled").length, 2);

  const b = await measureBenefit(id, { demo: true });
  assert.equal(b.steps.decided, 20);
  assert.equal(b.steps.mean, 1.1, "18 orders at one step, 2 that needed a second receipt at two");
  assert.equal(b.orders.pricedAndChecked, 20);
  assert.equal(b.receipts.total, 22);
  assert.equal(b.receipts.fullyChecked, 22);
  assert.equal((await measureBenefit(id)).orders.total, 0, "test records never count as real ones");
});

test("the Today panel's rows carry the baseline, targets and counts, and nothing measured stays no data", () => {
  const empty = benefitRows(summarise([], []));
  assert.deepEqual(empty.map((r) => [r.measured, r.met]), [[null, null], [null, null], [null, null]]);
  assert.equal(empty[0].baseline, "5");

  const rows = benefitRows(summarise(
    [{ steps: 1, priced: true, stockChecked: true }, { steps: 2, priced: true, stockChecked: true }, { steps: null, priced: true, stockChecked: false }],
    [{ checks: codes("amount", "payee", "date", "reuse") }],
  ));
  assert.deepEqual(rows[0], { label: "Manual steps per order", baseline: "5", target: "1 or fewer", measured: "1.50", counted: "2 orders decided, 1 not decided yet", met: false });
  assert.deepEqual(rows[1], { label: "Orders priced and stock-checked", baseline: null, target: "90.0% or more", measured: "66.7%", counted: "2 of 3 orders", met: false });
  assert.deepEqual(rows[2], { label: "Receipts checked for amount, payee, date and reuse", baseline: null, target: "100.0%", measured: "100.0%", counted: "1 of 1 receipt", met: true });
});

test("the panel never calls simulator or sample orders real, and never adds customer, test and demo numbers together", async () => {
  const { workspaceId } = await createWorkspace({ name: "Labels", timezone: "Asia/Kuala_Lumpur", owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  workspaces.push(workspaceId);
  const order = (refCode: string, channel: "whatsapp" | "simulator", isDemo = false) => ({ workspaceId, refCode: `${refCode}-${Math.random().toString(36).slice(2, 8)}`, customerName: "Sample", totalMinor: 100, currency: "MYR", channel, isDemo });
  await db.insert(t.orders).values([order("WA1", "whatsapp"), order("WA2", "whatsapp"), order("SIM", "simulator"), order("D1", "simulator", true), order("D2", "simulator", true), order("D3", "whatsapp", true), order("D4", "whatsapp", true)]);
  const counts = (sets: Awaited<ReturnType<typeof benefitSets>>) => sets.map((s) => [s.kind, s.label, s.rows[1].counted.split(" of ")[1]]);

  const own = { id: workspaceId, settings: {} };
  assert.deepEqual(counts(await benefitSets(own, true)), [["real", "Customer orders", "2 orders"], ["test", "Test orders", "1 order"], ["demo", "Demo data", "4 orders"]]);
  assert.deepEqual((await benefitSets(own, false)).map((s) => s.kind), ["real", "test"], "demo stays out when it's switched off");

  const sample = await benefitSets({ id: workspaceId, settings: { sample: true } }, true);
  assert.deepEqual(counts(sample), [["test", "Test orders", "3 orders"], ["demo", "Demo data", "4 orders"]]);
  assert.ok(sample.every((s) => s.kind !== "real" && !/customer orders|real orders/i.test(s.label)), "nothing on a sample business is called real");
  assert.ok(sample.every((s) => s.note), "each test set says what it is");

  // A real business with no simulator orders has no test table to explain.
  await db.delete(t.orders).where(and(eq(t.orders.workspaceId, workspaceId), eq(t.orders.channel, "simulator")));
  assert.deepEqual((await benefitSets(own, false)).map((s) => s.kind), ["real"]);
});

test("a staff chat message before the decision counts as a step", async () => {
  const id = await runSyntheticOrders();
  workspaces.push(id);
  const [order] = await db.select().from(t.orders).where(eq(t.orders.workspaceId, id));
  const before = (await measureBenefit(id, { demo: true })).steps.mean!;
  await db.insert(t.messages).values({ workspaceId: id, threadId: order.threadId!, direction: "out", author: "staff", text: "Checking", status: "sent", createdAt: new Date(order.createdAt.getTime() + 1) });
  assert.equal(((await measureBenefit(id, { demo: true })).steps.mean! * 20) - before * 20, 1);
});
