// When every AI provider fails, the customer gets the holding reply and staff get a Needs-you card that says why.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { db, t, sql } from "../src/db";
import { eq } from "drizzle-orm";
import { ingest, respond } from "../src/agent/pipeline";
import { AIUnavailableError, explainAiError } from "../src/agent/ai-router";

process.env.GROQ_API_KEY = "gsk_testkey1234567890abcdef";
delete process.env.GEMINI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

const realFetch = globalThis.fetch;
const limited = (model: string) => ({ error: { message: `Rate limit reached for model \`${model}\` in organization on tokens per minute (TPM): Limit 8000, Used 7900, Requested 4800. Bearer gsk_testkey1234567890abcdef` } });
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.endsWith("/models")) return new Response("down", { status: 503 });
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  return new Response(JSON.stringify(limited(body.model)), { status: 429, headers: { "content-type": "application/json", "retry-after": "40" } });
}) as typeof fetch;
after(async () => {
  globalThis.fetch = realFetch;
  await sql.end();
});

test("explainAiError: one short line per attempt, no keys", () => {
  const e = new AIUnavailableError([
    { provider: "Groq", model: "openai/gpt-oss-120b", status: 429, message: "429 Rate limit reached for model" },
    { provider: "Groq", model: "qwen/qwen3.8-27b", status: 413, message: "413 Request too large for model" },
    { provider: "Google Gemini", model: "gemini-2.5-flash", status: 400, message: "400 API key sk-abcdefghijklmnop not valid" },
    { provider: "Google Gemini", model: "gemini-2.5-flash-lite", status: 404, message: "404 not found" },
    { provider: "OpenRouter", model: "x", message: "Request timed out." },
  ]);
  const line = explainAiError(e);
  assert.match(line, /^Groq gpt-oss-120b: rate limited; Groq qwen3\.8-27b: request too large/);
  assert.match(line, /Google Gemini gemini-2\.5-flash: 400: API key \[hidden\] not valid/);
  assert.match(line, /\+1 more$/);
  assert.ok(line.length <= 220);
  assert.equal(explainAiError(new Error("connect ECONNREFUSED 10.0.0.1:5432")), "connect ECONNREFUSED 10.0.0.1:5432");
});

test("every provider down: the customer gets the holding reply, staff see the reason in Needs you", async () => {
  const r = await ingest({
    workspaceId: "FORNO7", channel: "simulator", externalThreadId: `sim:aifail${Date.now()}`,
    customer: { externalId: `aifail${Date.now()}`, displayName: "Web visitor" },
    text: "Get me both in large size please, extra sauce on both", attachments: [], receivedAt: new Date(),
  });
  const out = await respond(r.thread.id, r.messageId);
  assert.equal(out.outcome, "error");
  assert.match(out.reply ?? "", /passed this to our team/i);
  assert.ok(!/rate limit|Groq|gsk_/i.test(out.reply ?? ""), "the customer never sees the reason");

  const [esc] = await db.select().from(t.escalations).where(eq(t.escalations.threadId, r.thread.id));
  assert.equal(esc.category, "ai_failure");
  assert.equal(esc.reason, "Every AI provider failed");
  assert.equal(esc.priority, "high");
  assert.match(esc.summary, /^The customer got the holding reply because no AI could answer \(Groq [a-z0-9.-]+: rate limit \(tokens per minute\)/);
  assert.match(esc.summary, /They wrote: “Get me both in large size please/);
  assert.ok(!esc.summary.includes("gsk_"), "keys are redacted");
  assert.ok(esc.summary.length <= 300);
});
