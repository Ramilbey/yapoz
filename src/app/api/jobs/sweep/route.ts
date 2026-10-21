import { sweepJobs } from "@/lib/jobs";
import { purgeExpiredCandidates } from "@/lib/retention";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { refreshInstagramTokens } from "@/channels/instagram-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Retries queued jobs, purges expired CVs and refreshes Instagram tokens. Call from a cron with Authorization: Bearer $CRON_SECRET. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!env.cronSecret || !safeEqual(auth, `Bearer ${env.cronSecret}`)) return new Response("unauthorized", { status: 401 });
  const jobs = await sweepJobs();
  const purged = await purgeExpiredCandidates();
  const instagramTokensRefreshed = await refreshInstagramTokens();
  return Response.json({ ...jobs, purgedCandidates: purged, instagramTokensRefreshed });
}
