import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { DEMO_NAMES, type DemoTurn, weightedLibrary, rng } from "./library";

type Channel = "telegram" | "whatsapp" | "simulator";

function pickChannel(r: number): Channel {
  if (r < 0.55) return "telegram";
  if (r < 0.85) return "whatsapp";
  return "simulator";
}

export async function insertDemoTurn(workspaceId: string, timeZone: string, turn: DemoTurn, at: Date, rand: () => number) {
  const channel = pickChannel(rand());
  const name = DEMO_NAMES[Math.floor(rand() * DEMO_NAMES.length)];
  const ext = `demo-${Math.floor(rand() * 1e9).toString(36)}`;

  const [customer] = await db
    .insert(t.customers)
    .values({ workspaceId, channel, externalId: ext, displayName: name, language: "en", createdAt: at, lastSeenAt: at })
    .returning();
  const replyAt = new Date(at.getTime() + 1200 + Math.floor(rand() * 2400));
  const [thread] = await db
    .insert(t.threads)
    .values({
      workspaceId, channel, externalThreadId: ext, customerId: customer.id,
      status: "resolved",
      isDemo: true, lastMessageAt: replyAt, lastInboundAt: at, lastPreview: turn.out, createdAt: at,
    })
    .returning();

  const [inbound] = await db
    .insert(t.messages)
    .values({ workspaceId, threadId: thread.id, direction: "in", author: "customer", text: turn.in, status: "received", isDemo: true, createdAt: at })
    .returning();

  const latency = replyAt.getTime() - at.getTime();
  const [run] = await db
    .insert(t.agentRuns)
    .values({
      workspaceId, threadId: thread.id, inboundMessageId: inbound.id, channel,
      model: turn.outcome === "escalated" && !turn.gap ? "claude-sonnet-5-5" : "claude-haiku-5-5",
      intent: turn.intent, topic: turn.topic, language: "en", sentiment: turn.sentiment,
      confidence: 0.8 + rand() * 0.19,
      toolCalls: turn.tools.map((x) => ({ name: x.name, label: x.label, input: {}, output: { demo: true }, ms: 4 + Math.floor(rand() * 30), ok: true })),
      latencyMs: latency, firstResponseMs: latency,
      inputTokens: 300 + Math.floor(rand() * 400), outputTokens: 40 + Math.floor(rand() * 90),
      cacheReadTokens: 3800 + Math.floor(rand() * 300), cacheWriteTokens: 0,
      outcome: turn.outcome, isDemo: true, createdAt: replyAt,
    })
    .returning();

  await db.insert(t.messages).values({
    workspaceId, threadId: thread.id, direction: "out", author: "ai", text: turn.out, status: "sent", agentRunId: run.id, isDemo: true, createdAt: replyAt,
  });

  if (turn.escalation) {
    await db.insert(t.escalations).values({
      workspaceId, threadId: thread.id, agentRunId: run.id, reason: turn.escalation.reason, category: turn.escalation.category,
      priority: turn.escalation.priority, summary: turn.escalation.summary,
      status: "resolved", resolvedAt: new Date(replyAt.getTime() + 20 * 60_000), isDemo: true, createdAt: replyAt,
    });
  }
  if (turn.gap) {
    await db
      .insert(t.knowledgeGaps)
      .values({ workspaceId, key: turn.gap.key, question: turn.gap.question, count: 1, isDemo: true, firstAskedAt: at, lastAskedAt: at })
      .onConflictDoUpdate({
        target: [t.knowledgeGaps.workspaceId, t.knowledgeGaps.key],
        set: { count: sql`${t.knowledgeGaps.count} + 1`, lastAskedAt: sql`greatest(${t.knowledgeGaps.lastAskedAt}, excluded.last_asked_at)` },
      });
  }
  await db.insert(t.events).values([
    { workspaceId, type: "message.received", props: { channel, topic: turn.topic }, isDemo: true, createdAt: at },
    { workspaceId, type: "message.answered", props: { channel, outcome: turn.outcome, latencyMs: latency }, isDemo: true, createdAt: replyAt },
  ]);
  return { threadId: thread.id };
}

/** One live tick of "Demo traffic": a replayed conversation timestamped now. */
export async function demoTick(workspaceId: string, timeZone: string) {
  const lib = weightedLibrary();
  const rand = rng(Date.now() & 0xffffffff);
  const turn = lib[Math.floor(rand() * lib.length)];
  // Keep live demo replays out of the "Needs you" queue: they're logged as resolved demo escalations.
  return insertDemoTurn(workspaceId, timeZone, turn, new Date(Date.now() - 2500), rand);
}

export async function clearDemoData(workspaceId: string) {
  await db.delete(t.threads).where(and(eq(t.threads.workspaceId, workspaceId), eq(t.threads.isDemo, true)));
  await db.delete(t.knowledgeGaps).where(and(eq(t.knowledgeGaps.workspaceId, workspaceId), eq(t.knowledgeGaps.isDemo, true)));
  await db.delete(t.events).where(and(eq(t.events.workspaceId, workspaceId), eq(t.events.isDemo, true)));
  await db.execute(sql`delete from customers c where c.workspace_id = ${workspaceId} and c.external_id like 'demo-%'`);
}
