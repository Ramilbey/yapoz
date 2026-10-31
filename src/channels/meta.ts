// Yapoz's one Meta app (META_APP_ID, META_APP_SECRET, WHATSAPP_VERIFY_TOKEN, META_EMBEDDED_SIGNUP_CONFIG_ID) and the checks it makes
// with Meta before it trusts a WhatsApp number. A number is connected one of two ways: Embedded Signup, or manually with
// its own details: Phone number ID, Business Account ID → channels(whatsapp).config   Access token → channels(whatsapp).credentialsEnc
// Both ways arrive at the one webhook /api/webhooks/whatsapp, signed with the app secret.
import { env } from "@/lib/env";

export type MetaField = "phoneNumberId" | "wabaId" | "accessToken";

/** Something the owner can fix, in words that name the Meta setting. `status` is the HTTP status the API answers with. */
export class MetaError extends Error {
  constructor(public field: MetaField | null, message: string, public status = 400) {
    super(message);
    this.name = "MetaError";
  }
}

class GraphError extends Error {
  constructor(public status: number, message: string, public code?: number) {
    super(message);
  }
}

const REQUIRED_SCOPES = ["whatsapp_business_messaging", "whatsapp_business_management"];

async function graph<T>(path: string, query: Record<string, string>, opts: { method?: "GET" | "POST" | "DELETE"; token?: string } = {}): Promise<T> {
  const url = `https://graph.facebook.com/${env.whatsapp.graphVersion}/${path}?${new URLSearchParams(query)}`;
  let res: Response;
  try {
    res = await fetch(url, { method: opts.method ?? "GET", headers: opts.token ? { authorization: `Bearer ${opts.token}` } : undefined, signal: AbortSignal.timeout(12_000), cache: "no-store" });
  } catch {
    throw new MetaError(null, "Couldn't reach Meta. Try again in a moment.", 502);
  }
  const j = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number } };
  if (!res.ok) throw new GraphError(res.status, j.error?.message ?? `Meta answered ${res.status}`, j.error?.code);
  return j;
}

/** Is the token valid, made by this app, allowed to use WhatsApp, and when does it stop working? */
export async function inspectAccessToken(token: string): Promise<{ expiresAt: string | null; scopes: string[] }> {
  const { appId, appSecret } = env.whatsapp;
  let d: { app_id?: string; is_valid?: boolean; expires_at?: number; scopes?: string[]; error?: { message?: string } };
  try {
    d = (await graph<{ data?: typeof d }>("debug_token", { input_token: token, access_token: `${appId}|${appSecret}` })).data ?? {};
  } catch (e) {
    if (e instanceof GraphError) throw new MetaError("accessToken", `Meta couldn't read this access token (${e.message}).`);
    throw e;
  }
  if (!d.is_valid) throw new MetaError("accessToken", `Meta says this access token isn't valid${d.error?.message ? ` (${d.error.message})` : ""}. It may have expired: make a new System User token.`);
  if (d.app_id && d.app_id !== appId) throw new MetaError("accessToken", `This access token was made by a different Meta app (${d.app_id}), not the one Yapoz runs on (${appId}). Generate it in Yapoz's Meta app.`);
  if (d.scopes) {
    const missing = REQUIRED_SCOPES.filter((s) => !d.scopes!.includes(s));
    if (missing.length) throw new MetaError("accessToken", `This access token is missing the ${missing.join(" and ")} permission${missing.length > 1 ? "s" : ""}. Generate a new System User token with both.`);
  }
  return { expiresAt: d.expires_at ? new Date(d.expires_at * 1000).toISOString() : null, scopes: d.scopes ?? [] };
}

/** The number must really be on this WhatsApp Business Account; returns what the owner will recognise it by. */
export async function checkNumberOnWaba(wabaId: string, phoneNumberId: string, token: string): Promise<{ displayPhone: string | null; verifiedName: string | null }> {
  let numbers: { id: string; display_phone_number?: string; verified_name?: string }[];
  try {
    numbers = (await graph<{ data?: typeof numbers }>(`${wabaId}/phone_numbers`, { fields: "id,display_phone_number,verified_name", limit: "100" }, { token })).data ?? [];
  } catch (e) {
    if (e instanceof GraphError) throw new MetaError("wabaId", `Meta won't show the WhatsApp Business Account ${wabaId} to this token (${e.message}). Check the account ID, and that the token's system user is assigned to it.`);
    throw e;
  }
  const hit = numbers.find((n) => n.id === phoneNumberId);
  if (!hit) {
    const have = numbers.map((n) => `${n.display_phone_number ?? "number"} (ID ${n.id})`).join(", ");
    throw new MetaError("phoneNumberId", `Phone number ID ${phoneNumberId} isn't on WhatsApp Business Account ${wabaId}.${have ? ` That account has: ${have}.` : " That account has no numbers yet."}`);
  }
  return { displayPhone: hit.display_phone_number ?? null, verifiedName: hit.verified_name ?? null };
}

/** Reads the number itself, for when Meta won't show the Business Account it sits on. */
async function readNumber(phoneNumberId: string, token: string): Promise<{ displayPhone: string | null; verifiedName: string | null }> {
  try {
    const j = await graph<{ display_phone_number?: string; verified_name?: string }>(phoneNumberId, { fields: "display_phone_number,verified_name" }, { token });
    return { displayPhone: j.display_phone_number ?? null, verifiedName: j.verified_name ?? null };
  } catch (e) {
    if (e instanceof GraphError) throw new MetaError("phoneNumberId", `Meta won't show phone number ID ${phoneNumberId} to this token (${e.message}).`);
    throw e;
  }
}

/**
 * The number, confirmed against its Business Account when Meta lets the token see that account. Meta's own test numbers sit
 * on an account no System User can be assigned to: the token can read the number but not the account. Then the number alone
 * is confirmed (`accountChecked: false`) and the webhook subscription is left to the app-level one in Meta's dashboard.
 * A number that isn't on an account the token CAN see is still refused, and so is one Meta shows neither way.
 */
export async function checkNumber(wabaId: string, phoneNumberId: string, token: string): Promise<{ displayPhone: string | null; verifiedName: string | null; accountChecked: boolean }> {
  try {
    return { ...(await checkNumberOnWaba(wabaId, phoneNumberId, token)), accountChecked: true };
  } catch (e) {
    if (!(e instanceof MetaError) || e.field !== "wabaId") throw e;
    try {
      return { ...(await readNumber(phoneNumberId, token)), accountChecked: false };
    } catch {
      throw e;
    }
  }
}

/** Subscribes the token's app to the account's webhooks so Meta sends it the customers' messages. */
export async function subscribeWaba(wabaId: string, token: string) {
  try {
    const j = await graph<{ success?: boolean }>(`${wabaId}/subscribed_apps`, {}, { method: "POST", token });
    if (!j.success) throw new MetaError("wabaId", "Meta didn't subscribe the app to this WhatsApp Business Account.");
  } catch (e) {
    if (e instanceof GraphError) throw new MetaError("wabaId", `Couldn't subscribe to the WhatsApp Business Account ${wabaId} (${e.message}).`);
    throw e;
  }
}

/** Connecting a number needs Yapoz's Meta app: its secret checks the access token and signs the webhooks. */
export const metaAppReady = () => Boolean(env.whatsapp.appId && env.whatsapp.appSecret);

/** Embedded Signup also needs the app's Login-for-Business configuration (optional: without it only manual credentials work). */
export const embeddedSignupReady = () => Boolean(metaAppReady() && env.whatsapp.embeddedConfigId);

/** Embedded Signup hands the browser a short-lived code; only the server, with the app secret, can turn it into the business's token. */
export async function exchangeSignupCode(code: string): Promise<string> {
  const w = env.whatsapp;
  try {
    const j = await graph<{ access_token?: string }>("oauth/access_token", { client_id: w.appId, client_secret: w.appSecret, code });
    if (!j.access_token) throw new MetaError("accessToken", "Meta didn't return an access token. Try connecting again.");
    return j.access_token;
  } catch (e) {
    if (e instanceof GraphError) throw new MetaError("accessToken", `Meta didn't accept the sign-up code (${e.message}). The code is single-use and expires in minutes: start again.`);
    throw e;
  }
}

/**
 * A number new to the Cloud API has to be registered before it can send. Meta refuses a second registration of a number
 * that already works, so that answer is fine; anything else is returned for the owner to see, without blocking the connection.
 */
export async function registerNumber(phoneNumberId: string, token: string): Promise<string | null> {
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  try {
    await graph(`${phoneNumberId}/register`, { messaging_product: "whatsapp", pin }, { method: "POST", token });
    return null;
  } catch (e) {
    if (e instanceof GraphError) return /already registered/i.test(e.message) ? null : `Meta didn't register the number for the Cloud API (${e.message}).`;
    throw e;
  }
}

/** Stops Meta sending this account's webhooks to the app (on disconnect). Best effort. */
export async function unsubscribeWaba(wabaId: string, token: string) {
  await graph(`${wabaId}/subscribed_apps`, {}, { method: "DELETE", token }).catch(() => {});
}
