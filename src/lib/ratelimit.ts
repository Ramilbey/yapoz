import { db } from "@/db";
import { sql } from "drizzle-orm";
import { log } from "./log";

/** Fixed-window counter in Postgres so limits hold across serverless instances. */
export async function hit(key: string, window: "minute" | "hour" | "day", limit: number): Promise<{ ok: boolean; count: number }> {
  try {
    const rows = await db.execute<{ count: number }>(sql`
      insert into rate_limits (key, window_start, count) values (${key}, date_trunc(${window}::text, now()), 1)
      on conflict (key) do update set
        count = case when rate_limits.window_start = excluded.window_start then rate_limits.count + 1 else 1 end,
        window_start = excluded.window_start
      returning count`);
    const count = Number(rows[0]?.count ?? 0);
    return { ok: count <= limit, count };
  } catch (err) {
    log.warn("ratelimit.check_failed", { err });
    return { ok: true, count: 1 };
  }
}
