import Anthropic from "@anthropic-ai/sdk";

const g = globalThis as unknown as { __anthropic?: Anthropic };

export function claude(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  // Pass baseURL explicitly so a stray ANTHROPIC_BASE_URL in the shell never reroutes production traffic.
  g.__anthropic ??= new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: process.env.JAWAB_ANTHROPIC_BASE_URL || "https://api.anthropic.com",
    timeout: 30_000,
    maxRetries: 2,
  });
  return g.__anthropic;
}

export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number };
export function addUsage(u: Usage, r: Anthropic.Messages.Usage) {
  u.input += r.input_tokens ?? 0;
  u.output += r.output_tokens ?? 0;
  u.cacheRead += r.cache_read_input_tokens ?? 0;
  u.cacheWrite += r.cache_creation_input_tokens ?? 0;
}

export function textOf(msg: Anthropic.Messages.Message): string {
  return msg.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
