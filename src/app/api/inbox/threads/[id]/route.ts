import { z } from "zod";
import { db, t } from "@/db";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { deliver } from "@/agent/pipeline";

export const dynamic = "force-dynamic";

async function load(workspaceId: string, id: string) {
  const [thread] = await db.select().from(t.threads).where(and(eq(t.threads.id, id), eq(t.threads.workspaceId, workspaceId)));
  if (!thread) throw new HttpError(404, "Thread not found");
  return thread;
}

/** Long chats load their latest messages only, so opening one stays quick. */
const MESSAGE_LIMIT = 200;

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Thread not found");
  const thread = await load(s.workspaceId, id);
  const [[customer], latest, escalations, orders] = await Promise.all([
    db.select().from(t.customers).where(eq(t.customers.id, thread.customerId)),
    db.select().from(t.messages).where(eq(t.messages.threadId, id)).orderBy(desc(t.messages.createdAt)).limit(MESSAGE_LIMIT + 1),
    db.select().from(t.escalations).where(eq(t.escalations.threadId, id)).orderBy(desc(t.escalations.createdAt)),
    db
      .select({ id: t.orders.id, refCode: t.orders.refCode, status: t.orders.status, totalMinor: t.orders.totalMinor, currency: t.orders.currency, createdAt: t.orders.createdAt, confirmedAt: t.orders.confirmedAt, receiptRequest: t.orders.receiptRequest })
      .from(t.orders)
      .where(eq(t.orders.threadId, id))
      .orderBy(desc(t.orders.createdAt))
      .limit(10),
  ]);
  const more = latest.length > MESSAGE_LIMIT;
  const messages = latest.slice(0, MESSAGE_LIMIT).reverse();
  const runIds = messages.map((m) => m.agentRunId).filter(Boolean) as string[];
  const runs = runIds.length ? await db.select().from(t.agentRuns).where(inArray(t.agentRuns.id, runIds)) : [];
  let takenOverBy: string | null = null;
  if (thread.takenOverBy) {
    const [u] = await db.select({ name: t.users.name }).from(t.users).where(eq(t.users.id, thread.takenOverBy));
    takenOverBy = u?.name ?? null;
  }
  const authorIds = [...new Set(messages.map((m) => m.authorUserId).filter(Boolean))] as string[];
  const authors = authorIds.length ? await db.select({ id: t.users.id, name: t.users.name }).from(t.users).where(inArray(t.users.id, authorIds)) : [];
  return ok({
    thread: { ...thread, takenOverByName: takenOverBy },
    customer,
    messages: messages.map((m) => {
      const run = runs.find((r) => r.id === m.agentRunId);
      return {
        ...m,
        attachments: m.attachments.map((a) => ({ kind: a.kind, name: a.name })),
        authorName: authors.find((a) => a.id === m.authorUserId)?.name ?? null,
        run: run
          ? { model: run.model, intent: run.intent, topic: run.topic, language: run.language, sentiment: run.sentiment, confidence: run.confidence, latencyMs: run.latencyMs, outcome: run.outcome, tokens: run.inputTokens + run.outputTokens + run.cacheReadTokens + run.cacheWriteTokens, cacheRead: run.cacheReadTokens, tools: run.toolCalls.map((tc) => ({ name: tc.name, label: tc.label, ok: tc.ok, ms: tc.ms })), error: run.error }
          : null,
      };
    }),
    escalations,
    orders,
    more,
    canDelete: s.role === "owner",
  });
});

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reply"), text: z.string().trim().min(1).max(4000) }),
  z.object({ action: z.literal("takeover") }),
  z.object({ action: z.literal("release") }),
  z.object({ action: z.literal("resolve") }),
  z.object({ action: z.literal("reopen") }),
]);

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const a = await body(req, Action);
  const thread = await load(s.workspaceId, id);
  switch (a.action) {
    case "reply": {
      // A human replying takes the thread over so the AI doesn't talk over them.
      if (!thread.aiPaused) await db.update(t.threads).set({ aiPaused: true, takenOverBy: s.userId }).where(eq(t.threads.id, id));
      const r = await deliver({ ...thread, aiPaused: true }, a.text, { author: "staff", userId: s.userId });
      await log(s, "staff.reply", { threadId: id, status: r.status, ...("error" in r ? { error: r.error?.slice(0, 200) } : {}) });
      return ok(r);
    }
    case "takeover":
      await db.update(t.threads).set({ aiPaused: true, takenOverBy: s.userId }).where(eq(t.threads.id, id));
      await log(s, "thread.takeover", { threadId: id });
      return ok({ ok: true });
    case "release":
      await db.update(t.threads).set({ aiPaused: false, takenOverBy: null }).where(eq(t.threads.id, id));
      await log(s, "thread.release", { threadId: id });
      return ok({ ok: true });
    case "resolve":
      await db.update(t.threads).set({ status: "resolved", aiPaused: false, takenOverBy: null }).where(eq(t.threads.id, id));
      await db.update(t.escalations).set({ status: "resolved", resolvedAt: new Date(), resolvedBy: s.userId }).where(and(eq(t.escalations.threadId, id), eq(t.escalations.status, "open")));
      await log(s, "thread.resolved", { threadId: id });
      return ok({ ok: true });
    case "reopen":
      await db.update(t.threads).set({ status: "open" }).where(eq(t.threads.id, id));
      await log(s, "thread.reopened", { threadId: id });
      return ok({ ok: true });
  }
});

const log = (s: { workspaceId: string; userId: string }, type: string, props: Record<string, unknown>) => db.insert(t.events).values({ workspaceId: s.workspaceId, type, props: { ...props, by: s.userId } });

/**
 * Erase this customer (privacy request): their profile, every chat with them, and their receipt files. Orders stay for the
 * business's records but lose the name, phone and address. Owners only; it can't be undone.
 */
export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Thread not found");
  const thread = await load(s.workspaceId, id);
  const customerId = thread.customerId;
  const removed = await db.transaction(async (tx) => {
    const threads = await tx.select({ id: t.threads.id }).from(t.threads).where(and(eq(t.threads.customerId, customerId), eq(t.threads.workspaceId, s.workspaceId)));
    const threadIds = threads.map((x) => x.id);
    const orderWhere = and(eq(t.orders.workspaceId, s.workspaceId), sql`(${t.orders.customerId} = ${customerId}${threadIds.length ? sql` or ${inArray(t.orders.threadId, threadIds)}` : sql``})`);
    const orders = await tx.select({ id: t.orders.id }).from(t.orders).where(orderWhere);
    if (orders.length) {
      await tx.delete(t.orderReceipts).where(inArray(t.orderReceipts.orderId, orders.map((o) => o.id)));
      await tx.update(t.orders).set({ customerName: "Deleted customer", phone: null, address: null, notes: null }).where(orderWhere);
    }
    // Customer rows cascade to their threads, messages, AI runs and escalations.
    await tx.delete(t.customers).where(and(eq(t.customers.id, customerId), eq(t.customers.workspaceId, s.workspaceId)));
    // Logged events may name the thread; drop their copies of anything the customer wrote.
    if (threadIds.length) await tx.delete(t.events).where(and(eq(t.events.workspaceId, s.workspaceId), isNotNull(t.events.props), inArray(sql`${t.events.props}->>'threadId'`, threadIds), inArray(t.events.type, ["message.received", "order.attempt_failed"])));
    return { threads: threadIds.length, orders: orders.length };
  });
  await log(s, "privacy.customer_deleted", { threads: removed.threads, orders: removed.orders });
  return ok({ ok: true, ...removed });
});
