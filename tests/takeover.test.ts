// A takeover nobody released: after 2 hours without a staff message the AI answers again, and the Activity log says why.
// AI calls are stubbed to fail, because whether the AI replies well isn't the point here.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { respond } from "../src/agent/pipeline";
import { categoryOf, describe } from "../src/lib/activity";
import { createWorkspace } from "../src/lib/workspace";

const realFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  throw new TypeError("no network in this test");
}) as typeof fetch;

const workspaces: string[] = [];
after(async () => {
  globalThis.fetch = realFetch;
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await sql.end();
});

const HOUR = 3_600_000;

/** A taken-over simulator chat, optionally with a staff message that long ago, and a new customer message waiting. */
async function pausedChat(staffHoursAgo: number | null) {
  const { workspaceId } = await createWorkspace({ name: "Takeover", timezone: "Asia/Kuala_Lumpur", owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  workspaces.push(workspaceId);
  const [customer] = await db.insert(t.customers).values({ workspaceId, channel: "simulator", externalId: `s-${Math.random()}`, displayName: "Sample" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId, channel: "simulator", externalThreadId: `s-${Math.random()}`, customerId: customer.id, lastInboundAt: new Date(), aiPaused: true }).returning();
  if (staffHoursAgo !== null) await db.insert(t.messages).values({ workspaceId, threadId: thread.id, direction: "out", author: "staff", text: "On it", status: "sent", createdAt: new Date(Date.now() - staffHoursAgo * HOUR) });
  const [inbound] = await db.insert(t.messages).values({ workspaceId, threadId: thread.id, direction: "in", author: "customer", text: "Hello?", status: "received" }).returning();
  return { workspaceId, thread, inbound };
}
const resumed = (workspaceId: string) => db.select().from(t.events).where(and(eq(t.events.workspaceId, workspaceId), eq(t.events.type, "thread.ai_resumed")));
const paused = async (threadId: string) => (await db.select().from(t.threads).where(eq(t.threads.id, threadId)))[0].aiPaused;

test("a takeover quiet for 2 hours hands the chat back and logs the thread and the reason", async () => {
  const { workspaceId, thread, inbound } = await pausedChat(3);
  await respond(thread.id, inbound.id);
  assert.equal(await paused(thread.id), false);
  const [event, ...rest] = await resumed(workspaceId);
  assert.equal(rest.length, 0);
  assert.deepEqual(event.props, { threadId: thread.id, reason: "staff_idle", idleHours: 2 });
  assert.equal(event.isDemo, false);
  const line = describe(event.type, event.props as Record<string, unknown>, "MYR");
  assert.deepEqual(line, { text: "AI resumed after 2 hours without a staff message", level: "info" });
  assert.equal(categoryOf(event.type), "chats");
});

test("two messages at once log it once", async () => {
  const { workspaceId, thread, inbound } = await pausedChat(3);
  // The lock lets both see the chat as paused, then makes them queue at the update, so they always collide.
  let both: Promise<unknown> = Promise.resolve();
  await db.transaction(async (tx) => {
    await tx.select().from(t.threads).where(eq(t.threads.id, thread.id)).for("update");
    both = Promise.all([respond(thread.id, inbound.id), respond(thread.id, inbound.id)]);
    await new Promise((r) => setTimeout(r, 300));
  });
  await both;
  assert.equal((await resumed(workspaceId)).length, 1);
});

test("a recent staff message, or a takeover with no staff message at all, keeps the AI paused and logs nothing", async () => {
  for (const hours of [1, null]) {
    const { workspaceId, thread, inbound } = await pausedChat(hours);
    assert.equal((await respond(thread.id, inbound.id)).skipped, "takeover");
    assert.equal(await paused(thread.id), true);
    assert.equal((await resumed(workspaceId)).length, 0);
  }
});
