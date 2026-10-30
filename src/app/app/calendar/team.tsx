"use client";
import { useState } from "react";
import Link from "next/link";
import { send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input, Label } from "@/components/ui/field";
import type { StaffResponse, StaffSchedule, StaffView, StaffPatch } from "@/lib/appointment-types";

type Range = [string, string];
const DAYS = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]] as const;
const badRange = (r: Range) => !r[0] || !r[1] || r[0] >= r[1];

/** One or more from–to ranges; no ranges means off. */
function Ranges({ value, onChange, disabled }: { value: Range[]; onChange: (v: Range[]) => void; disabled?: boolean }) {
  const set = (i: number, k: 0 | 1, t: string) => onChange(value.map((r, j) => (j === i ? (k === 0 ? [t, r[1]] : [r[0], t]) : r)));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.length === 0 ? <span className="text-[13px] text-muted">Off</span> : null}
      {value.map((r, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <Input type="time" className="h-8 w-[116px]" value={r[0]} disabled={disabled} onChange={(e) => set(i, 0, e.target.value)} aria-invalid={badRange(r)} />
          <span className="text-muted">to</span>
          <Input type="time" className="h-8 w-[116px]" value={r[1]} disabled={disabled} onChange={(e) => set(i, 1, e.target.value)} aria-invalid={badRange(r)} />
          <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove hours">✕</Button>
        </span>
      ))}
      <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onChange([...value, value.length ? [value[value.length - 1][1], "23:00"] : ["09:00", "17:00"]])}>
        {value.length ? "+ Add hours" : "Set hours"}
      </Button>
    </div>
  );
}

function hoursLine(rs: Range[] | undefined) {
  return rs && rs.length ? rs.map(([a, b]) => `${a}–${b}`).join(", ") : "closed";
}

function Person({ s, data, onSaved }: { s: StaffView; data: StaffResponse; onSaved: () => void }) {
  const toast = useToast();
  const mine = data.me.role === "owner" || data.me.userId === s.userId;
  const [takes, setTakes] = useState(s.takesAppointments);
  const [custom, setCustom] = useState(s.schedule !== null);
  const [weekly, setWeekly] = useState<Record<string, Range[]>>(s.schedule?.weekly ?? {});
  const [exceptions, setExceptions] = useState<StaffSchedule["exceptions"]>(s.schedule?.exceptions ?? []);
  const [serviceIds, setServiceIds] = useState(s.serviceIds);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (custom) {
      const ranges = [...Object.values(weekly).flat(), ...exceptions.flatMap((e) => e.hours)];
      if (ranges.some(badRange)) return toast("Each time range needs a start before its end.", "error");
      if (exceptions.some((e) => !e.date)) return toast("Pick a date for each change.", "error");
    }
    const body: StaffPatch = { takesAppointments: takes, schedule: custom ? { weekly, exceptions } : null };
    if (data.assignment === "specific") body.serviceIds = serviceIds;
    setBusy(true);
    try {
      await send(`/api/staff/${s.userId}`, "PATCH", body);
      toast(`Saved ${s.name}'s availability.`);
      onSaved();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const setException = (i: number, patch: Partial<StaffSchedule["exceptions"][number]>) => setExceptions(exceptions.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{s.name}{data.me.userId === s.userId ? <span className="text-muted"> (you)</span> : null}</p>
          <p className="text-[13px] text-muted">{s.email} · {s.role === "owner" ? "Owner" : "Service staff"}</p>
        </div>
        <label className="flex items-center gap-2 text-[13.5px]">
          <Switch checked={takes} onCheckedChange={setTakes} disabled={!mine} label={`${s.name} takes appointments`} />
          Takes appointments
        </label>
      </div>

      {takes ? (
        <div className="mt-5 space-y-6">
          <div>
            <p className="mb-2 text-[13px] text-fg-2">Hours</p>
            <div className="mb-3 flex gap-2">
              <Button size="sm" variant={custom ? "secondary" : "brass"} disabled={!mine} onClick={() => setCustom(false)}>Same as opening hours</Button>
              <Button size="sm" variant={custom ? "brass" : "secondary"} disabled={!mine} onClick={() => setCustom(true)}>Custom hours</Button>
            </div>
            {custom ? (
              <div className="space-y-2">
                {DAYS.map(([k, label]) => (
                  <div key={k} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="w-24 text-[13.5px]">{label}</span>
                    <Ranges value={weekly[k] ?? []} disabled={!mine} onChange={(v) => setWeekly({ ...weekly, [k]: v })} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {custom ? (
            <div>
              <p className="mb-2 text-[13px] text-fg-2">Days off and changes</p>
              <div className="space-y-3">
                {exceptions.map((e, i) => (
                  <div key={i} className="rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <Label htmlFor={`ex-${s.userId}-${i}`}>Date</Label>
                        <Input id={`ex-${s.userId}-${i}`} type="date" className="w-[160px]" value={e.date} disabled={!mine} onChange={(ev) => setException(i, { date: ev.target.value })} />
                      </div>
                      <div className="min-w-[160px] flex-1">
                        <Label htmlFor={`exn-${s.userId}-${i}`}>Note</Label>
                        <Input id={`exn-${s.userId}-${i}`} value={e.note} placeholder="Holiday, training…" disabled={!mine} onChange={(ev) => setException(i, { note: ev.target.value })} />
                      </div>
                      <label className="flex h-10 items-center gap-2 text-[13.5px]">
                        <Switch checked={e.hours.length === 0} onCheckedChange={(off) => setException(i, { hours: off ? [] : [["09:00", "17:00"]] })} disabled={!mine} label="Off all day" />
                        Off all day
                      </label>
                      <Button size="sm" variant="ghost" disabled={!mine} onClick={() => setExceptions(exceptions.filter((_, j) => j !== i))}>Remove</Button>
                    </div>
                    {e.hours.length ? <div className="mt-3"><Ranges value={e.hours} disabled={!mine} onChange={(v) => setException(i, { hours: v })} /></div> : null}
                  </div>
                ))}
                <Button size="sm" variant="secondary" disabled={!mine} onClick={() => setExceptions([...exceptions, { date: "", hours: [], note: "" }])}>Add a day off or change</Button>
              </div>
            </div>
          ) : null}

          {data.assignment === "specific" ? (
            <div>
              <p className="mb-2 text-[13px] text-fg-2">Services {s.name} does</p>
              {data.services.length === 0 ? (
                <p className="text-[13.5px] text-muted">No services yet. Add them in <Link href="/app/knowledge" className="underline">Knowledge</Link>.</p>
              ) : (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {data.services.map((sv) => (
                    <label key={sv.id} className="flex items-center gap-2 text-[13.5px]">
                      <input type="checkbox" disabled={!mine} checked={serviceIds.includes(sv.id)} onChange={(e) => setServiceIds(e.target.checked ? [...serviceIds, sv.id] : serviceIds.filter((x) => x !== sv.id))} />
                      {sv.title}{sv.durationMinutes ? <span className="text-muted"> · {sv.durationMinutes} min</span> : null}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5">
        <Button variant="primary" size="sm" loading={busy} disabled={!mine} onClick={save}>Save</Button>
        {!mine ? <span className="ml-3 text-[13px] text-muted">Only the owner can change this.</span> : null}
      </div>
    </div>
  );
}

/** Who takes appointments, and when. Staff hours always stay inside opening hours. */
export function TeamAvailability({ data, onSaved }: { data: StaffResponse; onSaved: () => void }) {
  const oh = data.openingHours;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        {data.staff.map((s) => (
          <Person key={s.userId + JSON.stringify([s.takesAppointments, s.schedule, s.serviceIds])} s={s} data={data} onSaved={onSaved} />
        ))}
      </div>
      <aside className="h-fit rounded-2xl border border-line bg-raised/50 p-5 text-[13.5px]">
        <p className="font-medium">Opening hours</p>
        <p className="mt-1 text-[12.5px] text-muted">Staff hours always stay inside opening hours.</p>
        {oh ? (
          <ul className="mt-3 space-y-1">
            {DAYS.map(([k, label]) => (
              <li key={k} className="flex justify-between gap-3"><span className="text-fg-2">{label}</span><span className="num">{hoursLine(oh.weekly[k])}</span></li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted">No opening hours on file yet. Add them in Settings.</p>
        )}
      </aside>
    </div>
  );
}
