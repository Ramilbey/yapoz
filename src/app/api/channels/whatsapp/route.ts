import { z } from "zod";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { connectWhatsApp, disconnectWhatsApp } from "@/channels/connections";
import { MetaError } from "@/channels/meta";

export const dynamic = "force-dynamic";

const Connect = z.object({
  phoneNumberId: z.string().trim().regex(/^\d{6,25}$/, "Phone number ID is the long number from WhatsApp → API Setup, not the phone number itself"),
  wabaId: z.string().trim().regex(/^\d{6,25}$/, "WhatsApp Business Account ID is the long number from WhatsApp → API Setup"),
  accessToken: z.string().trim().min(20, "Paste the whole access token").max(1000).regex(/^\S+$/, "The access token has no spaces"),
});

/**
 * Connect a WhatsApp number to the business's Meta app (saved first, in the Meta app box). Meta checks the token, the number
 * and the Business Account before anything is stored; the answer carries the callback URL and verify token for Meta's webhook settings.
 */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  if (!(await hit(`connect:${s.workspaceId}`, "hour", 20)).ok) throw new HttpError(429, "Too many attempts. Try again in an hour.");
  const b = await body(req, Connect);
  try {
    return ok(await connectWhatsApp(s.workspaceId, b));
  } catch (e) {
    if (e instanceof MetaError) throw new HttpError(e.status, e.message);
    throw e;
  }
});

/** Disconnect the number. The verify token is kept, so reconnecting doesn't break Meta's webhook settings. */
export const DELETE = handle(async () => {
  const s = await apiSession(["owner"]);
  await disconnectWhatsApp(s.workspaceId);
  return ok({ ok: true });
});
