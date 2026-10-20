"use client";
import useSWR from "swr";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cx } from "@/components/ui/cx";

type Cal = {
  from: string; timezone: string; workday: { start: string; end: string };
  events: { id: string; title: string; kind: string; startsAt: string; endsAt: string; interviewId: string | null }[];
  interviews: { id: string; startsAt: string; endsAt: string; mode: string; meetUrl: string | null; status: string; candidateName: string; role: string; provider: string }[];
  holds: { start: string; end: string; name: string }[];
  google: { configured: boolean; connected: boolean };
};

const START = 9;
const END = 19;
const HOUR_PX = 56;

function addDays(d: string, n: number) {
  const x = new Date(d + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}
function localParts(iso: string, tz: string) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, minutes: Number(g("hour")) * 60 + Number(g("minute")) };
}

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarInner />
    </Suspense>
  );
}

function CalendarInner() {
  const toast = useToast();
  const params = useSearchParams();
  const [from, setFrom] = useState<string | null>(null);
  const { data, mutate } = useSWR<Cal>(`/api/hiring/calendar${from ? `?from=${from}` : ""}`, getJson);
  useLive(["interviews", "calendar_events", "outreach"], () => mutate(), 200);
  const days = useMemo(() => (data ? Array.from({ length: 7 }, (_, i) => addDays(data.from, i)) : []), [data]);
  const googleMsg = params.get("google");

  async function setStatus(id: string, status: "done" | "cancelled") {
    try {
      await send(`/api/hiring/interviews/${id}`, "POST", { status });
      await mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const place = (startIso: string, endIso: string) => {
    if (!data) return null;
    const a = localParts(startIso, data.timezone);
    const b = localParts(endIso, data.timezone);
    const top = ((a.minutes - START * 60) / 60) * HOUR_PX;
    const height = Math.max(18, ((b.minutes - a.minutes) / 60) * HOUR_PX - 2);
    return { day: a.date, top, height, time: `${String(Math.floor(a.minutes / 60)).padStart(2, "0")}:${String(a.minutes % 60).padStart(2, "0")}` };
  };

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="HR's week. Jawab only offers times that are free here; held slots stay blocked until the candidate picks one."
        actions={
          <>
            {data?.google.connected ? <Chip tone="answered">Google Calendar connected</Chip> : data?.google.configured ? <a href="/api/integrations/google/start" className="inline-flex h-10 items-center rounded-[10px] border border-line-strong px-4 text-sm hover:bg-raised">Connect Google Calendar</a> : <Chip>Built-in calendar</Chip>}
            <Button variant="secondary" onClick={() => data && setFrom(addDays(data.from, -7))}>Previous week</Button>
            <Button variant="secondary" onClick={() => data && setFrom(addDays(data.from, 7))}>Next week</Button>
          </>
        }
      />
      {googleMsg === "connected" ? <p className="mb-4 text-[14px] text-answered-ink">Google Calendar connected. New interviews get a Google event (and a Meet link for video).</p> : null}
      {googleMsg === "error" ? <p className="mb-4 text-[14px] text-signal-ink">Google didn&apos;t connect: {params.get("reason")}</p> : null}
      {!data ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-4 text-[12px] text-fg-2">
            <span className="flex items-center gap-1.5"><span className="hatch h-3 w-5 rounded-sm border border-line" /> Busy</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border border-dashed border-brass" /> Offered to a candidate</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm bg-brass" /> Interview booked</span>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-8 sm:px-8">
            <div className="grid min-w-[980px] grid-cols-[52px_repeat(7,1fr)] border border-line">
              <div className="border-b border-line bg-panel" />
              {days.map((d) => (
                <div key={d} className="border-b border-l border-line bg-panel px-2 py-2 text-[13px]">
                  {new Date(d + "T12:00:00").toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}
                </div>
              ))}
              <div className="relative" style={{ height: (END - START) * HOUR_PX }}>
                {Array.from({ length: END - START }, (_, i) => (
                  <span key={i} className="num absolute right-2 text-[11px] text-muted" style={{ top: i * HOUR_PX + 2 }}>{START + i}:00</span>
                ))}
              </div>
              {days.map((d) => (
                <div key={d} className="relative border-l border-line" style={{ height: (END - START) * HOUR_PX }}>
                  {Array.from({ length: END - START }, (_, i) => (
                    <div key={i} className="absolute inset-x-0 border-t border-line/60" style={{ top: i * HOUR_PX }} />
                  ))}
                  {data.events.filter((e) => e.kind === "busy").map((e) => {
                    const p = place(e.startsAt, e.endsAt);
                    if (!p || p.day !== d) return null;
                    return (
                      <div key={e.id} className="hatch absolute inset-x-1 rounded-md border border-line px-1.5 py-1 text-[11px] text-fg-2" style={{ top: p.top, height: p.height }}>
                        <span className="rounded bg-bg/80 px-1">{e.title}</span>
                      </div>
                    );
                  })}
                  {data.holds.map((h, i) => {
                    const p = place(h.start, h.end);
                    if (!p || p.day !== d) return null;
                    return (
                      <div key={i} className="absolute inset-x-1 rounded-md border border-dashed border-brass bg-brass/5 px-1.5 py-1 text-[11px]" style={{ top: p.top, height: p.height }}>
                        <span className="num">{p.time}</span> {h.name.split(" ")[0]}
                      </div>
                    );
                  })}
                  {data.interviews.filter((iv) => iv.status !== "cancelled").map((iv) => {
                    const p = place(iv.startsAt, iv.endsAt);
                    if (!p || p.day !== d) return null;
                    return (
                      <div key={iv.id} className={cx("row-new absolute inset-x-1 overflow-hidden rounded-md px-1.5 py-1 text-[11px] text-ink", iv.status === "done" ? "bg-brass/50" : "bg-brass")} style={{ top: p.top, minHeight: p.height }} title={`${iv.candidateName}, ${iv.role}`}>
                        <div className="font-medium"><span className="num">{p.time}</span> {iv.candidateName}</div>
                        <div>{iv.mode === "video" ? "Video" : "In person"}{iv.provider === "google" ? ", Google" : ""}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <section className="mt-10">
            <h2 className="font-display mb-3 text-[20px] font-bold">This week&apos;s interviews</h2>
            {data.interviews.length ? (
              <ul className="divide-y divide-line border-y border-line">
                {data.interviews.map((iv) => (
                  <li key={iv.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[14px]">
                    <span>
                      <span className="font-medium">{iv.candidateName}</span> <span className="text-muted">for {iv.role},</span>{" "}
                      <span className="num">{new Date(iv.startsAt).toLocaleString("en-MY", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                      {iv.meetUrl ? <a href={iv.meetUrl} target="_blank" rel="noreferrer" className="ml-2 text-brass-ink hover:underline">join link</a> : null}
                    </span>
                    {iv.status === "scheduled" ? (
                      <span className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setStatus(iv.id, "done")}>Mark interviewed</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus(iv.id, "cancelled")}>Cancel</Button>
                      </span>
                    ) : (
                      <Chip>{iv.status}</Chip>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted">No interviews this week yet. They appear the moment a candidate taps a time.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
