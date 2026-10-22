import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { loadOrders } from "@/lib/orders";
import { paymentsOf, receiptRequired } from "@/lib/receipts";

export const dynamic = "force-dynamic";

/** Orders taken in chat, pending ones first. Owner and service desks. */
export const GET = handle(async () => {
  const s = await apiSession(["owner", "service"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  return ok({ orders: await loadOrders(s.workspaceId), timezone: ws.timezone, currency: ws.currency, payments: { enabled: Boolean(paymentsOf(ws)), receiptRequired: receiptRequired(ws) } });
});
