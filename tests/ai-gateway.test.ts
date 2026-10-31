// The opt-in KrackedDevs gateway: selected only when configured, first choice, and every kind of failure falls through
// to the next provider. A stubbed fetch stands in for both; no key, no network, no database.
import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { executeWithFallback, explainAiError, getProviders, resetAiRouterState, AIUnavailableError } from "../src/agent/ai-router";

const GATEWAY = "https://gateway.test/v1";
const FAKE_KEY = "sk-fake-gateway-key-0000";
const calls: { url: string; body: any; auth: string }[] = [];
/** How the fake gateway answers: "ok", an HTTP status, or "hang" (never answers until the client's timeout aborts it). */
let gateway: "ok" | "hang" | number = "ok";
const realFetch = globalThis.fetch;
const json = (b: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", ...headers } });
const completion = (model: string) => json({
  id: "x", object: "chat.completion", created: 0, model,
  choices: [{ index: 0, finish_reason: "tool_calls", message: { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "record", arguments: '{"ok":true}' } }] } }],
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
});

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  const body = init?.body ? JSON.parse(String(init.body)) : null;
  const auth = new Headers(init?.headers).get("authorization") ?? "";
  calls.push({ url, body, auth });
  if (url.startsWith(GATEWAY)) {
    if (gateway === "hang") return new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    if (gateway === 401) return json({ error: { message: "Authentication Error, invalid key" } }, 401);
    if (gateway === 402) return json({ error: { message: "Budget has been exceeded" } }, 402);
    if (gateway === 429) return json({ error: { message: "Rate limit reached" } }, 429, { "retry-after": "30" });
    if (typeof gateway === "number") return json({ error: { message: "upstream exploded" } }, gateway);
    return completion(body.model);
  }
  if (url.endsWith("/models")) return json({ object: "list", data: [{ id: "openai/gpt-oss-20b", object: "model" }, { id: "openai/gpt-oss-120b", object: "model" }] });
  return completion(body.model);
}) as typeof fetch;
after(() => {
  globalThis.fetch = realFetch;
});

const GATEWAY_VARS = ["KRACKEDDEVS_API_KEY", "KRACKEDDEVS_BASE_URL", "KRACKEDDEVS_FAST_MODEL", "KRACKEDDEVS_SMART_MODEL", "KRACKEDDEVS_VISION", "KRACKEDDEVS_TIMEOUT_MS"];
const configureGateway = (extra: Record<string, string> = {}) => {
  Object.assign(process.env, { KRACKEDDEVS_API_KEY: FAKE_KEY, KRACKEDDEVS_BASE_URL: GATEWAY, KRACKEDDEVS_FAST_MODEL: "fast-m", KRACKEDDEVS_SMART_MODEL: "smart-m", KRACKEDDEVS_VISION: "true", ...extra });
};
beforeEach(() => {
  for (const k of GATEWAY_VARS) delete process.env[k];
  process.env.GROQ_API_KEY = "test-groq";
  for (const k of ["GEMINI_API_KEY", "OPENROUTER_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "OLLAMA_BASE_URL", "USE_OLLAMA"]) delete process.env[k];
  gateway = "ok";
  calls.length = 0;
  resetAiRouterState();
});

const tool = { name: "record", description: "Record it", input_schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] } };
const ask = (model = "claude-haiku-5-5") => executeWithFallback({ model, max_tokens: 300, temperature: 0.2, messages: [{ role: "user", content: "hi" }], tools: [tool], tool_choice: { type: "tool", name: "record" } });
const chats = () => calls.filter((c) => c.url.endsWith("/chat/completions"));

test("the gateway is ignored unless both its key and a fast model are set", () => {
  assert.deepEqual(getProviders().map((p) => p.name), ["Groq"]);
  process.env.KRACKEDDEVS_API_KEY = FAKE_KEY;
  assert.deepEqual(getProviders().map((p) => p.name), ["Groq"], "a key without a model id is not enough: ids are never guessed");
  delete process.env.KRACKEDDEVS_API_KEY;
  process.env.KRACKEDDEVS_FAST_MODEL = "fast-m";
  assert.deepEqual(getProviders().map((p) => p.name), ["Groq"], "a model without a key is not enough");
});

test("when configured the gateway comes first, with the default base URL and the fast model for the smart tier", () => {
  process.env.KRACKEDDEVS_API_KEY = FAKE_KEY;
  process.env.KRACKEDDEVS_FAST_MODEL = "fast-m";
  const [gw, groq] = getProviders();
  assert.equal(gw.name, "KrackedDevs");
  assert.equal(groq.name, "Groq");
  assert.equal(gw.baseURL, "https://litellm.rapidscreen.io/v1");
  assert.equal(gw.smartModel, "fast-m");
  assert.equal(gw.vision, false, "vision is opt-in");
  assert.equal(gw.timeoutMs, 12000);
});

test("a request goes to the gateway first with the configured model per tier, a forced tool and unchanged parameters", async () => {
  configureGateway();
  const r = await ask();
  assert.equal(r.model, "KrackedDevs: fast-m");
  assert.equal(r.stop_reason, "tool_use");
  assert.equal(chats().length, 1, "Groq is not called while the gateway works");
  const c = chats()[0];
  assert.ok(c.url.startsWith(GATEWAY));
  assert.equal(c.auth, `Bearer ${FAKE_KEY}`);
  assert.equal(c.body.max_tokens, 300);
  assert.equal(c.body.temperature, 0.2);
  assert.deepEqual(c.body.tool_choice, { type: "function", function: { name: "record" } });
  assert.equal(c.body.reasoning_effort, undefined, "no Groq/Gemini-only fields");
  assert.equal((await ask("claude-sonnet-5-5")).model, "KrackedDevs: smart-m");
});

test("401, 402, 429, a timeout and a 5xx each fail over to Groq and the customer still gets an answer", async () => {
  for (const mode of [401, 402, 429, 503, "hang"] as const) {
    configureGateway({ KRACKEDDEVS_TIMEOUT_MS: "60" });
    gateway = mode;
    calls.length = 0;
    resetAiRouterState();
    const r = await ask();
    assert.match(r.model ?? "", /^Groq: /, `fell back after ${mode}`);
    assert.equal(chats()[0].url.startsWith(GATEWAY), true, "the gateway was tried first");
  }
});

test("after a 401/402 or timeout the gateway goes to the back of the line, so replies don't wait on it", async () => {
  for (const mode of [402, "hang"] as const) {
    configureGateway({ KRACKEDDEVS_TIMEOUT_MS: "60" });
    gateway = mode;
    resetAiRouterState();
    await ask();
    calls.length = 0;
    const started = Date.now();
    const r = await ask();
    assert.match(r.model ?? "", /^Groq: /);
    assert.equal(chats().filter((c) => c.url.startsWith(GATEWAY)).length, 0, `no gateway call during the cooldown after ${mode}`);
    assert.ok(Date.now() - started < 500);
  }
});

test("a plain 5xx is not cooled: the gateway is tried again on the next message", async () => {
  configureGateway();
  gateway = 503;
  await ask();
  calls.length = 0;
  gateway = "ok";
  assert.equal((await ask()).model, "KrackedDevs: fast-m");
});

test("when the gateway and every fallback fail, the reason is short, says out of credit and never shows a key", async () => {
  configureGateway();
  gateway = 402;
  const realOk = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith(GATEWAY) || url.endsWith("/chat/completions")) return json({ error: { message: `Budget exceeded for key ${FAKE_KEY}` } }, url.startsWith(GATEWAY) ? 402 : 503);
    return realOk(input, init);
  }) as typeof fetch;
  try {
    await assert.rejects(ask(), (e: unknown) => {
      assert.ok(e instanceof AIUnavailableError);
      const line = explainAiError(e);
      assert.match(line, /^KrackedDevs fast-m: out of credit/);
      assert.ok(!line.includes(FAKE_KEY));
      return true;
    });
  } finally {
    globalThis.fetch = realOk;
  }
});
