// What an order card says at a glance: what was ordered, what's wrong, what to do next. Display only: this reads what the
// orders API already sends and decides nothing about the order. The rules themselves stay in lib/orders and lib/receipts.
type Level = "pass" | "warn" | "fail";
type CardReceipt = { verdict: "consistent" | "review" | "mismatch" | "unreadable"; checks: { code: string; level: Level; message: string }[]; rejectedAt: string | null };

export type CardOrder = {
  kind: "order" | "appointment"; status: "pending" | "confirmed" | "ready" | "completed" | "cancelled" | "expired"; fulfilment: "pickup" | "delivery"; totalMinor: number; currency: string; paid: boolean;
  items: { name: string; quantity: number }[];
  receipts: CardReceipt[];
  attention: { level: "block" | "warn" | "info"; text: string }[];
  holdExpiresAt: string | null; firmedBy: "receipt" | "staff" | null;
  notificationsView: { status: string }[];
};

export type CardIssue = { key: string; text: string; rank: number; blocks: boolean };
export type NextStep = "confirm" | "ready" | "complete";
export type MoreAction = "keep_reserved" | "complete" | "correct" | "ask_receipt" | "paid" | "unpaid" | "retry" | "cancel";

/** Rank order: what stops the next step, a receipt that doesn't add up, one that can't be read, then the smaller gaps. */
const RANK = { blocking: 0, mismatch: 1, unreadable: 2, notTold: 3, date: 4, reference: 5, timer: 6 };
const UNREADABLE = "Receipt couldn't be read: check it yourself";

/** Older saved text still has the product's old name. Only for text Yapoz wrote: a customer's own words stay as they are. */
export const displayText = (text: string) => text.replace(/\bjawab\b/gi, "Yapoz");

export function money(minor: number, currency: string) {
  const major = minor / 100;
  if (currency === "MYR") return `RM ${Number.isInteger(major) ? major : major.toFixed(2)}`;
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(major);
}

export function holdText(expiresAt: string, nowMs: number) {
  const mins = Math.ceil((new Date(expiresAt).getTime() - nowMs) / 60000);
  return mins <= 0 ? "Time's up: expiring" : `Held for ${mins} more minute${mins === 1 ? "" : "s"}`;
}

/** "2× Margherita · RM 76", "3 items · RM 94", "RM 76 + delivery". */
export function itemsLine(o: Pick<CardOrder, "kind" | "fulfilment" | "totalMinor" | "currency" | "items">) {
  const what = o.items.length > 2 ? `${o.items.reduce((n, i) => n + i.quantity, 0)} items` : o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
  const total = `${money(o.totalMinor, o.currency)}${o.kind === "order" && o.fulfilment === "delivery" ? " + delivery" : ""}`;
  return what ? `${what} · ${total}` : total;
}

const latestReceipt = (o: Pick<CardOrder, "receipts">) => o.receipts.find((r) => !r.rejectedAt);

function checkIssue({ code, level, message }: CardReceipt["checks"][number]): Pick<CardIssue, "text" | "rank"> | null {
  if (level === "pass") return null;
  if (["reading", "unreadable", "not_receipt"].includes(code)) return { text: UNREADABLE, rank: RANK.unreadable };
  if (code === "legibility") return { text: displayText(message), rank: RANK.unreadable };
  if (code === "reference") return { text: "No reference number on the receipt", rank: RANK.reference };
  if (level === "warn" && code === "date") return { text: "No clear date on the receipt", rank: RANK.date };
  if (level === "warn" && code === "date_early") return { text: displayText(message), rank: RANK.date };
  return { text: displayText(message), rank: RANK.mismatch };
}

/**
 * Everything worth saying about an order, most important first, each meaning once. The server's "block" level includes
 * receipt failures, which staff can still confirm past; `blocks` is only what really stops the next step.
 */
export function cardIssues(o: CardOrder, nowMs: number): CardIssue[] {
  const open = o.status === "pending" || o.status === "confirmed" || o.status === "ready";
  const found: CardIssue[] = [];
  const add = (text: string, rank: number, blocks = false) => {
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!found.some((f) => f.key === key)) found.push({ key, text, rank, blocks });
  };
  const receipt = open ? latestReceipt(o) : undefined;
  for (const c of receipt?.checks ?? []) {
    const issue = checkIssue(c);
    if (issue) add(issue.text, issue.rank);
  }
  const fromChecks = new Set((receipt?.checks ?? []).map((c) => displayText(c.message)));
  for (const a of o.attention) {
    const text = displayText(a.text);
    if (fromChecks.has(text)) continue;
    if (/wasn['’]t told|no chat to tell/i.test(text)) add(text, RANK.notTold);
    else if (!open || a.level === "info") continue;
    else if (/\bcould(n['’]t)?\b.*\bread\b/i.test(text)) add(UNREADABLE, RANK.unreadable);
    else if (/^(stock|the time is) held for/i.test(text)) continue;
    else if (a.level === "block") add(text, RANK.blocking, true);
    else add(text, RANK.mismatch);
  }
  if (o.status === "pending" && o.holdExpiresAt && !o.firmedBy && new Date(o.holdExpiresAt).getTime() > nowMs) add(holdText(o.holdExpiresAt, nowMs), RANK.timer);
  return found.sort((a, b) => a.rank - b.rank);
}

/** The card's third line. Anything that stops the next step always shows; the rest is the top issue and a count. */
export function issueLine(o: CardOrder, issues: CardIssue[]) {
  const shown = issues.filter((issue, i) => i === 0 || issue.blocks);
  return { shown, more: issues.length - shown.length, receiptOk: !issues.length && latestReceipt(o)?.verdict === "consistent" && o.status !== "cancelled" && o.status !== "expired" };
}

/** The attention lines Details adds after the issues: facts rather than problems. */
export const cardNotes = (o: CardOrder) => o.attention.filter((a) => a.level === "info" && !/no chat to tell/i.test(a.text)).map((a) => displayText(a.text));

/** The one thing to do next. Pending orders also show Reject beside it; bookings have no ready step. */
export function nextStep(o: Pick<CardOrder, "kind" | "status">): NextStep | null {
  if (o.status === "pending") return "confirm";
  if (o.kind !== "order") return null;
  return o.status === "confirmed" ? "ready" : o.status === "ready" ? "complete" : null;
}

/** Everything else this order allows, for the ··· menu. Same conditions as the buttons always had. */
export function moreActions(o: Pick<CardOrder, "kind" | "status" | "paid" | "holdExpiresAt" | "firmedBy" | "notificationsView">, canAsk: boolean): MoreAction[] {
  const live = o.status === "confirmed" || o.status === "ready";
  const list: (MoreAction | false)[] = [
    o.status === "pending" && Boolean(o.holdExpiresAt) && !o.firmedBy && "keep_reserved",
    o.status === "confirmed" && o.kind === "order" && "complete",
    o.status === "pending" && o.kind === "order" && "correct",
    canAsk && "ask_receipt",
    o.status !== "cancelled" && o.status !== "expired" && (o.paid ? "unpaid" : "paid"),
    o.notificationsView.at(-1)?.status === "failed" && "retry",
    live && "cancel",
  ];
  return list.filter((a): a is MoreAction => Boolean(a));
}
