// Who gets alerted, and when. Delivery itself is checked against a real database in the end-to-end run.
import "../scripts/env";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, t, sql } from "../src/db";
import { alertPrefs, inQuietHours, isPushEndpoint } from "../src/lib/alert-prefs";
import { sendTestAlert, testAlert, testAlertStatus } from "../src/lib/alerts";
import { createWorkspace } from "../src/lib/workspace";

const workspaces: string[] = [];
after(async () => {
  for (const id of workspaces) await db.delete(t.workspaces).where(eq(t.workspaces.id, id));
  await sql.end();
});

test("owners start with email backup, staff don't, and choices override defaults", () => {
  assert.equal(alertPrefs(null, "owner").email, true);
  assert.equal(alertPrefs({}, "service").email, false);
  assert.equal(alertPrefs({ email: true, sound: false }, "service").email, true);
  assert.equal(alertPrefs({ sound: false }, "owner").sound, false);
  assert.equal(alertPrefs(null, "owner").emailTo, null);
  assert.equal(alertPrefs({ emailTo: "alerts@shop.example" }, "owner").emailTo, "alerts@shop.example");
});

test("quiet hours work across midnight and within a day", () => {
  const night = { start: "22:00", end: "07:00" };
  assert.equal(inQuietHours(night, "23:30"), true);
  assert.equal(inQuietHours(night, "06:59"), true);
  assert.equal(inQuietHours(night, "07:00"), false);
  assert.equal(inQuietHours(night, "12:00"), false);
  assert.equal(inQuietHours({ start: "13:00", end: "14:00" }, "13:30"), true);
  assert.equal(inQuietHours({ start: "13:00", end: "14:00" }, "14:00"), false);
  assert.equal(inQuietHours({ start: "09:00", end: "09:00" }, "09:00"), false);
  assert.equal(inQuietHours(null, "09:00"), false);
});

test("only browser push services are accepted as addresses", () => {
  assert.equal(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"), true);
  assert.equal(isPushEndpoint("https://web.push.apple.com/abc"), true);
  assert.equal(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"), true);
  assert.equal(isPushEndpoint("https://wns2-par02p.notify.windows.com/w/?token=abc"), true);
  assert.equal(isPushEndpoint("http://fcm.googleapis.com/x"), false);
  assert.equal(isPushEndpoint("https://evilfcm.googleapis.com.example.com/x"), false);
  assert.equal(isPushEndpoint("https://169.254.169.254/latest"), false);
  assert.equal(isPushEndpoint("nonsense"), false);
});

test("a test alert says it's a test, and goes only to the person asking", async () => {
  const mail = () => `${Math.random().toString(36).slice(2)}@example.com`;
  const { workspaceId, user } = await createWorkspace({ name: "Bell Test", timezone: "Asia/Kuala_Lumpur", owner: { name: "Owner", email: mail(), passwordHash: "x" } });
  workspaces.push(workspaceId);
  const [other] = await db.insert(t.users).values({ workspaceId, email: mail(), name: "Other", passwordHash: "x", role: "service" }).returning();
  await db.insert(t.pushSubscriptions).values({ workspaceId, userId: other.id, endpoint: "https://fcm.googleapis.com/fcm/send/other", p256dh: "k", auth: "a" });
  const me = { id: user.id, email: user.email, prefs: alertPrefs({ emailTo: "alerts@shop.example" }, "owner") };

  assert.match(testAlert().body, /only a test/);
  const status = await testAlertStatus(me);
  assert.equal(status.devices, 0, "someone else's device isn't mine");
  assert.equal(status.emailTo, "alerts@shop.example");
  const push = await sendTestAlert(me, "push");
  assert.equal(push.ok, false, "nothing to send to");
  assert.match(push.message, /No devices yet/);

  const before = await db.select().from(t.orders).where(eq(t.orders.workspaceId, workspaceId));
  const realFetch = globalThis.fetch;
  const key = process.env.RESEND_API_KEY;
  const sent: { to: string[]; subject: string }[] = [];
  process.env.RESEND_API_KEY = "test-key";
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)));
    return new Response("{}");
  }) as typeof fetch;
  try {
    const email = await sendTestAlert(me, "email");
    assert.deepEqual(email, { ok: true, message: "Test email sent to alerts@shop.example." });
    assert.deepEqual(sent.map((m) => m.to), [["alerts@shop.example"]]);
    assert.match(sent[0].subject, /Test from Yapoz/);
    globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    assert.equal((await sendTestAlert(me, "email")).ok, false, "a failed send says so");
  } finally {
    globalThis.fetch = realFetch;
    if (key === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = key;
  }
  assert.equal((await db.select().from(t.orders).where(eq(t.orders.workspaceId, workspaceId))).length, before.length, "no order was created");
});
