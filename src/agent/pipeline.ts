import type Anthropic from "@anthropic-ai/sdk";
import { db, t } from "@/db";
import { and, desc, eq, gt, lte, ne, sql } from "drizzle-orm";
import { claude, addUsage, textOf, type Usage } from "./claude";
import { explainAiError } from "./ai-router";
import { acknowledgement, holdingReply } from "./acknowledge";
import { receiptIntake, orderAwaitingReceipt } from "@/lib/receipts";
import { expireDueOrders } from "@/lib/stock";
import { sendDueReminders, teamLines } from "@/lib/appointments";
import { formatMoney } from "@/lib/money";
import { gapAction, recordGap } from "@/lib/gaps";
import { knowledge, type Workspace } from "./knowledge";
import { rules, contextBlock } from "./prompt";
import { classify, type Classification } from "./classify";
import { TOOLS, runTool, openGapKeys, type ToolContext } from "./tools";
import { env } from "@/lib/env";
import { addLocalDays, localDate, zoned, fmt, human } from "@/lib/time";
import { adapterFor, type ChannelAdapter, type Inbound } from "@/channels";
import type { Attachment, ToolCallLog } from "@/db/schema";
import { log } from "@/lib/log";
import { withPrivacyNotice } from "@/lib/privacy-notice";

export type ChannelType = "telegram" | "whatsapp" | "simulator";

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

  // A channel retrying its webhook (or two deliveries racing) hits the unique index: the message is saved once and answered once.
  const [msg] = await db
    .insert(t.messages)
    .values({ workspaceId: e.workspaceId, threadId: thread.id, direction: "in", author: "customer", text: e.text, attachments: e.attachments, status: "received", externalMessageId: e.externalMessageId ?? null, createdAt: e.receivedAt })
    .onConflictDoNothing({ target: [t.messages.threadId, t.messages.externalMessageId], where: sql`direction = 'in' and external_message_id is not null` })
    .returning();
  if (!msg) {
    const [dupe] = await db
      .select({ id: t.messages.id })
      .from(t.messages)
      .where(and(eq(t.messages.threadId, thread.id), eq(t.messages.externalMessageId, e.externalMessageId!), eq(t.messages.direction, "in")))
      .limit(1);
    return { thread, customer, messageId: dupe.id, duplicate: true };
  }
  await db.insert(t.events).values({ workspaceId: e.workspaceId, type: "message.received", props: { channel: e.channel, threadId: thread.id, attachments: e.attachments.length } });
  return { thread, customer, messageId: msg.id, duplicate: false };
}

export type RespondResult = {
  skipped?: "takeover" | "superseded" | "duplicate" | "not_live";
  reply?: string;
  status?: "sent" | "pending_approval" | "failed" | "discarded";
  outcome?: string;
  tools?: ToolCallLog[];
  escalated?: { category: string; summary: string }[];
  order?: { refCode: string } | null;
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

/** How long after the last staff message an unreleased takeover lapses and the AI resumes. */
const TAKEOVER_IDLE_MS = 2 * 60 * 60_000;

const DEFAULT_HOLD = "Thanks for your message! I've passed this to our team and someone will reply here shortly.";

/** Run the inbox agent for one inbound message and deliver (or draft) the reply. */
export async function respond(threadId: string, inboundMessageId: string, opts: { isDemo?: boolean } = {}): Promise<RespondResult> {
  const started = Date.now();
  const [thread] = await db.select().from(t.threads).where(eq(t.threads.id, threadId));
  if (!thread) throw new Error("thread not found");
  if (thread.aiPaused) {
    // A takeover nobody released must not silence the customer for good: after a quiet spell the AI answers again.
    const [lastStaff] = await db
      .select({ at: t.messages.createdAt })
      .from(t.messages)
      .where(and(eq(t.messages.threadId, threadId), eq(t.messages.author, "staff"), eq(t.messages.direction, "out")))
      .orderBy(desc(t.messages.createdAt))
      .limit(1);
    // Taken over without a reply is a deliberate hold: only a staff message starts the quiet-spell clock.
    if (!lastStaff || Date.now() - lastStaff.at.getTime() < TAKEOVER_IDLE_MS) return { skipped: "takeover" };
    await db.transaction(async (tx) => {
      // Two messages can arrive together: only the one that actually hands it back logs it.
      const [resumed] = await tx.update(t.threads).set({ aiPaused: false, takenOverBy: null }).where(and(eq(t.threads.id, threadId), eq(t.threads.aiPaused, true))).returning({ id: t.threads.id });
      if (resumed) await tx.insert(t.events).values({ workspaceId: thread.workspaceId, type: "thread.ai_resumed", props: { threadId, reason: "staff_idle", idleHours: TAKEOVER_IDLE_MS / 3_600_000 }, isDemo: Boolean(opts.isDemo) });
    });
    thread.aiPaused = false;
  }
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, thread.workspaceId));
  // Until the owner presses Go live, real channels only collect messages; the dashboard simulator always answers.
  if (!ws.settings.live && thread.channel !== "simulator") return { skipped: "not_live" };
  const [customer] = await db.select().from(t.customers).where(eq(t.customers.id, thread.customerId));
  const [channelRow] = await db.select().from(t.channels).where(and(eq(t.channels.workspaceId, ws.id), eq(t.channels.type, thread.channel)));
  const mode = channelRow?.mode ?? "autopilot";
  const [inbound] = await db.select().from(t.messages).where(eq(t.messages.id, inboundMessageId));
  // "Typing…" while the AI works. Autopilot only: a Copilot reply waits for staff, so the customer would see typing, then nothing.
  const stopTyping = mode === "autopilot" ? keepTyping(adapterFor(thread.channel), thread, { externalMessageId: inbound.externalMessageId }) : () => {};
  // Whatever happens below, the indicator stops with the run.
  try {
    return await answer({ ws, thread, customer, inbound, mode, stopTyping, started, isDemo: opts.isDemo });
  } finally {
    stopTyping();
  }
}

type Run = { ws: Workspace; thread: ThreadRow; customer: typeof t.customers.$inferSelect; inbound: typeof t.messages.$inferSelect; mode: "autopilot" | "copilot"; stopTyping: () => void; started: number; isDemo?: boolean };

async function answer({ ws, thread, customer, inbound, mode, stopTyping, started, isDemo }: Run): Promise<RespondResult> {
  const threadId = thread.id;
  const inboundMessageId = inbound.id;
  const opts = { isDemo };
  // Unpaid orders past their timer are expired before anything reads them (the receipt check, the AI's order list).
  // Both start now and overlap with loading the chat; reminders are network sends the reply never waits for (they finish before we return).
  const expired = expireDueOrders(ws.id).catch((e) => log.error("stock.expiry_failed", { workspaceId: ws.id, threadId, err: e }));
  const reminders = sendDueReminders(ws.id).catch((e) => log.error("appointments.reminders_failed", { workspaceId: ws.id, threadId, err: e }));

  // A file from a customer whose order is waiting for its payment receipt: read and check it, answer from a fixed template.
  if (inbound.attachments.length) {
    await expired;
    const receipt = await receiptIntake(ws, thread, inbound, { isDemo: opts.isDemo }).catch((e) => {
      log.error("receipts.intake_failed", { workspaceId: ws.id, threadId, err: e });
      return null;
    });
    if (receipt) {
      stopTyping();
      await reminders;
      const sent = await deliver(thread, receipt.reply, { author: "ai", status: mode === "copilot" ? "pending_approval" : "sent", isDemo: opts.isDemo });
      await db.insert(t.events).values({ workspaceId: ws.id, type: "message.answered", props: { channel: thread.channel, outcome: "receipt", threadId, status: sent.status }, isDemo: Boolean(opts.isDemo) });
      return { reply: receipt.reply, status: sent.status, outcome: "receipt", latencyMs: Date.now() - started };
    }
  }

  const [historyRows, kb] = await Promise.all([
    db
      .select()
      .from(t.messages)
      .where(and(eq(t.messages.threadId, threadId), ne(t.messages.status, "pending_approval"), ne(t.messages.status, "discarded"), lte(t.messages.createdAt, inbound.createdAt)))
      .orderBy(desc(t.messages.createdAt))
      .limit(20),
    knowledge(ws),
  ]);
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
  // Providers (Gemini especially) reject a conversation that ends on an assistant turn. That happens when the message that
  // triggered this run has no text (a sticker, reaction or unsupported type), so the customer's turn is always the last one.
  if (!convo.length || convo[convo.length - 1].role !== "user") convo.push({ role: "user", content: inbound.text.trim() || "(the customer sent something that isn't text, such as a sticker or reaction)" });

  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const ctx: ToolContext = {
    ws, catalog: kb.catalog, threadId, customerId: customer.id,
    customerName: customer.displayName ?? customer.username ?? "", channel: thread.channel, escalations: [], orders: [], isDemo: opts.isDemo,
  };
  const toolLog: ToolCallLog[] = [];
  const latest = inbound.text || "(no text)";
  const recent = historyRows.slice(-5, -1).map((m) => `${m.direction === "in" ? "Customer" : "Us"}: ${m.text}`).join("\n");
  let model = routeModel(latest, historyRows.length, inbound.attachments.length);
  // The provider and model that actually wrote the reply (the cascade may fall back), for agent_runs.
  let answeredBy: string | undefined;
  let reply = "";
  let error: string | undefined;
  /** The AI failed, but an order it saved is acknowledged from the record: not a failed run for the customer. */
  let acked = false;
  let cls: Classification | null = null;

  if (!env.hasAnthropic) {
    error = "No AI provider is configured on the server";
    reply = DEFAULT_HOLD;
    toolLog.push(await runTool(ctx, "escalate", { category: "ai_failure", priority: "high", reason: "No AI provider configured", summary: `No AI provider is set up (GROQ_API_KEY or GEMINI_API_KEY), so the customer got the holding reply. They wrote: “${latest.slice(0, 140)}”` }, latest));
    model = "none";
  } else {
    try {
      // Orders are read after expiry has run; everything else is independent.
      const [gaps, orders, team] = await Promise.all([
        openGapKeys(ws.id),
        expired.then(() => chatOrders(threadId, ws)),
        teamLines(ws, ctx.catalog.items.filter((i) => i.kind === "service")),
      ]);
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
            orders,
            team,
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
        // The agent's reply is dropped, but anything it saved is still acknowledged: the customer needs that reference code.
        reply = holdingReply(cls.holding_reply || DEFAULT_HOLD, toolLog);
      } else if (!reply && acknowledgement(toolLog)) {
        reply = acknowledgement(toolLog)!;
      } else if (!reply) {
        if (cls && !ctx.escalations.length && cls.confidence < threshold && cls.intent !== "greeting" && cls.intent !== "off_topic") {
          toolLog.push(await runTool(ctx, "escalate", { category: "low_confidence", priority: "normal", reason: `Low confidence (${cls.confidence.toFixed(2)})`, summary: cls.summary }, latest));
        }
        reply = cls?.holding_reply || DEFAULT_HOLD;
        if (!ctx.escalations.length) toolLog.push(await runTool(ctx, "escalate", { category: "other", priority: "normal", reason: "Agent produced no reply", summary: latest.slice(0, 200) }, latest));
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      log.error("agent.failed", { workspaceId: ws.id, threadId, err: e });
      const ack = ctx.escalations.length ? null : acknowledgement(toolLog);
      acked = Boolean(ack);
      reply = ack ?? holdingReply(DEFAULT_HOLD, toolLog);
      // The reason goes to staff only (Needs you, Inbox); the customer gets the holding reply above.
      // An acknowledged order is already in the team's queue, so it doesn't need a second card.
      if (!ack && !ctx.escalations.length) toolLog.push(await runTool(ctx, "escalate", { category: "ai_failure", priority: "high", reason: "Every AI provider failed", summary: `The customer got the holding reply because no AI could answer (${explainAiError(e)}). They wrote: “${latest.slice(0, 60)}”` }, latest));
    }
  }

  // An unanswered question belongs in Knowledge → Gaps however it reached a person, so the owner answers it once.
  if (!error) {
    const action = gapAction({ intent: cls?.intent, escalations: ctx.escalations, reply, failed: false });
    if (action === "record") {
      await recordGap({ workspaceId: ws.id, key: cls?.topic ?? null, question: latest, isDemo: opts.isDemo }).catch((e) => log.error("gaps.record_failed", { workspaceId: ws.id, threadId, err: e }));
    } else if (action === "escalate") {
      toolLog.push(await runTool(ctx, "escalate", { category: "knowledge_gap", priority: "low", reason: "Told the customer it would check with the team", summary: cls?.summary ?? latest.slice(0, 200), gap_key: cls?.topic ?? "" }, latest));
    }
  }

  const failed = Boolean(error) && !acked;
  const outcome = failed
    ? "error"
    : ctx.escalations.length
      ? "escalated"
      : ctx.orders?.length
          ? "ordered"
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

  stopTyping();
  await reminders;
  if (newer) {
    return { skipped: "superseded", runId: run.id, outcome, latencyMs, model: answeredBy ?? model };
  }

  const status = mode === "copilot" && !failed ? "pending_approval" : "sent";
  const sent = await deliver(thread, reply, { author: "ai", agentRunId: run.id, status, isDemo: opts.isDemo });
  await db.insert(t.events).values({ workspaceId: ws.id, type: "message.answered", props: { channel: thread.channel, outcome, latencyMs, threadId, model: answeredBy ?? model, status: sent.status, ...(error ? { error: explainAiError(error).slice(0, 200) } : {}) }, isDemo: Boolean(opts.isDemo) });
  return {
    reply, status: sent.status, outcome, tools: toolLog, escalated: ctx.escalations.map((e) => ({ category: e.category, summary: e.summary })),
    order: ctx.orders?.[0] ? { refCode: ctx.orders[0].refCode } : null, latencyMs, model: answeredBy ?? model, runId: run.id, error,
  };
}

type ThreadRow = typeof t.threads.$inferSelect;

/**
 * The orders in this chat, as facts for the assistant: what state each is in, and whether the team is waiting for a receipt
 * (and why). It answers "is my order ready?" from these, and knows what to expect when staff asked for another receipt.
 */
async function chatOrders(threadId: string, ws: Workspace): Promise<string[]> {
  const currency = ws.currency;
  const rows = await db
    .select({ ref: t.orders.refCode, kind: t.orders.kind, status: t.orders.status, total: t.orders.totalMinor, confirmedAt: t.orders.confirmedAt, paid: t.orders.paid, holdExpiresAt: t.orders.holdExpiresAt, firmedBy: t.orders.firmedBy, wantedDate: t.orders.wantedDate, startsAt: t.appointments.startsAt, staffName: t.users.name, service: t.orderItems.name })
    .from(t.orders)
    .leftJoin(t.appointments, eq(t.appointments.orderId, t.orders.id))
    .leftJoin(t.users, eq(t.users.id, t.appointments.staffId))
    .leftJoin(t.orderItems, and(eq(t.orderItems.orderId, t.orders.id), eq(t.orders.kind, "appointment")))
    .where(and(eq(t.orders.threadId, threadId), gt(t.orders.createdAt, new Date(Date.now() - 14 * 86_400_000))))
    .orderBy(desc(t.orders.createdAt))
    .limit(5);
  const STATE: Record<string, string> = { pending: "received, waiting for the team to confirm", confirmed: "confirmed by the team", ready: "ready (or out for delivery)", completed: "completed", cancelled: "not going ahead (rejected or cancelled by the team)", expired: "expired: no payment arrived in time, so it isn't going ahead (they can order again)" };
  const now = new Date();
  // The payment timer, so the assistant can answer "how long do I have?" from the record.
  const timer = (o: (typeof rows)[number]) =>
    o.status !== "pending" ? "" : o.holdExpiresAt && o.holdExpiresAt > now ? `; held until ${human(o.holdExpiresAt, ws.timezone)} (${Math.ceil((o.holdExpiresAt.getTime() - now.getTime()) / 60_000)} min left) for a payment receipt, then it expires` : o.firmedBy ? "; reserved, the team is checking the payment" : "";
  // A booking says what, when and with whom; "confirmed" there means the team approved the time.
  const what = (o: (typeof rows)[number]) => (o.kind === "appointment" && o.startsAt ? `booking: ${o.service ?? "appointment"} on ${human(o.startsAt, ws.timezone)}${o.staffName ? ` with ${o.staffName}` : ""}, ` : o.wantedDate ? `for ${o.wantedDate}, ` : "");
  const lines = rows.map((o) => `${o.ref}: ${what(o)}${STATE[o.status] ?? o.status}, total ${formatMoney(o.total, currency)}${o.status === "cancelled" && !o.confirmedAt ? " (rejected)" : ""}${timer(o)}`);
  const waiting = await orderAwaitingReceipt(threadId);
  const req = waiting?.receiptRequest && !waiting.receiptRequest.fulfilledAt ? waiting.receiptRequest : null;
  if (waiting && req) {
    lines.push(
      `WAITING FOR A RECEIPT on ${waiting.refCode}: the team turned down the last receipt because “${req.reason}” and asked for ${req.kind === "top_up" ? `a transfer of the remaining ${formatMoney(req.expectedMinor, currency)} plus its receipt` : `a new receipt showing ${formatMoney(req.expectedMinor, currency)}`}. If the customer writes without sending a file, remind them kindly what to send and why (in your own words, same reason, same amount). Don't say the order is confirmed or accepted.`,
    );
  }
  return lines;
}

const TYPING_MAX_REPEATS = 6;

/**
 * Shows the channel's typing indicator now and, for channels whose indicator expires, again every `typingEveryMs` until
 * stopped (at most TYPING_MAX_REPEATS times, so a run that never finishes can't keep a customer's phone typing).
 */
export function keepTyping(adapter: ChannelAdapter, thread: ThreadRow, inbound: Inbound): () => void {
  if (!adapter.typing) return () => {};
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  const fire = (left: number) => {
    void adapter.typing!(thread, inbound).catch(() => {});
    if (adapter.typingEveryMs && left > 0) {
      timer = setTimeout(() => !stopped && fire(left - 1), adapter.typingEveryMs);
      (timer as { unref?: () => void }).unref?.();
    }
  };
  fire(TYPING_MAX_REPEATS);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

/** Insert an outbound message and push it through the channel adapter (unless it's a draft). */
export async function deliver(
  thread: ThreadRow,
  text: string,
  o: { author: "ai" | "staff" | "system"; agentRunId?: string; userId?: string; status?: "sent" | "pending_approval"; isDemo?: boolean; buttons?: { text: string; data: string }[][] },
) {
  // The customer's first answer from the assistant carries the privacy notice (not drafts, not the simulator).
  if (o.author === "ai" && o.status !== "pending_approval" && thread.channel !== "simulator") {
    const [prior] = await db.select({ id: t.messages.id }).from(t.messages).where(and(eq(t.messages.threadId, thread.id), eq(t.messages.direction, "out"))).limit(1);
    text = withPrivacyNotice(text, !prior);
  }
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
    log.error("deliver.failed", { workspaceId: thread.workspaceId, threadId: thread.id, channel: thread.channel, err });
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
