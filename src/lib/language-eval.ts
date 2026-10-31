// Pure scoring for the Malay/Manglish classifier evaluation (scripts/eval-language.ts). No model calls here.

// Mirror of INTENTS in src/agent/classify.ts (not exported there); tests/language-eval.test.ts checks they match.
export const EVAL_INTENTS = ["greeting", "question", "price", "stock", "order", "order_change", "payment", "delivery", "appointment", "complaint", "refund", "partnership", "negotiation", "allergy", "legal", "abuse", "feedback", "off_topic", "other"];
export const EVAL_LANGUAGES = ["en", "ms", "manglish"] as const;
export type EvalLanguage = (typeof EVAL_LANGUAGES)[number];
export type EvalItem = { id: string; text: string; language: EvalLanguage; expectedIntent: string; expectClarify: boolean; note: string };
export type Prediction = { intent: string; confidence: number; must_escalate: boolean; escalate_category: string | null } | null;

export const DEFAULT_THRESHOLD = 0.55; // same fallback as pipeline.ts: ws.settings.confidenceThreshold ?? 0.55

/**
 * Mirrors src/agent/pipeline.ts: a message is NOT answered directly when the classifier says must_escalate with a
 * category (serious escalation), or confidence < threshold for any intent other than greeting / off_topic
 * (low_confidence escalation). A null classification is handled separately by the caller.
 */
export function wouldClarify(p: NonNullable<Prediction>, threshold = DEFAULT_THRESHOLD): boolean {
  if (p.must_escalate && p.escalate_category) return true;
  return p.confidence < threshold && p.intent !== "greeting" && p.intent !== "off_topic";
}

type Bucket = { total: number; correct: number; accuracy: number };
export type Miss = { id: string; text: string; expected: string; predicted: string | null };
export type ClarifyStats = { predictedRate: number; expectedRate: number; agree: number; agreement: number; falseClarify: number; missedClarify: number };
export type EvalScore = {
  total: number;
  failed: number; // classify() returned null (provider error); counted as intent misses, excluded from clarify stats
  overall: Bucket;
  byLanguage: Record<string, Bucket>;
  clarify: ClarifyStats;
  misses: Miss[];
};

const bucket = (correct: number, total: number): Bucket => ({ total, correct, accuracy: total ? correct / total : 0 });

export function scoreEval(items: EvalItem[], preds: Prediction[], threshold = DEFAULT_THRESHOLD): EvalScore {
  if (items.length !== preds.length) throw new Error("items and predictions must be the same length");
  const lang: Record<string, { c: number; t: number }> = {};
  const misses: Miss[] = [];
  let correct = 0, failed = 0, scored = 0, predClar = 0, expClar = 0, agree = 0, falseClarify = 0, missedClarify = 0;
  items.forEach((it, i) => {
    const p = preds[i];
    const l = (lang[it.language] ??= { c: 0, t: 0 });
    l.t++;
    if (!p) {
      failed++;
      misses.push({ id: it.id, text: it.text, expected: it.expectedIntent, predicted: null });
      return;
    }
    if (p.intent === it.expectedIntent) { correct++; l.c++; } else misses.push({ id: it.id, text: it.text, expected: it.expectedIntent, predicted: p.intent });
    const pc = wouldClarify(p, threshold);
    scored++;
    if (pc) predClar++;
    if (it.expectClarify) expClar++;
    if (pc === it.expectClarify) agree++;
    else if (pc) falseClarify++;
    else missedClarify++;
  });
  return {
    total: items.length,
    failed,
    overall: bucket(correct, items.length),
    byLanguage: Object.fromEntries(Object.entries(lang).map(([k, v]) => [k, bucket(v.c, v.t)])),
    clarify: {
      predictedRate: scored ? predClar / scored : 0,
      expectedRate: scored ? expClar / scored : 0,
      agree, agreement: scored ? agree / scored : 0, falseClarify, missedClarify,
    },
    misses,
  };
}
