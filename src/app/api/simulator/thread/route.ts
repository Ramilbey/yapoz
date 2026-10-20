import { db, t } from "@/db";
import { and, asc, eq, ne } from "drizzle-orm";
import { handle, getSession } from "@/lib/auth";
import { ok } from "@/lib/api";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Messages for one simulator session (so staff replies during takeover show up in the phone). */
export const GET = handle(async (req: Request) => {
  const u = new URL(req.url);
  const sessionId = u.searchParams.get("sessionId") ?? "";
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(sessionId)) return ok({ messages: [] });
  const session = await getSession();
  const workspaceId = session?.workspaceId ?? env.demoWorkspaceId;
  const [thread] = await db.select().from(t.threads).where(and(eq(t.threads.workspaceId, workspaceId), eq(t.threads.channel, "simulator"), eq(t.threads.externalThreadId, `sim:${sessionId}`)));
  if (!thread) return ok({ messages: [], aiPaused: false });
  const msgs = await db
    .select({ id: t.messages.id, direction: t.messages.direction, author: t.messages.author, text: t.messages.text, status: t.messages.status, createdAt: t.messages.createdAt })
    .from(t.messages)
    .where(and(eq(t.messages.threadId, thread.id), ne(t.messages.status, "discarded"), ne(t.messages.status, "pending_approval")))
    .orderBy(asc(t.messages.createdAt));
  return ok({ messages: msgs, aiPaused: thread.aiPaused, status: thread.status });
});
