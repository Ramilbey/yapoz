import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { loadOrders } from "@/lib/orders";
import { paymentsOf, receiptRequired } from "@/lib/receipts";
import { expireDueOrders, stockSettings } from "@/lib/stock";
import { sendDueReminders } from "@/lib/appointments";

export const dynamic = "force-dynamic";

/** Orders taken in chat, pending ones first. Owner and service desks. */
export const GET = handle(async () => {
  const s = await apiSession(["owner", "service"]);
  // No cron runs often enough to expire unpaid orders: opening the page does it (exactly once per order).
  await expireDueOrders(s.workspaceId).catch((e) => console.error("[stock] expiry failed", e));
  await sendDueReminders(s.workspaceId).catch((e) => console.error("[appointments] reminders failed", e));
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  return ok({ orders: await loadOrders(s.workspaceId), timezone: ws.timezone, currency: ws.currency, payments: { enabled: Boolean(paymentsOf(ws)), receiptRequired: receiptRequired(ws) }, holdMinutes: stockSettings(ws).holdMinutes, now: new Date().toISOString() });
});
