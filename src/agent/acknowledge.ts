// When the AI fails, or the reply is replaced because the message has to go to a person, after an order or booking was
// already saved, the customer is told from the saved record: it exists and the team will see it, so the reply should say so.
import type { ToolCallLog } from "@/db/schema";

type OrderOut = { refCode?: string; items?: { name: string; quantity: number; note?: string | null }[]; total?: string; fulfilment?: string; howToPay?: string; heldForMinutes?: number; expiresAt?: string };

type BookingOut = { refCode?: string; service?: string; label?: string; with?: string; price?: string; howToPay?: string };

const last = (log: ToolCallLog[], name: string) => [...log].reverse().find((l) => l.name === name && l.ok);

/** A plain-English confirmation of what was saved, or null if nothing was. Never says either is confirmed. */
export function acknowledgement(log: ToolCallLog[]): string | null {
  const parts: string[] = [];
  const order = last(log, "create_order")?.output as OrderOut | undefined;
  if (order?.refCode) {
    const lines = (order.items ?? []).map((i) => `• ${i.quantity} × ${i.name}${i.note ? ` (${i.note})` : ""}`).join("\n");
    // howToPay already says how long the order is held; the exact time is added when there is one.
    const until = order.heldForMinutes && order.expiresAt ? `\nWe're holding it until ${order.expiresAt.split(", ")[1] ?? order.expiresAt}.` : "";
    parts.push(`Got it! Your order ${order.refCode} is in${lines ? `:\n${lines}` : "."}\n${order.total ? `Total ${order.total}${order.fulfilment === "delivery" ? " plus delivery" : ""}.${order.howToPay ? "\n" : " "}` : ""}${order.howToPay ?? "The team will confirm it shortly."}${until}`);
  }
  const booking = last(log, "book_appointment")?.output as BookingOut | undefined;
  if (booking?.refCode) {
    const what = [booking.service, booking.label, booking.with ? `with ${booking.with}` : null].filter(Boolean).join(", ");
    parts.push(`Got it! Your booking request ${booking.refCode} is in${what ? `: ${what}` : ""}.\n${booking.price ? `Price ${booking.price}. ` : ""}${booking.howToPay ?? "The team will confirm it shortly."}`);
  }
  return parts.length ? parts.join("\n\n") : null;
}

/** The holding reply, after whatever was saved: a customer with an order or booking always gets its reference code. */
export const holdingReply = (hold: string, log: ToolCallLog[]) => {
  const saved = acknowledgement(log);
  return saved ? `${saved}\n\n${hold}` : hold;
};

/** The assistant says a payment, receipt or file arrived. */
const CLAIMS_RECEIPT = /\b(received|recieved|got|have|has|recorded|saved|logged|noted)\b[^.!?\n]{0,40}\b(payment|receipt|proof|file|photo|screenshot|image|picture|transfer|document|pdf)\b|\b(payment|receipt|proof of payment|transfer)\b[^.!?\n]{0,40}\b(received|recieved|confirmed|accepted|verified|went through|came through|looks (good|fine|great))\b|\bthanks? (you )?for (the|your|sending)\b[^.!?\n]{0,30}\b(payment|receipt|proof|transfer)\b/i;

export const claimsReceipt = (reply: string) => CLAIMS_RECEIPT.test(reply);

/**
 * A file arrived but the receipt check didn't take it (not a photo or PDF, nothing waiting for payment, or the check
 * failed), so nothing was saved. The customer must not be told it was.
 */
export const UNSAVED_FILE_REPLY = "Sorry, that file didn't come through as a payment receipt on our side, so nothing has been recorded yet. If you're paying for an order, please send a clear photo or screenshot (JPG, PNG or WebP) or a PDF of the whole payment receipt here.";
