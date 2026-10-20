import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { deriveCriteria, rankRequisition } from "@/hiring/rank";

export const maxDuration = 120;

const Body = z.object({ request: z.string().trim().min(3).max(600) });

/** Plain-language request → explicit criteria (editable chips) → SQL filter → ranked with evidence. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "hr"]);
  const { id } = await ctx.params;
  const b = await body(req, Body);
  const [r] = await db.select().from(t.requisitions).where(and(eq(t.requisitions.id, id), eq(t.requisitions.workspaceId, s.workspaceId)));
  if (!r) throw new HttpError(404, "Not found");
  const started = Date.now();
  const { criteria, fairnessNotice } = await deriveCriteria(b.request, r.title);
  await db.update(t.requisitions).set({ rawRequest: b.request, criteria, fairnessNotice }).where(eq(t.requisitions.id, id));
  const result = await rankRequisition(s.workspaceId, id, criteria);
  await db.insert(t.events).values({ workspaceId: s.workspaceId, type: "hiring.ranked", props: { requisitionId: id, ms: Date.now() - started, ranked: result.ranked.length } });
  return ok({ criteria, fairnessNotice, ...result, ms: Date.now() - started });
});
