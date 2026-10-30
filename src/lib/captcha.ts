// Cloudflare Turnstile. A production server without the keys refuses sign-ups rather than letting bots through.
import { env } from "./env";
import { HttpError } from "./auth";

export function captchaReady() {
  if (!env.turnstile.secretKey && process.env.NODE_ENV === "production") throw new HttpError(503, "Sign-up isn't available right now. Please try again later.");
}

export async function verifyCaptcha(token: string, ip: string) {
  const { secretKey } = env.turnstile;
  if (!secretKey) return;
  const form = new URLSearchParams({ secret: secretKey, response: token });
  if (ip !== "local") form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form, signal: AbortSignal.timeout(8_000) }).catch(() => null);
  if (!res) throw new HttpError(503, "Couldn't run the human check. Please try again.");
  const j = (await res.json().catch(() => ({}))) as { success?: boolean };
  if (!j.success) throw new HttpError(400, "The human check failed. Please try it again.");
}
