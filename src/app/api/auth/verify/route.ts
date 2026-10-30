import { z } from "zod";
import { handle, HttpError } from "@/lib/auth";
import { body, clientIp, ok } from "@/lib/api";
import { startSession } from "@/lib/login";
import { hit } from "@/lib/ratelimit";
import { verificationCode } from "@/lib/validation";
import { confirmCode, forgetPendingUser, pendingUser } from "@/lib/verification";

const Body = z.object({ code: verificationCode });

/** The right code verifies the email and signs the owner in, straight to the setup wizard. */
export const POST = handle(async (req: Request) => {
  if (!(await hit(`verify:${clientIp(req)}`, "hour", 30)).ok) throw new HttpError(429, "Too many attempts. Try again later.");
  const b = await body(req, Body);
  const user = await pendingUser();
  if (!user) throw new HttpError(401, "This verification has expired. Sign in again to get a new code.");
  if (!(await confirmCode(user, b.code))) throw new HttpError(400, "That code is wrong or has expired. Check it, or send a new one.");
  await forgetPendingUser();
  await startSession(user);
  return ok({ ok: true, home: "/app/setup" });
});
