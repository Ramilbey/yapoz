// Google Calendar via REST (no SDK): OAuth for the HR user, free/busy, and event creation with a Meet link.
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { env } from "@/lib/env";
import { randomUUID } from "node:crypto";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.freebusy"];

export function googleConfigured() {
  return Boolean(env.google.clientId && env.google.clientSecret);
}

export function redirectUri() {
  return `${env.appUrl}/api/integrations/google/callback`;
}

export function authUrl(state: string) {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env.google.clientId);
  u.searchParams.set("redirect_uri", redirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPES.join(" "));
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("state", state);
  return u.toString();
}

type Tokens = { refresh_token: string; access_token?: string; expires_at?: number };

export async function exchangeCode(workspaceId: string, userId: string, code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.google.clientId, client_secret: env.google.clientSecret, redirect_uri: redirectUri(), grant_type: "authorization_code" }),
  });
  const j = (await res.json()) as { refresh_token?: string; access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !j.refresh_token) throw new Error(`Google token exchange failed: ${j.error ?? res.status}`);
  const tokens: Tokens = { refresh_token: j.refresh_token, access_token: j.access_token, expires_at: Date.now() + (j.expires_in ?? 3000) * 1000 };
  await db
    .insert(t.integrations)
    .values({ workspaceId, userId, provider: "google", dataEnc: encryptJson(tokens), meta: { connectedAt: new Date().toISOString() } })
    .onConflictDoUpdate({ target: [t.integrations.workspaceId, t.integrations.provider], set: { userId, dataEnc: encryptJson(tokens), meta: { connectedAt: new Date().toISOString() } } });
}

async function accessToken(workspaceId: string): Promise<string | null> {
  if (!googleConfigured()) return null;
  const [row] = await db.select().from(t.integrations).where(and(eq(t.integrations.workspaceId, workspaceId), eq(t.integrations.provider, "google")));
  if (!row) return null;
  const tok = decryptJson<Tokens>(row.dataEnc);
  if (tok.access_token && tok.expires_at && tok.expires_at > Date.now() + 60_000) return tok.access_token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.google.clientId, client_secret: env.google.clientSecret, refresh_token: tok.refresh_token, grant_type: "refresh_token" }),
  });
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!res.ok || !j.access_token) throw new Error("Google token refresh failed");
  const next: Tokens = { ...tok, access_token: j.access_token, expires_at: Date.now() + (j.expires_in ?? 3000) * 1000 };
  await db.update(t.integrations).set({ dataEnc: encryptJson(next) }).where(eq(t.integrations.id, row.id));
  return j.access_token;
}

export async function googleConnected(workspaceId: string) {
  if (!googleConfigured()) return false;
  const [row] = await db.select({ id: t.integrations.id }).from(t.integrations).where(and(eq(t.integrations.workspaceId, workspaceId), eq(t.integrations.provider, "google")));
  return Boolean(row);
}

export async function googleBusy(workspaceId: string, from: Date, to: Date): Promise<{ start: Date; end: Date }[] | null> {
  const token = await accessToken(workspaceId);
  if (!token) return null;
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: "primary" }] }),
  });
  if (!res.ok) throw new Error(`Google freeBusy failed: ${res.status}`);
  const j = (await res.json()) as { calendars?: { primary?: { busy?: { start: string; end: string }[] } } };
  return (j.calendars?.primary?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

export async function googleCreateEvent(
  workspaceId: string,
  e: { summary: string; description: string; start: Date; end: Date; timeZone: string; video: boolean; location?: string | null; attendeeEmail?: string | null },
): Promise<{ id: string; meetUrl: string | null } | null> {
  const token = await accessToken(workspaceId);
  if (!token) return null;
  const body: Record<string, unknown> = {
    summary: e.summary,
    description: e.description,
    start: { dateTime: e.start.toISOString(), timeZone: e.timeZone },
    end: { dateTime: e.end.toISOString(), timeZone: e.timeZone },
    ...(e.location ? { location: e.location } : {}),
    ...(e.attendeeEmail ? { attendees: [{ email: e.attendeeEmail }] } : {}),
    ...(e.video ? { conferenceData: { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } } } : {}),
  };
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=none", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google event insert failed: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as { id: string; hangoutLink?: string };
  return { id: j.id, meetUrl: j.hangoutLink ?? null };
}
