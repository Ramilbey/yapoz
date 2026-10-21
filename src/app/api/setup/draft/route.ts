import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { env } from "@/lib/env";
import { hit } from "@/lib/ratelimit";
import { generateDraft, saveDraft } from "@/setup/draft";
import { readWebsite } from "@/setup/website";
import { Draft, emptyDraft } from "@/setup/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Generate = z.object({ notes: z.string().max(20_000).default(""), website: z.string().trim().max(300).default("") });

async function upsertSource(workspaceId: string, kind: "notes" | "website", text: string, filename: string | null = null) {
  await db.delete(t.setupSources).where(and(eq(t.setupSources.workspaceId, workspaceId), eq(t.setupSources.kind, kind)));
  if (text.trim()) await db.insert(t.setupSources).values({ workspaceId, kind, filename, text });
}

/** Read everything the owner gave us and ask Claude for a draft. */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const b = await body(req, Generate);
  await upsertSource(s.workspaceId, "notes", b.notes);
  const warnings: string[] = [];
  if (b.website) {
    try {
      const site = await readWebsite(b.website);
      await upsertSource(s.workspaceId, "website", site.text, site.url);
    } catch (e) {
      warnings.push(`Couldn't read the website (${(e as Error).message}). The draft uses everything else.`);
      await upsertSource(s.workspaceId, "website", "");
    }
  } else await upsertSource(s.workspaceId, "website", "");

  if (!env.hasAnthropic) {
    const draft = emptyDraft();
    await saveDraft(s.workspaceId, draft);
    return ok({ draft, ai: false, warnings: [...warnings, "Claude isn't connected on this server (ANTHROPIC_API_KEY), so fill in the details by hand below."] });
  }
  if (!(await hit(`draft:${s.workspaceId}`, "day", 15)).ok) throw new HttpError(429, "That's a lot of drafts today. Edit this one by hand, or try again tomorrow.");
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const hasSomething = b.notes.trim().length > 20 || b.website || (await db.select({ id: t.setupSources.id }).from(t.setupSources).where(and(eq(t.setupSources.workspaceId, s.workspaceId), eq(t.setupSources.kind, "file"))).limit(1)).length;
  if (!hasSomething) throw new HttpError(400, "Tell us a bit about your business first, or upload your menu or price list.");
  const draft = await generateDraft(ws);
  await saveDraft(s.workspaceId, draft);
  return ok({ draft, ai: true, warnings });
});

/** Keep the owner's edits while they review. */
export const PATCH = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const b = await body(req, z.object({ draft: Draft }));
  await saveDraft(s.workspaceId, b.draft);
  return ok({ ok: true });
});
