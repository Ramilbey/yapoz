import { z } from "zod";
import { db, t } from "@/db";
import { sql } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await apiSession(["owner", "hr"]);
  const rows = await db.execute(sql`
    select r.*, 
      (select count(*)::int from matches m where m.requisition_id = r.id) as candidates,
      (select count(*)::int from matches m where m.requisition_id = r.id and m.stage = 'shortlisted') as shortlisted,
      (select count(*)::int from matches m where m.requisition_id = r.id and m.stage in ('invited','scheduled')) as in_progress,
      (select count(*)::int from matches m where m.requisition_id = r.id and m.stage = 'hired') as hired
    from requisitions r where r.workspace_id = ${s.workspaceId} order by r.created_at desc`);
  return ok({ requisitions: rows });
});

const Create = z.object({ title: z.string().trim().min(2).max(80), description: z.string().trim().max(2000).default("") });

export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner", "hr"]);
  const b = await body(req, Create);
  const [r] = await db.insert(t.requisitions).values({ workspaceId: s.workspaceId, title: b.title, description: b.description, createdBy: s.userId }).returning();
  // Every consented candidate in the pool is considered for a new role.
  await db.execute(sql`insert into matches (workspace_id, requisition_id, candidate_id, stage)
    select ${s.workspaceId}, ${r.id}, c.id, 'sourced' from candidates c where c.workspace_id = ${s.workspaceId} and c.consent on conflict do nothing`);
  return ok({ requisition: r });
});
