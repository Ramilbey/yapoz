import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { isPushEndpoint } from "@/lib/alert-prefs";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";

const endpoint = z.string().max(1000).refine(isPushEndpoint, "That isn't a browser push address.");
const Subscribe = z.object({ endpoint, keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }) });
const Unsubscribe = z.object({ endpoint });

/** Each device registers itself. A shared device belongs to whoever turned notifications on last. */
export const POST = handle(async (req: Request) => {
  const s = await apiSession();
  const b = await body(req, Subscribe);
  const row = { workspaceId: s.workspaceId, userId: s.userId, p256dh: b.keys.p256dh, auth: b.keys.auth };
  await db.insert(t.pushSubscriptions).values({ endpoint: b.endpoint, ...row }).onConflictDoUpdate({ target: t.pushSubscriptions.endpoint, set: row });
  return ok({ ok: true });
});

export const DELETE = handle(async (req: Request) => {
  const s = await apiSession();
  const b = await body(req, Unsubscribe);
  await db.delete(t.pushSubscriptions).where(and(eq(t.pushSubscriptions.endpoint, b.endpoint), eq(t.pushSubscriptions.userId, s.userId)));
  return ok({ ok: true });
});
