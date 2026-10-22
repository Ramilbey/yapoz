import type Anthropic from "@anthropic-ai/sdk";
import { claude, addUsage, type Usage } from "./claude";
import { env } from "@/lib/env";

export type Classification = {
  intent: string;
  topic: string;
  language: string;
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  must_escalate: boolean;
  escalate_category: string | null;
  summary: string;
  holding_reply: string;
};

const INTENTS = ["greeting", "question", "price", "stock", "booking", "booking_change", "order", "delivery", "complaint", "refund", "partnership", "negotiation", "allergy", "legal", "abuse", "feedback", "jobs", "off_topic", "other"];

const TOOL: Anthropic.Messages.Tool = {
  name: "classify",
  description: "Record the classification of the customer's latest message.",
  input_schema: {
    type: "object",
    properties: {
      intent: { type: "string", enum: INTENTS },
      topic: { type: "string", description: "2-4 word topic, lowercase, e.g. 'opening hours', 'gluten-free base', 'table booking'" },
      language: { type: "string", description: "BCP-47 code of the customer's language, e.g. en, ms, zh, ta, ru, uz-Latn" },
      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
      confidence: { type: "number", description: "0-1: how clearly the request can be understood and handled as a normal customer question" },
      must_escalate: { type: "boolean", description: "True only for: partnership/franchise/wholesale/supplier pitch, complaint, refund, legal, allergy/medical/safety question about the customer's own health, abuse, price negotiation/discount request." },
      escalate_category: { type: ["string", "null"], enum: ["partnership", "wholesale", "complaint", "refund", "legal", "allergy", "medical", "abuse", "negotiation", null] },
      summary: { type: "string", description: "One line for staff: who wants what" },
      holding_reply: { type: "string", description: "A one-sentence holding reply in the customer's language saying the team will follow up in this chat" },
    },
    required: ["intent", "topic", "language", "sentiment", "confidence", "must_escalate", "escalate_category", "summary", "holding_reply"],
  },
};

export async function classify(businessName: string, businessType: string, recent: string, latest: string, usage: Usage): Promise<Classification | null> {
  try {
    const res = await claude().messages.create({
      model: env.fastModel,
      max_tokens: 300,
      system: `You classify customer messages sent to ${businessName}${businessType ? `, a ${businessType}` : ""}. Normal customer inquiries, ordering requests, casual chat, asking for recommendations, asking what is available, or follow-ups are normal business messages (confidence >= 0.85, must_escalate = false). Only escalate for actual complaints, refund demands, legal threats, or medical emergencies.`,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "classify" },
      messages: [{ role: "user", content: `${recent ? `Earlier in the chat:\n${recent}\n\n` : ""}Latest customer message:\n${latest}` }],
    });
    addUsage(usage, res.usage);
    const block = res.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
    if (!block) return null;
    const c = block.input as Classification;
    c.confidence = Math.max(0, Math.min(1, Number(c.confidence ?? 0.5)));
    return c;
  } catch (e) {
    console.error("[classify] failed", e);
    return null;
  }
}
