import { z } from "zod";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { hit } from "@/lib/ratelimit";
import { MetaError, removeMetaApp, saveMetaApp } from "@/channels/meta";
import { clearWebhookIssue, whatsappDependsOnMetaApp } from "@/channels/connections";

export const dynamic = "force-dynamic";

const Save = z.object({
  appId: z.string().trim().regex(/^\d{8,20}$/, "App ID is the number at the top of App settings → Basic"),
  appSecret: z.string().trim().regex(/^[0-9a-f]{32}$/i, "App secret is the 32-character value in App settings → Basic (press Show)"),
});

/** The business's own Meta app, for a manually connected WhatsApp number. Meta confirms the App ID and App secret belong together before they're saved. */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  if (!(await hit(`connect:${s.workspaceId}`, "hour", 20)).ok) throw new HttpError(429, "Too many attempts. Try again in an hour.");
  const b = await body(req, Save);
  try {
    const { appName } = await saveMetaApp(s.workspaceId, s.userId, b.appId, b.appSecret);
    await clearWebhookIssue(s.workspaceId);
    return ok({ appId: b.appId, appName });
  } catch (e) {
    if (e instanceof MetaError) throw new HttpError(e.status, e.message);
    throw e;
  }
});

export const DELETE = handle(async () => {
  const s = await apiSession(["owner"]);
  if (await whatsappDependsOnMetaApp(s.workspaceId)) throw new HttpError(409, "Disconnect WhatsApp first: its messages are checked with this app's secret.");
  await removeMetaApp(s.workspaceId);
  await audit(s, "channel.meta_app_removed");
  return ok({ ok: true });
});
