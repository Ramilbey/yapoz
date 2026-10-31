// Unit cost per order: price table maths and a report over seeded agent_runs and orders.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { createWorkspace } from "../src/lib/workspace";
import { costOf, costReport, costSection, priceFor } from "../src/lib/cost";

let W = "";
let threadId = "";
let customerId = "";
const OLD = new Date("2020-01-01T00:00:00Z");

const run = (model: string, tok: [number, number, number, number], createdAt = new Date(), isDemo = false) =>
  db.insert(t.agentRuns).values({ workspaceId: W, threadId, channel: "simulator", model, inputTokens: tok[0], outputTokens: tok[1], cacheReadTokens: tok[2], cacheWriteTokens: tok[3], outcome: "auto_resolved", isDemo, createdAt });

before(async () => {
  const tag = Math.random().toString(36).slice(2, 8);
  W = (await createWorkspace({ name: `Cost ${tag}`, timezone: "Asia/Kuala_Lumpur", owner: { name: "C", email: `cost-${tag}@example.com`, passwordHash: "x" } })).workspaceId;
  const [c] = await db.insert(t.customers).values({ workspaceId: W, channel: "simulator", externalId: `${tag}-c`, displayName: "Cust" }).returning();
  customerId = c.id;
  const [th] = await db.insert(t.threads).values({ workspaceId: W, channel: "simulator", externalThreadId: `${tag}-t`, customerId: c.id }).returning();
  threadId = th.id;
});
after(async () => {
  await db.delete(t.workspaces).where(eq(t.workspaces.id, W));
  await sql.end();
});

test("price table: free providers cost 0, known models cost per million tokens, unknown are unpriced", () => {
  assert.equal(costOf("Groq: openai/gpt-oss-20b", { input: 1e6, output: 1e6, cacheRead: 0, cacheWrite: 0 }).usd, 0);
  assert.equal(costOf("Groq: openai/gpt-oss-20b", { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 }).priced, true);
  const sonnet = costOf("claude-sonnet-5-5", { input: 1e6, output: 1e6, cacheRead: 0, cacheWrite: 0 });
  assert.equal(sonnet.usd, 18);
  assert.equal(priceFor("Mystery: model-x"), null);
  assert.deepEqual(costOf("Mystery: model-x", { input: 1e6, output: 1e6, cacheRead: 0, cacheWrite: 0 }), { usd: 0, priced: false });
});

test("report totals tokens and dollars, flags unpriced models, and divides by confirmed orders", async () => {
  await run("claude-sonnet-5-5", [1_000_000, 100_000, 0, 0]); // 3 + 1.5 = 4.5
  await run("Groq: openai/gpt-oss-20b", [500, 50, 0, 0]);
  await run("Mystery: model-x", [100, 10, 5, 5]);
  await run("claude-sonnet-5-5", [9_000_000, 0, 0, 0], new Date(), true); // demo: excluded
  await run("claude-sonnet-5-5", [9_000_000, 0, 0, 0], OLD); // before `since`
  const mk = (ref: string, confirmedAt: Date | null) =>
    db.insert(t.orders).values({ workspaceId: W, threadId, customerId, refCode: ref, customerName: "Cust", totalMinor: 100, currency: "MYR", confirmedAt, status: confirmedAt ? "confirmed" : "pending" });
  await mk(`C1${W.slice(-4)}`, new Date());
  await mk(`C2${W.slice(-4)}`, new Date());
  await mk(`C3${W.slice(-4)}`, null);

  const since = new Date(Date.now() - 3600_000);
  const r = await costReport(W, { since });
  assert.equal(r.runs, 3);
  assert.equal(r.tokens.input, 1_000_600);
  assert.equal(r.tokens.total, 1_000_600 + 100_060 + 5 + 5);
  assert.ok(Math.abs(r.estimatedUsd - 4.5) < 1e-9);
  assert.deepEqual(r.unpriced, ["Mystery: model-x"]);
  assert.equal(r.ordersCompleted, 2);
  assert.ok(Math.abs((r.avgUsdPerOrder ?? 0) - 2.25) < 1e-9);
  assert.match(costSection(r), /ESTIMATE[\s\S]*UNPRICED[\s\S]*Price table assumed/);

  const all = await costReport(W);
  assert.equal(all.runs, 4); // the old run is back, demo still out
});

test("no confirmed orders gives no average, never a zero", async () => {
  const empty = await createWorkspace({ name: `Cost empty ${Math.random()}`, timezone: "Asia/Kuala_Lumpur", owner: { name: "E", email: `e-${Math.random()}@example.com`, passwordHash: "x" } });
  try {
    const r = await costReport(empty.workspaceId);
    assert.equal(r.avgUsdPerOrder, null);
    assert.equal(r.runs, 0);
    assert.match(costSection(r), /no data/);
  } finally {
    await db.delete(t.workspaces).where(eq(t.workspaces.id, empty.workspaceId));
  }
});
