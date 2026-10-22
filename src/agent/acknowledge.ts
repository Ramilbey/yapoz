// When the AI fails after it already saved an order or a booking, the customer is told from the saved record
// instead of "I've passed this to our team": the order exists and the team will see it, so the reply should say so.
import type { ToolCallLog } from "@/db/schema";

type OrderOut = { refCode?: string; items?: { name: string; quantity: number; note?: string | null }[]; total?: string; fulfilment?: string };
type BookingOut = { refCode?: string; when?: string; bookingType?: string; service?: string | null; quantity?: number };

const last = (log: ToolCallLog[], name: string) => [...log].reverse().find((l) => l.name === name && l.ok);

/** A plain-English confirmation of what was saved, or null if nothing was. Never says an order is confirmed. */
export function acknowledgement(log: ToolCallLog[]): string | null {
  const parts: string[] = [];
  const booking = last(log, "create_booking")?.output as BookingOut | undefined;
  if (booking?.refCode) {
    const what = booking.service || (booking.bookingType && booking.quantity && booking.quantity > 1 ? `${booking.bookingType} for ${booking.quantity}` : booking.bookingType) || "Your booking";
    parts.push(`You're booked: ${what}${booking.when ? `, ${booking.when}` : ""}. Your reference is ${booking.refCode}.`);
  }
  const order = last(log, "create_order")?.output as OrderOut | undefined;
  if (order?.refCode) {
    const lines = (order.items ?? []).map((i) => `• ${i.quantity} × ${i.name}${i.note ? ` (${i.note})` : ""}`).join("\n");
    parts.push(`Got it! Your order ${order.refCode} is in${lines ? `:\n${lines}` : "."}\n${order.total ? `Total ${order.total}${order.fulfilment === "delivery" ? " plus delivery" : ""}. ` : ""}The team will confirm it shortly.`);
  }
  return parts.length ? parts.join("\n\n") : null;
}
