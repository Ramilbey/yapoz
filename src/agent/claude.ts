import type Anthropic from "@anthropic-ai/sdk";
import { executeWithFallback, type UnifiedMessageResponse, hasAnyAIConfigured } from "./ai-router";

export function claude(): {
  messages: {
    create: (params: any, options?: any) => Promise<UnifiedMessageResponse>;
  };
} {
  return {
    messages: {
      create: async (params: any, _options?: any) => {
        return executeWithFallback(params);
      },
    },
  };
}

export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number };

export function addUsage(u: Usage, r: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number } | Anthropic.Messages.Usage) {
  u.input += (r as any).input_tokens ?? 0;
  u.output += (r as any).output_tokens ?? 0;
  u.cacheRead += (r as any).cache_read_input_tokens ?? 0;
  u.cacheWrite += (r as any).cache_creation_input_tokens ?? 0;
}

export function textOf(msg: UnifiedMessageResponse | Anthropic.Messages.Message): string {
  return (msg.content as any[])
    .filter((b) => b?.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export { hasAnyAIConfigured };
