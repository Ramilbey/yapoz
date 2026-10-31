// The order card's three-second summary, from the shape the orders API sends. No database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cardIssues, cardNotes, displayText, holdText, issueLine, itemsLine, moreActions, nextStep, type CardOrder } from "../src/lib/order-card";

const NOW = Date.parse("2026-11-02T04:00:00Z");
const order = (over: Partial<CardOrder> = {}): CardOrder => ({
  kind: "order", status: "pending", fulfilment: "pickup", totalMinor: 7600, currency: "MYR", paid: false,
  items: [{ name: "Texas BBQ Pulled Beef Pizza", quantity: 2 }], receipts: [], attention: [], holdExpiresAt: null, firmedBy: null, notificationsView: [], ...over,
});
const receipt = (verdict: CardOrder["receipts"][number]["verdict"], checks: [string, "pass" | "warn" | "fail", string][], rejectedAt: string | null = null) => ({ verdict, checks: checks.map(([code, level, message]) => ({ code, level, message })), rejectedAt });
const texts = (o: CardOrder) => cardIssues(o, NOW).map((i) => i.text);

test("line 2: items and total in one short line", () => {
  assert.equal(itemsLine(order()), "2× Texas BBQ Pulled Beef Pizza · RM 76");
  assert.equal(itemsLine(order({ items: [{ name: "A", quantity: 1 }, { name: "B", quantity: 2 }] })), "1× A, 2× B · RM 76");
  assert.equal(itemsLine(order({ totalMinor: 9400, items: [{ name: "A", quantity: 1 }, { name: "B", quantity: 1 }, { name: "C", quantity: 1 }] })), "3 items · RM 94");
  assert.equal(itemsLine(order({ fulfilment: "delivery" })), "2× Texas BBQ Pulled Beef Pizza · RM 76 + delivery");
  assert.equal(itemsLine(order({ kind: "appointment", fulfilment: "delivery" })), "2× Texas BBQ Pulled Beef Pizza · RM 76", "bookings have no delivery");
});

test("the same meaning shows once, whatever words it was saved in", () => {
  const o = order({
    receipts: [receipt("review", [["reading", "warn", "Jawab couldn't read this automatically. Open the file and check it yourself."]])],
    attention: [{ level: "warn", text: "Jawab couldn't read this automatically. Open the file and check it yourself." }, { level: "warn", text: "The AI couldn't read this receipt. Open it and check it yourself." }, { level: "warn", text: "No AI could read the receipt (providers unavailable). Open it and check it yourself." }, { level: "warn", text: "The latest receipt couldn't be read. The customer was asked to send a clearer one." }],
  });
  assert.deepEqual(texts(o), ["Receipt couldn't be read: check it yourself"]);
  const failed = order({ receipts: [receipt("mismatch", [["amount", "fail", "Paid RM 75, RM 10 short of the RM 85 total."]])], attention: [{ level: "block", text: "Paid RM 75, RM 10 short of the RM 85 total." }] });
  assert.deepEqual(texts(failed), ["Paid RM 75, RM 10 short of the RM 85 total."]);
});

test("issues come in priority order: blocking, mismatch, unreadable, date, reference", () => {
  const o = order({
    receipts: [receipt("mismatch", [["reference", "warn", "No transaction or reference number shown."], ["date", "warn", "No date or time could be read."], ["reading", "warn", "Yapoz couldn't read this automatically."], ["payee", "fail", "Paid to Someone, which isn't one of your accounts."]])],
    attention: [{ level: "block", text: "Paid to Someone, which isn't one of your accounts." }, { level: "block", text: "Pizza is sold out: confirming will fail until you restock it." }],
  });
  assert.deepEqual(texts(o), ["Pizza is sold out: confirming will fail until you restock it.", "Paid to Someone, which isn't one of your accounts.", "Receipt couldn't be read: check it yourself", "No clear date on the receipt", "No reference number on the receipt"]);
  const line = issueLine(o, cardIssues(o, NOW));
  assert.deepEqual(line.shown.map((i) => i.text), ["Pizza is sold out: confirming will fail until you restock it."]);
  assert.equal(line.more, 4);
  assert.equal(line.receiptOk, false);
});

test("everything that stops confirmation stays on the card; a receipt failure staff can confirm past doesn't count", () => {
  const o = order({ attention: [{ level: "block", text: "A is sold out: confirming will fail until you restock it." }, { level: "block", text: "B was removed from your catalog." }, { level: "warn", text: "Paid RM 1 more than the total." }] });
  const line = issueLine(o, cardIssues(o, NOW));
  assert.equal(line.shown.length, 2);
  assert.equal(line.more, 1);
  const receiptOnly = order({ receipts: [receipt("mismatch", [["amount", "fail", "Paid RM 1, short."]])], attention: [{ level: "block", text: "Paid RM 1, short." }] });
  assert.equal(cardIssues(receiptOnly, NOW)[0].blocks, false);
  const noReceipt = order({ attention: [{ level: "block", text: "No payment receipt yet. You can't confirm until one arrives." }] });
  assert.equal(cardIssues(noReceipt, NOW)[0].blocks, true);
  const asked = order({ attention: [{ level: "block", text: "Waiting for a new receipt for RM 76: you asked because “blurry”." }] });
  assert.equal(issueLine(asked, cardIssues(asked, NOW)).shown.length, 1);
});

test("a passed receipt says so, and nothing to say shows nothing", () => {
  const good = order({ receipts: [receipt("consistent", [["amount", "pass", "Amount matches."], ["payee", "pass", "Your account."]])] });
  assert.deepEqual(issueLine(good, cardIssues(good, NOW)), { shown: [], more: 0, receiptOk: true });
  const none = order();
  assert.deepEqual(issueLine(none, cardIssues(none, NOW)), { shown: [], more: 0, receiptOk: false });
  const turnedDown = order({ receipts: [receipt("consistent", [], "2026-11-01T00:00:00Z")] });
  assert.equal(issueLine(turnedDown, cardIssues(turnedDown, NOW)).receiptOk, false, "a receipt staff turned down isn't a match");
  const rejected = order({ status: "cancelled", receipts: [receipt("consistent", [])] });
  assert.equal(issueLine(rejected, cardIssues(rejected, NOW)).receiptOk, false);
});

test("the payment timer ticks live and stays last; a lapsed one is the server's blocking line", () => {
  const holdExpiresAt = new Date(NOW + 12 * 60_000).toISOString();
  const o = order({ holdExpiresAt, attention: [{ level: "warn", text: "Stock held for 12 more minutes (until 4:12pm). It goes back unless a receipt passes the checks or you press Keep reserved." }] });
  assert.deepEqual(texts(o), ["Held for 12 more minutes"]);
  assert.equal(holdText(holdExpiresAt, NOW + 11.5 * 60_000), "Held for 1 more minute");
  assert.deepEqual(texts(order({ holdExpiresAt, firmedBy: "receipt" })), [], "a firm order has no timer to mention");
});

test("closed orders drop receipt nagging, but a customer who wasn't told still shows", () => {
  const bad = receipt("mismatch", [["amount", "fail", "Paid RM 1, short."]]);
  const notTold = { level: "warn" as const, text: "The customer wasn't told the order was rejected: blocked. Retry or message them yourself." };
  for (const status of ["completed", "cancelled", "expired"] as const) assert.deepEqual(texts(order({ status, receipts: [bad], attention: [{ level: "info", text: "Expired." }] })), [], status);
  assert.deepEqual(texts(order({ status: "cancelled", receipts: [bad], attention: [notTold] })), [notTold.text]);
  assert.deepEqual(cardNotes(order({ attention: [{ level: "info", text: "The total covers the items only." }, { level: "info", text: "There's no chat to tell the customer." }, notTold] })), ["The total covers the items only."]);
});

test("Jawab reads as Yapoz in text Yapoz wrote, as a whole word only", () => {
  assert.equal(displayText("Jawab couldn't read this. JAWAB's note, Jawabu stays."), "Yapoz couldn't read this. Yapoz's note, Jawabu stays.");
  assert.deepEqual(texts(order({ receipts: [receipt("review", [["oddities", "warn", "Looks unusual: font. Jawab can't tell if that matters."]])] })), ["Looks unusual: font. Yapoz can't tell if that matters."]);
});

test("each status keeps every action it had: one main step, the rest in the menu", () => {
  const can = (over: Partial<CardOrder>, canAsk = false) => ({ next: nextStep(order(over)), more: moreActions(order(over), canAsk) });
  assert.deepEqual(can({}, true), { next: "confirm", more: ["correct", "ask_receipt", "paid"] });
  assert.deepEqual(can({ kind: "appointment" }).more, ["paid"], "only orders can be corrected");
  assert.deepEqual(can({ holdExpiresAt: "2026-11-02T05:00:00Z" }).more, ["keep_reserved", "correct", "paid"]);
  assert.deepEqual(can({ holdExpiresAt: "2026-11-02T05:00:00Z", firmedBy: "staff" }).more, ["correct", "paid"]);
  assert.deepEqual(can({ status: "confirmed" }, true), { next: "ready", more: ["complete", "ask_receipt", "paid", "cancel"] });
  assert.deepEqual(can({ status: "ready", paid: true }, true), { next: "complete", more: ["ask_receipt", "unpaid", "cancel"] });
  assert.deepEqual(can({ status: "confirmed", kind: "appointment" }), { next: null, more: ["paid", "cancel"] });
  assert.deepEqual(can({ status: "completed", paid: true }), { next: null, more: ["unpaid"] });
  assert.deepEqual(can({ status: "cancelled" }), { next: null, more: [] });
  assert.deepEqual(can({ status: "expired" }), { next: null, more: [] });
  assert.deepEqual(can({ status: "cancelled", notificationsView: [{ status: "failed" }] }).more, ["retry"]);
});
