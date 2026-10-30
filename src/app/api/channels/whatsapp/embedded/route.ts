import { z } from "zod";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { connectWhatsAppEmbedded } from "@/channels/connections";
import { MetaError } from "@/channels/meta";

export const dynamic = "force-dynamic";

const Connect = z.object({
  code: z.string().trim().min(10).max(2000).regex(/^\S+$/),
  phoneNumberId: z.string().trim().regex(/^\d{6,25}$/, "Meta didn't send the phone number ID. Finish every step in the popup."),
  wabaId: z.string().trim().regex(/^\d{6,25}$/, "Meta didn't send the WhatsApp Business Account ID. Finish every step in the popup."),
});

/** Finish Embedded Signup: the code from Meta's popup becomes the business's token, server-side. Owners only. */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  if (!(await hit(`connect:${s.workspaceId}`, "hour", 20)).ok) throw new HttpError(429, "Too many attempts. Try again in an hour.");
  const b = await body(req, Connect);
  try {
    return ok(await connectWhatsAppEmbedded(s.workspaceId, b));
  } catch (e) {
    if (e instanceof MetaError) throw new HttpError(e.status, e.message);
    throw e;
  }
});
