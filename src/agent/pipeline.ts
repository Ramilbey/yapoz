import type Anthropic from "@anthropic-ai/sdk";
import { db, t } from "@/db";
import { and, desc, eq, gt, lte, ne, sql } from "drizzle-orm";
import { claude, addUsage, textOf, type Usage } from "./claude";
import { explainAiError } from "./ai-router";
import { knowledge, type Workspace } from "./knowledge";
import { rules, contextBlock } from "./prompt";
import { classify, type Classification } from "./classify";
import { TOOLS, runTool, openGapKeys, type ToolContext } from "./tools";
import { env } from "@/lib/env";
import { addLocalDays, localDate, zoned, fmt } from "@/lib/time";
import { adapterFor } from "@/channels";
import type { Attachment, ToolCallLog } from "@/db/schema";

export type ChannelType = "telegram" | "whatsapp" | "instagram" | "simulator";

/** Every channel normalizes inbound events into this shape. */
export type InboundEvent = {
  workspaceId: string;
  channel: ChannelType;
  externalThreadId: string;
  customer: { externalId: string; displayName?: string | null; username?: string | null; phone?: string | null; language?: string | null };
  text: string;
  attachments: Attachment[];
  receivedAt: Date;
  externalMessageId?: string | null;
  routing?: Record<string, string | number | null>;
  accent?: string | null;
};

export async function ingest(e: InboundEvent) {
  const [customer] = await db
    .insert(t.customers)
    .values({
      workspaceId: e.workspaceId, channel: e.channel, externalId: e.customer.externalId,
      displayName: e.customer.displayName ?? null, username: e.customer.username ?? null, phone: e.customer.phone ?? null, lastSeenAt: e.receivedAt,
    })
    .onConflictDoUpdate({
      target: [t.customers.workspaceId, t.customers.channel, t.customers.externalId],
      set: {
        lastSeenAt: e.receivedAt,
        displayName: sql`coalesce(${e.customer.displayName ?? null}, ${t.customers.displayName})`,
        username: sql`coalesce(${e.customer.username ?? null}, ${t.customers.username})`,
      },
    })
    .returning();

  const preview = e.text.slice(0, 160) || (e.attachments[0] ? `[${e.attachments[0].kind}]` : "");
  const [thread] = await db
    .insert(t.threads)
    .values({
      workspaceId: e.workspaceId, channel: e.channel, externalThreadId: e.externalThreadId, customerId: customer.id,
      routing: e.routing ?? {}, accent: e.accent ?? null, lastMessageAt: e.receivedAt, lastInboundAt: e.receivedAt, lastPreview: preview,
    })
    .onConflictDoUpdate({
      target: [t.threads.workspaceId, t.threads.channel, t.threads.externalThreadId],
      set: {
        lastMessageAt: e.receivedAt, lastInboundAt: e.receivedAt, lastPreview: preview,
        routing: sql`${t.threads.routing} || ${JSON.stringify(e.routing ?? {})}::jsonb`,
        status: sql`case when ${t.threads.status} = 'resolved' then 'open'::thread_status else ${t.threads.status} end`,
        accent: sql`coalesce(${e.accent ?? null}, ${t.threads.accent})`,
      },
    })
    .returning();

  if (e.externalMessageId) {
    const [dupe] = await db
      .select({ id: t.messages.id })
      .from(t.messages)
      .where(and(eq(t.messages.threadId, thread.id), eq(t.messages.externalMessageId, e.externalMessageId), eq(t.messages.direction, "in")))
      .limit(1);
    if (dupe) return { thread, customer, messageId: dupe.id, duplicate: true };
  }
  const [msg] = await db
    .insert(t.messages)
    .values({ workspaceId: e.workspaceId, threadId: thread.id, direction: "in", author: "customer", text: e.text, attachments: e.attachments, status: "received", externalMessageId: e.externalMessageId ?? null, createdAt: e.receivedAt })
    .returning();
  await db.insert(t.events).values({ workspaceId: e.workspaceId, type: "message.received", props: { channel: e.channel, threadId: thread.id } });
  return { thread, customer, messageId: msg.id, duplicate: false };
}

export type RespondResult = {
  skipped?: "takeover" | "superseded" | "duplicate" | "not_live";
  reply?: string;
  status?: "sent" | "pending_approval" | "failed" | "discarded";
  outcome?: string;
  tools?: ToolCallLog[];
  escalated?: { category: string; summary: string }[];
  booking?: { refCode: string } | null;
  latencyMs?: number;
  model?: string;
  runId?: string;
  error?: string;
};

function routeModel(text: string, historyLen: number, attachments: number): string {
  const questions = (text.match(/\?/g) ?? []).length;
  if (text.length > 320 || questions >= 3 || historyLen > 14 || attachments > 0) return env.smartModel;
  return env.fastModel;
}

function calendar(ws: Workspace, now: Date): string[] {
  const today = localDate(now, ws.timezone);
  return Array.from({ length: 14 }, (_, i) => {
    const d = addLocalDays(today, i);
    const label = fmt(zoned(d, "12:00", ws.timezone), ws.timezone, "EEE d MMM");
    return `${label} = ${d}${i === 0 ? " (today)" : i === 1 ? " (tomorrow)" : ""}`;
  });
}

const DEFAULT_HOLD = "Thanks for your message! I've passed this to our team and someone will reply here shortly.";

/** Run the inbox agent for one inbound message and deliver (or draft) the reply. */
export async function respond(threadId: string, inboundMessageId: string, opts: { isDemo?: boolean } = {}): Promise<RespondResult> {
  const started = Date.now();
  const [thread] = await db.select().from(t.threads).where(eq(t.threads.id, threadId));
  if (!thread) throw new Error("thread not found");
  if (thread.aiPaused) return { skipped: "takeover" };
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, thread.workspaceId));
  // Until the owner presses Go live, real channels only collect messages; the dashboard simulator always answers.
  if (!ws.settings.live && thread.channel !== "simulator") return { skipped: "not_live" };
  const [customer] = await db.select().from(t.customers).where(eq(t.customers.id, thread.customerId));
  const [channelRow] = await db.select().from(t.channels).where(and(eq(t.channels.workspaceId, ws.id), eq(t.channels.type, thread.channel)));
  const mode = channelRow?.mode ?? "autopilot";
  const [inbound] = await db.select().from(t.messages).where(eq(t.messages.id, inboundMessageId));
  void adapterFor(thread.channel).typing?.(thread).catch(() => {});

  const historyRows = await db
    .select()
    .from(t.messages)
    .where(and(eq(t.messages.threadId, threadId), ne(t.messages.status, "pending_approval"), ne(t.messages.status, "discarded"), lte(t.messages.createdAt, inbound.createdAt)))
    .orderBy(desc(t.messages.createdAt))
    .limit(20);
  historyRows.reverse();
  const convo: Anthropic.Messages.MessageParam[] = [];
  for (const m of historyRows) {
    const role = m.direction === "in" ? "user" : "assistant";
    const text = (m.author === "staff" ? "[staff] " : "") + (m.text || (m.attachments.length ? `[sent a ${m.attachments[0].kind}]` : ""));
    if (!text.trim()) continue;
    const last = convo[convo.length - 1];
    if (last && last.role === role) last.content = `${last.content as string}\n${text}`;
    else convo.push({ role, content: text });
  }
  while (convo.length && convo[0].role !== "user") convo.shift();

  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const ctx: ToolContext = {
    ws, catalog: (await knowledge(ws)).catalog, threadId, customerId: customer.id,
    customerName: customer.displayName ?? customer.username ?? "", channel: thread.channel, escalations: [], bookings: [], isDemo: opts.isDemo,
  };
  const toolLog: ToolCallLog[] = [];
  const latest = inbound.text || "(no text)";
  const recent = historyRows.slice(-5, -1).map((m) => `${m.direction === "in" ? "Customer" : "Us"}: ${m.text}`).join("\n");
  let model = routeModel(latest, historyRows.length, inbound.attachments.length);
  // The provider and model that actually wrote the reply (the cascade may fall back), for agent_runs.
  let answeredBy: string | undefined;
  let reply = "";
  let error: string | undefined;
  let cls: Classification | null = null;

  if (!env.hasAnthropic) {
    error = "ANTHROPIC_API_KEY is not set";
    reply = DEFAULT_HOLD;
    await runTool(ctx, "escalate", { category: "other", priority: "high", reason: "AI not configured", summary: `AI is offline (no API key). Customer wrote: ${latest.slice(0, 160)}` }, latest);
    model = "none";
  } else {
    try {
      const kb = await knowledge(ws);
      const gaps = await openGapKeys(ws.id);
      const system: Anthropic.Messages.TextBlockParam[] = [
        { type: "text", text: rules(ws), cache_control: { type: "ephemeral" } },
        { type: "text", text: kb.block, cache_control: { type: "ephemeral" } },
        {
          type: "text",
          text: contextBlock({
            now: `${fmt(new Date(), ws.timezone, "EEEE d MMMM yyyy, h:mmaaa")} (${ws.timezone})`,
            calendar: calendar(ws, new Date()),
            channel: thread.channel === "simulator" ? `web simulator (shown as ${thread.accent ?? "chat"})` : thread.channel,
            customerName: ctx.customerName || null,
            gaps,
            mode,
          }),
        },
      ];
      const [c, agentText] = await Promise.all([
        classify(ws.name, ws.settings.business?.type ?? "", recent, latest, usage),
        (async () => {
          const messages = [...convo];
          for (let step = 0; step < 6; step++) {
            const res = await claude().messages.create({ model, max_tokens: 800, temperature: 0.3, system, tools: TOOLS, messages });
            addUsage(usage, res.usage);
            if (res.model) answeredBy = res.model;
            const uses = res.content.filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
            if (res.stop_reason !== "tool_use" || !uses.length) return textOf(res);
            messages.push({ role: "assistant", content: res.content });
            const results = await Promise.all(uses.map((u) => runTool(ctx, u.name, u.input as Record<string, unknown>, latest)));
            toolLog.push(...results);
            messages.push({
              role: "user",
              content: uses.map((u, i) => ({ type: "tool_result" as const, tool_use_id: u.id, content: JSON.stringify(results[i].output), is_error: !results[i].ok })),
            });
          }
          return "";
        })(),
      ]);
      cls = c;
      reply = agentText;

      // Safety net: serious escalation categories always land with a human.
      const threshold = ws.settings.confidenceThreshold ?? 0.55;
      if (cls && !ctx.escalations.length && cls.must_escalate && cls.escalate_category) {
        toolLog.push(await runTool(ctx, "escalate", { category: cls.escalate_category, priority: ["complaint", "refund", "legal", "allergy", "medical", "abuse"].includes(cls.escalate_category) ? "high" : "normal", reason: `Auto: ${cls.escalate_category}`, summary: cls.summary }, latest));
        reply = cls.holding_reply || DEFAULT_HOLD;
      } else if (!reply) {
        if (cls && !ctx.escalations.length && cls.confidence < threshold && cls.intent !== "greeting" && cls.intent !== "off_topic") {
          toolLog.push(await runTool(ctx, "escalate", { category: "low_confidence", priority: "normal", reason: `Low confidence (${cls.confidence.toFixed(2)})`, summary: cls.summary }, latest));
        }
        reply = cls?.holding_reply || DEFAULT_HOLD;
        if (!ctx.escalations.length) toolLog.push(await runTool(ctx, "escalate", { category: "other", priority: "normal", reason: "Agent produced no reply", summary: latest.slice(0, 200) }, latest));
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      console.error("[agent] failed", e);
      reply = DEFAULT_HOLD;
      // The reason goes to staff only (Needs you, Inbox); the customer gets the holding reply above.
      if (!ctx.escalations.length) toolLog.push(await runTool(ctx, "escalate", { category: "other", priority: "high", reason: "AI error", summary: `AI couldn't answer (${explainAiError(e)}). Customer wrote: ${latest.slice(0, 60)}` }, latest));
    }
  }

  const outcome = error
    ? "error"
    : ctx.escalations.length
      ? "escalated"
      : ctx.bookings.length
        ? "booked"
        : cls?.intent === "off_topic"
          ? "declined"
          : mode === "copilot"
            ? "drafted"
            : "auto_resolved";

  // A newer customer message arrived while we were thinking: let that run answer with full context.
  const [newer] = await db
    .select({ id: t.messages.id })
    .from(t.messages)
    .where(and(eq(t.messages.threadId, threadId), eq(t.messages.direction, "in"), gt(t.messages.createdAt, inbound.createdAt)))
    .limit(1);

  const latencyMs = Date.now() - started;
  const [run] = await db
    .insert(t.agentRuns)
    .values({
      workspaceId: ws.id, threadId, inboundMessageId, channel: thread.channel, model: answeredBy ?? model,
      intent: cls?.intent ?? null, topic: cls?.topic ?? null, language: cls?.language ?? null, sentiment: cls?.sentiment ?? null, confidence: cls?.confidence ?? null,
      toolCalls: toolLog, latencyMs, firstResponseMs: Date.now() - inbound.createdAt.getTime(),
      inputTokens: usage.input, outputTokens: usage.output, cacheReadTokens: usage.cacheRead, cacheWriteTokens: usage.cacheWrite,
      outcome, error: error ?? null, isDemo: Boolean(opts.isDemo),
    })
    .returning();
  if (cls?.language) await db.update(t.customers).set({ language: cls.language }).where(eq(t.customers.id, customer.id));

  if (newer) {
    return { skipped: "superseded", runId: run.id, outcome, latencyMs, model: answeredBy ?? model };
  }

  const status = mode === "copilot" && !error ? "pending_approval" : "sent";
  const sent = await deliver(thread, reply, { author: "ai", agentRunId: run.id, status, isDemo: opts.isDemo });
  await db.insert(t.events).values({ workspaceId: ws.id, type: "message.answered", props: { channel: thread.channel, outcome, latencyMs, threadId }, isDemo: Boolean(opts.isDemo) });
  return {
    reply, status: sent.status, outcome, tools: toolLog, escalated: ctx.escalations.map((e) => ({ category: e.category, summary: e.summary })),
    booking: ctx.bookings[0] ? { refCode: ctx.bookings[0].refCode } : null, latencyMs, model: answeredBy ?? model, runId: run.id, error,
  };
}

type ThreadRow = typeof t.threads.$inferSelect;

/** Insert an outbound message and push it through the channel adapter (unless it's a draft). */
export async function deliver(
  thread: ThreadRow,
  text: string,
  o: { author: "ai" | "staff" | "system"; agentRunId?: string; userId?: string; status?: "sent" | "pending_approval"; isDemo?: boolean; buttons?: { text: string; data: string }[][] },
) {
  const [msg] = await db
    .insert(t.messages)
    .values({
      workspaceId: thread.workspaceId, threadId: thread.id, direction: "out", author: o.author, authorUserId: o.userId ?? null, text,
      status: o.status === "pending_approval" ? "pending_approval" : "sent", agentRunId: o.agentRunId ?? null, isDemo: Boolean(o.isDemo),
    })
    .returning();
  if (o.status === "pending_approval") {
    await db.update(t.threads).set({ lastMessageAt: new Date() }).where(eq(t.threads.id, thread.id));
    return { id: msg.id, status: "pending_approval" as const };
  }
  return sendExisting(thread, msg.id, text, o.buttons);
}

export async function sendExisting(thread: ThreadRow, messageId: string, text: string, buttons?: { text: string; data: string }[][]) {
  try {
    const r = await adapterFor(thread.channel).send(thread, text, { buttons });
    await db.update(t.messages).set({ status: "sent", externalMessageId: r.externalMessageId ?? null, text, createdAt: new Date() }).where(eq(t.messages.id, messageId));
    await db.update(t.threads).set({ lastMessageAt: new Date(), lastPreview: text.slice(0, 160) }).where(eq(t.threads.id, thread.id));
    return { id: messageId, status: "sent" as const };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error(`[deliver:${thread.channel}]`, err);
    await db.update(t.messages).set({ status: "failed", error: err.slice(0, 500) }).where(eq(t.messages.id, messageId));
    return { id: messageId, status: "failed" as const, error: err };
  }
}

/** Job: ingest + respond for webhook events. */
export async function processInboundJob(payload: Record<string, unknown>) {
  const e = payload as unknown as InboundEvent & { receivedAt: string };
  const r = await ingest({ ...e, receivedAt: new Date(e.receivedAt) });
  if (r.duplicate) return;
  await respond(r.thread.id, r.messageId);
}
