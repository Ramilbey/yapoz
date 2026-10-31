// The Phase 2 measures, read from what the system recorded: orders, their items and stock holds, receipts and their
// checks, staff actions in the activity log, and staff messages. Only BASELINE_STEPS and the targets are fixed numbers;
// a measure with nothing to measure is null, never a zero or a hundred.
import { and, eq, inArray } from "drizzle-orm";
import { db, t } from "@/db";
import type { ReceiptCheck } from "@/db/schema";
import { modeOf } from "./stock";

/** From the Phase 1 submission: read the message, look up the price, check stock, send payment details, check the receipt. */
export const BASELINE_STEPS = 5;
export const TARGET = { steps: 1, pricedShare: 0.9, receiptShare: 1 };

/** What a person did to reach a decision. Ready and complete come after it, and aren't in the baseline either. */
const OWNER_ACTIONS = ["order.confirmed", "order.rejected", "receipt.requested", "order.kept_reserved", "order.paid", "order.unpaid"];
const DECISIONS = ["order.confirmed", "order.rejected"];
const RECEIPT_CHECKS: Record<string, string[]> = { amount: ["amount"], payee: ["payee"], date: ["date", "date_early"], reuse: ["reuse", "duplicate"] };

export type OrderFacts = {
  /** Owner actions and staff chat messages up to the decision; null if nobody decided (still pending, or expired). */
  steps: number | null;
  priced: boolean;
  stockChecked: boolean;
};

/** Which of amount, payee, date and reuse have no recorded result. */
export const missingChecks = (checks: Pick<ReceiptCheck, "code">[]) => Object.entries(RECEIPT_CHECKS).filter(([, codes]) => !checks.some((c) => codes.includes(c.code))).map(([name]) => name);

const share = (n: number, of: number) => (of ? n / of : null);

export function summarise(orders: OrderFacts[], receipts: { checks: Pick<ReceiptCheck, "code">[] }[]) {
  const steps = orders.map((o) => o.steps).filter((s): s is number => s !== null);
  const mean = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : null;
  const arrived = orders.filter((o) => o.priced && o.stockChecked).length;
  const checked = receipts.filter((r) => !missingChecks(r.checks).length).length;
  const missing: Record<string, number> = {};
  for (const r of receipts) for (const m of missingChecks(r.checks)) missing[m] = (missing[m] ?? 0) + 1;
  const pricedShare = share(arrived, orders.length);
  const receiptShare = share(checked, receipts.length);
  return {
    steps: { baseline: BASELINE_STEPS, decided: steps.length, undecided: orders.length - steps.length, mean, atOneStep: share(steps.filter((s) => s === 1).length, steps.length), reduction: mean === null ? null : 1 - mean / BASELINE_STEPS, met: mean === null ? null : mean <= TARGET.steps },
    orders: { total: orders.length, pricedAndChecked: arrived, share: pricedShare, met: pricedShare === null ? null : pricedShare >= TARGET.pricedShare },
    receipts: { total: receipts.length, fullyChecked: checked, share: receiptShare, missing, met: receiptShare === null ? null : receiptShare >= TARGET.receiptShare },
  };
}

export type Benefit = ReturnType<typeof summarise>;

/** One business's chat orders (bookings are a separate flow). `demo` picks the labelled test records instead of the real ones. */
export async function measureBenefit(workspaceId: string, o: { demo?: boolean } = {}): Promise<Benefit> {
  const isDemo = Boolean(o.demo);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  if (!ws) throw new Error(`No business with the id ${workspaceId}.`);
  const orders = await db.select().from(t.orders).where(and(eq(t.orders.workspaceId, workspaceId), eq(t.orders.kind, "order"), eq(t.orders.isDemo, isDemo)));
  const ids = orders.map((r) => r.id);
  const receipts = ids.length ? await db.select({ checks: t.orderReceipts.checks }).from(t.orderReceipts).where(inArray(t.orderReceipts.orderId, ids)) : [];
  if (!ids.length) return summarise([], receipts);
  const [items, holds, actions, staffMessages] = await Promise.all([
    db.select({ i: t.orderItems, variantFound: t.kbVariants.id, stock: t.kbVariants.stock, dailyQty: t.kbVariants.dailyQty, stockMode: t.kbItems.stockMode })
      .from(t.orderItems).leftJoin(t.kbVariants, eq(t.kbVariants.id, t.orderItems.variantId)).leftJoin(t.kbItems, eq(t.kbItems.id, t.orderItems.itemId)).where(inArray(t.orderItems.orderId, ids)),
    db.select({ orderId: t.stockHolds.orderId, variantId: t.stockHolds.variantId }).from(t.stockHolds).where(inArray(t.stockHolds.orderId, ids)),
    db.select({ type: t.events.type, props: t.events.props, at: t.events.createdAt }).from(t.events).where(and(eq(t.events.workspaceId, workspaceId), inArray(t.events.type, OWNER_ACTIONS))),
    db.select({ threadId: t.messages.threadId, at: t.messages.createdAt }).from(t.messages).where(and(eq(t.messages.workspaceId, workspaceId), eq(t.messages.author, "staff"), eq(t.messages.direction, "out"))),
  ]);
  const facts = orders.map((order): OrderFacts => {
    const lines = items.filter((x) => x.i.orderId === order.id);
    const mine = actions.filter((a) => (a.props as { orderId?: string }).orderId === order.id);
    const decision = mine.find((a) => DECISIONS.includes(a.type));
    const chats = decision ? staffMessages.filter((m) => m.threadId === order.threadId && m.at >= order.createdAt && m.at <= decision.at) : [];
    return {
      steps: decision ? mine.filter((a) => a.at <= decision.at).length + chats.length : null,
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

export function benefitReport(b: Benefit): string {
  const missing = Object.entries(b.receipts.missing).map(([k, n]) => `${k} ${n}`).join(", ");
  return [
    `Manual steps per order: ${b.steps.mean === null ? "no data" : b.steps.mean.toFixed(2)} (baseline ${b.steps.baseline}, target ${TARGET.steps}) ${verdict(b.steps.met)}`,
    `  ${pct(b.steps.reduction)} fewer; ${pct(b.steps.atOneStep)} took one step; ${b.steps.decided} decided, ${b.steps.undecided} not decided by a person`,
    `Priced and stock-checked: ${b.orders.pricedAndChecked} of ${b.orders.total} = ${pct(b.orders.share)} (target ${pct(TARGET.pricedShare)}) ${verdict(b.orders.met)}`,
    `Receipts checked for amount, payee, date and reuse: ${b.receipts.fullyChecked} of ${b.receipts.total} = ${pct(b.receipts.share)} (target ${pct(TARGET.receiptShare)}) ${verdict(b.receipts.met)}`,
    ...(missing ? [`  Not recorded: ${missing}`] : []),
  ].join("\n");
}
