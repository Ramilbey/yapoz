import { after } from "next/server";
import { db, t } from "@/db";
import { and, eq, lte, or, sql } from "drizzle-orm";

export type JobHandler = (payload: Record<string, unknown>, job: typeof t.jobs.$inferSelect) => Promise<void>;
export const MAX_ATTEMPTS = 3;
const handlers = new Map<string, () => Promise<JobHandler>>();

/** Handlers are registered lazily to keep webhook routes light. */
export function registerJob(type: string, load: () => Promise<JobHandler>) {
  handlers.set(type, load);
}

function schedule(fn: () => Promise<unknown>) {
  try {
    after(fn);
  } catch {
    // Outside a request (scripts, worker): run in the background.
    void fn();
  }
}

/** Insert a job and run it right after the response is sent. Duplicate dedupe keys are ignored. */
export async function enqueue(type: string, payload: Record<string, unknown>, opts: { dedupeKey?: string; workspaceId?: string; run?: "after" | "now" | "later" } = {}) {
  const rows = await db
    .insert(t.jobs)
    .values({ type, payload, dedupeKey: opts.dedupeKey ?? null, workspaceId: opts.workspaceId ?? null })
    .onConflictDoNothing()
    .returning({ id: t.jobs.id });
  const id = rows[0]?.id;
  if (!id) return null;
  if (opts.run === "now") await runJob(id);
  else if (opts.run !== "later") schedule(() => runJob(id));
  return id;
}

export async function runJob(id: string): Promise<boolean> {
  const [job] = await db
    .update(t.jobs)
    .set({ status: "running", attempts: sql`${t.jobs.attempts} + 1`, updatedAt: new Date() })
    .where(and(eq(t.jobs.id, id), eq(t.jobs.status, "queued")))
    .returning();
  if (!job) return false;
  const load = handlers.get(job.type) ?? (await import("./job-registry")).getHandler(job.type);
  try {
    if (!load) throw new Error(`No handler for job type ${job.type}`);
    const handler = await load();
    await handler(job.payload, job);
    await db.update(t.jobs).set({ status: "done", updatedAt: new Date(), lastError: null }).where(eq(t.jobs.id, id));
    return true;
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack ?? ""}`.slice(0, 2000) : String(e);
    console.error(`[job ${job.type}] failed:`, e);
    const failed = job.attempts >= MAX_ATTEMPTS;
    await db
      .update(t.jobs)
      .set({ status: failed ? "failed" : "queued", lastError: msg, runAfter: new Date(Date.now() + 15_000 * job.attempts), updatedAt: new Date() })
      .where(eq(t.jobs.id, id));
    return false;
  }
}

/** Retry queued jobs and reclaim ones stuck in "running" (e.g. the instance died). */
export async function sweepJobs(limit = 20) {
  await db
    .update(t.jobs)
    .set({ status: "queued" })
    .where(and(eq(t.jobs.status, "running"), lte(t.jobs.updatedAt, new Date(Date.now() - 5 * 60_000))));
  const due = await db
    .select({ id: t.jobs.id })
    .from(t.jobs)
    .where(and(eq(t.jobs.status, "queued"), or(lte(t.jobs.runAfter, new Date()))))
    .orderBy(t.jobs.createdAt)
    .limit(limit);
  let ran = 0;
  for (const j of due) if (await runJob(j.id)) ran++;
  return { due: due.length, ran };
}
