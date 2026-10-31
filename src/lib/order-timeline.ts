// "What the AI did and didn't do" for one order: the assistant's tool calls on the order's chat (agent_runs) and the
// order's own events, in time order, with explicit lines for what it refused to do and what is waiting on a person.
// Nothing here is stored separately: it is worded from records that already exist.
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, t } from "@/db";
import type { ToolCallLog } from "@/db/schema";
import { describe } from "./activity";

export type TimelineLine = {
  at: string;
  /** Who acted: the assistant, a person on the team, or the system (timers, checks, stock). */
  who: "ai" | "team" | "system";
  /** did = something happened; didnt = the assistant deliberately didn't; waiting = needs a person now. */
  kind: "did" | "didnt" | "waiting";
  text: string;
};

type P = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const out = (c: ToolCallLog) => (c.output ?? {}) as P;
const inp = (c: ToolCallLog) => (c.input ?? {}) as P;

/** One tool call as a sentence about what the assistant did. Staff-facing wording, not the customer's. */
export function toolLine(c: ToolCallLog): { kind: TimelineLine["kind"]; text: string } | null {
  const o = out(c);
  switch (c.name) {
    case "check_variant": {
      if (!o.found) return { kind: "didnt", text: `AI looked for “${s(inp(c).product)}” and it isn't in your catalogue, so it quoted nothing` };
      const vs = (Array.isArray(o.variants) ? o.variants : []) as { option?: string; price?: string; inStock?: boolean }[];
      const sold = vs.length > 0 && vs.every((v) => v.inStock === false);
      if (sold) return { kind: "did", text: `AI checked ${s(o.product)}: sold out, and told the customer so` };
      if (vs.length === 1) return { kind: "did", text: `AI quoted ${vs[0].price} for ${s(o.product)}${vs[0].option ? ` (${vs[0].option})` : ""} from your catalogue` };
      return { kind: "did", text: `AI quoted ${s(o.product)} from your catalogue (${vs.length} options)` };
    }
    case "search_catalog": return { kind: "did", text: `AI searched your catalogue for “${s(inp(c).query)}”` };
    case "get_business_info":
      if (o.found === false) return { kind: "didnt", text: `AI had no saved answer for “${s(inp(c).topic) || s(inp(c).kind)}” and did not make one up` };
      return { kind: "did", text: `AI used your saved ${s(inp(c).topic) || s(inp(c).kind) || "business info"}` };
    case "create_order":
      if (o.ok) return { kind: "did", text: `AI saved order ${s(o.refCode)} (${s(o.total)}) for your approval${o.duplicate ? "; it was already saved, so no second one was made" : ""}` };
      return { kind: "didnt", text: `AI could not save the order yet: ${(Array.isArray(o.problems) ? o.problems : []).map(s).join(" ").slice(0, 160)}` };
    case "escalate": return { kind: "did", text: `AI passed this to you instead of answering: ${s(inp(c).summary)}` };
    case "book_appointment": case "find_times": case "change_appointment": return { kind: "did", text: `AI ${c.label}` };
    default: return null;
  }
}

/** The order's story. `run` rows are matched by chat and by time around the order being saved. */
export async function orderTimeline(workspaceId: string, orderId: string): Promise<{ lines: TimelineLine[]; limits: string[] } | null> {
  const [order] = await db.select().from(t.orders).where(and(eq(t.orders.id, orderId), eq(t.orders.workspaceId, workspaceId)));
  if (!order) return null;
  const [ws] = await db.select({ currency: t.workspaces.currency, timezone: t.workspaces.timezone }).from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  const lines: TimelineLine[] = [];

  const events = await db.select().from(t.events).where(and(eq(t.events.workspaceId, workspaceId), sql`${t.events.props}->>'orderId' = ${orderId}`));
  for (const e of events) {
    const d = describe(e.type, e.props, ws.currency, ws.timezone);
    lines.push({ at: e.createdAt.toISOString(), who: (e.props as P).by ? "team" : "system", kind: "did", text: d.text });
  }

  if (order.threadId) {
    const from = new Date(order.createdAt.getTime() - 30 * 60_000);
    const to = new Date(order.createdAt.getTime() + 5 * 60_000);
    const runs = await db.select().from(t.agentRuns).where(and(eq(t.agentRuns.threadId, order.threadId), gte(t.agentRuns.createdAt, from), lte(t.agentRuns.createdAt, to)));
    for (const r of runs) {
      let at = r.createdAt.getTime() - (r.latencyMs ?? 0);
      for (const c of r.toolCalls) {
        const l = toolLine(c);
        at += c.ms;
        // A call about another order in the same chat isn't this order's story.
        if (c.name === "create_order" && s(out(c).refCode) && s(out(c).refCode) !== order.refCode) continue;
        if (l) lines.push({ at: new Date(Math.min(at, r.createdAt.getTime())).toISOString(), who: "ai", ...l });
      }
    }
  }

  // The refusals that always hold, stated where the owner is looking at a decision.
  if (order.status === "pending") lines.push({ at: new Date().toISOString(), who: "system", kind: "waiting", text: "Waiting for you to confirm or reject. The AI has not confirmed this order or promised it to the customer" });
  lines.sort((a, b) => a.at.localeCompare(b.at));
  return {
    lines,
    limits: [
      "The AI never sets prices: they come from your catalogue.",
      "The AI cannot confirm an order, take stock off, or take payment. Only a person can.",
      "Receipt checks are advice. You decide.",
    ],
  };
}
