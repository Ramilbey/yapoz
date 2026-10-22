// Model choice when a provider retires models, and how Anthropic-style requests reach OpenAI-compatible providers
// (images, PDFs, forced tool calls), against a stubbed fetch. No database needed.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { chooseModel, pickGroq, pickGemini, executeWithFallback } from "../src/agent/ai-router";

// What the Groq account actually served on 22 Oct 2026 (llama-3.1-8b-instant and llama-3.3-70b-versatile were gone).
const GROQ = ["allam-2-7b", "meta-llama/llama-prompt-guard-2-86m", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "openai/gpt-oss-safeguard-20b", "qwen/qwen3.8-27b", "whisper-large-v3"];

test("a retired model is swapped for one the provider serves; a served one is kept", () => {
  assert.equal(chooseModel(GROQ, "llama-3.1-8b-instant", "fast", pickGroq), "openai/gpt-oss-20b");
  assert.equal(chooseModel(GROQ, "llama-3.3-70b-versatile", "smart", pickGroq), "openai/gpt-oss-120b");
  assert.equal(chooseModel(GROQ, "qwen/qwen3.8-27b", "smart", pickGroq), "qwen/qwen3.8-27b");
  assert.equal(chooseModel(["whisper-large-v3", "qwen/qwen3.8-27b"], "gone", "fast", pickGroq), "qwen/qwen3.8-27b");
  // The list couldn't be fetched: try what was configured.
  assert.equal(chooseModel(null, "llama-3.1-8b-instant", "fast", pickGroq), "llama-3.1-8b-instant");
});

test("Gemini: newest stable flash, never preview, image or tts variants", () => {
  const ids = ["gemini-2.5-flash", "gemini-3-flash", "gemini-3-flash-preview", "gemini-2.5-flash-image", "gemini-2.5-flash-preview-tts", "gemini-2.5-pro", "gemini-3-flash-lite"];
  assert.equal(chooseModel(ids, "gemini-1.5-flash", "fast", pickGemini), "gemini-3-flash");
  assert.equal(pickGemini(["gemini-2.0-flash-lite", "embedding-001"], "fast"), "gemini-2.0-flash-lite");
});

const calls: { url: string; body: any }[] = [];
const realFetch = globalThis.fetch;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  const body = init?.body ? JSON.parse(String(init.body)) : null;
  calls.push({ url, body });
  if (url.endsWith("/models")) return json({ object: "list", data: (url.includes("groq") ? GROQ : ["models/gemini-2.5-flash"]).map((id) => ({ id, object: "model" })) });
  if (url.includes("groq") && body?.messages?.some((m: any) => Array.isArray(m.content))) return json({ error: { message: "content must be a string" } }, 400);
  return json({
    id: "x", object: "chat.completion", created: 0, model: body?.model,
    choices: [{ index: 0, finish_reason: "tool_calls", message: { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "record", arguments: '{"ok":true}' } }] } }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  });
}) as typeof fetch;
process.env.GROQ_API_KEY = "test-groq";
process.env.GEMINI_API_KEY = "test-gemini";
after(() => {
  globalThis.fetch = realFetch;
});

const tool = { name: "record", description: "Record it", input_schema: { type: "object", properties: { ok: { type: "boolean" }, category: { type: ["string", "null"], enum: ["a", "b", null] } }, required: ["ok"] } };

test("a forced tool call reaches Groq with a served model, low reasoning effort and a nullable enum Groq accepts", async () => {
  calls.length = 0;
  const r = await executeWithFallback({ model: "claude-haiku-5-5", max_tokens: 300, messages: [{ role: "user", content: "hi" }], tools: [tool], tool_choice: { type: "tool", name: "record" } });
  assert.equal(r.stop_reason, "tool_use");
  const chat = calls.find((c) => c.url.includes("groq") && c.url.endsWith("/chat/completions"))!;
  assert.equal(chat.body.model, "openai/gpt-oss-20b");
  assert.equal(chat.body.reasoning_effort, "low");
  assert.ok(chat.body.max_tokens >= 2048, "reasoning models get room to think");
  assert.deepEqual(chat.body.tool_choice, { type: "function", function: { name: "record" } });
  const category = chat.body.tools[0].function.parameters.properties.category;
  assert.equal(category.type, "string");
  assert.deepEqual(category.enum, ["a", "b"]);
});

test("a menu photo goes to a model that can see it, as an image part; a PDF arrives as text", async () => {
  calls.length = 0;
  const png = Buffer.from("89504e470d0a1a0a", "hex").toString("base64");
  await executeWithFallback({
    model: "claude-sonnet-5-5", max_tokens: 4000, tools: [tool], tool_choice: { type: "tool", name: "record" },
    messages: [{ role: "user", content: [{ type: "text", text: "Menu attached" }, { type: "image", source: { type: "base64", media_type: "image/png", data: png } }] }],
  });
  const chats = calls.filter((c) => c.url.endsWith("/chat/completions"));
  assert.ok(chats[0].url.includes("generativelanguage"), "Gemini (vision) is tried before Groq");
  const parts = chats[0].body.messages.at(-1).content;
  assert.equal(parts[1].type, "image_url");
  assert.match(parts[1].image_url.url, /^data:image\/png;base64,/);

  calls.length = 0;
  await executeWithFallback({
    model: "claude-haiku-5-5", max_tokens: 300,
    messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: Buffer.from("not a real pdf").toString("base64") }, title: "menu.pdf" }] }],
  });
  const sent = calls.find((c) => c.url.endsWith("/chat/completions"))!.body.messages.at(-1).content;
  assert.equal(typeof sent, "string");
  assert.match(sent, /menu\.pdf/);
});
