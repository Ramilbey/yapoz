import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { extractPdfText } from "@/lib/pdf";
import { log } from "@/lib/log";

type Tier = "fast" | "smart";
/** Picks a model from the ids a provider actually serves, in order of preference. */
type Picker = (ids: string[], tier: Tier) => string | undefined;

export type AIProviderConfig = {
  name: string;
  type: "openai_compatible" | "anthropic";
  apiKey?: string;
  baseURL?: string;
  fastModel: string;
  smartModel: string;
  /** Accepts image parts (OpenAI-style image_url). Providers without it get a text note instead. */
  vision: boolean;
  /** When the configured model isn't served any more, choose a replacement from the provider's model list. */
  pick?: Picker;
  /** Other served chat models to try after a 429: providers like Groq limit each model separately. */
  spare?: (ids: string[]) => string[];
  /** A model the owner chose with an env variable: kept as long as the provider serves it. Otherwise the router picks the best served one. */
  pinned?: { fast: boolean; smart: boolean };
  /** Per-request timeout; the default suits the free tiers. */
  timeoutMs?: number;
  /** A provider that can run out for good (credit, a revoked key): a 401/402/403 or a timeout sends it to the back of the line for a while. */
  coolOnFailure?: boolean;
  enabled: boolean;
};

const NOT_CHAT = /whisper|orpheus|guard|tts|embed|allam|audio|image|live|transcribe|computer-use/i;

const firstOf = (ids: string[], wanted: string[]) => wanted.find((w) => ids.includes(w));

/** Groq retires models often; prefer the ones that do tool calling well. */
export const pickGroq: Picker = (ids, tier) =>
  firstOf(ids, tier === "smart"
    ? ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen3-32b", "openai/gpt-oss-20b"]
    : ["openai/gpt-oss-20b", "llama-3.1-8b-instant", "openai/gpt-oss-120b"]) ??
  ids.find((id) => /gpt-oss|llama|qwen|kimi/i.test(id) && !NOT_CHAT.test(id));

/** Newest stable flash-lite for fast replies (quicker, higher free limits), newest flash for smart, then any flash. */
export const pickGemini: Picker = (ids, tier) => {
  const version = (id: string) => Number(id.match(/^gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const newest = (re: RegExp) => ids.filter((id) => re.test(id)).sort((a, b) => version(b) - version(a))[0];
  const flash = newest(/^gemini-\d+(\.\d+)?-flash$/);
  const lite = newest(/^gemini-\d+(\.\d+)?-flash-lite$/);
  return (tier === "fast" ? lite ?? flash : flash ?? lite) ?? newest(/^gemini-.*flash/i);
};

export function getProviders(): AIProviderConfig[] {
  const providers: AIProviderConfig[] = [];

  // 0. The hackathon LiteLLM gateway (OpenAI-compatible). Opt-in: needs its key and a model id, first choice while it works,
  // and everything below stays as the fallback for when its credit ends or it is down. Model ids come from GET <base>/models.
  if (process.env.KRACKEDDEVS_API_KEY && process.env.KRACKEDDEVS_FAST_MODEL) {
    providers.push({
      name: "KrackedDevs",
      type: "openai_compatible",
      apiKey: process.env.KRACKEDDEVS_API_KEY,
      baseURL: process.env.KRACKEDDEVS_BASE_URL || "https://litellm.rapidscreen.io/v1",
      fastModel: process.env.KRACKEDDEVS_FAST_MODEL,
      smartModel: process.env.KRACKEDDEVS_SMART_MODEL || process.env.KRACKEDDEVS_FAST_MODEL,
      vision: process.env.KRACKEDDEVS_VISION === "true",
      timeoutMs: Number(process.env.KRACKEDDEVS_TIMEOUT_MS) || 12000,
      coolOnFailure: true,
      enabled: true,
    });
  }

  // 1. Groq (free tier, very fast)
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      type: "openai_compatible",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      fastModel: process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b",
      smartModel: process.env.GROQ_SMART_MODEL || "openai/gpt-oss-120b",
      pinned: { fast: Boolean(process.env.GROQ_FAST_MODEL), smart: Boolean(process.env.GROQ_SMART_MODEL) },
      vision: false,
      pick: pickGroq,
      spare: (ids) => ids.filter((id) => /gpt-oss|llama|qwen|kimi/i.test(id) && !NOT_CHAT.test(id)),
      enabled: true,
    });
  }

  // 2. Google Gemini (free tier); reads photos of menus and price boards
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "Google Gemini",
      type: "openai_compatible",
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      // Only used if Google's model list can't be read: gemini-2.5-* is now limited to keys that used it before ("model not found").
      fastModel: process.env.GEMINI_FAST_MODEL || "gemini-3.5-flash-lite",
      smartModel: process.env.GEMINI_SMART_MODEL || "gemini-3.8-flash",
      pinned: { fast: Boolean(process.env.GEMINI_FAST_MODEL), smart: Boolean(process.env.GEMINI_SMART_MODEL) },
      vision: true,
      pick: pickGemini,
      enabled: true,
    });
  }

  // 3. OpenRouter (Free tier models with :free suffix)
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "OpenRouter",
      type: "openai_compatible",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      fastModel: process.env.OPENROUTER_FAST_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      smartModel: process.env.OPENROUTER_SMART_MODEL || "google/gemini-2.0-flash-exp:free",
      vision: false,
      enabled: true,
    });
  }

  // 4. Ollama (Completely free, offline local models)
  if (process.env.OLLAMA_BASE_URL || process.env.USE_OLLAMA === "true") {
    providers.push({
      name: "Ollama",
      type: "openai_compatible",
      apiKey: "ollama",
      baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
      fastModel: process.env.OLLAMA_MODEL || "llama3.2",
      smartModel: process.env.OLLAMA_MODEL || "llama3.2",
      vision: false,
      enabled: true,
    });
  }

  // 5. OpenAI (Standard API)
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "OpenAI",
      type: "openai_compatible",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      fastModel: process.env.OPENAI_FAST_MODEL || "gpt-4o-mini",
      smartModel: process.env.OPENAI_SMART_MODEL || "gpt-4o",
      vision: true,
      enabled: true,
    });
  }

  // 6. Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      name: "Anthropic",
      type: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.YAPOZ_ANTHROPIC_BASE_URL || process.env.JAWAB_ANTHROPIC_BASE_URL || "https://api.anthropic.com",
      fastModel: process.env.CLAUDE_FAST_MODEL || "claude-haiku-5-5",
      smartModel: process.env.CLAUDE_SMART_MODEL || "claude-sonnet-5-5",
      vision: true,
      enabled: true,
    });
  }

  return providers;
}

export function hasAnyAIConfigured(): boolean {
  return getProviders().length > 0;
}

export type AnthropicMessageParams = {
  model?: string;
  max_tokens: number;
  temperature?: number;
  system?: string | Array<{ text: string }>;
  messages: Array<any>;
  tools?: Array<any>;
  tool_choice?: any;
};

export type UnifiedMessageResponse = {
  /** Which provider and model actually answered, e.g. "Groq: openai/gpt-oss-20b". */
  model?: string;
  content: Array<Anthropic.Messages.ContentBlock>;
  stop_reason: "end_turn" | "tool_use" | "max_tokens" | string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
};

/** Callers ask for env.fastModel or env.smartModel; other providers map that to their own fast/smart model. */
function tierOf(model?: string): Tier {
  if (!model) return "fast";
  return model === env.smartModel || /smart|sonnet|opus/i.test(model) ? "smart" : "fast";
}

const MODEL_LIST_TTL = 10 * 60_000;
const modelLists = new Map<string, { at: number; ids: Promise<string[] | null>; known?: string[] }>();

/**
 * A model that answered 404 is set aside for an hour. Google keeps listing models that a key can no longer call
 * (gemini-2.5-* after its access was limited), so "it's in the list" doesn't mean "it works".
 */
const BAD_MODEL_MS = 60 * 60_000;
const badModels = new Map<string, number>();
const isBad = (provider: string, model: string) => (badModels.get(`${provider}:${model}`) ?? 0) > Date.now();

/** For tests: forget cached model lists, cooldowns and set-aside models. */
export function resetAiRouterState() {
  modelLists.clear();
  badModels.clear();
  coolingUntil.clear();
}

/** The model ids a provider serves right now (cached), or null when it can't be listed. */
function availableModels(p: AIProviderConfig): Promise<string[] | null> {
  const hit = modelLists.get(p.name);
  if (hit && Date.now() - hit.at < MODEL_LIST_TTL) return hit.ids;
  const client = new OpenAI({ apiKey: p.apiKey || "dummy", baseURL: p.baseURL, timeout: 8000, maxRetries: 0 });
  const fetched = client.models
    .list()
    .then((page) => page.data.map((m) => m.id.replace(/^models\//, "")))
    .catch((e) => {
      log.warn("ai_router.list_models_failed", { provider: p.name, err: e });
      return null;
    });
  // An expired list we already have is used as-is while the new one loads, so a customer's reply never waits on this call.
  if (hit?.known) {
    const entry = { at: Date.now(), ids: Promise.resolve(hit.known), known: hit.known };
    modelLists.set(p.name, entry);
    void fetched.then((ids) => {
      if (ids && modelLists.get(p.name) === entry) modelLists.set(p.name, { at: Date.now(), ids: Promise.resolve(ids), known: ids });
    });
    return entry.ids;
  }
  const entry: { at: number; ids: Promise<string[] | null>; known?: string[] } = { at: Date.now(), ids: fetched };
  modelLists.set(p.name, entry);
  void fetched.then((ids) => {
    if (ids) entry.known = ids;
  });
  return fetched;
}

/** The configured model if the provider still serves it, otherwise the best replacement it does serve. */
export function chooseModel(ids: string[] | null, wanted: string, tier: Tier, pick?: Picker): string {
  if (!ids?.length || !pick || ids.includes(wanted)) return wanted;
  return pick(ids, tier) ?? wanted;
}

async function modelFor(p: AIProviderConfig, tier: Tier): Promise<string> {
  const wanted = tier === "smart" ? p.smartModel : p.fastModel;
  if (!p.pick) return wanted;
  const listed = await availableModels(p);
  const ids = listed ? listed.filter((id) => !isBad(p.name, id)) : null;
  // A model the owner pinned stays while it's served; otherwise the best served model wins, not a name written into the code.
  const chosen = p.pinned?.[tier] ? chooseModel(ids, wanted, tier, p.pick) : ids?.length ? p.pick(ids, tier) ?? wanted : wanted;
  if (chosen !== wanted) log.warn("ai_router.model_substituted", { provider: p.name, chosen, wanted });
  return chosen;
}

/** This tier's model first, then the provider's other models, so a per-model limit doesn't take the whole provider out. */
async function modelsFor(p: AIProviderConfig, tier: Tier): Promise<string[]> {
  if (p.type === "anthropic") return [tier === "smart" ? p.smartModel : p.fastModel];
  const first = await modelFor(p, tier);
  if (!p.pick) return [first];
  const other = await modelFor(p, tier === "smart" ? "fast" : "smart");
  return [...new Set([first, other, ...(p.spare?.(((await availableModels(p)) ?? []).filter((id) => !isBad(p.name, id))) ?? [])])].filter((m) => !isBad(p.name, m));
}

/** Reasoning models spend output tokens thinking before they answer or call a tool. */
const isReasoning = (model: string) => /gpt-oss|qwen3|deepseek-r1|gemini-(2\.5|[3-9])|o\d-|o\d$/i.test(model);
/** Models that accept reasoning_effort; "low" keeps replies fast and leaves tokens for the answer. */
const takesEffort = (model: string) => /gpt-oss|gemini-(2\.5|[3-9])/i.test(model);

const hasImages = (params: AnthropicMessageParams) =>
  params.messages.some((m) => Array.isArray(m.content) && m.content.some((b: any) => b?.type === "image"));

type Part = OpenAI.Chat.Completions.ChatCompletionContentPart;

/** Anthropic image/document blocks → OpenAI parts. PDFs become their text; images need a vision model. */
async function userParts(blocks: any[], vision: boolean): Promise<Part[]> {
  const parts: Part[] = [];
  for (const b of blocks) {
    if (b?.type === "text" && b.text) parts.push({ type: "text", text: b.text });
    else if (b?.type === "image" && b.source?.type === "base64") {
      if (vision) parts.push({ type: "image_url", image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } });
      else parts.push({ type: "text", text: "[An image was attached here, but this model can't view images.]" });
    } else if (b?.type === "document" && b.source?.type === "base64" && b.source.media_type === "application/pdf") {
      const text = await extractPdfText(Buffer.from(b.source.data, "base64"));
      parts.push({ type: "text", text: text ? `PDF "${b.title ?? "document"}":\n"""\n${text}\n"""` : `[A PDF "${b.title ?? "document"}" was attached but has no readable text; it may be a scan.]` });
    }
  }
  return parts;
}

/**
 * Gemini 3 models sign each tool call (extra_content.google.thought_signature) and refuse the next turn if a call comes back
 * unsigned: "Function call is missing a thought_signature". Calls made by another provider have none, and Google documents
 * this placeholder for them. Other providers reject the unknown field, so it is only ever sent to Gemini.
 */
const SKIP_SIGNATURE = "skip_thought_signature_validator";
const isGemini = (p: AIProviderConfig) => /generativelanguage\.googleapis\.com/.test(p.baseURL ?? "");

async function formatOpenAIMessages(params: AnthropicMessageParams, vision: boolean, gemini = false): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
  const result: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  // 1. System prompt
  if (params.system) {
    const sysText = typeof params.system === "string"
      ? params.system
      : params.system.map((s) => s.text).join("\n");
    result.push({ role: "system", content: sysText });
  }

  // 2. Chat history
  for (const msg of params.messages) {
    if (typeof msg.content === "string") {
      result.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
      continue;
    }

    if (Array.isArray(msg.content)) {
      // Check for tool results (Anthropic format inside user message)
      const toolResults = msg.content.filter((b: any) => b.type === "tool_result");
      if (toolResults.length > 0) {
        for (const tr of toolResults) {
          result.push({
            role: "tool",
            tool_call_id: tr.tool_use_id,
            content: typeof tr.content === "string" ? tr.content : JSON.stringify(tr.content),
          });
        }
        continue;
      }

      // Check for assistant tool uses (Anthropic format)
      const toolUses = msg.content.filter((b: any) => b.type === "tool_use");
      const textBlocks = msg.content.filter((b: any) => b.type === "text");
      const text = textBlocks.map((b: any) => b.text).join("\n").trim();

      if (toolUses.length > 0) {
        result.push({
          role: "assistant",
          content: text || null,
          tool_calls: toolUses.map((u: any) => ({
            id: u.id,
            type: "function" as const,
            function: {
              name: u.name,
              arguments: JSON.stringify(u.input || {}),
            },
            ...(gemini ? { extra_content: { google: { thought_signature: u.extra_content?.google?.thought_signature ?? SKIP_SIGNATURE } } } : {}),
          })) as OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
        });
        continue;
      }

      if (msg.role === "assistant") {
        if (text) result.push({ role: "assistant", content: text });
        continue;
      }

      const parts = await userParts(msg.content, vision);
      if (parts.some((p) => p.type === "image_url")) result.push({ role: "user", content: parts });
      else {
        const joined = parts.map((p) => (p.type === "text" ? p.text : "")).join("\n\n").trim();
        if (joined) result.push({ role: "user", content: joined });
      }
    }
  }

  return result;
}

const isNullable = (schema: any) => Array.isArray(schema?.type) && schema.type.includes("null");
const OMIT_HINT = "Leave this out when it doesn't apply (don't send null).";

/**
 * Anthropic-style schemas allow "string or null". Groq (and others) validate tool arguments strictly and reject null for
 * a plain string, so a model that correctly says "no value" with null fails the whole call and the router wastes an attempt.
 * Nullable properties are sent as optional, non-null ones; restoreNulls() puts the null back afterwards.
 */
function cleanSchema(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(cleanSchema);

  const copy: any = { ...schema };
  if (Array.isArray(copy.type)) {
    const mainType = copy.type.find((t: string) => t !== "null") || "string";
    copy.type = mainType;
    // A collapsed ["string","null"] type can't keep null in its enum.
    if (Array.isArray(copy.enum)) copy.enum = copy.enum.filter((v: unknown) => v !== null);
  }
  if (copy.properties && typeof copy.properties === "object") {
    const nullable = Object.entries(copy.properties).filter(([, v]) => isNullable(v)).map(([k]) => k);
    copy.properties = Object.fromEntries(
      Object.entries(copy.properties).map(([k, v]: [string, any]) => [k, cleanSchema(isNullable(v) ? { ...v, description: [v.description, OMIT_HINT].filter(Boolean).join(" ") } : v)]),
    );
    if (Array.isArray(copy.required) && nullable.length) {
      copy.required = copy.required.filter((k: string) => !nullable.includes(k));
      if (!copy.required.length) delete copy.required;
    }
  }
  if (copy.items) {
    copy.items = cleanSchema(copy.items);
  }
  return copy;
}

/** The other half of cleanSchema: a nullable property the model left out comes back as null, as the original schema promised. */
export function restoreNulls(schema: any, value: any): any {
  if (!schema || typeof schema !== "object" || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return schema.items ? value.map((v) => restoreNulls(schema.items, v)) : value;
  const out: Record<string, unknown> = { ...value };
  for (const [key, sub] of Object.entries(schema.properties ?? {})) {
    if (out[key] === undefined) {
      if (isNullable(sub)) out[key] = null;
    } else out[key] = restoreNulls(sub, out[key]);
  }
  return out;
}

function formatOpenAITools(tools?: Array<any>): OpenAI.Chat.Completions.ChatCompletionTool[] | undefined {
  if (!tools || !tools.length) return undefined;
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: cleanSchema(t.input_schema) || {},
    },
  }));
}

async function callOpenAICompatible(
  provider: AIProviderConfig,
  params: AnthropicMessageParams,
  modelToUse: string,
): Promise<UnifiedMessageResponse> {
  const client = new OpenAI({
    apiKey: provider.apiKey || "dummy",
    baseURL: provider.baseURL,
    timeout: provider.timeoutMs ?? 20000,
    // No SDK retries: on a 429 it sleeps out retry-after (often 20s+) while the next provider is ready now.
    maxRetries: 0,
  });

  const reasoning = isReasoning(modelToUse);

  const openAIMessages = await formatOpenAIMessages(params, provider.vision, isGemini(provider));
  const openAITools = formatOpenAITools(params.tools);

  let toolChoice: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption | undefined = undefined;
  if (params.tool_choice) {
    if (typeof params.tool_choice === "object" && params.tool_choice.type === "tool") {
      toolChoice = { type: "function", function: { name: params.tool_choice.name } };
    } else if (params.tool_choice === "auto") {
      toolChoice = "auto";
    }
  }

  let res: OpenAI.Chat.Completions.ChatCompletion;
  try {
    res = await client.chat.completions.create({
      model: modelToUse,
      messages: openAIMessages,
      tools: openAITools,
      tool_choice: toolChoice,
      temperature: params.temperature ?? 0.3,
      // Leave reasoning models room to think before they write or call a tool.
      max_tokens: Math.min(Math.max(params.max_tokens || 1024, reasoning ? 2048 : 0), 8192),
      ...(takesEffort(modelToUse) ? { reasoning_effort: "low" as const } : {}),
    });
  } catch (err: any) {
    // The model may have been retired since the list was cached: list again next time.
    if (err?.status === 404) modelLists.delete(provider.name);
    throw err;
  }

  const choice = res.choices[0];
  const msg = choice?.message;
  const content: UnifiedMessageResponse["content"] = [];

  if (msg?.content) {
    content.push({ type: "text", text: msg.content.trim() } as any);
  }

  if (msg?.tool_calls && msg.tool_calls.length > 0) {
    for (const tc of msg.tool_calls) {
      if (tc.type === "function") {
        let parsedInput: Record<string, unknown> = {};
        try {
          const schema = params.tools?.find((tool) => tool.name === tc.function.name)?.input_schema;
          parsedInput = restoreNulls(schema, JSON.parse(tc.function.arguments || "{}"));
        } catch {
          parsedInput = {};
        }
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: parsedInput,
          // Gemini's signature for this call: it has to be sent back with the call on the next turn.
          ...((tc as any).extra_content ? { extra_content: (tc as any).extra_content } : {}),
        } as any);
      }
    }
  }

  return {
    model: `${provider.name}: ${modelToUse}`,
    content,
    stop_reason: (msg?.tool_calls && msg.tool_calls.length > 0) ? "tool_use" : "end_turn",
    usage: {
      input_tokens: res.usage?.prompt_tokens ?? 0,
      output_tokens: res.usage?.completion_tokens ?? 0,
    },
  };
}

async function callAnthropicNative(
  provider: AIProviderConfig,
  params: AnthropicMessageParams
): Promise<UnifiedMessageResponse> {
  const client = new Anthropic({
    apiKey: provider.apiKey!,
    baseURL: provider.baseURL,
    timeout: 30000,
    maxRetries: 1,
  });

  const model = tierOf(params.model) === "smart" ? provider.smartModel : provider.fastModel;
  const res = await client.messages.create({
    model,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
    system: params.system as any,
    // Anthropic refuses fields it doesn't know, like the Gemini signature a fallback turn may carry.
    messages: params.messages.map((m: any) => (Array.isArray(m.content) ? { ...m, content: m.content.map(({ extra_content: _x, ...b }: any) => b) } : m)) as any,
    tools: params.tools as any,
    tool_choice: params.tool_choice as any,
  });

  return {
    model: `${provider.name}: ${model}`,
    content: res.content as any,
    stop_reason: res.stop_reason as any,
    usage: {
      input_tokens: res.usage.input_tokens,
      output_tokens: res.usage.output_tokens,
      cache_read_input_tokens: (res.usage as any).cache_read_input_tokens,
      cache_creation_input_tokens: (res.usage as any).cache_creation_input_tokens,
    },
  };
}

export type AIAttempt = { provider: string; model: string; status?: number; message: string };

/** Every provider and model failed. Carries each attempt so staff can see why replies stopped. */
export class AIUnavailableError extends Error {
  constructor(public attempts: AIAttempt[]) {
    super(`AI generation failed: ${attempts.map((a) => `[${a.provider} ${a.model}]: ${a.message}`).join(" | ")}`);
    this.name = "AIUnavailableError";
  }
}

const SECRET = /\b(sk-[A-Za-z0-9_-]{8,}|gsk_[A-Za-z0-9]{8,}|AIza[0-9A-Za-z_-]{20,}|Bearer\s+\S+)/g;

function gist(a: AIAttempt): string {
  const text = a.message.replace(/^\d{3}\s+/, "");
  if (a.status === 429 || /rate limit|quota/i.test(text)) return /request too large|tokens per minute/i.test(text) ? "rate limit (tokens per minute)" : "rate limited";
  if (a.status === 413 || /request too large/i.test(text)) return "request too large for this model";
  if (a.status === 404) return "model not found";
  if (a.status === 401 || a.status === 403) return "API key rejected";
  if (a.status === 402) return "out of credit";
  if (/timed? ?out|timeout|aborted/i.test(text)) return "timed out";
  return `${a.status ?? "error"}: ${text.replace(/\s+/g, " ").slice(0, 70)}`;
}

/** One short line for the Needs-you card: why the AI couldn't answer. No keys, no stack traces. */
export function explainAiError(e: unknown): string {
  const line = e instanceof AIUnavailableError
    ? e.attempts.slice(0, 4).map((a) => `${a.provider} ${a.model.split("/").pop()}: ${gist(a)}`).join("; ") + (e.attempts.length > 4 ? `; +${e.attempts.length - 4} more` : "")
    : (e instanceof Error ? e.message : String(e)).replace(/\s+/g, " ");
  return line.replace(SECRET, "[hidden]").slice(0, 220);
}

/** Models that just answered 429 ("Groq:openai/gpt-oss-20b") go to the back of the line until their window passes. */
const coolingUntil = new Map<string, number>();
const MAX_ATTEMPTS = 6;
/** A gateway that answered 401/402/403 or timed out is tried last for this long, so every customer message doesn't wait on it. */
const GATEWAY_COOLDOWN_MS = 5 * 60_000;

function retryAfterMs(err: any): number {
  const h = err?.headers;
  const s = Number(typeof h?.get === "function" ? h.get("retry-after") : h?.["retry-after"]);
  return Number.isFinite(s) && s > 0 ? Math.min(s * 1000, 60_000) : 20_000;
}

/** Execute with automatic cascading fallback across every configured provider and model. */
export async function executeWithFallback(params: AnthropicMessageParams): Promise<UnifiedMessageResponse> {
  const providers = getProviders();

  if (providers.length === 0) {
    throw new Error("No AI API keys configured. Please configure KRACKEDDEVS_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY.");
  }
  const tier = tierOf(params.model);
  let attempts = (await Promise.all(providers.map(async (p) => (await modelsFor(p, tier)).map((model) => ({ p, model }))))).flat();
  const now = Date.now();
  const cooling = (a: { p: AIProviderConfig; model: string }) => (coolingUntil.get(`${a.p.name}:${a.model}`) ?? 0) > now;
  attempts = [...attempts.filter((a) => !cooling(a)), ...attempts.filter(cooling)];
  // Photos (menus, price boards) go to a model that can see them first.
  if (hasImages(params)) attempts = [...attempts.filter((a) => a.p.vision), ...attempts.filter((a) => !a.p.vision)];
  attempts = attempts.slice(0, MAX_ATTEMPTS);

  const errors: AIAttempt[] = [];

  for (let i = 0; i < attempts.length; i++) {
    const { p, model } = attempts[i];
    try {
      return p.type === "anthropic" ? await callAnthropicNative(p, params) : await callOpenAICompatible(p, params, model);
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push({ provider: p.name, model, status: typeof err?.status === "number" ? err.status : undefined, message: msg });
      const isRateLimit = err?.status === 429 || msg.includes("429") || msg.toLowerCase().includes("rate limit");
      if (isRateLimit) coolingUntil.set(`${p.name}:${model}`, Date.now() + retryAfterMs(err));
      if (p.coolOnFailure && (err?.status === 401 || err?.status === 402 || err?.status === 403 || /timed? ?out|timeout|aborted/i.test(msg))) {
        coolingUntil.set(`${p.name}:${model}`, Date.now() + GATEWAY_COOLDOWN_MS);
      }
      if (err?.status === 404) {
        badModels.set(`${p.name}:${model}`, Date.now() + BAD_MODEL_MS);
        modelLists.delete(p.name);
      }
      const next = attempts[i + 1];

      if (next) {
        log.warn("ai_router.fallback", { provider: p.name, model, rateLimited: isRateLimit, err: msg, next: `${next.p.name} ${next.model}` });
      } else {
        log.error("ai_router.failed", { provider: p.name, model, err: msg });
      }
    }
  }

  throw new AIUnavailableError(errors);
}

/** For /api/health?test=ai: one small forced tool call per provider and tier, the way the agent calls them. */
export async function probeProviders() {
  const tool = { name: "say", description: "Say one word.", input_schema: { type: "object", properties: { word: { type: "string" } }, required: ["word"] } };
  return Promise.all(
    getProviders().map(async (p) => {
      const out: Record<string, unknown> = { vision: p.vision, available: p.pick ? await availableModels(p) : undefined, setAside: [...badModels.keys()].filter((k) => k.startsWith(`${p.name}:`) && (badModels.get(k) ?? 0) > Date.now()).map((k) => k.slice(p.name.length + 1)) };
      for (const tier of ["fast", "smart"] as const) {
        const model = p.type === "anthropic" ? (tier === "smart" ? p.smartModel : p.fastModel) : await modelFor(p, tier);
        const params: AnthropicMessageParams = {
          model: tier === "smart" ? env.smartModel : env.fastModel,
          max_tokens: 200,
          messages: [{ role: "user", content: "Call the say tool with the word hello." }],
          tools: [tool],
          tool_choice: { type: "tool", name: "say" },
        };
        const started = Date.now();
        try {
          const r = p.type === "anthropic" ? await callAnthropicNative(p, params) : await callOpenAICompatible(p, params, model);
          out[tier] = { ok: r.content.some((b) => b.type === "tool_use"), model, ms: Date.now() - started };
        } catch (e: any) {
          out[tier] = { ok: false, model, ms: Date.now() - started, error: String(e?.message ?? e).slice(0, 300) };
        }
      }
      return [p.name, out] as const;
    }),
  ).then(Object.fromEntries);
}
