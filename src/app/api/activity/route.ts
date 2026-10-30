import { and, desc, eq, inArray, lt, notInArray, or, sql, type SQL } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { CATEGORIES, OWNER_ONLY, ROUTINE, categoryOf, describe, type Category } from "@/lib/activity";

export const dynamic = "force-dynamic";

const PAGE = 60;

/** The Activity log, newest first, 60 at a time (?before=<id>). Filters: category, order, thread, routine, demo. */
export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner", "service"]);
  const u = new URL(req.url);
  const before = Number(u.searchParams.get("before") ?? 0);
  const category = u.searchParams.get("category") as Category | null;
  const orderId = u.searchParams.get("order");
  const threadId = u.searchParams.get("thread");
  const routine = u.searchParams.get("routine") === "1";
  const demo = u.searchParams.get("demo") === "1";
  const allowed = (Object.keys(CATEGORIES) as Category[]).filter((c) => s.role === "owner" || !OWNER_ONLY.includes(c));
  const cats = category && allowed.includes(category) ? [category] : allowed;
  const prefixes = cats.flatMap((c) => CATEGORIES[c].prefixes);

  const where: (SQL | undefined)[] = [
    eq(t.events.workspaceId, s.workspaceId),
    or(...prefixes.map((p) => sql`${t.events.type} like ${p + "%"}`)),
    before > 0 ? lt(t.events.id, before) : undefined,
    demo ? undefined : eq(t.events.isDemo, false),
    // Routine chatter stays out unless asked for, but an AI reply that failed is never routine.
    routine || orderId ? undefined : or(notInArray(t.events.type, ROUTINE), sql`${t.events.props}->>'outcome' = 'error'`, sql`${t.events.props}->>'status' = 'failed'`),
    orderId && /^[0-9a-f-]{36}$/.test(orderId) ? sql`${t.events.props}->>'orderId' = ${orderId}` : undefined,
    threadId && /^[0-9a-f-]{36}$/.test(threadId) ? sql`${t.events.props}->>'threadId' = ${threadId}` : undefined,
  ];
  const rows = await db.select().from(t.events).where(and(...where)).orderBy(desc(t.events.id)).limit(PAGE + 1);
  const page = rows.slice(0, PAGE);
  const actorIds = [...new Set(page.map((r) => r.props.by).filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/.test(x)))];
  const actors = actorIds.length ? await db.select({ id: t.users.id, name: t.users.name, role: t.users.role }).from(t.users).where(inArray(t.users.id, actorIds)) : [];
  const [ws] = await db.select({ currency: t.workspaces.currency, timezone: t.workspaces.timezone }).from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  return ok({
    categories: allowed.map((c) => ({ key: c, label: CATEGORIES[c].label })),
    next: rows.length > PAGE ? page[page.length - 1].id : null,
    events: page.map((r) => {
      const p = r.props;
      const actor = typeof p.by === "string" ? actors.find((a) => a.id === p.by) : undefined;
      // Who did it: a person, or the system on the customer's behalf.
      const who = actor ? actor.name : typeof p.by === "string" ? "Removed user" : r.type.startsWith("message.") || r.type.startsWith("receipt.received") || r.type === "order.created" || r.type === "order.attempt_failed" || r.type === "escalation.created" ? "Yapoz AI" : "System";
      return {
        id: r.id,
        type: r.type,
        category: categoryOf(r.type),
        at: r.createdAt,
        who,
        isDemo: r.isDemo,
        ...describe(r.type, p, ws?.currency ?? "MYR", ws?.timezone),
        orderId: typeof p.orderId === "string" ? p.orderId : null,
        refCode: typeof p.refCode === "string" ? p.refCode : null,
        threadId: typeof p.threadId === "string" ? p.threadId : null,
      };
    }),
  });
});
