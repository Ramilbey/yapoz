// Tells staff that something needs them: the bell in an open dashboard reads recentAlerts(), and a job sends a phone
// notification (or, without one, an email) to anyone who isn't looking. Only new orders and customers waiting on a person
// count; demo data and low-priority cards stay quiet, so the bell keeps meaning something.
import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNotNull, ne } from "drizzle-orm";
import { db, t } from "@/db";
import { alertPrefs, inQuietHours, type AlertPrefs } from "./alert-prefs";
import { canSendEmail, sendEmail } from "./email";
import { env } from "./env";
import { enqueue, type JobHandler } from "./jobs";
import { formatMoney } from "./money";
import { hit } from "./ratelimit";
import { localTime } from "./time";

type Order = typeof t.orders.$inferSelect;
type Escalation = typeof t.escalations.$inferSelect;
export type AlertKind = "order" | "needs";
export type Alert = { id: string; kind: AlertKind; title: string; body: string; url: string; at: string };

// A ceiling for one business, so a runaway loop or a flood of orders can't send without end.
const EMAILS_PER_DAY = 1000;
const FEED_LIMIT = 20;

export const orderAlert = (o: Pick<Order, "id" | "kind" | "totalMinor" | "currency" | "customerName" | "refCode" | "createdAt">): Alert => ({
  id: `order:${o.id}`, kind: "order", title: o.kind === "appointment" ? "New booking" : "New order",
  body: `${formatMoney(o.totalMinor, o.currency)} from ${o.customerName} · ${o.refCode}`, url: "/app/orders", at: o.createdAt.toISOString(),
});

export const needsAlert = (e: Pick<Escalation, "id" | "summary" | "createdAt">): Alert => ({
  id: `needs:${e.id}`, kind: "needs", title: "A customer needs you", body: e.summary, url: "/app/needs-you", at: e.createdAt.toISOString(),
});

export const worthAlerting = (e: Pick<Escalation, "isDemo" | "priority" | "category" | "status">) => !e.isDemo && e.status === "open" && e.priority !== "low" && e.category !== "low_stock";

export const wants = (p: AlertPrefs, kind: AlertKind) => (kind === "order" ? p.orders : p.needsYou);

/** What the open dashboard hasn't shown yet. */
export async function recentAlerts(workspaceId: string, since: Date, prefs: AlertPrefs) {
  const [orders, cards] = await Promise.all([
    prefs.orders ? db.select().from(t.orders).where(and(eq(t.orders.workspaceId, workspaceId), eq(t.orders.status, "pending"), eq(t.orders.isDemo, false), gt(t.orders.createdAt, since))).orderBy(desc(t.orders.createdAt)).limit(FEED_LIMIT) : [],
    prefs.needsYou ? db.select().from(t.escalations).where(and(eq(t.escalations.workspaceId, workspaceId), eq(t.escalations.status, "open"), eq(t.escalations.isDemo, false), ne(t.escalations.priority, "low"), ne(t.escalations.category, "low_stock"), gt(t.escalations.createdAt, since))).orderBy(desc(t.escalations.createdAt)).limit(FEED_LIMIT) : [],
  ]);
  return [...orders.map(orderAlert), ...cards.map(needsAlert)].sort((a, b) => a.at.localeCompare(b.at));
}

/** Never lets a problem with alerts get in the way of the order or the card itself. */
export async function queueAlert(kind: AlertKind, id: string, workspaceId: string) {
  await enqueue("alert.send", { kind, id, workspaceId }, { dedupeKey: `alert:${kind}:${id}`, workspaceId }).catch((e) => console.error("[alerts] couldn't queue", e));
}

async function findAlert(kind: AlertKind, id: string, workspaceId: string): Promise<Alert | null> {
  if (kind === "order") {
    const [o] = await db.select().from(t.orders).where(and(eq(t.orders.id, id), eq(t.orders.workspaceId, workspaceId)));
    return o && !o.isDemo && o.status === "pending" ? orderAlert(o) : null;
  }
  const [e] = await db.select().from(t.escalations).where(and(eq(t.escalations.id, id), eq(t.escalations.workspaceId, workspaceId)));
  return e && worthAlerting(e) ? needsAlert(e) : null;
}

/** True when the phone got it. A subscription the browser has dropped is deleted, so it isn't tried again. */
async function sendPush(sub: typeof t.pushSubscriptions.$inferSelect, alert: Alert) {
  const { publicKey, privateKey, subject } = env.push;
  if (!publicKey || !privateKey) return false;
  const webpush = (await import("web-push")).default;
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title: alert.title, body: alert.body, url: alert.url, tag: alert.id }),
      { vapidDetails: { subject, publicKey, privateKey }, TTL: 3600, urgency: "high" },
    );
    return true;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await db.delete(t.pushSubscriptions).where(eq(t.pushSubscriptions.id, sub.id));
    else console.error("[alerts] push failed", status, e);
    return false;
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function sendAlertEmail(to: string, businessName: string, alert: Alert) {
  const link = `${env.appUrl}${alert.url}`;
  await sendEmail({
    to,
    subject: `${alert.title}: ${alert.body}`.slice(0, 120),
    text: `${alert.title} at ${businessName}.\n\n${alert.body}\n\nOpen Yapoz: ${link}\n\nYou can change these alerts in Your account.`,
    html: `<p><strong>${escapeHtml(alert.title)}</strong> at ${escapeHtml(businessName)}.</p><p>${escapeHtml(alert.body)}</p><p><a href="${escapeHtml(link)}">Open Yapoz</a></p><p style="color:#777;font-size:13px">You can change these alerts in Your account.</p>`,
  });
}

/**
 * One person's failure never stops the next, and never fails the job: a retry would alert everyone who already got it.
 * Email is only for people with no phone notification that worked.
 */
export async function deliverAlert(kind: AlertKind, id: string, workspaceId: string, now = new Date()) {
  const [alert, [ws], users] = await Promise.all([
    findAlert(kind, id, workspaceId),
    db.select({ name: t.workspaces.name, timezone: t.workspaces.timezone }).from(t.workspaces).where(eq(t.workspaces.id, workspaceId)),
    db.select().from(t.users).where(and(eq(t.users.workspaceId, workspaceId), isNotNull(t.users.emailVerifiedAt))),
  ]);
  if (!alert || !ws) return { pushed: 0, emailed: 0 };
  const time = localTime(now, ws.timezone);
  const people = users.map((u) => ({ u, prefs: alertPrefs(u.alertPrefs, u.role) })).filter(({ prefs }) => wants(prefs, kind) && !inQuietHours(prefs.quietHours, time));
  const subs = people.length ? await db.select().from(t.pushSubscriptions).where(inArray(t.pushSubscriptions.userId, people.map((p) => p.u.id))) : [];
  let pushed = 0;
  let emailed = 0;
  for (const { u, prefs } of people) {
    const sent = await Promise.all(subs.filter((s) => s.userId === u.id).map((s) => sendPush(s, alert)));
    pushed += sent.filter(Boolean).length;
    if (sent.some(Boolean) || !prefs.email) continue;
    if (!(await hit(`alert-email:${workspaceId}`, "day", EMAILS_PER_DAY)).ok) continue;
    try {
      await sendAlertEmail(prefs.emailTo ?? u.email, ws.name, alert);
      emailed++;
    } catch (e) {
      console.error("[alerts] email failed", e);
    }
  }
  return { pushed, emailed };
}

type Tester = { id: string; email: string; prefs: AlertPrefs };

/** Only for the panel in Your account: it says it's a test, and it never touches an order. */
export const testAlert = (): Alert => ({ id: `test:${randomUUID()}`, kind: "order", title: "Test from Yapoz", body: "This is only a test. No order was placed.", url: "/app/account", at: new Date().toISOString() });

const myDevices = (userId: string) => db.select().from(t.pushSubscriptions).where(eq(t.pushSubscriptions.userId, userId));

export async function testAlertStatus(u: Tester) {
  const { publicKey, privateKey } = env.push;
  return { devices: (await myDevices(u.id)).length, pushReady: Boolean(publicKey && privateKey), emailReady: canSendEmail(), emailTo: u.prefs.emailTo ?? u.email };
}

/** Goes only to this person's own devices or alert address. Ignores quiet hours, because they asked for it just now. */
export async function sendTestAlert(u: Tester, channel: "push" | "email"): Promise<{ ok: boolean; message: string }> {
  const alert = testAlert();
  if (channel === "email") {
    const to = u.prefs.emailTo ?? u.email;
    try {
      await sendAlertEmail(to, "your business", alert);
      return { ok: true, message: `Test email sent to ${to}.` };
    } catch (e) {
      console.error("[alerts] test email failed", e);
      return { ok: false, message: "That email didn't go through. Check the address, or try again later." };
    }
  }
  const subs = await myDevices(u.id);
  if (!subs.length) return { ok: false, message: "No devices yet. Turn on Notifications on this device first." };
  const sent = (await Promise.all(subs.map((sub) => sendPush(sub, alert)))).filter(Boolean).length;
  if (!sent) return { ok: false, message: "No device got it. Turn notifications off and on again on this device." };
  return { ok: true, message: `${subs.length === 1 ? "Sent to your device" : `Sent to ${sent} of your ${subs.length} devices`}. It should arrive in a few seconds.` };
}

export const sendAlertJob: JobHandler = async (p) => {
  await deliverAlert(p.kind as AlertKind, String(p.id), String(p.workspaceId));
};
