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
import { Card } from "@/components/ui/card";
import { useCountUp } from "@/components/app/motion";
import { Input, Textarea, Label } from "@/components/ui/field";
import { useToast } from "@/components/app/toast";
import { cx } from "@/components/ui/cx";
import type { AppointmentView } from "@/lib/appointment-types";
import type { BenefitSet } from "@/lib/benefit";

type Today = {
  today: string;
  kpi: {
    handled: number; autoResolvedPct: number | null; escalated: number; medianFirstResponseMs: number | null; ordersCreated: number; aiFailures: number;
    openEscalations: number; urgentEscalations: number; demoShare: number;
    yesterday: { handled: number; autoResolvedPct: number | null; medianFirstResponseMs: number | null };
  };
  topics: { topic: string; n: number; resolved: number }[];
  langs: { language: string; n: number }[];
  channels: { channel: string; n: number }[];
  sentiment: { day: string; positive: number; neutral: number; negative: number; total: number }[];
  hourly: number[];
  gaps: { id: string; key: string; question: string; count: number; last_asked_at: string; is_demo: boolean }[];
  appointments?: AppointmentView[];
  pending: { id: string; ref_code: string; customer_name: string; total_minor: number; currency: string; created_at: string; receipts: number; last_verdict: string | null }[];
  models: { model: string; n: number }[];
  includeDemo: boolean;
  demoMode: boolean;
  demoTraffic: boolean;
  live: boolean;
  setupDone: boolean;
  workspace: { name: string; timezone: string };
};

const LANG: Record<string, string> = { en: "English", ms: "Malay", zh: "Chinese", ta: "Tamil", ru: "Russian", uz: "Uzbek", ar: "Arabic", id: "Indonesian", unknown: "Not detected" };
const CH: Record<string, string> = { telegram: "Telegram", whatsapp: "WhatsApp", simulator: "Simulator" };
const VERDICT: Record<string, string> = { consistent: "receipt looks consistent", review: "receipt needs a look", mismatch: "receipt doesn't add up", unreadable: "receipt unreadable" };

function money(minor: number, currency: string) {
  const major = minor / 100;
  return currency === "MYR" ? `RM ${Number.isInteger(major) ? major : major.toFixed(2)}` : new Intl.NumberFormat("en", { style: "currency", currency }).format(major);
}

/** Shown until a real channel has traffic; `tested` = there are simulator messages already. */
function GettingStarted({ live, setupDone, tested }: { live: boolean; setupDone: boolean; tested: boolean }) {
  const steps = [
    { done: setupDone, title: "Teach it your business", body: "Describe what you sell, upload your menu or price list, and check the draft.", href: "/app/setup", cta: setupDone ? "Edit in Knowledge" : "Continue setup", alt: "/app/knowledge" },
    { done: false, title: "Connect your chats", body: "WhatsApp and Telegram, from Settings → Channels.", href: "/app/settings#channels", cta: "Connect" },
    { done: live, title: "Go live", body: live ? "Customers on connected channels get answers right away." : "Until then it only answers in the simulator.", href: "/app/settings#assistant", cta: live ? "Live" : "Go live" },
    { done: false, title: "Bring in your team", body: "Give service staff the orders queue and the inbox.", href: "/app/settings#team", cta: "Invite" },
  ];
  return (
    <Card className="mb-8">
      <h2 className="font-display text-[22px] font-bold">{tested ? "Only test messages so far" : "No customer messages yet"}</h2>
      <p className="mt-1 text-[14px] text-muted">
        {tested ? "The numbers below come from your simulator tests. Real customers show up here once your chats are connected and you're live:" : "Numbers fill in as customers message you on your channels (simulator tests count too). Meanwhile:"}
      </p>
      <ol className="mt-5 grid gap-5 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="border-t-2 pt-3" style={{ borderColor: s.done ? "var(--fg)" : "var(--line)" }}>
            <span className="num text-[12px] text-muted">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-0.5 text-[15px] font-medium">{s.title}</p>
            <p className="mt-1 text-[13px] text-fg-2">{s.body}</p>
            <Link href={s.done && s.alt ? s.alt : s.href} className="mt-2 inline-block text-[13px] font-medium text-accent underline-offset-4 hover:underline">
              {s.done && s.alt ? s.cta : s.cta}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

type StockRow = { itemId: string; itemTitle: string; variantId: string; name: string; usualQty: number | null; override: number | null; qty: number | null; held: number; sold: number; left: number | null; on: boolean };
type Stock = {
  date: string; today: string; days: string[];
  daily: StockRow[];
  low: { itemId: string; itemTitle: string; variantId: string; name: string; left: number; threshold: number }[];
};

function dayLabel(d: string, today: string) {
  if (d === today) return "Today";
  const next = new Date(today + "T12:00:00");
  next.setDate(next.getDate() + 1);
  if (d === next.toLocaleDateString("sv-SE")) return "Tomorrow";
  return new Date(d + "T12:00:00").toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
}

const putStock = (body: { variantId: string; date: string; qty: number | null }) => send("/api/stock/daily", "PUT", body);

function StockQty({ row, date, onSaved }: { row: StockRow; date: string; onSaved: () => void }) {
  const toast = useToast();
  const [val, setVal] = useState(row.override !== null ? String(row.override) : "");
  useEffect(() => setVal(row.override !== null ? String(row.override) : ""), [row.override]);
  async function save(qty: number | null) {
    try {
      await putStock({ variantId: row.variantId, date, qty });
      onSaved();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  function commit() {
    const t = val.trim();
    const n = t === "" ? null : Math.max(0, Math.floor(Number(t)));
    if (n !== null && !Number.isFinite(n)) return setVal(row.override !== null ? String(row.override) : "");
    if (n !== row.override) void save(n);
  }
  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="number" min={0} inputMode="numeric" value={val} placeholder={row.usualQty !== null ? String(row.usualQty) : "–"}
        aria-label={`Quantity for ${row.itemTitle} ${row.name}`}
        onChange={(e) => setVal(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="num h-8 w-16 rounded-lg border border-line bg-transparent px-2 text-right text-[14px]"
      />
      {row.override !== null ? (
        <button type="button" onClick={() => void save(null)} className="text-[12px] text-muted underline-offset-4 hover:underline">Reset</button>
      ) : null}
    </div>
  );
}

function StockCards() {
  const [date, setDate] = useState<string | null>(null);
  const { data, mutate } = useSWR<Stock>(`/api/stock${date ? `?date=${date}` : ""}`, getJson);
  useLive(["stock_holds", "daily_stock", "kb_variants"], () => mutate(), 600);
  if (!data) return null;
  const shown = data.date;
  return (
    <>
      {data.daily.length > 0 ? (
        <section className="panel mt-6 p-5" aria-label="Stock">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[20px] font-bold">{shown === data.today ? "Today's stock" : `Stock for ${dayLabel(shown, data.today)}`}</h2>
              <p className="text-[13px] text-muted">Leave “Today” empty to use the usual amount.</p>
            </div>
            {data.days.length > 1 ? (
              <label className="flex items-center gap-2 text-[13px] text-fg-2">
                Plan ahead
                <select value={shown} onChange={(e) => setDate(e.target.value === data.today ? null : e.target.value)} className="h-8 rounded-lg border border-line bg-transparent px-2 text-[14px] text-fg">
                  {data.days.map((d) => <option key={d} value={d}>{dayLabel(d, data.today)}</option>)}
                </select>
              </label>
            ) : null}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-line text-left text-[12px] font-normal text-muted">
                  <th className="py-2 pr-3 font-normal">Item</th>
                  <th className="px-3 text-right font-normal">Usual</th>
                  <th className="px-3 text-right font-normal">{shown === data.today ? "Today" : "That day"}</th>
                  <th className="px-3 text-right font-normal">Held</th>
                  <th className="px-3 text-right font-normal">Sold</th>
                  <th className="pl-3 text-right font-normal">Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.daily.map((r) => (
                  <tr key={r.variantId}>
                    <td className="py-2 pr-3"><span className="font-medium">{r.itemTitle}</span>{r.name && r.name !== r.itemTitle ? <span className="text-fg-2">, {r.name}</span> : null}</td>
                    <td className="num px-3 text-right text-fg-2">{r.usualQty ?? "–"}</td>
                    <td className="px-3">{r.on ? <StockQty row={r} date={shown} onSaved={() => void mutate()} /> : <div className="text-right text-muted">Off</div>}</td>
                    <td className="num px-3 text-right text-fg-2">{r.held}</td>
                    <td className="num px-3 text-right text-fg-2">{r.sold}</td>
                    <td className="pl-3 text-right">
                      {!r.on ? <span className="text-muted">Off</span> : r.left === 0 ? <Chip tone="signal">Sold out</Chip> : <span className="num font-medium">{r.left ?? "–"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {data.low.length > 0 ? (
        <section className="panel mt-6 border-accent! p-5" aria-label="Low stock">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-[20px] font-bold">Low stock</h2>
            <Link href="/app/knowledge" className="text-[14px] font-medium text-accent underline-offset-4 hover:underline">Update in Knowledge</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {data.low.map((l) => (
              <li key={l.variantId} className="py-2.5 text-[14px]">
                {l.left === 0 ? "Out of stock: " : `Only ${l.left} left of `}
                <span className="font-medium">{l.name && l.name !== l.itemTitle ? `${l.itemTitle}, ${l.name}` : l.itemTitle}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/** Owner-only: anyone else gets a 403 from the API, so nothing shows. */
function BenefitPanel({ includeDemo }: { includeDemo: boolean }) {
  const { data, mutate } = useSWR<{ sets: BenefitSet[] }>(`/api/owner/benefit?demo=${includeDemo ? 1 : 0}`, getJson, { shouldRetryOnError: false });
  useLive(["orders", "order_receipts"], () => mutate(), 2000);
  if (!data) return null;
  return (
    <section className="panel mt-6 p-5" aria-label="Measured benefit">
      <SectionTitle title="Measured benefit" sub="How much checking Yapoz saves you on each order, compared with the goals we set. Worked out from your recorded orders and receipts. Only you can see this." />
      <div className="space-y-5">
        {data.sets.map((set) => (
          <div key={set.kind}>
            <h3 className="mb-1 flex items-center gap-2 text-[14px] font-medium">
              {set.kind === "real" ? set.label : <><Chip tone="brass">{set.label}</Chip> {set.note}</>}
            </h3>
            {set.measured ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[12px] text-muted">
                      <th className="py-2 pr-3 font-normal">Measure</th>
                      <th className="px-3 text-right font-normal">Baseline</th>
                      <th className="px-3 text-right font-normal">Target</th>
                      <th className="px-3 text-right font-normal">Measured</th>
                      <th className="px-3 font-normal">Counted</th>
                      <th className="pl-3 text-right font-normal">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {set.rows.map((r) => (
                      <tr key={r.label}>
                        <td className="py-2 pr-3 font-medium">{r.label}</td>
                        <td className="num px-3 text-right text-fg-2">{r.baseline ?? "–"}</td>
                        <td className="num px-3 text-right text-fg-2 whitespace-nowrap">{r.target}</td>
                        <td className="num px-3 text-right font-medium">{r.measured ?? "No data yet"}</td>
                        <td className="px-3 text-fg-2">{r.counted}</td>
                        <td className="pl-3 text-right">{r.met === null ? <Chip>No data yet</Chip> : r.met ? <Chip tone="answered">Target met</Chip> : <Chip tone="signal">Target not met</Chip>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h4 className="mb-1 mt-5 text-[13px] font-medium">Decisions and replies</h4>
                <p className="mb-1 text-[12px] text-muted">No baseline or target for these yet, so they are shown as plain numbers.</p>
                <table className="w-full text-[14px]">
                  <tbody className="divide-y divide-line">
                    {set.outcomes.map((r) => (
                      <tr key={r.label}>
                        <td className="py-2 pr-3 font-medium">{r.label}</td>
                        <td className="num px-3 text-right font-medium">{r.measured ?? "No data yet"}</td>
                        <td className="pl-3 text-fg-2">{r.counted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[14px] text-muted">No data yet. This fills in once orders are placed and decided.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function secs(ms: number | null) {
  if (ms === null || ms === undefined) return "–";
  return ms < 10_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms / 1000)}s`;
}

export default function TodayPage() {
  const [includeDemo, setIncludeDemo] = useState(true);
  const toast = useToast();
  const { data, mutate } = useSWR<Today>(`/api/owner/today?demo=${includeDemo ? 1 : 0}`, getJson);
  useLive(["agent_runs", "escalations", "knowledge_gaps", "orders", "order_receipts", "appointments"], () => mutate(), 600);
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
        eyebrow={data ? `${data.workspace.name} · ${new Date(data.today + "T12:00:00").toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}` : undefined}
        title="Today at the counter"
        accent="counter"
        description={data ? "Every number below comes from logged events. Yapoz answered the chats; the decisions are waiting for you." : "Loading…"}
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

      {data && !data.demoMode && data.channels.every((c) => c.channel === "simulator") ? <GettingStarted live={data.live} setupDone={data.setupDone} tested={data.channels.length > 0} /> : null}

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Messages handled" value={k ? k.handled : null} delta={k ? diff(k.handled, k.yesterday.handled, "") : null} delay={0} />
        <Kpi label="Auto-resolved" value={k?.autoResolvedPct ?? null} fmt={(n) => `${Math.round(n)}%`} delta={k && k.autoResolvedPct != null && k.yesterday.autoResolvedPct != null ? diff(k.autoResolvedPct, k.yesterday.autoResolvedPct, " pts") : null} delay={90} />
        <Kpi label="Median first reply" value={k?.medianFirstResponseMs ?? null} fmt={secs} delta={k?.yesterday.medianFirstResponseMs ? `yesterday ${secs(k.yesterday.medianFirstResponseMs)}` : null} delay={180} />
        <Link href="/app/orders" className="group block">
          <Kpi label="Waiting for approval" value={data ? data.pending.length : null} hot={Boolean(data?.pending.length)} delta={k ? `${k.ordersCreated} order${k.ordersCreated === 1 ? "" : "s"} taken today` : null} delay={270} />
        </Link>
        <Link href="/app/needs-you" className="group col-span-2 block md:col-span-1">
          <Kpi label="Needs you" value={k ? k.openEscalations : null} hot={Boolean(k && k.openEscalations > 0)} delta={k ? (k.urgentEscalations ? `${k.urgentEscalations} high priority` : "open escalations") : null} delay={360} />
        </Link>
      </section>

      {data?.pending.length ? (
        <section className="panel mt-6 border-accent! p-5" aria-label="Orders waiting for approval">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-[20px] font-bold">Orders waiting for you</h2>
            <Link href="/app/orders" className="text-[14px] font-medium text-accent underline-offset-4 hover:underline">Review and approve</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {data.pending.map((o) => (
              <li key={o.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 text-[14px]">
                <Link href={`/app/orders?o=${o.id}`} className="num font-semibold underline-offset-4 hover:underline">{o.ref_code}</Link>
                <span>{o.customer_name}</span>
                <span className="num text-fg-2">{money(o.total_minor, o.currency)}</span>
                <span className="text-muted">{o.receipts ? VERDICT[o.last_verdict ?? ""] ?? "receipt sent" : "no receipt yet"}</span>
                <span className="num ml-auto text-[12px] text-muted">{new Date(o.created_at).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data?.appointments?.length ? (
        <section className="panel mt-6 p-5" aria-label="Today's appointments">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-[20px] font-bold">Today&apos;s appointments</h2>
            <Link href="/app/calendar" className="text-[14px] font-medium text-accent underline-offset-4 hover:underline">Open calendar</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {data.appointments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[14px]">
                <span className="num w-16 font-semibold">{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: data.workspace.timezone }).format(new Date(a.startsAt)).replace(" ", "").toLowerCase()}</span>
                <span className="font-medium">{a.service}</span>
                <span>{a.customerName}</span>
                {a.staffName ? <span className="text-fg-2">with {a.staffName}</span> : null}
                <span className="ml-auto">{a.status === "pending" ? <Chip tone="brass">Waiting for approval</Chip> : a.status === "completed" ? <Chip tone="answered">Done</Chip> : <Chip tone="answered">Confirmed</Chip>}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <BenefitPanel includeDemo={includeDemo} />

      <StockCards />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="panel p-6 lg:col-span-8">
          <SectionTitle title="Messages by hour" sub="Today, local time" />
          {data ? <Columns values={data.hourly} labels={data.hourly.map((_, h) => (h % 3 === 0 ? `${h}` : ""))} tipLabel={(h) => `${String(h).padStart(2, "0")}:00–${String(h).padStart(2, "0")}:59`} format={(v) => `${v} message${v === 1 ? "" : "s"}`} /> : <Skeleton h={180} />}
        </section>

        <section className="panel p-6 lg:col-span-4">
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

        <section className="panel p-6 lg:col-span-6">
          <SectionTitle title="Top questions" sub="Last 7 days, by topic" />
          {data ? <BarList items={data.topics.map((t) => ({ label: t.topic, value: t.n, note: `${Math.round((t.resolved / Math.max(1, t.n)) * 100)}% resolved` }))} empty="No questions yet." /> : <Skeleton h={220} />}
        </section>
        <section className="panel p-6 lg:col-span-3">
          <SectionTitle title="Language mix" sub="Last 7 days" />
          {data ? <BarList items={data.langs.map((l) => ({ label: LANG[l.language] ?? l.language, value: l.n }))} total={totalLang} empty="No messages yet." /> : <Skeleton h={120} />}
        </section>
        <section className="panel p-6 lg:col-span-3">
          <SectionTitle title="Channels" sub="Last 7 days" />
          {data ? <BarList items={data.channels.map((c) => ({ label: CH[c.channel] ?? c.channel, value: c.n }))} total={totalCh} empty="No messages yet." /> : <Skeleton h={120} />}
        </section>

        <section className="panel p-6 lg:col-span-8">
          <SectionTitle title="Sentiment" sub="Customer messages per day, last 7 days" />
          {data ? (
            <StackedColumns
              rows={data.sentiment}
              labelOf={(r) => new Date(String(r.day) + "T12:00:00").toLocaleDateString("en-MY", { weekday: "short", day: "numeric" })}
              series={[
                { key: "positive", label: "Positive", color: "var(--positive-mark)" },
                { key: "neutral", label: "Neutral", color: "var(--neutral-mark)" },
                { key: "negative", label: "Negative", color: "var(--signal-mark)" },
              ]}
            />
          ) : (
            <Skeleton h={200} />
          )}
        </section>

        <section className="panel p-6 lg:col-span-4">
          <SectionTitle title="AI today" sub="Which models wrote the replies" />
          {data ? (
            <>
              <BarList items={data.models.map((m) => ({ label: m.model === "none" ? "No AI configured" : m.model, value: m.n }))} empty="No replies yet." />
              <p className={cx("mt-3 text-[13px]", k?.aiFailures ? "text-signal-ink" : "text-muted")}>
                {k?.aiFailures ? `${k.aiFailures} message${k.aiFailures === 1 ? "" : "s"} got the holding reply because every AI provider failed. Each one is in Needs you.` : "No AI failures today."}
              </p>
            </>
          ) : (
            <Skeleton h={160} />
          )}
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

/** One headline number: counts up on load and on live updates. `hot` fills the card with the accent (needs a person). */
function Kpi({ label, value, fmt = (n) => String(Math.round(n)), delta, hot, delay = 0 }: { label: string; value: number | null; fmt?: (n: number) => string; delta?: string | null; hot?: boolean; delay?: number }) {
  const shown = useCountUp(value);
  return (
    <Card as="div" hot={hot} className="k-fade h-full px-5 pb-[18px] pt-5 transition-transform duration-300 group-hover:-translate-y-0.5 hover:-translate-y-0.5" style={{ "--d": 400 + delay } as React.CSSProperties}>
      <div className="flex items-center justify-between text-[13px] text-muted">
        {label}
        {hot ? <span className="ping" aria-hidden /> : null}
      </div>
      <div className="num mt-2 text-[44px] font-medium leading-none tracking-[-0.05em]">{shown === null ? "–" : fmt(shown)}</div>
      <div className="mt-3 h-4 text-[12.5px] text-muted">{delta ?? ""}</div>
    </Card>
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
      await send(`/api/knowledge/gaps/${gap.id}`, "POST", { question, answer, category: "general" });
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
          <Textarea id="ga" rows={4} value={answer} onChange={(e) => setA(e.target.value)} placeholder="The answer you'd give at the counter, in your own words." />
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
