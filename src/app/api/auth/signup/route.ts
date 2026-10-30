import { z } from "zod";
import bcrypt from "bcryptjs";
import { handle, HttpError } from "@/lib/auth";
import { body, clientIp, ok } from "@/lib/api";
import { captchaReady, verifyCaptcha } from "@/lib/captcha";
import { canSendEmail } from "@/lib/email";
import { hit } from "@/lib/ratelimit";
import { SignupFields } from "@/lib/validation";
import { rememberPendingUser, sendCode } from "@/lib/verification";
import { createWorkspace, dropUnverifiedSignups } from "@/lib/workspace";

const Body = z.intersection(SignupFields, z.object({ timezone: z.string().max(64).default("UTC"), captchaToken: z.string().max(4096).default("") }));

/** A new business: workspace + owner account. Nobody is signed in until the emailed code is entered at /verify. */
export const POST = handle(async (req: Request) => {
  if (!(await hit(`signup:${clientIp(req)}`, "hour", 8)).ok) return ok({ error: "Too many sign-ups from here. Try again later." }, { status: 429 });
  const b = await body(req, Body);
  captchaReady();
  if (!canSendEmail()) throw new HttpError(503, "Sign-up isn't available right now. Please try again later.");
  await verifyCaptcha(b.captchaToken, clientIp(req));
  await dropUnverifiedSignups(b.email);
  const passwordHash = await bcrypt.hash(b.password, 10);
  const { workspaceId, user } = await createWorkspace({ name: b.businessName, timezone: b.timezone, owner: { name: b.name, email: b.email, passwordHash } });
  await rememberPendingUser(user);
  const sent = await sendCode(user);
  return ok({ ok: true, workspaceId, home: sent === "failed" ? "/verify?failed=1" : "/verify" });
});
