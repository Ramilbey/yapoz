import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export type AIProviderConfig = {
  name: string;
  type: "openai_compatible" | "anthropic";
  apiKey?: string;
  baseURL?: string;
  fastModel: string;
  smartModel: string;
  enabled: boolean;
};

export function getProviders(): AIProviderConfig[] {
  const providers: AIProviderConfig[] = [];

  // 1. Groq (Free forever, ultra-fast 500 tok/sec, 30 RPM)
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      type: "openai_compatible",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      fastModel: process.env.GROQ_FAST_MODEL || "llama-3.1-8b-instant",
      smartModel: process.env.GROQ_SMART_MODEL || "llama-3.3-70b-versatile",
      enabled: true,
    });
  }

  // 2. Google Gemini (Free tier, 15 RPM, 1M tokens/min)
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "Google Gemini 2.5",
      type: "openai_compatible",
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      fastModel: process.env.GEMINI_FAST_MODEL || "gemini-2.5-flash",
      smartModel: process.env.GEMINI_SMART_MODEL || "gemini-2.5-flash",
      enabled: true,
    });
    providers.push({
      name: "Google Gemini 1.5",
      type: "openai_compatible",
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      fastModel: "gemini-1.5-flash",
      smartModel: "gemini-1.5-flash",
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

function formatOpenAIMessages(params: AnthropicMessageParams): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
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

      if (text) {
        result.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: text,
        });
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
    timeout: 35000,
    maxRetries: 1,
  });

  const isSmart = params.model && (params.model.includes("smart") || params.model.includes("sonnet") || params.model.includes("gpt-4") || params.model.includes("70b"));
  const modelToUse = isSmart ? provider.smartModel : provider.fastModel;

  const openAIMessages = formatOpenAIMessages(params);
  const openAITools = formatOpenAITools(params.tools);

  let toolChoice: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption | undefined = undefined;
  if (params.tool_choice) {
    if (typeof params.tool_choice === "object" && params.tool_choice.type === "tool") {
      toolChoice = { type: "function", function: { name: params.tool_choice.name } };
    } else if (params.tool_choice === "auto") {
      toolChoice = "auto";
    }
  }

  const res = await client.chat.completions.create({
    model: modelToUse,
    messages: openAIMessages,
    tools: openAITools,
    tool_choice: toolChoice,
    temperature: params.temperature ?? 0.3,
    max_tokens: Math.min(params.max_tokens || 1024, 4096),
  });

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
    model: params.model || provider.fastModel,
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
  const providers = getProviders();

  if (providers.length === 0) {
    throw new Error("No AI API keys configured. Please configure GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY.");
  }

  let lastError: Error | null = null;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      if (provider.type === "anthropic") {
        return await callAnthropicNative(provider, params);
      } else {
        return await callOpenAICompatible(provider, params);
      }
    } catch (err: any) {
      lastError = err;
      const isRateLimit = err?.status === 429 || String(err?.message || "").includes("429") || String(err?.message || "").toLowerCase().includes("rate limit");
      const nextProvider = providers[i + 1]?.name;

      if (nextProvider) {
        console.warn(
          `[AI Router] Provider "${provider.name}" ${isRateLimit ? "rate limited (429)" : "failed: " + (err?.message || err)}. Automatically falling back to "${nextProvider}"...`
        );
      } else {
        console.error(`[AI Router] Provider "${provider.name}" failed: ${err?.message || err}. No more fallback providers available.`);
      }
    }
  }

  throw lastError || new Error("All configured AI providers failed.");
}
