// The Phase 2 measures: how they're worked out (pure), then a synthetic run of 20 orders read back from its own records.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { benefitReport, measureBenefit, missingChecks, summarise } from "../src/lib/benefit";
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

test("a staff chat message before the decision counts as a step", async () => {
  const id = await runSyntheticOrders();
  workspaces.push(id);
  const [order] = await db.select().from(t.orders).where(eq(t.orders.workspaceId, id));
  const before = (await measureBenefit(id, { demo: true })).steps.mean!;
  await db.insert(t.messages).values({ workspaceId: id, threadId: order.threadId!, direction: "out", author: "staff", text: "Checking", status: "sent", createdAt: new Date(order.createdAt.getTime() + 1) });
  assert.equal(((await measureBenefit(id, { demo: true })).steps.mean! * 20) - before * 20, 1);
});
