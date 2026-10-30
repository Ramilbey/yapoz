// A new business from sign-up to a working assistant: workspace creation, a Claude-style draft (as Claude would
// return it, odd fields included) imported into Knowledge, the agent's tools answering from it, the "not live
// yet" gate on real channels, and which business the public simulator may talk to.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { db, t, sql } from "../src/db";
import { eq } from "drizzle-orm";
import { makeWorkspaceId, createWorkspace, currencyFor } from "../src/lib/workspace";
import { coerceDraft } from "../src/setup/draft";
import { importDraft } from "../src/setup/import";
import { knowledge } from "../src/agent/knowledge";
import { runTool, type ToolContext } from "../src/agent/tools";
import { ingest, respond } from "../src/agent/pipeline";
import { simulatorWorkspace } from "../src/lib/samples";

let WS = "";
const TZ = "Asia/Kuala_Lumpur";

before(async () => {
  const r = await createWorkspace({ name: "Kedai Baiki Fon Ali", timezone: TZ, owner: { name: "Ali", email: "ALI@example.com", passwordHash: "x" } });
  WS = r.workspaceId;
});
after(async () => {
  if (WS) await db.delete(t.workspaces).where(eq(t.workspaces.id, WS));
  await sql.end();
});

test("workspace IDs are short, readable and unique", async () => {
  assert.match(await makeWorkspaceId("Kasih Hair Studio"), /^KASIH\d{2,4}$/);
  assert.match(await makeWorkspaceId("Café & Co"), /^CAFE\d{2,4}$/);
  assert.match(await makeWorkspaceId("J"), /^[A-Z0-9]{3,12}$/);
  assert.match(WS, /^KEDAI\d{2,4}$/);
  assert.equal(currencyFor("Asia/Kuala_Lumpur"), "MYR");
  assert.equal(currencyFor("Europe/Berlin"), "EUR");
});

test("a new business starts with an owner, three channels, not live, setup at step 1", async () => {
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, WS));
  assert.equal(ws.currency, "MYR");
  assert.equal(ws.settings.live, false);
  assert.equal(ws.settings.onboarding.step, 1);
  const users = await db.select().from(t.users).where(eq(t.users.workspaceId, WS));
  assert.equal(users.length, 1);
  assert.equal(users[0].email, "ali@example.com");
  assert.equal(users[0].role, "owner");
  const channels = await db.select().from(t.channels).where(eq(t.channels.workspaceId, WS));
  assert.deepEqual(channels.map((c) => c.type).sort(), ["simulator", "telegram", "whatsapp"]);
});

// What Claude might send back: mostly right, with a few fields to repair.
const RAW = {
  summary: "Phone repair shop in Brickfields. Screens, batteries and charging ports for iPhone and Samsung, most repairs done the same day.",
  businessType: "phone repair shop",
  hours: { weekly: { mon: [["10:00", "19:00"]], tue: [["10:00", "19:00"]], wed: [["10:00", "19:00"]], thu: [["10:00", "19:00"]], fri: [["10:00", "19:00"]], sat: [["10:00", "17:00"]], sun: [] }, lastOrdersMinutesBeforeClose: 0, notes: "" },
  items: [
    { kind: "service", name: "iPhone 13 screen replacement", category: "Screens", description: "Original-grade OLED, 3-month warranty.", options: [{ label: "Standard", price: 380 }, { label: "Original Apple part", price: 520 }], durationMinutes: 60, tags: ["bestseller"] },
    { kind: "service", name: "Battery replacement", category: "batteries", description: "", options: [{ label: null, price: 150 }], durationMinutes: 30 },
    { kind: "product", name: "Tempered glass protector", category: "accessories", description: "Fitted free.", options: [{ label: null, price: 25, stock: 40 }] },
    { kind: "service", name: "", category: "x", description: "broken row", options: [] },
    { kind: "robot", name: "nonsense" },
  ],
  delivery: null,
  policies: [{ topic: "warranty", title: "Warranty", body: "3 months on parts and labour, not for water damage." }],
  faqs: [{ question: "can fix water damage?", answer: "We can check it for free, but we can't promise a fix.", topic: "repairs" }, { question: "", answer: "empty question" }],
  openQuestions: [{ question: "Do you take walk-ins?", why: "Customers often ask before coming" }],
};

test("a messy draft keeps every valid part and repairs keys", () => {
  const d = coerceDraft(RAW as unknown as Record<string, unknown>);
  assert.equal(d.items.length, 3, "the two broken rows are dropped");
  assert.equal(d.faqs.length, 1);
  assert.equal(d.openQuestions[0].answer, "");
  assert.deepEqual(d.hours?.weekly.sun, []);
});

test("importing the reviewed draft fills Knowledge, and the agent's tools answer from it", async () => {
  const d = coerceDraft(RAW as unknown as Record<string, unknown>);
  d.openQuestions[0].answer = "Yes, walk-ins until 6pm.";
  const r = await importDraft(WS, d, { replace: true });
  assert.deepEqual(r, { items: 3, faqs: 2, policies: 1, hours: true });

  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, WS));
  assert.equal(ws.settings.business.type, "phone repair shop");
  assert.equal(ws.settings.onboarding.step, 4);
  const kb = await knowledge(ws);
  assert.match(kb.block, /iPhone 13 screen replacement \(60 min\)/);
  assert.match(kb.block, /walk-ins until 6pm/);

  const [customer] = await db.insert(t.customers).values({ workspaceId: WS, channel: "simulator", externalId: "t1", displayName: "Test" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: WS, channel: "simulator", externalThreadId: "t1", customerId: customer.id }).returning();
  const ctx: ToolContext = { ws, catalog: kb.catalog, threadId: thread.id, customerId: customer.id, customerName: "Test", channel: "simulator", escalations: [] };

  const price = await runTool(ctx, "check_variant", { product: "iphone 13 screen", option: "original" }, "");
  assert.deepEqual((price.output as { variants: { price: string }[] }).variants.map((v) => v.price), ["RM 520"]);
  const glass = await runTool(ctx, "check_variant", { product: "tempered glass" }, "");
  assert.equal((glass.output as { variants: { inStock: boolean; stock?: number }[] }).variants[0].inStock, true);
  assert.equal((glass.output as { variants: { stock?: number }[] }).variants[0].stock, undefined, "counts aren't exposed to the customer");
  const tooMany = await runTool(ctx, "check_variant", { product: "tempered glass", quantity: 41 }, "");
  assert.equal((tooMany.output as { variants: { maxQuantity?: number }[] }).variants[0].maxQuantity, 40);
});

test("until the owner goes live, real channels are recorded but not answered (the simulator still works)", async () => {
  const r = await ingest({
    workspaceId: WS, channel: "telegram", externalThreadId: "chat:test:1", customer: { externalId: "tg1", displayName: "Sam" },
    text: "battery how much", attachments: [], receivedAt: new Date(), externalMessageId: "1", routing: { chatId: 1 },
  });
  const out = await respond(r.thread.id, r.messageId);
  assert.equal(out.skipped, "not_live");
});

test("the public simulator only talks to sample businesses (or your own when signed in)", async () => {
  assert.equal(await simulatorWorkspace("KASIH1", null), "KASIH1");
  assert.equal(await simulatorWorkspace(WS, null), null, "a real business isn't public");
  assert.equal(await simulatorWorkspace(WS, WS), WS);
  assert.equal(await simulatorWorkspace(undefined, WS), WS);
  assert.equal(await simulatorWorkspace(undefined, null), "FORNO7");
});
