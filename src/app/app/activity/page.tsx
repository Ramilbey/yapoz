"use client";
import useSWRInfinite from "swr/infinite";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/shell";
import { getJson } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cx } from "@/components/ui/cx";

type Level = "info" | "good" | "warn" | "bad";
type Ev = { id: number; type: string; category: string | null; at: string; who: string; isDemo: boolean; text: string; level: Level; orderId: string | null; refCode: string | null; threadId: string | null };
type Page = { categories: { key: string; label: string }[]; next: number | null; events: Ev[] };

const MARK: Record<Level, { label: string; dot: string; text: string }> = {
  good: { label: "Good", dot: "bg-answered-ink", text: "" },
  warn: { label: "Warning", dot: "bg-brass", text: "" },
  bad: { label: "Problem", dot: "bg-signal", text: "text-signal-ink" },
  info: { label: "Info", dot: "bg-muted", text: "" },
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date();
  y.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return "Today";
  if (dayKey(d) === dayKey(y)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
}
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });

export default function ActivityPage() {
  return (
    <Suspense>
      <Activity />
    </Suspense>
  );
}

function Activity() {
  const router = useRouter();
  const params = useSearchParams();
  const order = params.get("order");
  const thread = params.get("thread");
  const [category, setCategory] = useState<string>(params.get("category") ?? "");
  const [routine, setRoutine] = useState(false);
  const [demo, setDemo] = useState(false);

  const qs = (before?: number | null) => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (routine) q.set("routine", "1");
    if (demo) q.set("demo", "1");
    if (order) q.set("order", order);
    if (thread) q.set("thread", thread);
    if (before) q.set("before", String(before));
    const s = q.toString();
    return `/api/activity${s ? `?${s}` : ""}`;
  };
  const { data, size, setSize, mutate, isLoading, isValidating, error } = useSWRInfinite<Page>(
    (i, prev) => (i === 0 ? qs() : prev && prev.next ? qs(prev.next) : null),
    getJson,
  );
  // Only the first page needs refreshing for new events (SWR revalidates just page one by default).
  useLive(["events"], (e) => { if (!e.demo || demo) void mutate(); }, 800);

  const pages = useMemo(() => data ?? [], [data]);
  const categories = pages[0]?.categories ?? [];
  const events = useMemo(() => pages.flatMap((p) => p.events), [pages]);
  const last = pages[pages.length - 1];
  const loadingMore = isValidating && size > pages.length;

  const groups = useMemo(() => {
    const out: { label: string; items: Ev[] }[] = [];
    for (const e of events) {
      const label = dayLabel(e.at);
      const g = out[out.length - 1];
      if (g && g.label === label) g.items.push(e);
      else out.push({ label, items: [e] });
    }
    return out;
  }, [events]);

  const pills = [{ key: "", label: "All" }, ...categories];

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Everything that happened, newest first: who confirmed or rejected each order, receipts and what they showed, messages that didn't reach customers, AI hand-overs, stock and setting changes."
      />
      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
        {pills.map((c) => (
          <button
            key={c.key || "all"}
            type="button"
            aria-pressed={category === c.key}
            onClick={() => setCategory(c.key)}
            className={cx("h-8 rounded-full border px-3.5 text-[13px]", category === c.key ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-fg-2">
        <label className="flex items-center gap-2">
          <Switch checked={routine} onCheckedChange={setRoutine} label="Show every message" />
          Show every message
        </label>
        <label className="flex items-center gap-2">
          <Switch checked={demo} onCheckedChange={setDemo} label="Include demo data" />
          Include demo data
        </label>
      </div>
      {order || thread ? (
        <p className="mb-5 text-[13px] text-muted">
          Showing one {order ? "order" : "chat"} ·{" "}
          <button type="button" className="underline hover:text-fg" onClick={() => router.replace("/app/activity")}>Show everything</button>
        </p>
      ) : null}

      {error && !data ? (
        <p className="text-signal-ink">Couldn&apos;t load the activity log. Try again in a moment.</p>
      ) : isLoading || !data ? (
        <p className="text-muted">Loading…</p>
      ) : events.length === 0 ? (
        <div className="max-w-[52ch] border-t border-line pt-8">
          <p className="font-display text-[24px] font-bold">Nothing here yet.</p>
          <p className="mt-2 text-[15px] text-muted">Orders, receipts, hand-overs and changes to your shop show up here as they happen.</p>
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <section key={g.label + g.items[0].id} className="mb-6">
              <h2 className="mb-1 text-[13px] font-medium text-muted">{g.label}</h2>
              <ul className="divide-y divide-line border-y border-line">
                {g.items.map((e) => {
                  const m = MARK[e.level];
                  return (
                    <li key={e.id} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-x-3 py-3 md:grid-cols-[4.5rem_minmax(0,1fr)] md:gap-x-4">
                      <span className="num pt-0.5 text-[12px] text-muted">{timeOf(e.at)}</span>
                      <div className="min-w-0">
                        <p className={cx("text-[15px] leading-snug break-words", m.text)}>
                          <span aria-hidden className={cx("mr-2 inline-block h-2 w-2 rounded-full align-middle", m.dot)} />
                          <span className="sr-only">{m.label}: </span>
                          <span className="font-medium">{e.who}</span> {e.text}
                        </p>
                        {e.orderId || e.threadId || e.isDemo ? (
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                            {e.orderId ? <Link href={`/app/orders?o=${e.orderId}`} className="num font-medium underline hover:text-fg-2">{e.refCode ?? "Order"}</Link> : null}
                            {e.threadId ? <Link href={`/app/inbox?t=${e.threadId}`} className="underline hover:text-fg-2">Open chat</Link> : null}
                            {e.isDemo ? <Chip>Sample</Chip> : null}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {last?.next ? (
            <Button variant="secondary" loading={loadingMore} onClick={() => setSize(size + 1)}>Load older</Button>
          ) : null}
        </>
      )}
    </div>
  );
}
