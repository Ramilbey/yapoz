import { z } from "zod";
import { apiSession, handle } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { importDraft } from "@/setup/import";
import { saveDraft } from "@/setup/draft";
import { Draft } from "@/setup/types";

export const dynamic = "force-dynamic";

/** Save the reviewed draft into Knowledge. replace=true clears what setup created before. */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const b = await body(req, z.object({ draft: Draft, replace: z.boolean().default(true) }));
  await saveDraft(s.workspaceId, b.draft);
  return ok(await importDraft(s.workspaceId, b.draft, { replace: b.replace }));
});
