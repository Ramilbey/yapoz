"use client";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cx } from "@/components/ui/cx";
import { addLocalDays, localDate, localWeekday, WEEKDAYS, zoned } from "@/lib/time";
import type { AppointmentView, Attendance, CalendarResponse, StaffResponse } from "@/lib/appointment-types";
import { TeamAvailability } from "./team";

type View = "day" | "week" | "team";

const ATTENDANCE: [Attendance, string][] = [["present", "Present"], ["late", "Late"], ["no_show", "No-show"]];
const ATTENDED: Record<Attendance, string> = { present: "Attended", late: "Came late", no_show: "No-show" };
const stamp = (iso: string, timezone: string, pattern: string) => format(new Date(iso), pattern, { in: tz(timezone) });

function statusChip(a: AppointmentView) {
  if (a.status === "pending") return a.taken ? <Chip tone="brass">Waiting for approval</Chip> : <Chip>Payment window ran out</Chip>;
  if (a.status === "completed") return <Chip tone={a.attendance === "no_show" ? "signal" : "answered"}>{a.attendance ? ATTENDED[a.attendance] : "Completed"}</Chip>;
  if (a.status === "cancelled" || a.status === "expired") return <Chip>{a.status === "cancelled" ? "Cancelled" : "Expired"}</Chip>;
  return <Chip tone="answered">Confirmed</Chip>;
}

/** One booking: when, what, who, and the attendance buttons once the start has passed. */
function Booking({ a, timezone, nowMs, onChanged, showStaff }: { a: AppointmentView; timezone: string; nowMs: number; onChanged: () => void; showStaff: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState<Attendance | null>(null);
  const started = new Date(a.startsAt).getTime() <= nowMs;
  const canMark = started && (a.status === "confirmed" || a.status === "ready" || a.status === "completed");
  const faded = a.status === "cancelled" || a.status === "expired" || (a.status === "pending" && !a.taken);

  async function mark(attendance: Attendance) {
    setBusy(attendance);
    try {
      await send(`/api/appointments/${a.id}`, "PATCH", { attendance });
      onChanged();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cx("rounded-xl border border-line bg-bg p-3 text-[13px]", faded && "opacity-55")}>
      <p className="num font-medium">{stamp(a.startsAt, timezone, "h:mmaaa")}–{stamp(a.endsAt, timezone, "h:mmaaa")}</p>
      <p className="mt-0.5 text-[13.5px]">{a.service}</p>
      <p className="text-fg-2">{a.customerName} · <span className="num">{a.refCode}</span></p>
      {showStaff && a.staffName ? <p className="text-muted">with {a.staffName}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {statusChip(a)}
        <Chip>{a.inPerson ? "In person" : "Online"}</Chip>
      </div>
      {!a.inPerson && a.meetLink ? <a href={a.meetLink} target="_blank" rel="noreferrer" className="mt-1.5 block truncate underline">Meeting link</a> : null}
      {a.status === "pending" && a.taken ? <Link href="/app/orders" className="mt-1.5 block underline">Review in Orders</Link> : null}
      {canMark ? (
        <div className="mt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {ATTENDANCE.map(([k, label]) => (
              <Button key={k} size="sm" variant={a.attendance === k ? "brass" : "secondary"} loading={busy === k} disabled={busy !== null} onClick={() => mark(k)}>{label}</Button>
            ))}
          </div>
          {a.attendance && a.attendanceByName ? <p className="mt-1 text-[12px] text-muted">Marked by {a.attendanceByName}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<View>("week");
  const [anchorSet, setAnchorSet] = useState<string | null>(null);
  const [who, setWho] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  // First load has no dates: the API answers with this week, and its `now` tells us today in the business's timezone.
  const [first, setFirst] = useState<CalendarResponse | null>(null);
  const anchor = anchorSet ?? (first ? localDate(new Date(first.now), first.timezone) : null);
  const timezone = first?.timezone ?? "UTC";
  let from = anchor;
  let to = anchor;
  if (anchor && view === "week") {
    const idx = (WEEKDAYS.indexOf(localWeekday(zoned(anchor, "12:00", timezone), timezone)) + 6) % 7;
    from = addLocalDays(anchor, -idx);
    to = addLocalDays(from, 6);
  }
  const key = from && to ? `/api/appointments?from=${from}&to=${to}` : "/api/appointments";
  const { data, error, mutate } = useSWR<CalendarResponse>(view === "team" ? null : key, getJson, {
    keepPreviousData: true,
    onSuccess: (d) => setFirst((f) => f ?? d),
  });
  const staffKey = view === "team" ? "/api/staff" : null;
  const { data: team, error: teamError, mutate: mutateTeam } = useSWR<StaffResponse>(staffKey, getJson);
  useLive(["appointments", "orders", "staff"], () => (void mutate(), void mutateTeam()), 400);

  const step = (n: number) => anchor && setAnchorSet(addLocalDays(anchor, n * (view === "week" ? 7 : 1)));
  const today = () => setAnchorSet(first ? localDate(new Date(data?.now ?? first.now), first.timezone) : null);

  const header = (
    <PageHeader
      title="Calendar"
      actions={
        <>
          <div className="flex gap-1">
            {(["day", "week", "team"] as const).map((v) => (
              <Button key={v} size="sm" variant={view === v ? "brass" : "secondary"} onClick={() => setView(v)}>{v === "day" ? "Day" : v === "week" ? "Week" : "Team availability"}</Button>
            ))}
          </div>
        </>
      }
    />
  );

  if (view === "team") {
    return (
      <div>
        {header}
        {teamError ? <p className="text-[14px] text-signal-ink">{(teamError as Error).message}</p> : !team ? <p className="text-[14px] text-muted">Loading…</p> : <TeamAvailability data={team} onSaved={() => { mutateTeam(); mutate(); }} />}
      </div>
    );
  }

  if (error && !data) return <div>{header}<p className="text-[14px] text-signal-ink">{(error as Error).message}</p></div>;
  if (!data || !anchor || !from || !to) return <div>{header}<p className="text-[14px] text-muted">Loading…</p></div>;

  const nowMs = new Date(data.now).getTime();
  const takers = data.staff.filter((s) => s.takesAppointments);
  const list = data.appointments
    .filter((a) => showCancelled || (a.status !== "cancelled" && a.status !== "expired"))
    .filter((a) => !who || a.staffId === who)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const dayOf = (a: AppointmentView) => localDate(new Date(a.startsAt), data.timezone);
  const today0 = localDate(new Date(data.now), data.timezone);
  const label = (d: string) => format(zoned(d, "12:00", data.timezone), "EEE d MMM", { in: tz(data.timezone) });
  const days = view === "week" ? Array.from({ length: 7 }, (_, i) => addLocalDays(from, i)) : [from];
  // Day view: a column per person; anything without a person goes in its own column.
  const columns = view === "day" ? [...takers.map((s) => ({ id: s.userId, name: s.name })), ...(list.some((a) => !takers.some((s) => s.userId === a.staffId)) ? [{ id: "", name: "Unassigned" }] : [])] : [];

  const card = (a: AppointmentView) => <Booking key={a.id} a={a} timezone={data.timezone} nowMs={nowMs} onChanged={() => mutate()} showStaff={view === "week"} />;

  return (
    <div>
      {header}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={() => step(-1)} aria-label="Previous">←</Button>
          <Button size="sm" variant="secondary" onClick={today}>Today</Button>
          <Button size="sm" variant="secondary" onClick={() => step(1)} aria-label="Next">→</Button>
        </div>
        <p className="font-medium">{view === "week" ? `${label(from)} – ${label(to)}` : label(from)}</p>
        {view === "week" ? (
          <select value={who} onChange={(e) => setWho(e.target.value)} className="h-8 rounded-[10px] border border-line bg-raised px-2 text-[13px]" aria-label="Staff">
            <option value="">Everyone</option>
            {takers.map((s) => <option key={s.userId} value={s.userId}>{s.name}</option>)}
          </select>
        ) : null}
        <label className="ml-auto flex items-center gap-2 text-[13px] text-fg-2">
          <Switch checked={showCancelled} onCheckedChange={setShowCancelled} label="Show cancelled" /> Show cancelled
        </label>
      </div>

      {takers.length === 0 ? (
        <div className="mb-5 rounded-2xl border border-line bg-raised/50 p-5 text-[14px]">
          <p className="font-medium">No one takes appointments yet</p>
          <p className="mt-1 text-fg-2">Open <button className="underline" onClick={() => setView("team")}>Team availability</button> and switch on &ldquo;Takes appointments&rdquo; for each person who does them. Services themselves live in <Link href="/app/knowledge" className="underline">Knowledge</Link>.</p>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => {
            const items = list.filter((a) => dayOf(a) === d);
            return (
              <div key={d} className={cx("min-w-0 rounded-2xl border border-line p-2.5", d === today0 && "border-brass")}>
                <p className="mb-2 text-[13px] font-medium">{label(d)}</p>
                <div className="space-y-2">{items.length ? items.map(card) : <p className="text-[12.5px] text-muted">Nothing booked</p>}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))` }}>
          {columns.length === 0 ? <p className="text-[14px] text-muted">Nothing booked.</p> : null}
          {columns.map((c) => {
            const items = list.filter((a) => (c.id ? a.staffId === c.id : !takers.some((s) => s.userId === a.staffId)));
            return (
              <div key={c.id || "none"} className="min-w-0 rounded-2xl border border-line p-2.5">
                <p className="mb-2 text-[13px] font-medium">{c.name}</p>
                <div className="space-y-2">{items.length ? items.map(card) : <p className="text-[12.5px] text-muted">Nothing booked</p>}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
