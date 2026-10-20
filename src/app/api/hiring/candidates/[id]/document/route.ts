import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "hr"]);
  const { id } = await ctx.params;
  const [d] = await db.select().from(t.candidateDocuments).where(and(eq(t.candidateDocuments.candidateId, id), eq(t.candidateDocuments.workspaceId, s.workspaceId))).limit(1);
  if (!d) throw new HttpError(404, "No document");
  return new Response(new Uint8Array(d.bytes), { headers: { "content-type": d.mime, "content-disposition": `inline; filename="${d.filename.replace(/"/g, "")}"`, "cache-control": "private, no-store" } });
});
