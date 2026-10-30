// For self-hosting (e.g. an Ubuntu server): retries queued jobs, expires unpaid orders and sends booking reminders.
// On Vercel, call GET /api/jobs/sweep from a cron with Authorization: Bearer $CRON_SECRET instead.
import "./env";
import { sweepJobs } from "@/lib/jobs";
import { purgeExpired } from "@/lib/retention";
import { expireDueOrders } from "@/lib/stock";
import { sendDueReminders } from "@/lib/appointments";

console.log("Yapoz worker running.");
let lastPurge = 0;
for (;;) {
  try {
    const r = await sweepJobs();
    if (r.ran) console.log(`ran ${r.ran} job(s)`);
    const expired = await expireDueOrders();
    if (expired) console.log(`expired ${expired} unpaid order(s)`);
    const reminded = await sendDueReminders();
    if (reminded) console.log(`sent ${reminded} booking reminder(s)`);
    if (Date.now() - lastPurge > 3600_000) {
      const p = await purgeExpired();
      if (p.threads || p.receipts) console.log(`retention: deleted ${p.threads} chat(s), ${p.receipts} receipt file(s)`);
      lastPurge = Date.now();
    }
  } catch (e) {
    console.error("worker error:", e);
  }
  await new Promise((r) => setTimeout(r, 5000));
}
