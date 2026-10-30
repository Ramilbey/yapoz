import { z } from "zod";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { hit } from "@/lib/ratelimit";
import { connectOwnBot, disconnectOwnBot, unlinkBusinessConnection } from "@/channels/telegram/connect";

export const dynamic = "force-dynamic";

const Connect = z.object({ token: z.string().min(20).max(200) });

/** Connect the business's own bot (token from @BotFather). */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  if (!(await hit(`connect:${s.workspaceId}`, "hour", 20)).ok) throw new HttpError(429, "Too many attempts. Try again in an hour.");
  const b = await body(req, Connect);
  try {
    return ok(await connectOwnBot(s.workspaceId, b.token));
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
});

/** Disconnect the own bot, or one Telegram Business connection (?connection=<id>). */
export const DELETE = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const connection = new URL(req.url).searchParams.get("connection");
  if (connection) await unlinkBusinessConnection(s.workspaceId, connection);
  else await disconnectOwnBot(s.workspaceId);
  await audit(s, "channel.disconnected", connection ? { channel: "telegram", kind: "business_connection" } : { channel: "telegram" });
  return ok({ ok: true });
});
