"use client";
import useSWR from "swr";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { ChannelMark, Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";

type Booking = { id: string; customerName: string; partySize: number; startsAt: string; endsAt: string; refCode: string; status: string; channel: string | null; notes: string | null; isDemo: boolean; createdAt: string };

function ymd(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export default function BookingsPage() {
  const toast = useToast();
  const { data, mutate } = useSWR<{ bookings: Booking[]; from: string; days: number; timezone: string; seatsPerSlot: number }>("/api/bookings?days=7", getJson);
  useLive(["bookings"], () => mutate(), 200);
  const [busy, setBusy] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const fresh = useMemo(() => {
    const ids = new Set((data?.bookings ?? []).map((b) => b.id));
    const prev = seen.current;
    seen.current = ids;
    return prev ? new Set([...ids].filter((x) => !prev.has(x))) : new Set<string>();
  }, [data]);

  const days = useMemo(() => {
    if (!data) return [];
    const tz = data.timezone;
    const out: { date: string; label: string; items: Booking[]; covers: number }[] = [];
    for (let i = 0; i < data.days; i++) {
      const d = new Date(new Date(data.from + "T12:00:00+08:00").getTime() + i * 86400000);
      const key = ymd(d, tz);
      const items = data.bookings.filter((b) => ymd(new Date(b.startsAt), tz) === key);
      out.push({ date: key, label: d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", timeZone: tz }), items, covers: items.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.partySize, 0) });
    }
    return out;
  }, [data]);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      await send(`/api/bookings/${id}`, "PATCH", { status });
      await mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title="Bookings" description="Tables for the next seven days. Bookings made by the agent appear here the moment the customer confirms." />
      {!data ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-8 sm:px-8">
          <div className="grid min-w-[1100px] grid-cols-7 gap-px border border-line bg-line">
            {days.map((d) => (
              <section key={d.date} className="min-h-[420px] bg-bg">
                <header className="sticky top-0 border-b border-line bg-panel px-3 py-2.5">
                  <div className="text-[14px] font-medium">{d.label}</div>
                  <div className="num text-[12px] text-muted">{d.items.length ? `${d.items.length} tables, ${d.covers} covers` : "No bookings"}</div>
                </header>
                <ul className="space-y-1.5 p-2">
                  {d.items.map((b) => (
                    <li key={b.id} className={cx("rounded-lg border border-line bg-raised px-2.5 py-2", fresh.has(b.id) && "row-new", b.status === "cancelled" && "opacity-45", b.channel && !b.isDemo && "border-brass/60")}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="num text-[13px] font-medium">{new Date(b.startsAt).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit", timeZone: data.timezone })}</span>
                        <span className="num text-[12px] text-fg-2">{b.partySize} ppl</span>
                      </div>
                      <div className="truncate text-[13px]">{b.customerName}</div>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="num text-[11px] text-muted">{b.refCode}</span>
                        {b.channel ? <ChannelMark channel={b.channel} showLabel={false} /> : <span className="text-[11px] text-muted">phone</span>}
                      </div>
                      {b.notes ? <div className="mt-1 text-[11px] text-muted">{b.notes}</div> : null}
                      {b.status !== "confirmed" ? <Chip className="mt-1.5">{b.status.replace("_", " ")}</Chip> : null}
                      <div className="mt-1.5 flex gap-1">
                        {b.status === "confirmed" ? (
                          <>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" loading={busy === b.id} onClick={() => setStatus(b.id, "seated")}>Seated</Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" onClick={() => setStatus(b.id, "no_show")}>No-show</Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" onClick={() => setStatus(b.id, "cancelled")}>Cancel</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" onClick={() => setStatus(b.id, "confirmed")}>Undo</Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-muted">Highlighted cards came in through chat. Capacity is {data.seatsPerSlot} seated covers per 30-minute slot; each table is held for 90 minutes.</p>
        </div>
      )}
    </div>
  );
}
