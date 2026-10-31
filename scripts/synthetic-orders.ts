// A synthetic run of 20 chat orders through the real order, receipt and approval code, in a throwaway business whose
// records are labelled as demo data. The AI is left out: the script stands in for the assistant's tool call and for the
// receipt reader, so this measures what the system records, not how well a model understands a customer.
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import type { PayAccount, ReceiptReading } from "@/db/schema";
import { ingest, respond } from "@/agent/pipeline";
import { knowledge } from "@/agent/knowledge";
import { runTool } from "@/agent/tools";
import { requestReceipt, transitionOrder } from "@/lib/orders";
import { setReceiptReader } from "@/lib/receipts";
import { localDate, localTime } from "@/lib/time";
import { createWorkspace } from "@/lib/workspace";

const TZ = "Asia/Kuala_Lumpur";
const ACCOUNT: PayAccount = { id: "synthetic", type: "bank_transfer", provider: "Sample Bank", accountName: "Synthetic Kitchen", accountNumber: "1111 2222 3333" };
const MENU = [
  { slug: "synthetic-loaf", title: "Synthetic Loaf", stockMode: "tracked" as const, priceMinor: 1200, stock: 1000, dailyQty: null },
  { slug: "synthetic-bun", title: "Synthetic Bun", stockMode: "daily" as const, priceMinor: 450, stock: null, dailyQty: 1000 },
  { slug: "synthetic-tart", title: "Synthetic Tart", stockMode: "none" as const, priceMinor: 900, stock: null, dailyQty: null },
];
/** Sixteen clean orders and four a person has to look at. This script picks the mix, so it says nothing about real customers. */
const SCENARIOS = [...Array<string>(16).fill("clean"), "short", "short", "wrong_payee", "reused"];

const png = (tag: string) => `data:image/png;base64,${Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.from(`synthetic receipt ${tag}`)]).toString("base64")}`;

function reading(amountMinor: number, over: Partial<ReceiptReading> = {}) {
  const now = new Date();
  return { looksLikeReceipt: true, amount: amountMinor / 100, currency: "MYR", paidAt: `${localDate(now, TZ)}T${localTime(now, TZ)}`, payeeName: ACCOUNT.accountName, payeeAccount: ACCOUNT.accountNumber, reference: null, status: "successful", legibility: "clear", oddities: [], ...over } as ReceiptReading;
}

/** Returns the throwaway business's id. Its orders, receipts and activity are the run's only output. */
export async function runSyntheticOrders() {
  const stamp = Date.now().toString(36);
  const { workspaceId, user } = await createWorkspace({ name: `Synthetic Kitchen ${stamp}`, timezone: TZ, owner: { name: "Synthetic Owner", email: `synthetic-${stamp}@example.com`, passwordHash: "x" } });
  const [row] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  await db.update(t.workspaces).set({ settings: { ...row.settings, payments: { enabled: true, requireReceipt: true, accounts: [ACCOUNT] } } }).where(eq(t.workspaces.id, workspaceId));
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  for (const { priceMinor, stock, dailyQty, ...item } of MENU) {
    const [kb] = await db.insert(t.kbItems).values({ workspaceId, kind: "product", category: "synthetic", ...item }).returning();
    await db.insert(t.kbVariants).values({ workspaceId, itemId: kb.id, priceMinor, stock, dailyQty });
  }
  const { catalog } = await knowledge(ws);
  const say = (sid: string, text: string, attachments: { kind: "image"; ref: string }[] = []) =>
    ingest({ workspaceId, channel: "simulator", externalThreadId: `sim:${sid}`, customer: { externalId: sid, displayName: "Synthetic Customer" }, text, attachments, receivedAt: new Date() });
  const firstReceipt = png("clean-0");
  try {
    for (const [i, scenario] of SCENARIOS.entries()) {
      const product = MENU[i % MENU.length];
      const quantity = 1 + (i % 3);
      const sid = `synthetic-${stamp}-${i}`;
      const opened = await say(sid, `${quantity} ${product.title} for pickup please`);
      const ctx = { ws, catalog, threadId: opened.thread.id, customerId: opened.customer.id, customerName: "Synthetic Customer", channel: "simulator" as const, escalations: [], orders: [], isDemo: true };
      const placed = await runTool(ctx, "create_order", { items: [{ product: product.title, quantity }], fulfilment: "pickup", customer_name: "Synthetic Customer" }, "");
      const refCode = (placed.output as { refCode?: string }).refCode;
      if (!refCode) throw new Error(`Synthetic order ${i} wasn't placed: ${JSON.stringify(placed.output)}`);
      const [order] = await db.select().from(t.orders).where(eq(t.orders.refCode, refCode));
      const upload = async (file: string, r: ReceiptReading) => {
        setReceiptReader(async () => ({ reading: r, model: "synthetic" }));
        const m = await say(sid, "", [{ kind: "image", ref: file }]);
        await respond(m.thread.id, m.messageId, { isDemo: true });
      };
      const paid = reading(order.totalMinor);
      if (scenario === "short") {
        await upload(png(`short-${i}`), reading(order.totalMinor - 100));
        const asked = await requestReceipt({ workspaceId, orderId: order.id, userId: user.id, reason: "The amount is short", kind: "replace" });
        if (!asked.ok) throw new Error(asked.error);
        await upload(png(`resent-${i}`), paid);
      } else if (scenario === "wrong_payee") await upload(png(`payee-${i}`), reading(order.totalMinor, { payeeAccount: "9999 8888 7777" }));
      else await upload(scenario === "reused" || i === 0 ? firstReceipt : png(`clean-${i}`), paid);
      const reject = scenario === "wrong_payee" || scenario === "reused";
      const done = await transitionOrder({ workspaceId, orderId: order.id, action: reject ? "reject" : "confirm", userId: user.id, reason: reject ? "The receipt didn't pass" : null, reasonCode: reject ? "other" : null });
      if (!done.ok) throw new Error(`Synthetic order ${i}: ${done.error}`);
    }
  } finally {
    setReceiptReader(null);
  }
  return workspaceId;
}
