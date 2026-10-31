// One line in the Activity log for something a person did: who, what, and the few facts needed to understand it later.
import { db, t } from "@/db";
import { log } from "./log";

export async function audit(s: { workspaceId: string; userId: string | null }, type: string, props: Record<string, unknown> = {}, isDemo = false) {
  await db
    .insert(t.events)
    .values({ workspaceId: s.workspaceId, type, props: { ...props, by: s.userId }, isDemo })
    .catch((e) => log.error("audit.log_failed", { workspaceId: s.workspaceId, type, err: e }));
}
