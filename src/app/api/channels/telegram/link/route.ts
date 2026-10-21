import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { createLinkCode } from "@/channels/telegram/connect";

export const dynamic = "force-dynamic";

/** A one-time t.me link that proves to the shared bot which business this Telegram account runs. */
export const POST = handle(async () => {
  const s = await apiSession(["owner"]);
  if (!(await hit(`tglink:${s.workspaceId}`, "hour", 30)).ok) throw new HttpError(429, "Too many links. Try again in an hour.");
  try {
    return ok(await createLinkCode(s.workspaceId));
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
});
