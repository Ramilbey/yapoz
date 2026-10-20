import { db } from "@/db";
import { sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { Site, type SiteStats } from "@/components/site/site";

export const dynamic = "force-dynamic";

async function stats(): Promise<SiteStats> {
  const days = 7;
  const base = { days, botUsername: env.telegramBotUsername || null, qrTarget: env.telegramBotUsername ? `https://t.me/${env.telegramBotUsername}` : "#ring" };
  try {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const rows = (await db.execute(sql`
      select channel::text as channel, count(*)::int as n, avg(case when is_demo then 1 else 0 end)::float as demo
      from agent_runs where workspace_id = ${env.demoWorkspaceId} and created_at >= ${since} and outcome <> 'error'
      group by 1`)) as unknown as { channel: string; n: number; demo: number }[];
    const total = rows.reduce((s, r) => s + r.n, 0);
    const demoShare = total ? rows.reduce((s, r) => s + r.demo * r.n, 0) / total : 0;
    return { ...base, channels: rows.map((r) => ({ channel: r.channel, n: r.n })), demoShare };
  } catch {
    return { ...base, channels: [], demoShare: 0 };
  }
}

export default async function Home() {
  return <Site stats={await stats()} />;
}
