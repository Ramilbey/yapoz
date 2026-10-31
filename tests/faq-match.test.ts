// An owner-taught FAQ must be found for the question it answers, worded differently or not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { matchFaqs, type Catalog } from "../src/agent/knowledge";

const faq = (title: string, body: string) => ({ kind: "faq", title, body }) as Catalog["all"][number];
const c = { items: [], all: [faq("Can I apply to work with you?", "Yes! Email careers@yapoz.com with your CV."), faq("Do you have parking?", "Yes, free parking behind the shop.")] } as Catalog;

test("the same question, reworded, finds its FAQ", () => {
  for (const q of ["Can I apply to work with you", "Can I work with you?", "how do i apply to work here"]) {
    assert.ok(matchFaqs(c, q)[0]?.answer.startsWith("Yes! Email"), q);
  }
});

test("an unrelated question matches nothing", () => {
    assert.equal(matchFaqs(c, "what time do you close").length, 0);
});
