// Offline checks for the language eval set and its scoring. No model calls.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EVAL_INTENTS, EVAL_LANGUAGES, scoreEval, wouldClarify, type EvalItem, type Prediction } from "../src/lib/language-eval";

const data = JSON.parse(readFileSync(new URL("./eval/language-eval.json", import.meta.url), "utf8")) as { _about: string; items: EvalItem[] };

test("EVAL_INTENTS matches classify.ts", () => {
  const src = readFileSync(new URL("../src/agent/classify.ts", import.meta.url), "utf8");
  const m = src.match(/const INTENTS = (\[[^\]]*\])/);
  assert.ok(m);
  assert.deepEqual(JSON.parse(m[1]), EVAL_INTENTS);
});

test("dataset is well formed", () => {
  assert.match(data._about, /hand-written/i);
  const items = data.items;
  assert.ok(items.length >= 30 && items.length <= 50);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  for (const i of items) {
    assert.ok(EVAL_INTENTS.includes(i.expectedIntent), i.id);
    assert.ok((EVAL_LANGUAGES as readonly string[]).includes(i.language), i.id);
    assert.equal(typeof i.expectClarify, "boolean");
    assert.ok(i.text.trim().length > 0);
  }
  for (const l of EVAL_LANGUAGES) assert.ok(items.filter((i) => i.language === l).length >= 5, l);
  assert.ok(items.filter((i) => /ambiguous/.test(i.note)).length >= 3);
});

const P = (intent: string, confidence = 0.9, must_escalate = false, escalate_category: string | null = null): NonNullable<Prediction> => ({ intent, confidence, must_escalate, escalate_category });
const it = (id: string, language: EvalItem["language"], expectedIntent: string, expectClarify = false): EvalItem => ({ id, text: id, language, expectedIntent, expectClarify, note: "" });

test("wouldClarify mirrors the pipeline", () => {
  assert.equal(wouldClarify(P("price", 0.9)), false);
  assert.equal(wouldClarify(P("price", 0.4)), true);
  assert.equal(wouldClarify(P("price", 0.55)), false);
  assert.equal(wouldClarify(P("greeting", 0.1)), false);
  assert.equal(wouldClarify(P("off_topic", 0.1)), false);
  assert.equal(wouldClarify(P("allergy", 0.95, true, "allergy")), true);
  assert.equal(wouldClarify(P("price", 0.7), 0.8), true);
});

test("scoreEval computes accuracy, clarify rates and misses", () => {
  const items = [it("a", "en", "price"), it("b", "ms", "stock", true), it("c", "ms", "order"), it("d", "manglish", "allergy", true), it("e", "en", "order")];
  const preds: Prediction[] = [P("price"), P("stock", 0.3), P("price"), P("allergy", 0.9, true, "allergy"), null];
  const s = scoreEval(items, preds);
  assert.equal(s.overall.correct, 3);
  assert.equal(s.overall.accuracy, 0.6);
  assert.equal(s.failed, 1);
  assert.equal(s.byLanguage.ms.accuracy, 0.5);
  assert.equal(s.byLanguage.en.accuracy, 0.5);
  assert.equal(s.clarify.predictedRate, 0.5);
  assert.equal(s.clarify.expectedRate, 0.5);
  assert.equal(s.clarify.agreement, 1);
  assert.deepEqual(s.misses.map((m) => m.id), ["c", "e"]);
  assert.throws(() => scoreEval(items, []));
});
