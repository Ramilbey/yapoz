// For self-hosting (e.g. an Ubuntu server): retries queued jobs and applies resume retention.
// On Vercel, call GET /api/jobs/sweep from a cron with Authorization: Bearer $CRON_SECRET instead.
import "./env";
import { sweepJobs } from "@/lib/jobs";
import { purgeExpiredCandidates } from "@/lib/retention";

console.log("Jawab worker running.");
let lastPurge = 0;
for (;;) {
  try {
    const r = await sweepJobs();
    if (r.ran) console.log(`ran ${r.ran} job(s)`);
    if (Date.now() - lastPurge > 3600_000) {
      const n = await purgeExpiredCandidates();
      if (n) console.log(`retention: deleted ${n} candidate(s)`);
      lastPurge = Date.now();
    }
  } catch (e) {
    console.error("worker error:", e);
  }
  await new Promise((r) => setTimeout(r, 5000));
}
