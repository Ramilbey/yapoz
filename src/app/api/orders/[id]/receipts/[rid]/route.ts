import { and, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The receipt file a customer sent, for the owner and service desk of the same business. Never cached or sniffed. */
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string; rid: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id, rid } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f-]{36}$/.test(rid)) throw new HttpError(404, "Receipt not found.");
  const [r] = await db
    .select({ bytes: t.orderReceipts.bytes, mime: t.orderReceipts.mime })
    .from(t.orderReceipts)
    .where(and(eq(t.orderReceipts.id, rid), eq(t.orderReceipts.orderId, id), eq(t.orderReceipts.workspaceId, s.workspaceId)));
  if (!r) throw new HttpError(404, "Receipt not found.");
  return new Response(new Uint8Array(r.bytes), {
    headers: {
      "content-type": r.mime,
      "content-disposition": "inline",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; img-src data:; sandbox",
    },
  });
});
