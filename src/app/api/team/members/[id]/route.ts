import { z } from "zod";
import { db, t } from "@/db";
import { and, eq, ne } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";

async function otherOwners(workspaceId: string, userId: string) {
  return db.select({ id: t.users.id }).from(t.users).where(and(eq(t.users.workspaceId, workspaceId), eq(t.users.role, "owner"), ne(t.users.id, userId)));
}

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner"]);
  const { id } = await ctx.params;
  const b = await body(req, z.object({ role: z.enum(["owner", "service", "hr"]) }));
  if (b.role !== "owner" && !(await otherOwners(s.workspaceId, id)).length) throw new HttpError(400, "A business needs at least one owner.");
  const r = await db.update(t.users).set({ role: b.role }).where(and(eq(t.users.id, id), eq(t.users.workspaceId, s.workspaceId))).returning({ id: t.users.id });
  if (!r.length) throw new HttpError(404, "Not found");
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner"]);
  const { id } = await ctx.params;
  if (id === s.userId) throw new HttpError(400, "You can't remove yourself.");
  const [u] = await db.select().from(t.users).where(and(eq(t.users.id, id), eq(t.users.workspaceId, s.workspaceId)));
  if (!u) throw new HttpError(404, "Not found");
  if (u.role === "owner" && !(await otherOwners(s.workspaceId, id)).length) throw new HttpError(400, "A business needs at least one owner.");
  await db.delete(t.users).where(eq(t.users.id, id));
  return ok({ ok: true });
});
