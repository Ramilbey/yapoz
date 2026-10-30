// When the AI fails after it already saved an order, the customer is told from the saved record
// instead of "I've passed this to our team": the order exists and the team will see it, so the reply should say so.
import type { ToolCallLog } from "@/db/schema";

type OrderOut = { refCode?: string; items?: { name: string; quantity: number; note?: string | null }[]; total?: string; fulfilment?: string; howToPay?: string; heldForMinutes?: number; expiresAt?: string };

const last = (log: ToolCallLog[], name: string) => [...log].reverse().find((l) => l.name === name && l.ok);

/** A plain-English confirmation of what was saved, or null if nothing was. Never says an order is confirmed. */
export function acknowledgement(log: ToolCallLog[]): string | null {
  const parts: string[] = [];
  const order = last(log, "create_order")?.output as OrderOut | undefined;
  if (order?.refCode) {
    const lines = (order.items ?? []).map((i) => `• ${i.quantity} × ${i.name}${i.note ? ` (${i.note})` : ""}`).join("\n");
    // howToPay already says how long the order is held; the exact time is added when there is one.
    const until = order.heldForMinutes && order.expiresAt ? `\nWe're holding it until ${order.expiresAt.split(", ")[1] ?? order.expiresAt}.` : "";
    parts.push(`Got it! Your order ${order.refCode} is in${lines ? `:\n${lines}` : "."}\n${order.total ? `Total ${order.total}${order.fulfilment === "delivery" ? " plus delivery" : ""}.${order.howToPay ? "\n" : " "}` : ""}${order.howToPay ?? "The team will confirm it shortly."}${until}`);
  }
  return parts.length ? parts.join("\n\n") : null;
}
