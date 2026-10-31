// A file the receipt check didn't save must never be answered with "we received your payment".
import { test } from "node:test";
import assert from "node:assert/strict";
import { claimsReceipt } from "../src/agent/acknowledge";

test("replies that say a payment or file arrived are caught", () => {
  for (const r of [
    "Thanks! We received your payment.",
    "Got your receipt, the team will confirm shortly.",
    "I've received the screenshot, thank you!",
    "Your payment has been confirmed.",
    "Thank you for the payment!",
    "The receipt looks good.",
  ]) assert.ok(claimsReceipt(r), r);
});

test("honest replies pass", () => {
  for (const r of [
    "Sorry, that file didn't come through as a receipt. Could you send a clear photo?",
    "Please send the payment receipt here once you've paid.",
    "We're open 10 to 10.",
  ]) assert.ok(!claimsReceipt(r), r);
});
