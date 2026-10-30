// The rules around a new account: what sign-up accepts, and what an owner can open before setup is finished.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BusinessDetails, SignupFields, fieldErrors, verificationCode } from "../src/lib/validation";
import { canOpenDuringSetup, signSession, verifySession } from "../src/lib/session";

const good = { businessName: "Kasih Hair Studio", name: "Nadia Lim", email: "NADIA@Example.com ", password: "blue-kettle-42" };
const problems = (v: object) => {
  const r = SignupFields.safeParse({ ...good, ...v });
  return r.success ? {} : fieldErrors(r.error);
};

test("a sensible sign-up passes, with the email normalised", () => {
  assert.equal(SignupFields.parse(good).email, "nadia@example.com");
});

test("sign-up rejects bad names, emails and weak passwords", () => {
  assert.ok(problems({ businessName: "!!" }).businessName);
  assert.ok(problems({ name: "1234" }).name);
  assert.ok(problems({ email: "not-an-email" }).email);
  assert.ok(problems({ password: "short1" }).password);
  assert.ok(problems({ password: "onlyletters" }).password);
  assert.ok(problems({ password: "12345678" }).password);
  assert.ok(problems({ password: "Password123" }).password);
  assert.ok(problems({ password: `${"a1".repeat(40)}` }).password, "over bcrypt's 72 bytes");
  assert.ok(problems({ password: "nadia12345" }).password, "contains the email");
  assert.deepEqual(problems({ email: "a@example.com", password: "blue-kettle-42" }), {}, "a short email name isn't a match");
});

test("verification codes are exactly six digits", () => {
  assert.ok(verificationCode.safeParse("012345").success);
  for (const c of ["12345", "1234567", "12a456", ""]) assert.equal(verificationCode.safeParse(c).success, false);
});

test("business details reject junk phones and websites", () => {
  const ok = { type: "hair salon", description: "", address: "", phone: "+60 12-345 6789", website: "kasih.my/book", languages: ["English"] };
  assert.ok(BusinessDetails.safeParse(ok).success);
  assert.ok(BusinessDetails.safeParse({ ...ok, phone: null, website: null }).success);
  for (const bad of [{ phone: "call me" }, { website: "not a site" }, { website: "nodot" }, { type: "" }, { languages: [] }]) assert.equal(BusinessDetails.safeParse({ ...ok, ...bad }).success, false);
});

test("an owner mid-setup can only reach setup and the pages it links to", () => {
  for (const p of ["/app/setup", "/app/knowledge", "/app/settings", "/app/calendar", "/app/account"]) assert.ok(canOpenDuringSetup(p));
  for (const p of ["/app", "/app/today", "/app/inbox", "/app/orders", "/app/setupx"]) assert.equal(canOpenDuringSetup(p), false);
});

test("the setup hold survives the session token", async () => {
  const s = { userId: "u", workspaceId: "W", role: "owner" as const, name: "N", email: "e" };
  assert.equal((await verifySession(await signSession({ ...s, setupPending: true })))?.setupPending, true);
  assert.equal((await verifySession(await signSession(s)))?.setupPending, false);
});
