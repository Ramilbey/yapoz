import { z } from "zod";
import { db, t } from "@/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { deliver } from "@/agent/pipeline";

export const dynamic = "force-dynamic";

async function load(workspaceId: string, id: string) {
  const [thread] = await db.select().from(t.threads).where(and(eq(t.threads.id, id), eq(t.threads.workspaceId, workspaceId)));
  if (!thread) throw new HttpError(404, "Thread not found");
  return thread;
}

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const thread = await load(s.workspaceId, id);
  const [customer] = await db.select().from(t.customers).where(eq(t.customers.id, thread.customerId));
  const messages = await db.select().from(t.messages).where(eq(t.messages.threadId, id)).orderBy(asc(t.messages.createdAt));
  const runIds = messages.map((m) => m.agentRunId).filter(Boolean) as string[];
  const runs = runIds.length ? await db.select().from(t.agentRuns).where(inArray(t.agentRuns.id, runIds)) : [];
  const escalations = await db.select().from(t.escalations).where(eq(t.escalations.threadId, id)).orderBy(desc(t.escalations.createdAt));
  const bookings = await db.select().from(t.bookings).where(eq(t.bookings.threadId, id)).orderBy(desc(t.bookings.createdAt));
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
        authorName: authors.find((a) => a.id === m.authorUserId)?.name ?? null,
        run: run
          ? { model: run.model, intent: run.intent, topic: run.topic, language: run.language, sentiment: run.sentiment, confidence: run.confidence, latencyMs: run.latencyMs, outcome: run.outcome, tokens: run.inputTokens + run.outputTokens + run.cacheReadTokens + run.cacheWriteTokens, cacheRead: run.cacheReadTokens, tools: run.toolCalls.map((tc) => ({ name: tc.name, label: tc.label, ok: tc.ok, ms: tc.ms })), error: run.error }
          : null,
      };
    }),
    escalations,
    bookings,
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
      await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "staff.reply", props: { threadId: id } });
      return ok(r);
    }
    case "takeover":
      await db.update(t.threads).set({ aiPaused: true, takenOverBy: s.userId }).where(eq(t.threads.id, id));
      await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "thread.takeover", props: { threadId: id } });
      return ok({ ok: true });
    case "release":
      await db.update(t.threads).set({ aiPaused: false, takenOverBy: null }).where(eq(t.threads.id, id));
      return ok({ ok: true });
    case "resolve":
      await db.update(t.threads).set({ status: "resolved" }).where(eq(t.threads.id, id));
      await db.update(t.escalations).set({ status: "resolved", resolvedAt: new Date(), resolvedBy: s.userId }).where(and(eq(t.escalations.threadId, id), eq(t.escalations.status, "open")));
      return ok({ ok: true });
    case "reopen":
      await db.update(t.threads).set({ status: "open" }).where(eq(t.threads.id, id));
      return ok({ ok: true });
  }
});
