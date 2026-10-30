import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { sendExisting } from "@/agent/pipeline";

const Action = z.object({ action: z.enum(["approve", "discard"]), text: z.string().trim().min(1).max(4000).optional() });

/**
 * Copilot: staff approves (optionally edits) or discards an AI draft. The draft is claimed in one update, so a double
 * click or two staff at once can't send it twice.
 */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Message not found");
  const a = await body(req, Action);
  const [msg] = await db.select().from(t.messages).where(and(eq(t.messages.id, id), eq(t.messages.workspaceId, s.workspaceId)));
  if (!msg) throw new HttpError(404, "Message not found");
  const text = a.text ?? msg.text;
  const [claimed] = await db
    .update(t.messages)
    .set(a.action === "discard" ? { status: "discarded" } : { status: "received", authorUserId: s.userId, text })
    .where(and(eq(t.messages.id, id), eq(t.messages.status, "pending_approval")))
    .returning({ id: t.messages.id });
  if (!claimed) throw new HttpError(409, "This draft was already handled");
  await db.insert(t.events).values({ workspaceId: s.workspaceId, type: a.action === "discard" ? "draft.discarded" : "draft.approved", props: { threadId: msg.threadId, by: s.userId, edited: Boolean(a.text && a.text !== msg.text) } });
  if (a.action === "discard") return ok({ ok: true });
  const [thread] = await db.select().from(t.threads).where(eq(t.threads.id, msg.threadId));
  return ok(await sendExisting(thread, id, text));
});
