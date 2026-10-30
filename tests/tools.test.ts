import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { db, t, sql } from "../src/db";
import { eq } from "drizzle-orm";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";
import { addLocalDays, localDate, localWeekday, zoned } from "../src/lib/time";

async function ctx(wsId = "FORNO7"): Promise<ToolContext> {
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, wsId));
  const [customer] = await db.insert(t.customers).values({ workspaceId: ws.id, channel: "simulator", externalId: `test-${Date.now()}`, displayName: "Test Guest" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: ws.id, channel: "simulator", externalThreadId: `test-${Date.now()}`, customerId: customer.id }).returning();
  const kb = await knowledge(ws);
  return { ws, catalog: kb.catalog, threadId: thread.id, customerId: customer.id, customerName: "Test Guest", channel: "simulator", escalations: [] };
}
function nextWeekday(wd: string) {
  const today = localDate(new Date(), "Asia/Kuala_Lumpur");
  for (let i = 1; i <= 7; i++) {
    const d = addLocalDays(today, i);
    if (localWeekday(zoned(d, "12:00", "Asia/Kuala_Lumpur"), "Asia/Kuala_Lumpur") === wd) return d;
  }
  throw new Error("no day");
}

after(async () => { await sql.end(); });

test("check_variant: large margherita price", async () => {
  const c = await ctx();
  const r = await runTool(c, "check_variant", { product: "margherita", size: "large" }, "");
  const out = r.output as { variants: { price: string }[]; available: boolean };
  assert.equal(out.variants[0].price, "RM 52");
  assert.equal(out.available, true);
  assert.match(r.label, /Large Margherita ✓/);
});

test("check_variant: truffle sold out today", async () => {
  const c = await ctx();
  const r = await runTool(c, "check_variant", { product: "truffle" }, "");
  assert.equal((r.output as { available: boolean }).available, false);
  assert.match(r.label, /sold out/i);
});

test("check_variant: merch stock by size and colour", async () => {
  const c = await ctx();
  const r = await runTool(c, "check_variant", { product: "t-shirt", size: "XL", color: "brick red" }, "");
  const out = r.output as { variants: { inStock: boolean; stock?: number }[] };
  assert.equal(out.variants[0].stock, undefined, "the customer-facing output doesn't expose counts");
  assert.equal(out.variants[0].inStock, false);
  const r2 = await runTool(c, "check_variant", { product: "tee", size: "M", color: "black" }, "");
  assert.ok((r2.output as { colorNotFound?: string }).colorNotFound?.includes("Charcoal"));
});

test("search_catalog: vegan and gluten-free", async () => {
  const c = await ctx();
  const v = await runTool(c, "search_catalog", { query: "vegan pizza" }, "");
  assert.deepEqual((v.output as { items: { name: string }[] }).items.map((i) => i.name), ["Marinara"]);
  const g = await runTool(c, "search_catalog", { query: "gluten free base" }, "");
  assert.equal((g.output as { count: number }).count, 0);
  const s = await runTool(c, "search_catalog", { query: "spicy" }, "");
  assert.ok((s.output as { count: number }).count >= 4);
});

test("get_business_info: Monday closed, private event exception", async () => {
  const c = await ctx();
  const mon = nextWeekday("mon");
  const r = await runTool(c, "get_business_info", { topic: "hours", date: mon }, "");
  assert.equal((r.output as { days: { closed: boolean }[] }).days[0].closed, true);
  const ex = await runTool(c, "get_business_info", { topic: "hours", date: "2026-10-31" }, "");
  assert.match((ex.output as { days: { hours: string }[] }).days[0].hours, /private event/);
});

test("escalate: knowledge gap lands in Needs you", async () => {
  const c = await ctx();
  const r = await runTool(c, "escalate", { category: "knowledge_gap", priority: "low", reason: "gluten free", summary: "asks gluten free", gap_key: "gluten-free base" }, "gluten free?");
  assert.equal(r.ok, true);
  const [th] = await db.select().from(t.threads).where(eq(t.threads.id, c.threadId));
  assert.equal(th.status, "needs_human");
});

