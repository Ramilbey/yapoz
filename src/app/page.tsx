import { db } from "@/db";
import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/env";
import { sampleWorkspaces } from "@/lib/samples";
import { Anybody, Familjen_Grotesk, Martian_Mono } from "next/font/google";
import { Site, type SiteStats } from "@/components/site/site";

// Anybody is a variable font with a width axis: expanded for headlines, squeezed and slanted for the accent word.
const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"], variable: "--font-anybody", display: "swap" });
const familjen = Familjen_Grotesk({ subsets: ["latin"], variable: "--font-familjen", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap" });

export const dynamic = "force-dynamic";

/** Live answer counts from the sample businesses, so the landing page shows real numbers. */
async function loadStats(): Promise<SiteStats> {
  const days = 7;
  const base = { days, botUsername: env.telegramBotUsername || null, demoWorkspaceId: env.demoWorkspaceId };
  try {
    const samples = await sampleWorkspaces();
    const ids = samples.map((s) => s.id);
    if (!ids.length) return { ...base, samples: [], channels: [], demoShare: 0 };
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const rows = (await db.execute(sql`
      select channel::text as channel, count(*)::int as n, avg(case when is_demo then 1 else 0 end)::float as demo
      from agent_runs where workspace_id in ${sql.raw(`(${ids.map((i) => `'${i.replace(/[^A-Z0-9]/g, "")}'`).join(",")})`)} and created_at >= ${since} and outcome <> 'error'
      group by 1`)) as unknown as { channel: string; n: number; demo: number }[];
    const total = rows.reduce((s, r) => s + r.n, 0);
    const demoShare = total ? rows.reduce((s, r) => s + r.demo * r.n, 0) / total : 0;
    return { ...base, samples, channels: rows.map((r) => ({ channel: r.channel, n: r.n })), demoShare };
  } catch {
    return { ...base, samples: [], channels: [], demoShare: 0 };
  }
}

/** The numbers move slowly, so a visit does not wait on the database: the answer is reused for a minute. */
const stats = unstable_cache(loadStats, ["landing-stats"], { revalidate: 60 });

export default async function Home() {
  return (
    <div className={`${anybody.variable} ${familjen.variable} ${martian.variable}`}>
      <Site stats={await stats()} />
    </div>
  );
}
