import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { channelOf } from "@/channels/connections";

export const dynamic = "force-dynamic";

export const DELETE = handle(async () => {
  const s = await apiSession(["owner"]);
  const ch = await channelOf(s.workspaceId, "instagram");
  const { accountId: _a, username: _u, ...rest } = ch.config;
  await db.update(t.channels).set({ credentialsEnc: null, config: rest }).where(eq(t.channels.id, ch.id));
  return ok({ ok: true });
});
