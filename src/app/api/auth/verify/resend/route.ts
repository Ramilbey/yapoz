import { handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { pendingUser, sendCode } from "@/lib/verification";

export const POST = handle(async () => {
  const user = await pendingUser();
  if (!user) throw new HttpError(401, "This verification has expired. Sign in again to get a new code.");
  const sent = await sendCode(user);
  if (sent === "throttled") throw new HttpError(429, "A code was sent recently. Check your inbox and spam folder, or try again in a minute.");
  if (sent === "failed") throw new HttpError(502, "We couldn't send the email. Please try again shortly.");
  return ok({ ok: true });
});
