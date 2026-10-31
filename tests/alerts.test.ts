// Who gets alerted, and when. Delivery itself is checked against a real database in the end-to-end run.
import { test } from "node:test";
import assert from "node:assert/strict";
import { alertPrefs, inQuietHours, isPushEndpoint } from "../src/lib/alert-prefs";

test("owners start with email backup, staff don't, and choices override defaults", () => {
  assert.equal(alertPrefs(null, "owner").email, true);
  assert.equal(alertPrefs({}, "service").email, false);
  assert.equal(alertPrefs({ email: true, sound: false }, "service").email, true);
  assert.equal(alertPrefs({ sound: false }, "owner").sound, false);
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
