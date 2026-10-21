// Connecting a business's Instagram professional account through Jawab's Meta app
// ("Instagram API with Instagram Login"). Until the app passes App Review, only accounts added as
// Instagram testers on the app can finish this flow; everything else works the same.
import { db, t } from "@/db";
import { and, eq, ne, sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { channelOf, type InstagramSecrets } from "./connections";

export const IG_SCOPES = ["instagram_business_basic", "instagram_business_manage_messages", "instagram_business_manage_comments"];
const DAY = 24 * 60 * 60 * 1000;

export const igRedirectUri = () => `${env.appUrl}/api/channels/instagram/callback`;

export function igAuthUrl(state: string) {
  const q = new URLSearchParams({ client_id: env.instagram.appId, redirect_uri: igRedirectUri(), response_type: "code", scope: IG_SCOPES.join(","), state });
  return `https://www.instagram.com/oauth/authorize?${q}`;
}

async function json<T>(res: Response, what: string): Promise<T> {
  const j = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } | string; error_message?: string };
  if (!res.ok) {
    const msg = typeof j.error === "string" ? j.error_message ?? j.error : j.error?.message ?? j.error_message;
    throw new Error(`${what} failed (${res.status})${msg ? `: ${msg}` : ""}`);
  }
  return j;
}

/** Some Instagram endpoints wrap the result in data[]; others return it flat. */
const unwrap = <T,>(j: T | { data?: T[] }): T => ((j as { data?: T[] }).data?.[0] ?? (j as T));

export async function connectInstagram(workspaceId: string, code: string) {
  const ig = env.instagram;
  if (!ig.appId || !ig.appSecret) throw new Error("Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET first.");

  const short = unwrap(
    await json<{ access_token: string; user_id: string | number } | { data: { access_token: string; user_id: string | number }[] }>(
      await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        body: new URLSearchParams({ client_id: ig.appId, client_secret: ig.appSecret, grant_type: "authorization_code", redirect_uri: igRedirectUri(), code }),
      }),
      "Instagram sign-in",
    ),
  );

  const long = await json<{ access_token: string; expires_in?: number }>(
    await fetch(`https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: ig.appSecret, access_token: short.access_token })}`),
    "Long-lived token",
  );

  const me = unwrap(
    await json<{ user_id?: string | number; id?: string; username?: string } | { data: { user_id?: string | number; id?: string; username?: string }[] }>(
      await fetch(`https://graph.instagram.com/${ig.graphVersion}/me?${new URLSearchParams({ fields: "user_id,username", access_token: long.access_token })}`),
      "Reading the Instagram account",
    ),
  );
  // Webhooks name the account by its professional account id (user_id), not the app-scoped id.
  const accountId = String(me.user_id ?? short.user_id ?? me.id ?? "");
  if (!accountId) throw new Error("Instagram didn't return an account id.");

  const [taken] = await db
    .select({ ws: t.channels.workspaceId })
    .from(t.channels)
    .where(and(eq(t.channels.type, "instagram"), ne(t.channels.workspaceId, workspaceId), sql`${t.channels.config}->>'accountId' = ${accountId}`));
  if (taken) throw new Error("This Instagram account is already connected to another business on Jawab.");

  await json<{ success?: boolean }>(
    await fetch(`https://graph.instagram.com/${ig.graphVersion}/me/subscribed_apps?${new URLSearchParams({ subscribed_fields: "messages,comments", access_token: long.access_token })}`, { method: "POST" }),
    "Turning on Instagram notifications",
  );

  const ch = await channelOf(workspaceId, "instagram");
  const secrets: InstagramSecrets = { token: long.access_token, expiresAt: long.expires_in ? Date.now() + long.expires_in * 1000 : Date.now() + 60 * DAY, refreshedAt: Date.now() };
  await db
    .update(t.channels)
    .set({ credentialsEnc: encryptJson(secrets), config: { ...ch.config, accountId, username: me.username ?? null }, enabled: true })
    .where(eq(t.channels.id, ch.id));
  await db.insert(t.events).values({ workspaceId, type: "channel.connected", props: { channel: "instagram", username: me.username ?? null } });
  return { accountId, username: me.username ?? null };
}

/** Long-lived tokens last about 60 days; refresh any that are at least a day old and expire within 20 days. */
export async function refreshInstagramTokens() {
  const rows = await db.select().from(t.channels).where(eq(t.channels.type, "instagram"));
  let refreshed = 0;
  for (const ch of rows) {
    if (!ch.credentialsEnc) continue;
    const s = decryptJson<InstagramSecrets>(ch.credentialsEnc);
    if (Date.now() - s.refreshedAt < DAY || (s.expiresAt && s.expiresAt - Date.now() > 20 * DAY)) continue;
    try {
      const r = await json<{ access_token: string; expires_in?: number }>(
        await fetch(`https://graph.instagram.com/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: s.token })}`),
        "Instagram token refresh",
      );
      const next: InstagramSecrets = { token: r.access_token, expiresAt: r.expires_in ? Date.now() + r.expires_in * 1000 : s.expiresAt, refreshedAt: Date.now() };
      await db.update(t.channels).set({ credentialsEnc: encryptJson(next) }).where(eq(t.channels.id, ch.id));
      refreshed++;
    } catch (e) {
      await db.insert(t.events).values({ workspaceId: ch.workspaceId, type: "channel.refresh_failed", props: { channel: "instagram", error: (e as Error).message } });
    }
  }
  return refreshed;
}
