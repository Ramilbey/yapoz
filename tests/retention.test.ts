// Retention: past the owner's period, finished orders lose the customer's details; orders in progress and newer ones keep them.
import "../scripts/env";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { createWorkspace } from "../src/lib/workspace";
import { purgeExpired } from "../src/lib/retention";
import { withPrivacyNotice } from "../src/lib/privacy-notice";

let W = "";
const old = new Date(Date.now() - 60 * 86_400_000);

const order = (ref: string, status: "completed" | "pending", createdAt: Date) =>
  db.insert(t.orders).values({ workspaceId: W, refCode: ref, customerName: "Aisha", phone: "012", address: "1 Jalan", notes: "n", status, totalMinor: 500, currency: "MYR", createdAt });

before(async () => {
  const tag = Math.random().toString(36).slice(2, 8);
  W = (await createWorkspace({ name: `Retention ${tag}`, timezone: "Asia/Kuala_Lumpur", owner: { name: "O", email: `r-${tag}@example.com`, passwordHash: "H" } })).workspaceId;
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, W));
  await db.update(t.workspaces).set({ settings: { ...ws.settings, privacy: { retentionDays: 30 } } }).where(eq(t.workspaces.id, W));
  await order("OLD1", "completed", old);
  await order("OLD2", "pending", old);
  await order("NEW1", "completed", new Date());
});
after(async () => {
  await db.delete(t.workspaces).where(eq(t.workspaces.id, W));
  await sql.end();
});

test("old finished orders are anonymised; in-progress and recent ones are not", async () => {
  await purgeExpired();
  const rows = await db.select().from(t.orders).where(eq(t.orders.workspaceId, W));
  const by = Object.fromEntries(rows.map((r) => [r.refCode, r]));
  assert.equal(by.OLD1.customerName, "Deleted customer");
  assert.equal(by.OLD1.phone, null);
  assert.equal(by.OLD1.address, null);
  assert.equal(by.OLD1.totalMinor, 500);
  assert.equal(by.OLD2.customerName, "Aisha");
  assert.equal(by.NEW1.customerName, "Aisha");
});

test("the privacy notice goes on the first reply only", () => {
  assert.match(withPrivacyNotice("Hi", true), /^Hi\n\n.*automated assistant.*\/privacy$/s);
  assert.equal(withPrivacyNotice("Hi", false), "Hi");
});
