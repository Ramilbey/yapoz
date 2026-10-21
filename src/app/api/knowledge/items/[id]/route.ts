import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";

const Patch = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().toLowerCase().min(1).max(40).optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  body: z.string().trim().max(4000).optional(),
  available: z.boolean().optional(),
  availabilityNote: z.string().trim().max(200).nullable().optional(),
  active: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const b = await body(req, Patch);
  const [item] = await db
    .update(t.kbItems)
    .set({ ...b, updatedAt: new Date() })
    .where(and(eq(t.kbItems.id, id), eq(t.kbItems.workspaceId, s.workspaceId)))
    .returning();
  if (!item) throw new HttpError(404, "Not found");
  await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "kb.updated", props: { id, fields: Object.keys(b) } });
  return ok({ item });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  await db.delete(t.kbItems).where(and(eq(t.kbItems.id, id), eq(t.kbItems.workspaceId, s.workspaceId)));
  return ok({ ok: true });
});
