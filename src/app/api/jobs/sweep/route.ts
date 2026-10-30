import { sweepJobs } from "@/lib/jobs";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { purgeExpired } from "@/lib/retention";
import { expireDueOrders } from "@/lib/stock";
import { sendDueReminders } from "@/lib/appointments";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Retries queued jobs, expires unpaid orders, sends booking reminders and applies each business's data retention. Call it
 * every few minutes (reminders and expiry are only as punctual as this) with Authorization: Bearer $CRON_SECRET.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!env.cronSecret || !safeEqual(auth, `Bearer ${env.cronSecret}`)) return new Response("unauthorized", { status: 401 });
  return Response.json({ ...(await sweepJobs()), expired: await expireDueOrders(), reminded: await sendDueReminders(), purged: await purgeExpired() });
}
