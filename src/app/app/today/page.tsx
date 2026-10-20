"use client";
import useSWR from "swr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { Columns, StackedColumns, BarList } from "@/components/app/charts";
import { Switch } from "@/components/ui/switch";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea, Label } from "@/components/ui/field";
import { useToast } from "@/components/app/toast";
import { cx } from "@/components/ui/cx";

type Today = {
  today: string;
  kpi: {
    handled: number; autoResolvedPct: number | null; escalated: number; medianFirstResponseMs: number | null; bookingsCreated: number;
    openEscalations: number; urgentEscalations: number; demoShare: number;
    yesterday: { handled: number; autoResolvedPct: number | null; medianFirstResponseMs: number | null };
  };
  topics: { topic: string; n: number; resolved: number }[];
  langs: { language: string; n: number }[];
  channels: { channel: string; n: number }[];
  sentiment: { day: string; positive: number; neutral: number; negative: number; total: number }[];
  hourly: number[];
  gaps: { id: string; key: string; question: string; count: number; last_asked_at: string; is_demo: boolean }[];
  hiring: { open_roles: number; candidates: number; shortlisted: number; invited: number; scheduled: number; approvals: number; next_interview: string | null };
  includeDemo: boolean;
  demoMode: boolean;
  demoTraffic: boolean;
  workspace: { name: string; timezone: string };
};

const LANG: Record<string, string> = { en: "English", ms: "Malay", zh: "Chinese", ta: "Tamil", ru: "Russian", uz: "Uzbek", ar: "Arabic", id: "Indonesian", unknown: "Not detected" };
const CH: Record<string, string> = { telegram: "Telegram", whatsapp: "WhatsApp", instagram: "Instagram", simulator: "Simulator" };

function secs(ms: number | null) {
  if (ms === null || ms === undefined) return "–";
  return ms < 10_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms / 1000)}s`;
}

export default function TodayPage() {
  const [includeDemo, setIncludeDemo] = useState(true);
  const toast = useToast();
  const { data, mutate } = useSWR<Today>(`/api/owner/today?demo=${includeDemo ? 1 : 0}`, getJson);
  useLive(["agent_runs", "escalations", "knowledge_gaps", "bookings", "outreach", "interviews", "matches"], () => mutate(), 600);
  const [gap, setGap] = useState<Today["gaps"][number] | null>(null);

  // Owner-only demo traffic: replays one seeded conversation every few seconds while this page is open.
  useEffect(() => {
    if (!data?.demoTraffic) return;
    const id = setInterval(() => void send("/api/demo/tick", "POST").catch(() => {}), 3500);
    return () => clearInterval(id);
  }, [data?.demoTraffic]);

  async function setTraffic(v: boolean) {
    try {
      await send("/api/settings", "PATCH", { demoTraffic: v });
      await mutate();
      toast(v ? "Demo traffic on: replaying seeded conversations." : "Demo traffic off.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const k = data?.kpi;
  const totalLang = data?.langs.reduce((s, l) => s + l.n, 0) ?? 0;
  const totalCh = data?.channels.reduce((s, l) => s + l.n, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title={<>Today at the counter</>}
        description={data ? `${data.workspace.name}, ${new Date(data.today + "T12:00:00").toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}. Every number below comes from logged events.` : "Loading…"}
        actions={
          data?.demoMode ? (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line px-4 py-2.5">
              <label className="flex items-center gap-2 text-[13px] text-fg-2">
                <Switch checked={includeDemo} onCheckedChange={setIncludeDemo} label="Include demo data" />
                Include demo data
              </label>
              <label className="flex items-center gap-2 text-[13px] text-fg-2">
                <Switch checked={Boolean(data?.demoTraffic)} onCheckedChange={setTraffic} label="Demo traffic" />
                Demo traffic
              </label>
            </div>
          ) : null
        }
      />

      {data?.demoTraffic || (includeDemo && (k?.demoShare ?? 0) > 0) ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-brass/50 bg-brass/10 px-4 py-2.5 text-[13px] text-fg">
          <Chip tone="brass">Demo mode</Chip>
          <span>
            {data?.demoTraffic ? "Replaying seeded conversations so the charts move. " : ""}
            {Math.round((k?.demoShare ?? 0) * 100)}% of today&apos;s messages are seeded demo data. Switch off “Include demo data” to see live traffic only.
          </span>
        </div>
      ) : null}

      <section aria-label="Key numbers" className="grid grid-cols-2 border-y border-line md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Messages handled" value={k ? String(k.handled) : "–"} delta={k ? diff(k.handled, k.yesterday.handled, "") : null} />
        <Kpi label="Auto-resolved" value={k?.autoResolvedPct != null ? `${k.autoResolvedPct}%` : "–"} delta={k && k.autoResolvedPct != null && k.yesterday.autoResolvedPct != null ? diff(k.autoResolvedPct, k.yesterday.autoResolvedPct, " pts") : null} />
        <Kpi label="Median first reply" value={secs(k?.medianFirstResponseMs ?? null)} delta={k?.yesterday.medianFirstResponseMs ? `yesterday ${secs(k.yesterday.medianFirstResponseMs)}` : null} />
        <Kpi label="Bookings created" value={k ? String(k.bookingsCreated) : "–"} delta="by the agent, today" />
        <Link href="/app/needs-you" className="group col-span-2 md:col-span-1">
          <Kpi label="Needs you" value={k ? String(k.openEscalations) : "–"} tone={k && k.openEscalations > 0 ? "signal" : undefined} delta={k ? (k.urgentEscalations ? `${k.urgentEscalations} high priority` : "open escalations") : null} />
        </Link>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <SectionTitle title="Messages by hour" sub="Today, local time" />
          {data ? <Columns values={data.hourly} labels={data.hourly.map((_, h) => (h % 3 === 0 ? `${h}` : ""))} tipLabel={(h) => `${String(h).padStart(2, "0")}:00–${String(h).padStart(2, "0")}:59`} format={(v) => `${v} message${v === 1 ? "" : "s"}`} /> : <Skeleton h={180} />}
        </section>

        <section className="lg:col-span-4">
          <SectionTitle title="Knowledge gaps" sub="Questions the agent couldn't answer this week" />
          {data ? (
            data.gaps.length ? (
              <ul className="divide-y divide-line border-y border-line">
                {data.gaps.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-[14px]">
                        <span className="num text-fg-2">asked {g.count}×</span> <span className="font-medium">{g.question}</span>
                      </div>
                      <div className="text-[12px] text-muted">{g.key}{g.is_demo ? ", includes demo data" : ""}</div>
                    </div>
                    <Button size="sm" variant="brass" onClick={() => setGap(g)}>
                      Add answer
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted">No gaps this week. When a customer asks something the agent can&apos;t find, it lands here.</p>
            )
          ) : (
            <Skeleton h={160} />
          )}
        </section>

        <section className="lg:col-span-6">
          <SectionTitle title="Top questions" sub="Last 7 days, by topic" />
          {data ? <BarList items={data.topics.map((t) => ({ label: t.topic, value: t.n, note: `${Math.round((t.resolved / Math.max(1, t.n)) * 100)}% resolved` }))} empty="No questions yet." /> : <Skeleton h={220} />}
        </section>
        <section className="lg:col-span-3">
          <SectionTitle title="Language mix" sub="Last 7 days" />
          {data ? <BarList items={data.langs.map((l) => ({ label: LANG[l.language] ?? l.language, value: l.n }))} total={totalLang} empty="No messages yet." /> : <Skeleton h={120} />}
        </section>
        <section className="lg:col-span-3">
          <SectionTitle title="Channels" sub="Last 7 days" />
          {data ? <BarList items={data.channels.map((c) => ({ label: CH[c.channel] ?? c.channel, value: c.n }))} total={totalCh} empty="No messages yet." /> : <Skeleton h={120} />}
        </section>

        <section className="lg:col-span-8">
          <SectionTitle title="Sentiment" sub="Customer messages per day, last 7 days" />
          {data ? (
            <StackedColumns
              rows={data.sentiment}
              labelOf={(r) => new Date(String(r.day) + "T12:00:00").toLocaleDateString("en-MY", { weekday: "short", day: "numeric" })}
              series={[
                { key: "positive", label: "Positive", color: "var(--brass-mark)" },
                { key: "neutral", label: "Neutral", color: "var(--neutral-mark)" },
                { key: "negative", label: "Negative", color: "var(--signal-mark)" },
              ]}
            />
          ) : (
            <Skeleton h={200} />
          )}
        </section>

        <section className="lg:col-span-4">
          <SectionTitle title="Hiring" sub="Pizza cook and other open roles" />
          {data ? (
            <dl className="grid grid-cols-2 border-t border-line">
              <Stat label="Open roles" value={data.hiring.open_roles} />
              <Stat label="Candidates" value={data.hiring.candidates} />
              <Stat label="Shortlisted" value={data.hiring.shortlisted} />
              <Stat label="Waiting for Approve" value={data.hiring.approvals} tone={data.hiring.approvals ? "brass" : undefined} />
              <Stat label="Invited" value={data.hiring.invited} />
              <Stat label="Interviews booked" value={data.hiring.scheduled} />
            </dl>
          ) : (
            <Skeleton h={160} />
          )}
          <Link href="/app/hiring" className="mt-4 inline-block text-[14px] text-brass-ink underline-offset-4 hover:underline">
            Open hiring
          </Link>
        </section>
      </div>

      <GapDialog gap={gap} onClose={() => setGap(null)} onSaved={() => (setGap(null), mutate(), toast("Answer added. The agent uses it from the next message."))} />
    </div>
  );
}

function diff(now: number, before: number, unit: string) {
  const d = now - before;
  if (!before && !now) return null;
  return `${d >= 0 ? "+" : "−"}${Math.abs(d)}${unit} vs yesterday`;
}

function Kpi({ label, value, delta, tone }: { label: string; value: string; delta?: string | null; tone?: "signal" }) {
  return (
    <div className="border-line px-4 py-5 [&:not(:first-child)]:border-l max-md:[&:nth-child(odd)]:border-l-0 max-md:border-b">
      <div className="text-[13px] text-muted">{label}</div>
      <div className={cx("num mt-1 text-[44px] font-medium leading-none tracking-[-0.04em]", tone === "signal" ? "text-signal-ink" : "text-fg")}>{value}</div>
      <div className="mt-2 h-4 text-[12px] text-muted">{delta ?? ""}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "brass" }) {
  return (
    <div className="border-b border-line py-3 pr-3 [&:nth-child(even)]:border-l [&:nth-child(even)]:pl-4">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className={cx("num text-[26px] leading-tight", tone === "brass" ? "text-brass-ink" : "")}>{value}</dd>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-[20px] font-bold leading-tight">{title}</h2>
      {sub ? <p className="text-[13px] text-muted">{sub}</p> : null}
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="animate-pulse rounded-lg bg-raised" style={{ height: h }} />;
}

function GapDialog({ gap, onClose, onSaved }: { gap: Today["gaps"][number] | null; onClose: () => void; onSaved: () => void }) {
  const [question, setQ] = useState("");
  const [answer, setA] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => {
    if (gap) {
      setQ(gap.question.replace(/\?*$/, "?"));
      setA("");
    }
  }, [gap]);
  async function save() {
    if (!gap) return;
    setBusy(true);
    try {
      await send(`/api/knowledge/gaps/${gap.id}`, "POST", { question, answer, category: "menu" });
      onSaved();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={Boolean(gap)} onOpenChange={(v) => !v && onClose()} title="Add an answer" description={gap ? `Customers asked about “${gap.key}” ${gap.count} times. Write the house answer once; it goes live immediately.` : undefined}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="gq">Question, the way customers ask it</Label>
          <Input id="gq" value={question} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ga" hint="Facts only: prices, sizes, days">Answer</Label>
          <Textarea id="ga" rows={4} value={answer} onChange={(e) => setA(e.target.value)} placeholder="e.g. Yes, a gluten-free base is available on Medium pizzas for RM 6 extra. It's made in the same kitchen, so it isn't suitable for coeliacs." />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} disabled={answer.trim().length < 2} onClick={save}>
            Publish answer
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
