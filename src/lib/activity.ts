// The Activity log: every event the app records, turned into one readable line with who did it and a link to the order
// or chat. The events table is the source of truth; this file only words it.
import { formatMoney } from "./money";
import { human } from "./time";

export const CATEGORIES = {
  orders: { label: "Orders", prefixes: ["order.", "stock.held", "stock.firmed", "stock.released"] },
  appointments: { label: "Appointments", prefixes: ["appointment."] },
  receipts: { label: "Receipts", prefixes: ["receipt."] },
  chats: { label: "Chats", prefixes: ["message.", "staff.", "thread.", "draft.", "escalation."] },
  knowledge: { label: "Knowledge and stock", prefixes: ["kb.", "setup.", "stock."] },
  channels: { label: "Channels and settings", prefixes: ["channel.", "telegram.", "settings.", "assistant.", "workspace."] },
  security: { label: "Team and security", prefixes: ["team.", "auth.", "privacy."] },
} as const;
export type Category = keyof typeof CATEGORIES;

/** Service staff see what happens with orders and customers; team, security and settings changes are for owners. */
export const OWNER_ONLY: Category[] = ["channels", "security"];

/** Every customer message and every routine AI reply: hidden unless asked for, so the log reads as a list of decisions. */
export const ROUTINE = ["message.received", "message.answered"];

export const categoryOf = (type: string): Category | null =>
  (Object.entries(CATEGORIES).find(([, c]) => c.prefixes.some((p) => type.startsWith(p)))?.[0] as Category | undefined) ?? null;

type P = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const q = (v: unknown) => (str(v) ? `“${str(v)}”` : "");
const KIND: Record<string, string> = { confirmed: "confirmed", ready: "ready", rejected: "rejected", cancelled: "cancelled", receipt_request: "asked for a new receipt", expired: "expired", reminder: "reminded of their booking" };
const OUTCOME: Record<string, string> = { auto_resolved: "answered", ordered: "took an order", escalated: "handed to staff", drafted: "drafted a reply for approval", declined: "declined (off-topic)", error: "failed: holding reply sent", receipt: "acknowledged a receipt" };

export type Line = { text: string; level: "info" | "good" | "warn" | "bad" };

export function describe(type: string, p: P, currency: string, timeZone = "UTC"): Line {
  const ref = str(p.refCode);
  const when = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? human(new Date(v), timeZone) : str(v));
  const money = (m: unknown) => (typeof m === "number" ? formatMoney(m, currency) : "");
  switch (type) {
    case "order.created": if (p.kind === "appointment") return { text: `New booking ${ref} from chat, ${money(p.totalMinor)}, waiting for approval`, level: "info" };
      return { text: `New order ${ref} from chat, ${money(p.totalMinor)} (${str(p.items)} line${p.items === 1 ? "" : "s"}), waiting for approval`, level: "info" };
    case "order.confirmed": return { text: `Confirmed ${ref}${p.stock === "deducted" ? "; stock deducted" : ""}`, level: "good" };
    case "order.rejected": return { text: `Rejected ${ref}${p.reason ? `: ${q(p.reason)}` : ""}${p.stock === "returned" ? "; stock returned" : ""}`, level: "warn" };
    case "order.cancelled": return { text: `Cancelled ${ref}${p.reason ? `: ${q(p.reason)}` : ""}${p.stock === "returned" ? "; stock returned" : ""}`, level: "warn" };
    case "order.ready": return { text: `Marked ${ref} ready`, level: "good" };
    case "order.completed": return { text: `Completed ${ref}`, level: "good" };
    case "order.paid": return { text: `Marked ${ref} paid`, level: "good" };
    case "order.unpaid": return { text: `Marked ${ref} unpaid`, level: "info" };
    case "order.notified": return { text: `Customer told: ${ref} ${KIND[str(p.kind)] ?? str(p.kind)}`, level: "good" };
    case "order.notify_failed": return { text: p.status === "no_chat" ? `Couldn't tell the customer about ${ref}: no chat to message` : `Customer NOT told: ${ref} ${KIND[str(p.kind)] ?? str(p.kind)}${p.error ? ` (${str(p.error)})` : ""}`, level: "bad" };
    case "order.expired": return { text: `${ref} expired: no receipt passed the checks in time; the customer was told`, level: "warn" };
    case "order.reopened": return { text: `Reopened ${ref}: a receipt that passes the checks arrived after it expired${p.holds ? "; stock reserved again" : ""}`, level: "info" };
    case "order.kept_reserved": return { text: `Kept ${ref} reserved: the payment timer stopped`, level: "info" };
    case "appointment.booked": return { text: `${ref} booked for ${when(p.startsAt)}${p.online ? " (online)" : " (in person)"}${p.service ? `: ${str(p.service)}` : ""}`, level: "info" };
    case "appointment.rescheduled": return { text: `Customer moved ${ref} from ${when(p.from)} to ${when(p.to)}${p.reconfirm ? "; back in Pending for approval" : ""}`, level: "warn" };
    case "appointment.cancelled": return { text: `Customer cancelled ${ref} (${when(p.startsAt)}) in chat`, level: "warn" };
    case "appointment.attended": return { text: `${ref}: ${({ present: "attended", late: "arrived late", no_show: "no-show" } as P)[str(p.attendance)] ?? str(p.attendance)}${p.previous ? ` (was ${str(p.previous).replace("_", "-")})` : ""}`, level: p.attendance === "no_show" ? "warn" : "good" };
    case "appointment.staff_updated": return { text: `Changed ${str(p.name)}'s appointment settings: ${(Array.isArray(p.fields) ? p.fields : []).map(str).join(", ")}`, level: "info" };
    case "stock.held": return { text: `Stock held for ${ref}${p.date ? ` (for ${str(p.date)})` : ""}${p.expiresAt ? " while the customer pays" : ""}`, level: "info" };
    case "stock.firmed": return { text: `Receipt for ${ref} passed the checks: its stock stays reserved`, level: "good" };
    case "stock.released": return { text: `Stock for ${ref} went back${p.why === "expired" ? " (expired)" : p.why === "reject" ? " (rejected)" : p.why === "cancel" ? " (cancelled)" : ""}`, level: "info" };
    case "stock.daily_set": return { text: p.usual ? `${q(p.name)} on ${str(p.date)} back to the usual ${str(p.to ?? "–")}` : `Set ${q(p.name)} to ${str(p.to)} for ${str(p.date)}${p.from != null ? ` (was ${str(p.from)})` : ""}`, level: "info" };
    case "stock.low": return { text: Number(p.left) <= 0 ? `${str(p.name)} is out of stock` : `Low stock: only ${str(p.left)} left of ${str(p.name)}`, level: "warn" };
    case "stock.restocked": return { text: `Restocked ${q(p.itemTitle)} ${str(p.variant)}: ${str(p.from ?? 0)} → ${str(p.to)}`, level: "good" };
    case "order.attempt_failed": return { text: `AI couldn't place an order yet: ${(Array.isArray(p.problems) ? p.problems : []).map(str).join(" ").slice(0, 200)}`, level: "warn" };
    case "receipt.received": return { text: `${p.requested ? "New receipt (as asked)" : "Receipt"} for ${ref}: ${({ consistent: "looks consistent", review: "needs a look", mismatch: "doesn't add up", unreadable: "couldn't be read" } as P)[str(p.verdict)] ?? str(p.verdict)}${p.model ? `, read by ${str(p.model)}` : ""}`, level: p.verdict === "consistent" ? "good" : p.verdict === "review" ? "info" : "warn" };
    case "receipt.requested": return { text: `Asked for ${p.kind === "top_up" ? `the remaining ${money(p.expectedMinor)}` : `a new receipt (${money(p.expectedMinor)})`} on ${ref}: ${q(p.reason)}`, level: "warn" };
    case "message.received": return { text: `Customer message on ${str(p.channel)}${p.attachments ? " with a file" : ""}`, level: "info" };
    case "message.answered": return { text: `AI ${OUTCOME[str(p.outcome)] ?? str(p.outcome)}${p.model && p.model !== "none" ? ` (${str(p.model)})` : ""}${p.status === "failed" ? "; reply not delivered" : ""}${p.error ? `: ${str(p.error)}` : ""}`, level: p.outcome === "error" || p.status === "failed" ? "bad" : "info" };
    case "staff.reply": return { text: `Replied in chat${p.status === "failed" ? `, NOT delivered${p.error ? ` (${str(p.error)})` : ""}` : ""}`, level: p.status === "failed" ? "bad" : "info" };
    case "thread.takeover": return { text: "Took over a chat (AI paused)", level: "info" };
    case "thread.release": return { text: "Handed a chat back to the AI", level: "info" };
    case "thread.resolved": return { text: "Marked a chat resolved", level: "good" };
    case "thread.reopened": return { text: "Reopened a chat", level: "info" };
    case "draft.approved": return { text: `Approved an AI draft${p.edited ? " (edited)" : ""}`, level: "good" };
    case "draft.discarded": return { text: "Discarded an AI draft", level: "info" };
    case "escalation.created": return { text: `Needs you: ${str(p.summary)}${p.reason ? ` (${str(p.reason)})` : ""}`, level: p.priority === "high" || p.priority === "urgent" ? "bad" : "warn" };
    case "escalation.resolved": return { text: `Resolved: ${str(p.summary)}`, level: "good" };
    case "kb.created": return { text: `Added ${q(p.title)} to Knowledge`, level: "info" };
    case "kb.updated": return { text: `Edited ${q(p.title)}${p.available === false ? ": marked unavailable" : p.available === true ? ": marked available" : ""}`, level: "info" };
    case "kb.deleted": return { text: `Deleted ${q(p.title)} from Knowledge`, level: "warn" };
    case "kb.variant_created": return { text: `Added option ${str(p.variant)} to ${q(p.itemTitle)}`, level: "info" };
    case "kb.variant_updated": {
      const st = p.stock as { from?: unknown; to?: unknown } | undefined;
      const pr = p.priceMinor as { from?: unknown; to?: unknown } | undefined;
      const parts = [st ? `stock ${str(st.from ?? "∞")} → ${str(st.to ?? "∞")}` : null, pr ? `price ${money(pr.from)} → ${money(pr.to)}` : null].filter(Boolean);
      return { text: `Changed ${q(p.itemTitle)} ${str(p.variant)}${parts.length ? `: ${parts.join(", ")}` : ""}`, level: "info" };
    }
    case "kb.variant_deleted": return { text: `Removed option ${str(p.variant)} from ${q(p.itemTitle)}`, level: "warn" };
    case "kb.gap_answered": return { text: `Answered a knowledge gap${p.title ? `: ${q(p.title)}` : ""}`, level: "good" };
    case "kb.gap_dismissed": return { text: `Dismissed a knowledge gap ${q(p.gap)}`, level: "info" };
    case "setup.drafted": return { text: "Setup drafted the knowledge base", level: "info" };
    case "setup.imported": return { text: "Imported the setup draft into Knowledge", level: "info" };
    case "channel.connected": return { text: `Connected ${str(p.channel)}${p.method === "embedded" ? " with Facebook" : p.method === "manual" ? " manually" : ""}${p.phone ? ` (${str(p.phone)})` : p.bot ? ` (@${str(p.bot)})` : ""}`, level: "good" };
    case "channel.disconnected": return { text: `Disconnected ${str(p.channel)}`, level: "warn" };
    case "channel.meta_app_saved": return { text: "Saved the Meta app", level: "info" };
    case "channel.meta_app_removed": return { text: "Removed the Meta app", level: "warn" };
    case "telegram.linked": return { text: "Linked a Telegram account", level: "info" };
    case "telegram.business_connection": return { text: `Telegram Business connection ${p.enabled ? "on" : "off"}${p.canReply === false ? " (can't reply yet)" : ""}`, level: "info" };
    case "telegram.cannot_reply": return { text: "A Telegram Business message couldn't be answered: allow “Reply to messages”", level: "bad" };
    case "settings.updated": return { text: `Changed settings: ${(Array.isArray(p.keys) ? p.keys : []).map(str).join(", ")}`, level: "info" };
    case "assistant.live": return { text: p.live ? "Went live: the assistant answers customers" : "Paused the assistant", level: p.live ? "good" : "warn" };
    case "workspace.created": return { text: "Business created", level: "info" };
    case "team.invited": return { text: `Invited ${str(p.email)} as ${str(p.role)}`, level: "info" };
    case "team.invite_revoked": return { text: `Revoked the invite for ${str(p.email)}`, level: "info" };
    case "team.joined": return { text: `${str(p.name)} joined as ${str(p.role)}`, level: "good" };
    case "team.role_changed": return { text: `Changed ${str(p.name)} from ${str(p.from)} to ${str(p.to)}`, level: "warn" };
    case "team.removed": return { text: `Removed ${str(p.name)} (${str(p.email)}) from the team`, level: "warn" };
    case "auth.login": return { text: "Signed in", level: "info" };
    case "auth.logout": return { text: "Signed out", level: "info" };
    case "auth.login_failed": return { text: `Failed sign-in for ${str(p.email)}`, level: "bad" };
    case "auth.password_changed": return { text: "Changed their password (other devices signed out)", level: "warn" };
    case "auth.signed_out_everywhere": return { text: "Signed out on every other device", level: "warn" };
    case "privacy.customer_deleted": return { text: `Erased a customer's data (${str(p.threads)} chat${p.threads === 1 ? "" : "s"}, ${str(p.orders)} order${p.orders === 1 ? "" : "s"} anonymised)`, level: "warn" };
    case "privacy.retention_purge": return { text: `Retention: deleted ${str(p.threads)} old chat(s) and ${str(p.receipts)} receipt file(s) (older than ${str(p.days)} days)`, level: "info" };
    default: return { text: type.replace(/[._]/g, " "), level: "info" };
  }
}
