"use client";
import useSWR from "swr";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { ChannelMark, Chip } from "@/components/ui/chip";
import { cx } from "@/components/ui/cx";

type Booking = { id: string; customerName: string; partySize: number; startsAt: string; endsAt: string; refCode: string; status: string; channel: string | null; notes: string | null; isDemo: boolean; createdAt: string; bookingTypeId: string | null; serviceName: string | null };
type BType = { id: string; key: string; name: string; unit: "party" | "appointment" | "day"; capacity: number; durationMinutes: number };
type Data = { bookings: Booking[]; from: string; days: number; timezone: string; types: BType[] };

const act = "rounded px-0.5 text-fg-2 underline-offset-2 hover:text-fg hover:underline disabled:opacity-50";
const ARRIVED: Record<BType["unit"], string> = { party: "Seated", appointment: "Arrived", day: "Checked in" };

function ymd(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function describe(t: BType) {
  if (t.unit === "party") return `${t.name}: ${t.capacity} people per time slot, each booking held ${t.durationMinutes} min`;
  if (t.unit === "appointment") return `${t.name}: ${t.capacity} at the same time, ${t.durationMinutes} min unless the service says otherwise`;
  return `${t.name}: ${t.capacity} available per day`;
}

export default function BookingsPage() {
  const toast = useToast();
  const { data, mutate } = useSWR<Data>("/api/bookings?days=7", getJson);
  useLive(["bookings"], () => mutate(), 200);
  const [busy, setBusy] = useState<string | null>(null);
  const [only, setOnly] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const fresh = useMemo(() => {
    const ids = new Set((data?.bookings ?? []).map((b) => b.id));
    const prev = seen.current;
    seen.current = ids;
    return prev ? new Set([...ids].filter((x) => !prev.has(x))) : new Set<string>();
  }, [data]);

  const typeOf = useMemo(() => new Map((data?.types ?? []).map((t) => [t.id, t])), [data]);
  const days = useMemo(() => {
    if (!data) return [];
    const tz = data.timezone;
    const out: { date: string; label: string; items: Booking[]; people: number }[] = [];
    const [y, m, d0] = data.from.split("-").map(Number);
    for (let i = 0; i < data.days; i++) {
      const d = new Date(Date.UTC(y, m - 1, d0 + i, 12));
      const key = d.toISOString().slice(0, 10);
      const items = data.bookings.filter((b) => ymd(new Date(b.startsAt), tz) === key && (!only || b.bookingTypeId === only));
      out.push({ date: key, label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }), items, people: items.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.partySize, 0) });
    }
    return out;
  }, [data, only]);

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

  const single = data?.types.length === 1 ? data.types[0] : null;
  return (
    <div>
      <PageHeader title="Bookings" description="The next seven days. Bookings made in chat appear here the moment the customer confirms." />
      {!data ? (
        <p className="text-muted">Loading…</p>
      ) : !data.types.length && !data.bookings.length ? (
        <p className="max-w-[60ch] text-[15px] text-muted">
          You don&apos;t take bookings in chat yet. Add a way to book (tables, appointments or day bookings) in{" "}
          <a href="/app/knowledge" className="underline decoration-brass underline-offset-4">Knowledge → Bookings</a>.
        </p>
      ) : (
        <>
          {data.types.length > 1 ? (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {[null, ...data.types].map((t) => (
                <button key={t?.id ?? "all"} onClick={() => setOnly(t?.id ?? null)} className={cx("h-8 rounded-full border px-3.5 text-[13px]", only === (t?.id ?? null) ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}>
                  {t?.name ?? "All"}
                </button>
              ))}
            </div>
          ) : null}
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-8 sm:px-8">
            <div className="grid min-w-[1100px] grid-cols-7 gap-px border border-line bg-line">
              {days.map((d) => (
                <section key={d.date} className="min-h-[420px] bg-bg">
                  <header className="sticky top-0 border-b border-line bg-panel px-3 py-2.5">
                    <div className="text-[14px] font-medium">{d.label}</div>
                    <div className="num text-[12px] text-muted">
                      {d.items.length ? `${d.items.length} booking${d.items.length > 1 ? "s" : ""}${single?.unit === "party" || (!single && d.people > d.items.length) ? `, ${d.people} people` : ""}` : "No bookings"}
                    </div>
                  </header>
                  <ul className="space-y-1.5 p-2">
                    {d.items.map((b) => {
                      const t = b.bookingTypeId ? typeOf.get(b.bookingTypeId) : single;
                      return (
                        <li key={b.id} className={cx("rounded-lg border border-line bg-raised px-2.5 py-2", fresh.has(b.id) && "row-new", b.status === "cancelled" && "opacity-45", b.channel && !b.isDemo && "border-brass/60")}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="num text-[13px] font-medium">{t?.unit === "day" ? "All day" : new Date(b.startsAt).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", timeZone: data.timezone })}</span>
                            <span className="num text-[12px] text-fg-2">{t?.unit === "party" || (!t && b.partySize > 1) ? `${b.partySize} ppl` : t?.unit === "day" && b.partySize > 1 ? `×${b.partySize}` : null}</span>
                          </div>
                          <div className="truncate text-[13px]">{b.customerName}</div>
                          {b.serviceName ? <div className="truncate text-[12px] text-fg-2">{b.serviceName}</div> : null}
                          {data.types.length > 1 && t ? <div className="text-[11px] text-muted">{t.name}</div> : null}
                          <div className="mt-1 flex items-center justify-between gap-1">
                            <span className="num text-[11px] text-muted">{b.refCode}</span>
                            {b.channel ? <ChannelMark channel={b.channel} showLabel={false} /> : <span className="text-[11px] text-muted">phone</span>}
                          </div>
                          {b.notes ? <div className="mt-1 text-[11px] text-muted">{b.notes}</div> : null}
                          {b.status !== "confirmed" ? <Chip className="mt-1.5">{b.status === "seated" ? ARRIVED[t?.unit ?? "party"].toLowerCase() : b.status.replace("_", " ")}</Chip> : null}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
                            {b.status === "confirmed" ? (
                              <>
                                <button className={act} disabled={busy === b.id} onClick={() => setStatus(b.id, "seated")}>
                                  {ARRIVED[t?.unit ?? "party"]}
                                </button>
                                <button className={act} disabled={busy === b.id} onClick={() => setStatus(b.id, "no_show")}>
                                  No-show
                                </button>
                                <button className={act} disabled={busy === b.id} onClick={() => setStatus(b.id, "cancelled")}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button className={act} disabled={busy === b.id} onClick={() => setStatus(b.id, "confirmed")}>
                                Undo
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-muted">
              Highlighted cards came in through chat. {data.types.map(describe).join(". ")}.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
