import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { rankRequisition, AVAILABILITY } from "@/hiring/rank";

export const maxDuration = 120;

const Criteria = z.object({
  criteria: z.object({
    role: z.string().min(1).max(80),
    skills: z.array(z.object({ name: z.string().min(1).max(60), minYears: z.number().min(0).max(40).optional(), required: z.boolean() })).max(8),
    availability: z.array(z.enum(AVAILABILITY)).max(7),
    near: z.object({ district: z.string().min(1).max(60), maxKm: z.number().min(1).max(100) }).nullable().optional(),
    languages: z.array(z.string().max(30)).max(6),
    minTotalYears: z.number().min(0).max(40).nullable().optional(),
    ignored: z.array(z.string().max(120)).max(10).default([]),
  }),
});

/** Re-rank after HR edits the criteria chips. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "hr"]);
  const { id } = await ctx.params;
  const { criteria } = await body(req, Criteria);
  const [r] = await db.select().from(t.requisitions).where(and(eq(t.requisitions.id, id), eq(t.requisitions.workspaceId, s.workspaceId)));
  if (!r) throw new HttpError(404, "Not found");
  const result = await rankRequisition(s.workspaceId, id, { ...criteria, near: criteria.near ?? null, minTotalYears: criteria.minTotalYears ?? null });
  return ok(result);
});
