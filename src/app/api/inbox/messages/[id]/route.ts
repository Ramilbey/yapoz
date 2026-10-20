import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { sendExisting } from "@/agent/pipeline";

const Action = z.object({ action: z.enum(["approve", "discard"]), text: z.string().trim().min(1).max(4000).optional() });

/** Copilot: staff approves (optionally edits) or discards an AI draft. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const a = await body(req, Action);
  const [msg] = await db.select().from(t.messages).where(and(eq(t.messages.id, id), eq(t.messages.workspaceId, s.workspaceId)));
  if (!msg) throw new HttpError(404, "Message not found");
  if (msg.status !== "pending_approval") throw new HttpError(409, "This draft was already handled");
  if (a.action === "discard") {
    await db.update(t.messages).set({ status: "discarded" }).where(eq(t.messages.id, id));
    return ok({ ok: true });
  }
  const [thread] = await db.select().from(t.threads).where(eq(t.threads.id, msg.threadId));
  const text = a.text ?? msg.text;
  await db.update(t.messages).set({ authorUserId: s.userId, text }).where(eq(t.messages.id, id));
  const r = await sendExisting(thread, id, text);
  return ok(r);
});
