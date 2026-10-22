import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { extractPdfText } from "@/hiring/pdf";

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

/** Newest stable "gemini-X-flash", then flash-lite, then any flash model. */
export const pickGemini: Picker = (ids) => {
  const version = (id: string) => Number(id.match(/^gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const newest = (re: RegExp) => ids.filter((id) => re.test(id)).sort((a, b) => version(b) - version(a))[0];
  return newest(/^gemini-\d+(\.\d+)?-flash$/) ?? newest(/^gemini-\d+(\.\d+)?-flash-lite$/) ?? newest(/^gemini-.*flash/i);
};

export function getProviders(): AIProviderConfig[] {
  const providers: AIProviderConfig[] = [];

  // 1. Groq (free tier, very fast)
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      type: "openai_compatible",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      fastModel: process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b",
      smartModel: process.env.GROQ_SMART_MODEL || "openai/gpt-oss-120b",
      vision: false,
      pick: pickGroq,
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
      fastModel: process.env.GEMINI_FAST_MODEL || "gemini-2.5-flash",
      smartModel: process.env.GEMINI_SMART_MODEL || "gemini-2.5-flash",
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
      baseURL: process.env.JAWAB_ANTHROPIC_BASE_URL || "https://api.anthropic.com",
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
const modelLists = new Map<string, { at: number; ids: Promise<string[] | null> }>();

/** The model ids a provider serves right now (cached), or null when it can't be listed. */
function availableModels(p: AIProviderConfig): Promise<string[] | null> {
  const hit = modelLists.get(p.name);
  if (hit && Date.now() - hit.at < MODEL_LIST_TTL) return hit.ids;
  const client = new OpenAI({ apiKey: p.apiKey || "dummy", baseURL: p.baseURL, timeout: 8000, maxRetries: 0 });
  const ids = client.models
    .list()
    .then((page) => page.data.map((m) => m.id.replace(/^models\//, "")))
    .catch((e) => {
      console.warn(`[AI Router] Couldn't list ${p.name} models: ${e?.message ?? e}`);
      return null;
    });
  modelLists.set(p.name, { at: Date.now(), ids });
  return ids;
}

/** The configured model if the provider still serves it, otherwise the best replacement it does serve. */
export function chooseModel(ids: string[] | null, wanted: string, tier: Tier, pick?: Picker): string {
  if (!ids?.length || !pick || ids.includes(wanted)) return wanted;
  return pick(ids, tier) ?? wanted;
}

async function modelFor(p: AIProviderConfig, tier: Tier): Promise<string> {
  const wanted = tier === "smart" ? p.smartModel : p.fastModel;
  if (!p.pick) return wanted;
  const chosen = chooseModel(await availableModels(p), wanted, tier, p.pick);
  if (chosen !== wanted) console.warn(`[AI Router] ${p.name} doesn't serve "${wanted}"; using "${chosen}".`);
  return chosen;
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

async function formatOpenAIMessages(params: AnthropicMessageParams, vision: boolean): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
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
          })),
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
    copy.properties = Object.fromEntries(
      Object.entries(copy.properties).map(([k, v]) => [k, cleanSchema(v)])
    );
  }
  if (copy.items) {
    copy.items = cleanSchema(copy.items);
  }
  return copy;
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
  params: AnthropicMessageParams
): Promise<UnifiedMessageResponse> {
  const client = new OpenAI({
    apiKey: provider.apiKey || "dummy",
    baseURL: provider.baseURL,
    timeout: 25000,
    maxRetries: 1,
  });

  const modelToUse = await modelFor(provider, tierOf(params.model));
  const reasoning = isReasoning(modelToUse);

  const openAIMessages = await formatOpenAIMessages(params, provider.vision);
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
          parsedInput = JSON.parse(tc.function.arguments || "{}");
        } catch {
          parsedInput = {};
        }
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: parsedInput,
        } as any);
      }
    }
  }

  return {
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

  const res = await client.messages.create({
    model: tierOf(params.model) === "smart" ? provider.smartModel : provider.fastModel,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
    system: params.system as any,
    messages: params.messages as any,
    tools: params.tools as any,
    tool_choice: params.tool_choice as any,
  });

  return {
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

/** Execute with automatic cascading fallback across all configured providers. */
export async function executeWithFallback(params: AnthropicMessageParams): Promise<UnifiedMessageResponse> {
  let providers = getProviders();

  if (providers.length === 0) {
    throw new Error("No AI API keys configured. Please configure GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY.");
  }
  // Photos (menus, price boards) go to a model that can see them first.
  if (hasImages(params)) providers = [...providers.filter((p) => p.vision), ...providers.filter((p) => !p.vision)];

  const errors: string[] = [];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      if (provider.type === "anthropic") {
        return await callAnthropicNative(provider, params);
      } else {
        return await callOpenAICompatible(provider, params);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push(`[${provider.name}]: ${msg}`);
      const isRateLimit = err?.status === 429 || msg.includes("429") || msg.toLowerCase().includes("rate limit");
      const nextProvider = providers[i + 1]?.name;

      if (nextProvider) {
        console.warn(
          `[AI Router] Provider "${provider.name}" ${isRateLimit ? "rate limited (429)" : "failed: " + msg}. Automatically falling back to "${nextProvider}"...`
        );
      } else {
        console.error(`[AI Router] Provider "${provider.name}" failed: ${msg}. No more fallback providers available.`);
      }
    }
  }

  throw new Error(`AI generation failed: ${errors.join(" | ")}`);
}

/** For /api/health?test=ai: one small forced tool call per provider and tier, the way the agent calls them. */
export async function probeProviders() {
  const tool = { name: "say", description: "Say one word.", input_schema: { type: "object", properties: { word: { type: "string" } }, required: ["word"] } };
  return Promise.all(
    getProviders().map(async (p) => {
      const out: Record<string, unknown> = { vision: p.vision, available: p.pick ? await availableModels(p) : undefined };
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
          const r = p.type === "anthropic" ? await callAnthropicNative(p, params) : await callOpenAICompatible(p, params);
          out[tier] = { ok: r.content.some((b) => b.type === "tool_use"), model, ms: Date.now() - started };
        } catch (e: any) {
          out[tier] = { ok: false, model, ms: Date.now() - started, error: String(e?.message ?? e).slice(0, 300) };
        }
      }
      return [p.name, out] as const;
    }),
  ).then(Object.fromEntries);
}
