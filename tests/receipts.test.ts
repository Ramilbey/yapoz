// Payment receipts: the rules that compare a reading with the order and the business's accounts (pure), then a customer
// sending a file in chat end to end (read, checked, stored, answered from a template), with the AI stubbed out.
import "../scripts/env";
import { test, after, before, mock } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import type { PayAccount, ReceiptReading } from "../src/db/schema";
import { accountMatches, assessReceipt, nameMatches, normaliseReading, paymentInstruction, readWithAI, receiptIntake, setReceiptReader, sniffMime, type AssessInput, type Reader } from "../src/lib/receipts";
import { transitionOrder } from "../src/lib/orders";
import { ingest, respond } from "../src/agent/pipeline";
import { adapterFor } from "../src/channels";
import { resetAiRouterState } from "../src/agent/ai-router";
import { createWorkspace } from "../src/lib/workspace";

let OWNER = "";
const TZ = "Asia/Kuala_Lumpur";
const ACCOUNTS: PayAccount[] = [
  { id: "a", type: "bank_transfer", provider: "Sample Bank", accountName: "Forno Sette Sdn Bhd", accountNumber: "1234 5678 9012" },
  { id: "b", type: "duitnow", provider: "DuitNow", accountName: "Forno Sette Sdn Bhd", accountNumber: "012-345 6789" },
];
const NOW = new Date("2026-10-23T12:00:00+08:00");
const ORDER = { totalMinor: 5200, currency: "MYR", createdAt: new Date("2026-10-23T11:30:00+08:00") };

const good = (over: Partial<ReceiptReading> = {}): ReceiptReading => ({
  looksLikeReceipt: true, amount: 52, currency: "MYR", paidAt: "2026-10-23T11:40", payeeName: "FORNO SETTE SDN BHD", payeeAccount: "1234 5678 9012", payerName: "AIMAN",
  reference: `TXN${Math.floor(Math.random() * 1e10)}`, method: "Sample Bank transfer", status: "successful", legibility: "clear", oddities: [], ...over,
});
const assess = (reading: ReceiptReading | null, over: Partial<AssessInput> = {}) => assessReceipt({ reading, order: ORDER, accounts: ACCOUNTS, timezone: TZ, now: NOW, duplicates: [], ...over });
const level = (r: ReturnType<typeof assess>, code: string) => r.checks.find((c) => c.code === code)?.level;

test("a receipt that matches the order, the account and the time is consistent, with every check passing", () => {
  const r = assess(good());
  assert.equal(r.verdict, "consistent");
  assert.deepEqual(r.checks.map((c) => `${c.code}:${c.level}`), ["amount:pass", "payee:pass", "date:pass", "reuse:pass"]);
});

test("amount: short is a mismatch, more than the total is only worth a look, a different currency is a mismatch", () => {
  const short = assess(good({ amount: 42 }));
  assert.equal(short.verdict, "mismatch");
  assert.match(short.checks.find((c) => c.code === "amount")!.message, /RM 10 short of the RM 52 total/);
  const over = assess(good({ amount: 57 }));
  assert.equal(over.verdict, "review");
  assert.match(over.checks.find((c) => c.code === "amount")!.message, /RM 5 more than/);
  assert.equal(level(assess(good({ currency: "SGD" })), "currency"), "fail");
  assert.equal(level(assess(good({ amount: null })), "amount"), "warn");
});

test("who was paid: your account number passes, any other account fails, even when the name looks the same", () => {
  assert.equal(level(assess(good()), "payee"), "pass");
  assert.equal(level(assess(good({ payeeAccount: "012 345 6789", payeeName: null })), "payee"), "pass", "a DuitNow phone number");
  assert.equal(level(assess(good({ payeeAccount: "+60 12-345 6789" })), "payee"), "pass", "with the country code");
  assert.equal(level(assess(good({ payeeAccount: "****9012" })), "payee"), "pass", "masked, but the shown digits match");
  const other = assess(good({ payeeAccount: "7788 1122 3344", payeeName: "FORNO SETTE SDN BHD" }));
  assert.equal(level(other, "payee"), "fail");
  assert.equal(other.verdict, "mismatch");
  assert.equal(level(assess(good({ payeeAccount: "****1111" })), "payee"), "fail", "masked digits that don't match");
  assert.equal(level(assess(good({ payeeAccount: null, payeeName: "FORNO SETTE" })), "payee"), "pass", "name only, and it matches");
  assert.equal(level(assess(good({ payeeAccount: null, payeeName: "AHMAD BIN ROSLI" })), "payee"), "fail");
  assert.equal(level(assess(good({ payeeAccount: null, payeeName: null })), "payee"), "warn");
  assert.equal(level(assess(good(), { accounts: [] }), "payee"), "warn", "nothing set up to compare with");
});

test("names and numbers: banks shorten names, filler words don't count, masked numbers match on the digits shown", () => {
  assert.ok(nameMatches("Forno Sette Sdn Bhd", "FORNO SETTE"));
  assert.ok(nameMatches("Forno Sette Sdn Bhd", "FORNO SE"), "cut off mid-word");
  assert.ok(!nameMatches("Forno Sette Sdn Bhd", "FORNO"), "one word of two is not enough");
  assert.ok(!nameMatches("Forno Sette Sdn Bhd", "SDN BHD"));
  assert.ok(!nameMatches("Forno Sette Sdn Bhd", "Kedai Mamak Ali"));
  assert.ok(accountMatches("1234 5678 9012", "123456789012"));
  assert.ok(accountMatches("1234 5678 9012", "XXXX 9012"));
  assert.ok(!accountMatches("1234 5678 9012", "**12"), "two digits prove nothing");
  assert.ok(!accountMatches("1234 5678 9012", "1234 5678 9013"));
});

test("date: the future or an old receipt fails, hours before the order is a look, no time shown is judged by the day", () => {
  assert.equal(level(assess(good({ paidAt: "2026-10-24T09:00" })), "date"), "fail", "in the future");
  const old = assess(good({ paidAt: "2026-10-20T10:00" }));
  assert.equal(level(old, "date"), "fail");
  assert.match(old.checks.find((c) => c.code === "date")!.message, /3 day\(s\) before the order/);
  assert.equal(level(assess(good({ paidAt: "2026-10-23T08:00" })), "date_early"), "warn", "3.5 hours before");
  assert.equal(level(assess(good({ paidAt: "2026-10-23" })), "date"), "pass", "date only, same day");
  assert.equal(level(assess(good({ paidAt: "2026-10-21" })), "date"), "fail", "date only, two days before");
  assert.equal(level(assess(good({ paidAt: "2026-10-23T11:40+08:00" })), "date"), "pass", "with an offset");
  assert.equal(level(assess(good({ paidAt: null })), "date"), "warn");
  assert.equal(level(assess(good({ paidAt: "yesterday-ish" })), "date"), "warn");
});

test("reuse, failed payments and odd-looking images: reuse and failure are mismatches, oddities only ask for a closer look", () => {
  const dupe = assess(good(), { duplicates: [{ refCode: "ORD-AAAA", why: "same file" }] });
  assert.equal(dupe.verdict, "mismatch");
  assert.match(dupe.checks.find((c) => c.code === "duplicate")!.message, /same file was already used for order ORD-AAAA/);
  assert.equal(assess(good({ status: "failed" })).verdict, "mismatch");
  assert.equal(assess(good({ status: "pending" })).verdict, "review");
  const odd = assess(good({ oddities: ["amount digits use a different font"] }));
  assert.equal(odd.verdict, "review", "never a mismatch on looks alone");
  assert.match(odd.checks.find((c) => c.code === "oddities")!.message, /can't tell if that matters/);
  assert.equal(level(assess(good({ reference: null })), "reference"), "warn");
  assert.equal(assess(good({ legibility: "partial" })).verdict, "review");
});

test("unreadable: not a receipt or too blurry asks for a new one; an AI that couldn't read at all is left to the owner", () => {
  assert.equal(assess(good({ looksLikeReceipt: false })).verdict, "unreadable");
  assert.equal(assess(good({ legibility: "poor" })).verdict, "unreadable");
  assert.equal(assess(good({ amount: null, payeeName: null, payeeAccount: null })).verdict, "unreadable");
  const none = assess(null);
  assert.equal(none.verdict, "review", "not the customer's fault, so they aren't asked to resend");
  assert.match(none.checks[0].message, /check it yourself/);
});

test("what the model returns is tidied, not trusted: junk values become null and a missing status is 'unknown'", () => {
  const r = normaliseReading({ looks_like_receipt: true, amount: "RM 1,250.50", currency: "RM", paid_at: " 2026-10-23 ", payee_name: "  ", status: "weird", legibility: "clear", oddities: ["", "blurry edge", 5 as unknown as string] });
  assert.equal(r.amount, 1250.5);
  assert.equal(r.currency, "MYR");
  assert.equal(r.paidAt, "2026-10-23");
  assert.equal(r.payeeName, null);
  assert.equal(r.status, "unknown");
  assert.deepEqual(r.oddities, ["blurry edge"]);
  assert.equal(normaliseReading({ amount: -5 }).amount, null);
  assert.equal(normaliseReading({}).legibility, "poor");
});

test("files are recognised by their first bytes, not by what they claim to be", () => {
  assert.equal(sniffMime(Buffer.from("89504e470d0a1a0a0000", "hex")), "image/png");
  assert.equal(sniffMime(Buffer.from("ffd8ffe000104a46", "hex")), "image/jpeg");
  assert.equal(sniffMime(Buffer.from("%PDF-1.7 ...")), "application/pdf");
  assert.equal(sniffMime(Buffer.from("RIFFxxxxWEBPVP8 ")), "image/webp");
  assert.equal(sniffMime(Buffer.from("<script>alert(1)</script>")), null);
  assert.equal(sniffMime(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>")), null, "SVG can carry script, so customers can't send it");
});

test("customers are told how to pay with exactly the saved accounts and the order's total", () => {
  const ws = { currency: "MYR", settings: { payments: { enabled: true, requireReceipt: true, accounts: ACCOUNTS, note: "Use your order code as the reference." } } } as never;
  const text = paymentInstruction(ws, 5200, "ORD-AAAA", false)!;
  assert.match(text, /please pay RM 52 to:\n• Bank transfer: Sample Bank, 1234 5678 9012 \(Forno Sette Sdn Bhd\)\n• DuitNow: DuitNow, 012-345 6789/);
  assert.match(text, /Use your order code as the reference\./);
  assert.match(text, /send a photo or screenshot of the payment receipt here/);
  assert.match(paymentInstruction(ws, 5200, "ORD-AAAA", true)!, /for the items \(the team will tell you the delivery fee\)/);
  assert.equal(paymentInstruction({ currency: "MYR", settings: { payments: { enabled: false, requireReceipt: true, accounts: ACCOUNTS } } } as never, 100, "x", false), null);
});

// ───────────────────────────── in chat

const PNG = (n: string) => Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.from(`fake image ${n}`)]);
const dataUrl = (b: Buffer, mime = "image/png") => `data:${mime};base64,${b.toString("base64")}`;
const workspaces: string[] = [];
let wsRow: typeof t.workspaces.$inferSelect;
let plainRow: typeof t.workspaces.$inferSelect;

// Their own businesses, so these orders can't show up on the sample business's Orders page while other tests run.
before(async () => {
  const mk = (name: string) => createWorkspace({ name, timezone: TZ, owner: { name: "Owner", email: `${Math.random().toString(36).slice(2)}@example.com`, passwordHash: "x" } });
  const [a, b] = [await mk("Receipt Pizza"), await mk("Receipt Salon")];
  workspaces.push(a.workspaceId, b.workspaceId);
  OWNER = a.user.id;
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, a.workspaceId));
  await db.update(t.workspaces).set({ settings: { ...ws.settings, payments: { enabled: true, requireReceipt: true, accounts: ACCOUNTS } } }).where(eq(t.workspaces.id, a.workspaceId));
  [wsRow] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, a.workspaceId));
  [plainRow] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, b.workspaceId));
});
after(async () => {
  setReceiptReader(null);
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await sql.end();
});

async function chatWithOrder(opts: { total?: number; workspace?: string } = {}) {
  const wsId = opts.workspace ?? wsRow.id;
  const [customer] = await db.insert(t.customers).values({ workspaceId: wsId, channel: "simulator", externalId: `rc-${Math.random()}`, displayName: "Aiman" }).returning();
  const [thread] = await db.insert(t.threads).values({ workspaceId: wsId, channel: "simulator", externalThreadId: `rc-${Math.random()}`, customerId: customer.id }).returning();
  const [order] = await db
    .insert(t.orders)
    .values({ workspaceId: wsId, threadId: thread.id, customerId: customer.id, refCode: `ORD-T${Math.random().toString(36).slice(2, 6).toUpperCase()}`, customerName: "Aiman", fulfilment: "pickup", totalMinor: opts.total ?? 5200, currency: "MYR", channel: "simulator", isDemo: true })
    .returning();
  return { thread, order, customer };
}
const send = async (thread: typeof t.threads.$inferSelect, attachments: { kind: "image" | "document" | "voice"; ref?: string; mime?: string }[], text = "") => {
  const r = await ingest({ workspaceId: thread.workspaceId, channel: "simulator", externalThreadId: thread.externalThreadId, customer: { externalId: "x" }, text, attachments, receivedAt: new Date() });
  const [m] = await db.select().from(t.messages).where(eq(t.messages.id, r.messageId));
  return m;
};
/** A reader that returns what's given instead of asking an AI. */
const reads = (reading: ReceiptReading | null): Reader => async () => ({ reading, model: "test" });
const stored = (orderId: string) => db.select().from(t.orderReceipts).where(eq(t.orderReceipts.orderId, orderId));
const TEMPLATE = (ref: string) => `Thanks! I've received your payment receipt for order ${ref}. The team will check it and confirm your order shortly.`;
const paidNow = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 16);

test("a receipt in chat is read, checked, stored with its file, and answered from a template that says nothing about the checks", async () => {
  const { thread, order } = await chatWithOrder();
  setReceiptReader(reads(good({ paidAt: paidNow(), amount: 40 })));
  const file = PNG("a");
  const m = await send(thread, [{ kind: "image", ref: dataUrl(file) }]);
  const r = await receiptIntake(wsRow, thread, m);
  assert.equal(r?.reply, TEMPLATE(order.refCode), "the customer isn't told it was short");
  assert.equal(r?.verdict, "mismatch");
  const [row] = await stored(order.id);
  assert.equal(row.verdict, "mismatch");
  assert.equal(row.mime, "image/png");
  assert.ok(row.bytes.equals(file), "the file is kept");
  assert.equal(row.reading?.amount, 40);
  assert.ok(row.checks.some((c) => c.code === "amount" && c.level === "fail"));
  const ev = await db.select().from(t.events).where(and(eq(t.events.workspaceId, wsRow.id), eq(t.events.type, "receipt.received")));
  assert.ok(ev.some((e) => (e.props as { orderId?: string }).orderId === order.id));
});

test("confirming needs a receipt; once there is one, the owner can confirm whatever it says: the checks are advice", async () => {
  const { thread, order } = await chatWithOrder();
  const before = await transitionOrder({ workspaceId: wsRow.id, orderId: order.id, action: "confirm", userId: OWNER });
  assert.ok(!before.ok && before.status === 409 && /No payment receipt yet/.test(before.error));
  setReceiptReader(reads(good({ paidAt: paidNow(), payeeAccount: "9999 8888 7777" })));
  await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: dataUrl(PNG("b")) }]));
  assert.equal((await stored(order.id))[0].verdict, "mismatch");
  assert.ok((await transitionOrder({ workspaceId: wsRow.id, orderId: order.id, action: "confirm", userId: OWNER })).ok);
});

test("the same file on another order is flagged as reuse; once an order has a usable receipt, more files go to the normal assistant", async () => {
  const a = await chatWithOrder();
  setReceiptReader(reads(good({ paidAt: paidNow() })));
  const file = PNG("reused");
  await receiptIntake(wsRow, a.thread, await send(a.thread, [{ kind: "image", ref: dataUrl(file) }]));
  assert.equal((await stored(a.order.id))[0].verdict, "consistent");
  assert.equal(await receiptIntake(wsRow, a.thread, await send(a.thread, [{ kind: "image", ref: dataUrl(file) }])), null, "sending it again is just chat");
  assert.equal((await stored(a.order.id)).length, 1);

  const b = await chatWithOrder();
  const r = await receiptIntake(wsRow, b.thread, await send(b.thread, [{ kind: "image", ref: dataUrl(file) }]));
  assert.equal(r?.verdict, "mismatch");
  const [row] = await stored(b.order.id);
  assert.ok(row.checks.some((c) => c.code === "duplicate" && c.message.includes(a.order.refCode)));
});

test("the same transaction reference on a different file and order is flagged too", async () => {
  const a = await chatWithOrder();
  const ref = `TXN${Math.floor(Math.random() * 1e9)}`;
  setReceiptReader(reads(good({ paidAt: paidNow(), reference: ref })));
  await receiptIntake(wsRow, a.thread, await send(a.thread, [{ kind: "image", ref: dataUrl(PNG("r1")) }]));
  const b = await chatWithOrder();
  await receiptIntake(wsRow, b.thread, await send(b.thread, [{ kind: "image", ref: dataUrl(PNG("r2")) }]));
  const [row] = await stored(b.order.id);
  assert.equal(row.verdict, "mismatch");
  assert.ok(row.checks.some((c) => c.code === "duplicate" && /same transaction reference/.test(c.message)));
});

test("an unreadable receipt asks for a clearer one and leaves the order waiting, so the next file still counts", async () => {
  const { thread, order } = await chatWithOrder();
  setReceiptReader(reads(good({ legibility: "poor" })));
  const first = await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: dataUrl(PNG("blur")) }]));
  assert.match(first?.reply ?? "", /couldn't read that clearly.*clear photo or screenshot/);
  assert.equal(first?.verdict, "unreadable");
  const blurAgain = await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: dataUrl(PNG("blur")) }]));
  assert.match(blurAgain?.reply ?? "", /couldn't read that clearly/, "the same blurry file again isn't read twice");
  assert.equal((await stored(order.id)).length, 1);
  setReceiptReader(reads(good({ looksLikeReceipt: false })));
  const notReceipt = await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: dataUrl(PNG("pizza")) }]));
  assert.equal(notReceipt?.verdict, "unreadable");
  assert.match(notReceipt?.reply ?? "", /still couldn't read that clearly.*asked the team to check your payment for order /, "the second unreadable file hands the chat to a person instead of asking a third time");
  assert.ok(!/clear photo or screenshot/.test(notReceipt?.reply ?? ""));
  const cards = await db.select().from(t.escalations).where(eq(t.escalations.threadId, thread.id));
  assert.equal(cards.length, 1);
  assert.equal(cards[0].category, "receipt_problem");
  assert.match(cards[0].summary, new RegExp(`Couldn't read 2 receipts for ${order.refCode}`));
  setReceiptReader(reads(good({ paidAt: paidNow() })));
  const ok = await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: dataUrl(PNG("clear")) }]));
  assert.equal(ok?.reply, TEMPLATE(order.refCode));
  assert.deepEqual((await stored(order.id)).map((r) => r.verdict).sort(), ["consistent", "unreadable", "unreadable"], "the blurry one, the pizza photo, then the real receipt");
  // Now it has a usable receipt, another file in the chat goes to the normal assistant.
  assert.equal(await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: dataUrl(PNG("later")) }])), null);
});

test("an AI that can't read the file doesn't blame the customer: the receipt is kept for the owner to open", async () => {
  const { thread, order } = await chatWithOrder();
  setReceiptReader(reads(null));
  const r = await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: dataUrl(PNG("ai-down")) }]));
  assert.equal(r?.reply, TEMPLATE(order.refCode));
  const [row] = await stored(order.id);
  assert.equal(row.verdict, "review");
  assert.equal(row.reading, null);
});

test("files that aren't receipts for anything fall through to the normal assistant", async () => {
  const none = await chatWithOrder();
  await db.update(t.orders).set({ status: "cancelled" }).where(eq(t.orders.id, none.order.id));
  setReceiptReader(reads(good()));
  assert.equal(await receiptIntake(wsRow, none.thread, await send(none.thread, [{ kind: "image", ref: dataUrl(PNG("c")) }])), null, "its only order is cancelled");
  const live = await chatWithOrder();
  assert.equal(await receiptIntake(wsRow, live.thread, await send(live.thread, [{ kind: "voice", ref: dataUrl(PNG("v")) }])), null, "a voice note");
  assert.equal(await receiptIntake(wsRow, live.thread, await send(live.thread, [])), null, "text only");
  const other = await chatWithOrder({ workspace: plainRow.id });
  assert.equal(await receiptIntake(plainRow, other.thread, await send(other.thread, [{ kind: "image", ref: dataUrl(PNG("d")) }])), null, "a business with payments off");
  const stale = await chatWithOrder();
  await db.update(t.orders).set({ createdAt: new Date(Date.now() - 9 * 86_400_000) }).where(eq(t.orders.id, stale.order.id));
  assert.equal(await receiptIntake(wsRow, stale.thread, await send(stale.thread, [{ kind: "image", ref: dataUrl(PNG("e")) }])), null, "an order from last week");
});

test("a file that isn't a photo or PDF, or can't be fetched, gets a polite ask and nothing is stored", async () => {
  const { thread, order } = await chatWithOrder();
  setReceiptReader(reads(good()));
  const svg = await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: dataUrl(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), "image/svg+xml") }]));
  assert.match(svg?.reply ?? "", /only read photos \(JPG, PNG, WebP\) and PDFs/);
  const broken = await receiptIntake(wsRow, thread, await send(thread, [{ kind: "image", ref: "not-a-real-file" }]));
  assert.match(broken?.reply ?? "", /couldn't open that file/);
  assert.equal((await stored(order.id)).length, 0);
});

test("through the pipeline: a customer's receipt is answered by the template, as a 'receipt' outcome, without calling the assistant", async () => {
  const { thread, order } = await chatWithOrder();
  setReceiptReader(reads(good({ paidAt: paidNow() })));
  const m = await send(thread, [{ kind: "image", ref: dataUrl(PNG("pipe")) }]);
  const out = await respond(thread.id, m.id, { isDemo: true });
  assert.equal(out.outcome, "receipt");
  assert.equal(out.reply, TEMPLATE(order.refCode));
  assert.equal(out.status, "sent");
  const sent = await db.select().from(t.messages).where(and(eq(t.messages.threadId, thread.id), eq(t.messages.direction, "out")));
  assert.equal(sent[0]?.text, TEMPLATE(order.refCode));
  assert.equal((await db.select().from(t.agentRuns).where(eq(t.agentRuns.threadId, thread.id))).length, 0, "no assistant run was made");
});

/** Typing every few ms (WhatsApp's repeat, sped up), so a run that forgets to stop it keeps counting after it returns. */
async function typingStopsAfter(run: () => Promise<unknown>, onStart = () => {}) {
  const sim = adapterFor("simulator");
  let shown = 0;
  sim.typingEveryMs = 25;
  sim.typing = async () => {
    if (!shown++) onStart();
  };
  try {
    await run();
    const atEnd = shown;
    await new Promise((r) => setTimeout(r, 80));
    assert.ok(atEnd >= 1, "typing was shown");
    assert.equal(shown, atEnd, "typing stopped with the run");
  } finally {
    delete sim.typing;
    delete sim.typingEveryMs;
  }
}

test("typing stops when a receipt is answered from the template", async () => {
  const { thread } = await chatWithOrder();
  setReceiptReader(reads(good({ paidAt: paidNow() })));
  const m = await send(thread, [{ kind: "image", ref: dataUrl(PNG("typing")) }]);
  await typingStopsAfter(async () => assert.equal((await respond(thread.id, m.id, { isDemo: true })).outcome, "receipt"));
});

test("typing stops when the run throws", async () => {
  const { thread } = await chatWithOrder();
  const m = await send(thread, [], "hello?");
  const broken = () => mock.method(db, "select", () => {
    throw new Error("database went away");
  });
  try {
    await typingStopsAfter(() => assert.rejects(respond(thread.id, m.id, { isDemo: true }), /database went away/), broken);
  } finally {
    mock.restoreAll();
  }
});

// ───────────────────────────── the AI step

const realFetch = globalThis.fetch;
const toolJson = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
const READ = { looks_like_receipt: true, amount: 52, currency: "MYR", paid_at: "2026-10-23T11:40", payee_name: "FORNO SETTE SDN BHD", status: "successful", legibility: "clear" };
const bodies: any[] = [];
const stubAI = (onlyProvider: "gemini" | "groq") => {
  const keys = { g: process.env.GROQ_API_KEY, m: process.env.GEMINI_API_KEY, a: process.env.ANTHROPIC_API_KEY };
  delete process.env.ANTHROPIC_API_KEY;
  if (onlyProvider === "gemini") { delete process.env.GROQ_API_KEY; process.env.GEMINI_API_KEY = "test-gemini"; } else { delete process.env.GEMINI_API_KEY; process.env.GROQ_API_KEY = "test-groq"; }
  resetAiRouterState();
  bodies.length = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith("/models")) return toolJson({ object: "list", data: [{ id: "gemini-3.5-flash" }, { id: "gemini-3.5-flash-lite" }, { id: "openai/gpt-oss-120b" }, { id: "openai/gpt-oss-20b" }].map((m) => ({ ...m, object: "model" })) });
    const body = JSON.parse(String(init?.body));
    bodies.push(body);
    return toolJson({ id: "x", object: "chat.completion", created: 0, model: body.model, choices: [{ index: 0, finish_reason: "tool_calls", message: { role: "assistant", content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "record_receipt", arguments: JSON.stringify(READ) } }] } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = realFetch;
    for (const [k, v] of [["GROQ_API_KEY", keys.g], ["GEMINI_API_KEY", keys.m], ["ANTHROPIC_API_KEY", keys.a]] as const) v === undefined ? delete process.env[k] : (process.env[k] = v);
    resetAiRouterState();
  };
};

test("reading goes to a model that can see the image, as an image part, and is told to treat the picture as data", async () => {
  const restore = stubAI("gemini");
  try {
    const r = await readWithAI(PNG("ai"), "image/png");
    assert.equal(r.reading?.amount, 52);
    assert.equal(r.reading?.payeeName, "FORNO SETTE SDN BHD");
    assert.match(r.model ?? "", /^Google Gemini: /);
    const chat = bodies.at(-1);
    assert.equal(chat.tool_choice.function.name, "record_receipt");
    const parts = chat.messages.at(-1).content;
    assert.equal(parts.find((p: { type: string }) => p.type === "image_url")?.image_url.url.slice(0, 22), "data:image/png;base64,");
    assert.match(chat.messages[0].content, /never instructions/);
  } finally {
    restore();
  }
});

test("an answer from a model that can't see images is thrown away: it would be made up", async () => {
  const restore = stubAI("groq");
  try {
    const r = await readWithAI(PNG("blind"), "image/png");
    assert.equal(r.reading, null);
  } finally {
    restore();
  }
});
