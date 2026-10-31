// Unit cost per order: tokens come from agent_runs (stored per run); dollars are an ESTIMATE from the price table below.
// Prices are USD per million tokens and are assumptions to be checked against each provider's current price list.
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db, t } from "@/db";

export type Price = { input: number; output: number; cacheRead: number; cacheWrite: number };

/** The free tiers the router uses (Groq, Gemini, OpenRouter ":free", local Ollama) cost nothing but still report tokens. */
const FREE: Price = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
/** Cache reads at 0.1x and writes at 1.25x input, Anthropic's list ratios. OpenAI-style: reads at 0.5x, no write charge. */
const anthropic = (input: number, output: number): Price => ({ input, output, cacheRead: input * 0.1, cacheWrite: input * 1.25 });
const openai = (input: number, output: number): Price => ({ input, output, cacheRead: input * 0.5, cacheWrite: input });

/**
 * Matched in order against the stored model string ("Provider: model" or a bare model id), case-insensitively.
 * The first row whose pattern matches wins.
 */
export const PRICE_TABLE: { pattern: RegExp; label: string; price: Price }[] = [
  { pattern: /^(groq|google gemini|ollama|openrouter)\b/i, label: "free-tier provider (Groq, Gemini, OpenRouter, Ollama)", price: FREE },
  { pattern: /:free$/i, label: "OpenRouter :free model", price: FREE },
  { pattern: /claude-haiku/i, label: "Claude Haiku (assumed $1 in / $5 out)", price: anthropic(1, 5) },
  { pattern: /claude-sonnet/i, label: "Claude Sonnet (assumed $3 in / $15 out)", price: anthropic(3, 15) },
  { pattern: /claude-opus/i, label: "Claude Opus (assumed $15 in / $75 out)", price: anthropic(15, 75) },
  { pattern: /gpt-4o-mini/i, label: "OpenAI gpt-4o-mini ($0.15 in / $0.60 out)", price: openai(0.15, 0.6) },
  { pattern: /gpt-4o/i, label: "OpenAI gpt-4o ($2.50 in / $10 out)", price: openai(2.5, 10) },
];

/** Price for a stored model name, or null when it isn't in the table (counted as $0 and flagged unpriced). */
export function priceFor(model: string): Price | null {
  return PRICE_TABLE.find((r) => r.pattern.test(model))?.price ?? null;
}

export type TokenCounts = { input: number; output: number; cacheRead: number; cacheWrite: number };

export function costOf(model: string, tokens: TokenCounts): { usd: number; priced: boolean } {
  const p = priceFor(model);
  if (!p) return { usd: 0, priced: false };
  return { usd: (tokens.input * p.input + tokens.output * p.output + tokens.cacheRead * p.cacheRead + tokens.cacheWrite * p.cacheWrite) / 1e6, priced: true };
}

export type CostReport = {
  runs: number;
  tokens: TokenCounts & { total: number };
  estimatedUsd: number;
  /** Orders with a confirmation time in the window. */
  ordersCompleted: number;
  /** null when no order was completed: nothing to divide by. */
  avgUsdPerOrder: number | null;
  avgTokensPerOrder: number | null;
  byModel: { model: string; runs: number; tokens: number; usd: number; unpriced: boolean }[];
  /** Models in the data with no price-table entry: their dollars are counted as 0, so the total is a lower bound. */
  unpriced: string[];
};

export async function costReport(workspaceId: string, o: { since?: Date; demo?: boolean } = {}): Promise<CostReport> {
  const isDemo = Boolean(o.demo);
  const runWhere = and(eq(t.agentRuns.workspaceId, workspaceId), eq(t.agentRuns.isDemo, isDemo), o.since ? gte(t.agentRuns.createdAt, o.since) : undefined);
  const rows = await db
    .select({
      model: t.agentRuns.model,
      runs: sql<number>`count(*)::int`,
      input: sql<number>`coalesce(sum(${t.agentRuns.inputTokens}), 0)::float8`,
      output: sql<number>`coalesce(sum(${t.agentRuns.outputTokens}), 0)::float8`,
      cacheRead: sql<number>`coalesce(sum(${t.agentRuns.cacheReadTokens}), 0)::float8`,
      cacheWrite: sql<number>`coalesce(sum(${t.agentRuns.cacheWriteTokens}), 0)::float8`,
    })
    .from(t.agentRuns)
    .where(runWhere)
    .groupBy(t.agentRuns.model);
  const [{ n: ordersCompleted }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(t.orders)
    .where(and(eq(t.orders.workspaceId, workspaceId), eq(t.orders.isDemo, isDemo), isNotNull(t.orders.confirmedAt), o.since ? gte(t.orders.confirmedAt, o.since) : undefined));

  const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
  let usd = 0;
  let runs = 0;
  const unpriced: string[] = [];
  const byModel = rows.map((r) => {
    const c = costOf(r.model, r);
    tokens.input += r.input;
    tokens.output += r.output;
    tokens.cacheRead += r.cacheRead;
    tokens.cacheWrite += r.cacheWrite;
    usd += c.usd;
    runs += r.runs;
    if (!c.priced) unpriced.push(r.model);
    return { model: r.model, runs: r.runs, tokens: r.input + r.output + r.cacheRead + r.cacheWrite, usd: c.usd, unpriced: !c.priced };
  });
  tokens.total = tokens.input + tokens.output + tokens.cacheRead + tokens.cacheWrite;
  return {
    runs,
    tokens,
    estimatedUsd: usd,
    ordersCompleted,
    avgUsdPerOrder: ordersCompleted ? usd / ordersCompleted : null,
    avgTokensPerOrder: ordersCompleted ? tokens.total / ordersCompleted : null,
    byModel: byModel.sort((a, b) => b.tokens - a.tokens),
    unpriced,
  };
}

/** Text for the measure script: always says it is an estimate and which prices it assumed. */
export function costSection(r: CostReport): string {
  const n = (x: number) => Math.round(x).toLocaleString("en-US");
  const usd = (x: number) => `$${x.toFixed(x < 0.01 && x > 0 ? 5 : 4)}`;
  const lines = [
    "Cost (ESTIMATE, not an invoice)",
    `  Agent runs: ${n(r.runs)}; tokens: ${n(r.tokens.total)} (input ${n(r.tokens.input)}, output ${n(r.tokens.output)}, cache read ${n(r.tokens.cacheRead)}, cache write ${n(r.tokens.cacheWrite)})`,
    `  Estimated spend: ${usd(r.estimatedUsd)}${r.unpriced.length ? " (a lower bound: some models are unpriced)" : ""}`,
    `  Orders completed (confirmed): ${n(r.ordersCompleted)}`,
    `  Average cost per completed order: ${r.avgUsdPerOrder === null ? "no data (no confirmed orders)" : `${usd(r.avgUsdPerOrder)} (${n(r.avgTokensPerOrder ?? 0)} tokens)`}`,
  ];
  for (const m of r.byModel) lines.push(`    ${m.model}: ${n(m.runs)} runs, ${n(m.tokens)} tokens, ${m.unpriced ? "UNPRICED (counted as $0)" : usd(m.usd)}`);
  lines.push("  Price table assumed (USD per million tokens), edit src/lib/cost.ts to change:");
  for (const p of PRICE_TABLE) lines.push(`    ${p.label}: in ${+p.price.input.toPrecision(6)}, out ${+p.price.output.toPrecision(6)}, cache read ${+p.price.cacheRead.toPrecision(6)}, cache write ${+p.price.cacheWrite.toPrecision(6)}`);
  lines.push("  Anything not in the table is counted as $0 and flagged UNPRICED. Orders are those with a confirmation time; runs include every customer message, confirmed or not.");
  return lines.join("\n");
}
