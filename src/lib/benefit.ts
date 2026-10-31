// The Phase 2 measures, read from what the system recorded: orders, their items and stock holds, receipts and their
// checks, staff actions in the activity log, and staff messages. Only BASELINE_STEPS and the targets are fixed numbers;
// a measure with nothing to measure is null, never a zero or a hundred.
import { and, eq, inArray, ne } from "drizzle-orm";
import { db, t } from "@/db";
import type { ReceiptCheck } from "@/db/schema";
import { modeOf } from "./stock";
import { openStatus, type HoursData } from "./hours";
import { isReasonCode, type ReasonCode } from "./order-reasons";

/** From the Phase 1 submission: read the message, look up the price, check stock, send payment details, check the receipt. */
export const BASELINE_STEPS = 5;
export const TARGET = { steps: 1, pricedShare: 0.9, receiptShare: 1 };
/** A chat nobody on the team answered within this many minutes counts as unattended. */
export const UNATTENDED_AFTER_MINUTES = 10;

/** What a person did to reach a decision. Ready and complete come after it, and aren't in the baseline either. */
const OWNER_ACTIONS = ["order.confirmed", "order.rejected", "order.corrected", "receipt.requested", "order.kept_reserved", "order.paid", "order.unpaid"];
const DECISIONS = ["order.confirmed", "order.rejected"];
const RECEIPT_CHECKS: Record<string, string[]> = { amount: ["amount"], payee: ["payee"], date: ["date", "date_early"], reuse: ["reuse", "duplicate"] };

export type OrderFacts = {
  /** Owner actions and staff chat messages up to the decision; null if nobody decided (still pending, or expired). */
  steps: number | null;
  priced: boolean;
  stockChecked: boolean;
  /** Minutes from the order being saved to a person confirming or rejecting it; null while undecided. */
  decisionMinutes?: number | null;
  /** The owner edited the order after the AI saved it and before deciding. */
  corrected?: boolean;
  /** Set when the order was rejected: the reason code, or "unspecified" for a rejection recorded without one. */
  rejection?: ReasonCode | "unspecified" | null;
  totalMinor?: number;
  /** How the chat the order came from was answered. Left out when the order has no chat. */
  reply?: { firstReplyMinutes: number | null; firstHumanMinutes: number | null; afterHours: boolean | null; unattended: boolean };
};

/** Which of amount, payee, date and reuse have no recorded result. */
export const missingChecks = (checks: Pick<ReceiptCheck, "code">[]) => Object.entries(RECEIPT_CHECKS).filter(([, codes]) => !checks.some((c) => codes.includes(c.code))).map(([name]) => name);

const share = (n: number, of: number) => (of ? n / of : null);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function summarise(orders: OrderFacts[], receipts: { checks: Pick<ReceiptCheck, "code">[] }[]) {
  const steps = orders.map((o) => o.steps).filter((s): s is number => s !== null);
  const meanSteps = mean(steps);
  const arrived = orders.filter((o) => o.priced && o.stockChecked).length;
  const checked = receipts.filter((r) => !missingChecks(r.checks).length).length;
  const missing: Record<string, number> = {};
  for (const r of receipts) for (const m of missingChecks(r.checks)) missing[m] = (missing[m] ?? 0) + 1;
  const pricedShare = share(arrived, orders.length);
  const receiptShare = share(checked, receipts.length);

  const minutes = orders.map((o) => o.decisionMinutes).filter((m): m is number => m != null);
  const decided = orders.filter((o) => o.steps !== null);
  const rejected = decided.filter((o) => o.rejection);
  const needed = decided.filter((o) => o.corrected || o.rejection);
  const reasons: Record<string, number> = {};
  for (const o of rejected) reasons[o.rejection!] = (reasons[o.rejection!] ?? 0) + 1;
  const chats = orders.filter((o) => o.reply);
  const sum = (os: OrderFacts[]) => os.reduce((a, o) => a + (o.totalMinor ?? 0), 0);
  const afterHours = chats.filter((o) => o.reply!.afterHours);
  const unattended = chats.filter((o) => o.reply!.unattended);
  const both = afterHours.filter((o) => o.reply!.unattended);
  return {
    steps: { baseline: BASELINE_STEPS, decided: steps.length, undecided: orders.length - steps.length, mean: meanSteps, atOneStep: share(steps.filter((s) => s === 1).length, steps.length), reduction: meanSteps === null ? null : 1 - meanSteps / BASELINE_STEPS, met: meanSteps === null ? null : meanSteps <= TARGET.steps },
    orders: { total: orders.length, pricedAndChecked: arrived, share: pricedShare, met: pricedShare === null ? null : pricedShare >= TARGET.pricedShare },
    receipts: { total: receipts.length, fullyChecked: checked, share: receiptShare, missing, met: receiptShare === null ? null : receiptShare >= TARGET.receiptShare },
    time: { decided: minutes.length, medianMinutes: median(minutes), meanMinutes: mean(minutes) },
    errors: { decided: decided.length, corrected: decided.filter((o) => o.corrected).length, rejected: rejected.length, needed: needed.length, share: share(needed.length, decided.length), reasons },
    reply: {
      chats: chats.length,
      medianFirstReplyMinutes: median(chats.map((o) => o.reply!.firstReplyMinutes).filter((m): m is number => m !== null)),
      medianFirstHumanMinutes: median(chats.map((o) => o.reply!.firstHumanMinutes).filter((m): m is number => m !== null)),
      /** Chats whose opening hours weren't on file can't be placed inside or outside them. */
      hoursUnknown: chats.filter((o) => o.reply!.afterHours === null).length,
      afterHours: { orders: afterHours.length, valueMinor: sum(afterHours) },
      unattended: { orders: unattended.length, valueMinor: sum(unattended) },
      /** Started outside opening hours and nobody on the team answered in time: orders the AI caught that would otherwise have waited. */
      afterHoursUnattended: { orders: both.length, valueMinor: sum(both) },
    },
  };
}

export type Benefit = ReturnType<typeof summarise>;

/** The opening-hours record as openStatus needs it, or null when it's missing or lists no open day (then nothing can be called after-hours). */
function hoursOf(data: Record<string, unknown> | undefined): HoursData | null {
  const d = data as Partial<HoursData> | undefined;
  if (!d?.weekly || !Object.values(d.weekly).some((x) => x?.length)) return null;
  return { weekly: d.weekly, lastOrdersMinutesBeforeClose: d.lastOrdersMinutesBeforeClose ?? 0, exceptions: d.exceptions ?? [] };
}

type ChatMessage = { author: "customer" | "ai" | "staff" | "system"; direction: "in" | "out"; at: Date };

/** How one chat was answered: minutes to the first reply of any kind and to the first one from a person, whether it began outside opening hours, and whether no person answered in time. */
export function replyFacts(messages: ChatMessage[], hours: HoursData | null, timeZone: string, unattendedAfter = UNATTENDED_AFTER_MINUTES): NonNullable<OrderFacts["reply"]> | undefined {
  const first = messages.filter((m) => m.direction === "in" && m.author === "customer").map((m) => m.at.getTime()).sort((a, b) => a - b)[0];
  if (first === undefined) return undefined;
  const after = (author?: "staff") => messages.filter((m) => m.direction === "out" && (!author || m.author === author) && m.at.getTime() >= first).map((m) => m.at.getTime()).sort((a, b) => a - b)[0];
  const reply = after();
  const human = after("staff");
  const minutes = (at: number | undefined) => (at === undefined ? null : (at - first) / 60_000);
  const firstHumanMinutes = minutes(human);
  return {
    firstReplyMinutes: minutes(reply),
    firstHumanMinutes,
    afterHours: hours ? !openStatus(hours, new Date(first), timeZone).open : null,
    unattended: firstHumanMinutes === null || firstHumanMinutes > unattendedAfter,
  };
}

/** One business's chat orders (bookings are a separate flow). `demo` picks the labelled test records instead of the real ones. */
export async function measureBenefit(workspaceId: string, o: { demo?: boolean } = {}): Promise<Benefit> {
  const isDemo = Boolean(o.demo);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  if (!ws) throw new Error(`No business with the id ${workspaceId}.`);
  const orders = await db.select().from(t.orders).where(and(eq(t.orders.workspaceId, workspaceId), eq(t.orders.kind, "order"), eq(t.orders.isDemo, isDemo)));
  const ids = orders.map((r) => r.id);
  const receipts = ids.length ? await db.select({ checks: t.orderReceipts.checks }).from(t.orderReceipts).where(inArray(t.orderReceipts.orderId, ids)) : [];
  if (!ids.length) return summarise([], receipts);
  const threadIds = [...new Set(orders.map((o) => o.threadId).filter((x): x is string => Boolean(x)))];
  const [items, holds, actions, staffMessages, chatMessages, [hoursItem]] = await Promise.all([
    db.select({ i: t.orderItems, variantFound: t.kbVariants.id, stock: t.kbVariants.stock, dailyQty: t.kbVariants.dailyQty, stockMode: t.kbItems.stockMode })
      .from(t.orderItems).leftJoin(t.kbVariants, eq(t.kbVariants.id, t.orderItems.variantId)).leftJoin(t.kbItems, eq(t.kbItems.id, t.orderItems.itemId)).where(inArray(t.orderItems.orderId, ids)),
    db.select({ orderId: t.stockHolds.orderId, variantId: t.stockHolds.variantId }).from(t.stockHolds).where(inArray(t.stockHolds.orderId, ids)),
    db.select({ type: t.events.type, props: t.events.props, at: t.events.createdAt }).from(t.events).where(and(eq(t.events.workspaceId, workspaceId), inArray(t.events.type, OWNER_ACTIONS))),
    db.select({ threadId: t.messages.threadId, at: t.messages.createdAt }).from(t.messages).where(and(eq(t.messages.workspaceId, workspaceId), eq(t.messages.author, "staff"), eq(t.messages.direction, "out"))),
    // Only the first customer message and the replies that reached them matter for latency.
    threadIds.length
      ? db.select({ threadId: t.messages.threadId, author: t.messages.author, direction: t.messages.direction, at: t.messages.createdAt }).from(t.messages).where(and(inArray(t.messages.threadId, threadIds), inArray(t.messages.author, ["customer", "ai", "staff"]), ne(t.messages.status, "failed"), ne(t.messages.status, "discarded"), ne(t.messages.status, "pending_approval")))
      : Promise.resolve([]),
    db.select({ data: t.kbItems.data }).from(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), eq(t.kbItems.kind, "hours"))).limit(1),
  ]);
  const hours = hoursOf(hoursItem?.data);
  const facts = orders.map((order): OrderFacts => {
    const lines = items.filter((x) => x.i.orderId === order.id);
    const mine = actions.filter((a) => (a.props as { orderId?: string }).orderId === order.id);
    const decision = mine.find((a) => DECISIONS.includes(a.type));
    const chats = decision ? staffMessages.filter((m) => m.threadId === order.threadId && m.at >= order.createdAt && m.at <= decision.at) : [];
    const reject = decision?.type === "order.rejected" ? (decision.props as { reasonCode?: unknown }).reasonCode : null;
    return {
      steps: decision ? mine.filter((a) => a.at <= decision.at).length + chats.length : null,
      decisionMinutes: decision ? Math.max(0, decision.at.getTime() - order.createdAt.getTime()) / 60_000 : null,
      corrected: mine.some((a) => a.type === "order.corrected" && (!decision || a.at <= decision.at)),
      rejection: decision?.type === "order.rejected" ? (isReasonCode(reject) ? reject : "unspecified") : null,
      totalMinor: order.totalMinor,
      reply: order.threadId ? replyFacts(chatMessages.filter((m) => m.threadId === order.threadId), hours, ws.timezone) : undefined,
      priced: lines.length > 0 && lines.every((l) => l.i.variantId && l.i.unitPriceMinor > 0),
      // A hold is the record of a stock check. An item with no count has nothing to hold; one that's gone can't be shown either way.
      stockChecked: lines.length > 0 && lines.every((l) => {
        if (!l.variantFound) return false;
        if (holds.some((h) => h.orderId === order.id && h.variantId === l.i.variantId)) return true;
        const mode = modeOf({ stockMode: l.stockMode }, ws);
        return mode === "none" || (mode === "tracked" ? l.stock === null : l.dailyQty === null);
      }),
    };
  });
  return summarise(facts, receipts);
}

const pct = (x: number | null) => (x === null ? "no data" : `${(x * 100).toFixed(1)}%`);
const verdict = (met: boolean | null) => (met === null ? "NO DATA" : met ? "MET" : "NOT MET");

export type BenefitRow = { label: string; baseline: string | null; target: string; measured: string | null; counted: string; met: boolean | null };

/** The three measures as the Today panel shows them. Only manual steps has a Phase 1 baseline. measured null = nothing recorded yet. */
export function benefitRows(b: Benefit): BenefitRow[] {
  return [
    { label: "Manual steps per order", baseline: String(b.steps.baseline), target: `${TARGET.steps} or fewer`, measured: b.steps.mean === null ? null : b.steps.mean.toFixed(2), counted: `${b.steps.decided} ${b.steps.decided === 1 ? "order" : "orders"} decided${b.steps.undecided ? `, ${b.steps.undecided} not decided yet` : ""}`, met: b.steps.met },
    { label: "Orders priced and stock-checked", baseline: null, target: `${pct(TARGET.pricedShare)} or more`, measured: b.orders.share === null ? null : pct(b.orders.share), counted: `${b.orders.pricedAndChecked} of ${b.orders.total} ${b.orders.total === 1 ? "order" : "orders"}`, met: b.orders.met },
    { label: "Receipts checked for amount, payee, date and reuse", baseline: null, target: pct(TARGET.receiptShare), measured: b.receipts.share === null ? null : pct(b.receipts.share), counted: `${b.receipts.fullyChecked} of ${b.receipts.total} ${b.receipts.total === 1 ? "receipt" : "receipts"}`, met: b.receipts.met },
  ];
}

const mins = (m: number | null) => (m === null ? "no data" : m < 1 ? "under a minute" : m < 90 ? `${m.toFixed(1)} min` : `${(m / 60).toFixed(1)} h`);
const rm = (minor: number) => `RM${(minor / 100).toFixed(2)}`;

export type OutcomeRow = { label: string; measured: string | null; counted: string };

/** What the owner's decisions and the replies looked like. These have no Phase 1 baseline or target, so they're shown as facts, not a pass or fail. */
export function outcomeRows(b: Benefit): OutcomeRow[] {
  const n = (x: number, one: string, many = `${one}s`) => `${x} ${x === 1 ? one : many}`;
  const reasons = Object.entries(b.errors.reasons).map(([k, v]) => `${k.replace("_", " ")} ${v}`).join(", ");
  return [
    { label: "Time from order to decision", measured: b.time.medianMinutes === null ? null : `${mins(b.time.medianMinutes)} median`, counted: `${n(b.time.decided, "order")} decided${b.time.meanMinutes === null ? "" : `, ${mins(b.time.meanMinutes)} on average`}` },
    { label: "Orders that needed a correction or were rejected", measured: b.errors.share === null ? null : pct(b.errors.share), counted: `${b.errors.needed} of ${n(b.errors.decided, "decided order")}: ${b.errors.corrected} edited, ${b.errors.rejected} rejected${reasons ? ` (${reasons})` : ""}` },
    { label: "First reply to a customer", measured: b.reply.medianFirstReplyMinutes === null ? null : `${mins(b.reply.medianFirstReplyMinutes)} median`, counted: `${n(b.reply.chats, "chat")}; first reply from a person: ${b.reply.medianFirstHumanMinutes === null ? "none yet" : `${mins(b.reply.medianFirstHumanMinutes)} median`}` },
    { label: "Orders started after opening hours", measured: b.reply.chats && b.reply.hoursUnknown < b.reply.chats ? String(b.reply.afterHours.orders) : null, counted: `${rm(b.reply.afterHours.valueMinor)}; ${b.reply.afterHoursUnattended.orders} of them with no person replying within ${UNATTENDED_AFTER_MINUTES} min (${rm(b.reply.afterHoursUnattended.valueMinor)})${b.reply.hoursUnknown ? `; ${n(b.reply.hoursUnknown, "chat")} without opening hours on file` : ""}` },
    { label: `Orders with no person replying within ${UNATTENDED_AFTER_MINUTES} min`, measured: b.reply.chats ? String(b.reply.unattended.orders) : null, counted: `${rm(b.reply.unattended.valueMinor)} of ${n(b.reply.chats, "chat order")}` },
  ];
}

export function benefitReport(b: Benefit): string {
  const missing = Object.entries(b.receipts.missing).map(([k, n]) => `${k} ${n}`).join(", ");
  return [
    `Manual steps per order: ${b.steps.mean === null ? "no data" : b.steps.mean.toFixed(2)} (baseline ${b.steps.baseline}, target ${TARGET.steps}) ${verdict(b.steps.met)}`,
    `  ${pct(b.steps.reduction)} fewer; ${pct(b.steps.atOneStep)} took one step; ${b.steps.decided} decided, ${b.steps.undecided} not decided by a person`,
    `Priced and stock-checked: ${b.orders.pricedAndChecked} of ${b.orders.total} = ${pct(b.orders.share)} (target ${pct(TARGET.pricedShare)}) ${verdict(b.orders.met)}`,
    `Receipts checked for amount, payee, date and reuse: ${b.receipts.fullyChecked} of ${b.receipts.total} = ${pct(b.receipts.share)} (target ${pct(TARGET.receiptShare)}) ${verdict(b.receipts.met)}`,
    ...(missing ? [`  Not recorded: ${missing}`] : []),
    "Decisions and replies (no baseline or target; facts, not pass or fail):",
    ...outcomeRows(b).map((r) => `  ${r.label}: ${r.measured ?? "no data"} (${r.counted})`),
  ].join("\n");
}
