// Data export: the owner downloads only their own workspace's data, with no credentials in it, and nobody else can.
import "../scripts/env";
import { test, after, before } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { createWorkspace } from "../src/lib/workspace";
import { exportWorkspace, toCsv, tableRows } from "../src/lib/export";

let A = "";
let B = "";
const SECRET = "SECRET-TOKEN-xyz";

async function seed(workspaceId: string, tag: string) {
  const [c] = await db.insert(t.customers).values({ workspaceId, channel: "simulator", externalId: `${tag}-c`, displayName: `Cust ${tag}`, phone: "012" }).returning();
  const [th] = await db.insert(t.threads).values({ workspaceId, channel: "simulator", externalThreadId: `${tag}-t`, customerId: c.id, routing: { token: SECRET } }).returning();
  await db.insert(t.messages).values({ workspaceId, threadId: th.id, direction: "in", author: "customer", text: `hello ${tag}`, status: "received" });
  const [o] = await db.insert(t.orders).values({ workspaceId, threadId: th.id, customerId: c.id, refCode: `EX${tag}`, customerName: `Cust ${tag}`, totalMinor: 500, currency: "MYR" }).returning();
  await db.insert(t.orderItems).values({ workspaceId, orderId: o.id, name: `Item ${tag}`, quantity: 1, unitPriceMinor: 500 });
  await db.insert(t.orderReceipts).values({ workspaceId, orderId: o.id, mime: "image/png", sha256: `h${tag}`, bytes: Buffer.from("png"), verdict: "consistent" });
}

before(async () => {
  const tag = Math.random().toString(36).slice(2, 8);
  A = (await createWorkspace({ name: `Export A ${tag}`, timezone: "Asia/Kuala_Lumpur", owner: { name: "A", email: `a-${tag}@example.com`, passwordHash: "HASH-A" } })).workspaceId;
  B = (await createWorkspace({ name: `Export B ${tag}`, timezone: "Asia/Kuala_Lumpur", owner: { name: "B", email: `b-${tag}@example.com`, passwordHash: "HASH-B" } })).workspaceId;
  await db.update(t.channels).set({ credentialsEnc: SECRET }).where(eq(t.channels.workspaceId, A));
  await seed(A, "a");
  await seed(B, "b");
});
after(async () => {
  for (const id of [A, B]) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await sql.end();
});

test("the export holds this workspace's data and none of another's", async () => {
  const d = await exportWorkspace(A);
  assert.equal(d.workspace.id, A);
  assert.deepEqual(d.customers.map((c) => c.displayName), ["Cust a"]);
  assert.equal(d.threads.length, 1);
  assert.deepEqual(d.messages.map((m) => m.text), ["hello a"]);
  assert.equal(d.orders.length, 1);
  assert.deepEqual(d.orders[0].items.map((i) => i.name), ["Item a"]);
  assert.equal(d.receipts.length, 1);
  assert.ok(!JSON.stringify(d).includes("Cust b"));
  assert.ok(!JSON.stringify(d).includes("hello b"));
});

test("no credentials, password hashes, tokens or receipt bytes appear anywhere in the export", async () => {
  const text = JSON.stringify(await exportWorkspace(A));
  for (const bad of [SECRET, "HASH-A", "passwordHash", "credentialsEnc", "credentials", "token", "bytes", "routing", "sessionVersion"]) assert.ok(!text.includes(bad), `leaked ${bad}`);
});

test("CSV has a header, escapes cells and defuses spreadsheet formulas", async () => {
  const csv = toCsv([{ a: "x,y", b: '=1+1', c: 'say "hi"', d: null }]);
  assert.equal(csv, 'a,b,c,d\r\n"x,y",\'=1+1,"say ""hi""",\r\n');
  assert.equal(tableRows(await exportWorkspace(A), "order_items").length, 1);
});

test("the route is owner-only: it asks for the owner role before touching any data", async () => {
  // auth.ts is server-only (it reads request cookies) so it can't load under the test runner; check the wiring instead.
  const route = readFileSync("src/app/api/export/route.ts", "utf8");
  assert.match(route, /await apiSession\(\["owner"\]\)/);
  assert.ok(route.indexOf('apiSession(["owner"])') < route.indexOf("exportWorkspace("), "role check comes before the export");
  // ...and apiSession is what turns any other role into a 403.
  const auth = readFileSync("src/lib/auth.ts", "utf8");
  assert.match(auth, /roles && !roles\.includes\(s\.role\)\) throw new HttpError\(403/);
  assert.match(route, /audit\(s, "data\.exported"/);
});
