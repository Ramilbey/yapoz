import { db, t } from "@/db";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { apiSession, handle } from "@/lib/auth";
import { ok } from "@/lib/api";
import { env } from "@/lib/env";
import { loadDraft } from "@/setup/draft";
import { setupChecks, setupSelling } from "@/setup/checks";
import { ensureOnboarding } from "@/lib/workspace";

export const dynamic = "force-dynamic";

/** Everything the setup wizard needs to resume where the owner left off. */
export const GET = handle(async () => {
  const s = await apiSession(["owner"]);
  const [row] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const ws = await ensureOnboarding(row);
  const sources = await db
    .select({ id: t.setupSources.id, kind: t.setupSources.kind, filename: t.setupSources.filename, mime: t.setupSources.mime, size: sql<number>`coalesce(octet_length(${t.setupSources.bytes}), 0)`, chars: sql<number>`length(${t.setupSources.text})`, text: t.setupSources.text, createdAt: t.setupSources.createdAt })
    .from(t.setupSources)
    .where(and(eq(t.setupSources.workspaceId, s.workspaceId), ne(t.setupSources.kind, "draft")))
    .orderBy(asc(t.setupSources.createdAt));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(t.kbItems).where(eq(t.kbItems.workspaceId, s.workspaceId));
  const selling = await setupSelling(ws, s.userId);
  const notes = sources.find((x) => x.kind === "notes")?.text ?? "";
  const website = sources.find((x) => x.kind === "website")?.filename ?? ws.settings.business.website ?? "";
  return ok({
    workspace: { id: ws.id, name: ws.name, city: ws.city, timezone: ws.timezone, currency: ws.currency, settings: ws.settings },
    notes,
    website,
    files: sources.filter((x) => x.kind === "file").map(({ text: _t, ...f }) => f),
    draft: await loadDraft(s.workspaceId),
    knowledgeCount: n,
    selling,
    checks: setupChecks(selling),
    ai: env.hasAnthropic,
  });
});
