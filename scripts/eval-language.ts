// Runs the hand-written Malay/Manglish set (tests/eval/language-eval.json) through the live classifier.
//   npm run eval:language
// Needs an AI provider key (see src/agent/ai-router.ts). Without one it prints a message and exits 1; it never invents numbers.
import "./env";
import { readFileSync } from "node:fs";
import { classify } from "@/agent/classify";
import { hasAnyAIConfigured, type Usage } from "@/agent/claude";
import { DEFAULT_THRESHOLD, scoreEval, type EvalItem, type Prediction } from "@/lib/language-eval";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

async function main() {
  if (!hasAnyAIConfigured()) {
    console.error("No AI provider is configured (set a key such as GROQ/GEMINI/ANTHROPIC in .env.local). No accuracy number was produced.");
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(new URL("../tests/eval/language-eval.json", import.meta.url), "utf8")) as { threshold?: number; businessName: string; businessType: string; items: EvalItem[] };
  const threshold = Number(process.env.EVAL_CONFIDENCE_THRESHOLD) || data.threshold || DEFAULT_THRESHOLD;
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const preds: Prediction[] = [];
  for (const it of data.items) {
    const u: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }; // fresh per message
    preds.push(await classify(data.businessName, data.businessType, "", it.text, u));
    for (const k of Object.keys(usage) as (keyof Usage)[]) usage[k] += u[k];
  }
  const s = scoreEval(data.items, preds, threshold);
  console.log(`Messages: ${s.total} (classifier failures: ${s.failed}); confidence threshold ${threshold}`);
  console.log(`Intent accuracy overall: ${s.overall.correct}/${s.overall.total} = ${pct(s.overall.accuracy)}`);
  for (const [l, b] of Object.entries(s.byLanguage)) console.log(`  ${l}: ${b.correct}/${b.total} = ${pct(b.accuracy)}`);
  const c = s.clarify;
  console.log(`Clarification rate (not answered directly): predicted ${pct(c.predictedRate)}, expected ${pct(c.expectedRate)}; agreement ${pct(c.agreement)} (false clarify ${c.falseClarify}, missed clarify ${c.missedClarify})`);
  if (s.misses.length) {
    console.log("\nIntent misses:");
    for (const m of s.misses) console.log(`  ${m.id}: expected ${m.expected}, got ${m.predicted ?? "(no result)"} | ${m.text}`);
  }
  console.log(`\nTokens: input ${usage.input}, output ${usage.output}, cache read ${usage.cacheRead}, cache write ${usage.cacheWrite}`);
  if (s.failed) process.exitCode = 1;
}

await main();
