"use client";
import { useState } from "react";
import { send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cx } from "@/components/ui/cx";
import { Payments } from "../settings/payments";
import type { Patch } from "../settings/types";
import { DAYS, type Day, type SetupSelling } from "@/setup/types";
import type { StockMode } from "@/db/schema";

const DAY_LABEL: Record<Day, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
const select = "h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px]";
const STOCK: { mode: StockMode; label: string; hint: string }[] = [
  { mode: "none", label: "Made to order", hint: "No counting. Everything is always available." },
  { mode: "daily", label: "A fresh batch every day", hint: "You make a set amount each day and it runs out." },
  { mode: "tracked", label: "Count what's on the shelf", hint: "Each sale takes one off, until you restock." },
];
type Where = "in_person" | "online" | "mix";

function Choice({ on, onClick, title, hint }: { on: boolean; onClick: () => void; title: string; hint?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cx("rounded-xl border px-4 py-3 text-left transition-colors", on ? "border-brass bg-brass/10" : "border-line hover:border-line-strong")}>
      <span className="block text-[14.5px] font-medium">{title}</span>
      {hint ? <span className="mt-0.5 block text-[12.5px] text-muted">{hint}</span> : null}
    </button>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-display text-[20px] font-bold">{title}</h2>
      {hint ? <p className="mt-1 max-w-[62ch] text-[13.5px] text-muted">{hint}</p> : null}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Pick({ id, label, value, onChange, options, unit }: { id: string; label: string; value: number; onChange: (n: number) => void; options: [number, string][]; unit?: string }) {
  const all = options.some(([v]) => v === value) ? options : [...options, [value, `${value}${unit ?? ""}`] as [number, string]].sort((a, b) => a[0] - b[0]);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={select} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {all.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

const hasOpenDay = (h: SetupSelling["hours"]) => Boolean(h && Object.values(h.weekly).some((x) => x.length));

export function SellingStep({ data, currency: _currency, onSaved, onNext, onBackToReview, patch }: { data: SetupSelling; currency: string; onSaved: () => Promise<void>; onNext: () => void; onBackToReview: () => void; patch: Patch }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<StockMode>(data.stock.defaultMode);
  const [qty, setQty] = useState<Record<string, string>>(() => Object.fromEntries(data.products.flatMap((p) => p.options.map((o) => [o.id, o.dailyQty === null ? "" : String(o.dailyQty)]))));
  const [pay, setPay] = useState<"on" | "skip" | null>(data.payments?.enabled ? "on" : null);

  const inPersonNow = (s: { inPerson: boolean }) => s.inPerson;
  const [where, setWhere] = useState<Where>(() => {
    const v = data.services.map(inPersonNow);
    return v.every(Boolean) ? "in_person" : v.some(Boolean) ? "mix" : "online";
  });
  const [per, setPer] = useState<Record<string, boolean>>(() => Object.fromEntries(data.services.map((s) => [s.id, s.inPerson])));
  const [address, setAddress] = useState(data.address);
  const [team, setTeam] = useState(data.team > 1 || data.bookers > 1);
  const [appt, setAppt] = useState(data.appointments);
  const [durs, setDurs] = useState<Record<string, string>>({});
  const [hours, setHours] = useState<Record<string, [string, string][]>>(() => ({ mon: [["09:00", "18:00"]], tue: [["09:00", "18:00"]], wed: [["09:00", "18:00"]], thu: [["09:00", "18:00"]], fri: [["09:00", "18:00"]], sat: [], sun: [] }));
  const [savingHours, setSavingHours] = useState(false);

  const services = data.services;
  const hasHours = hasOpenDay(data.hours);
  const wantsInPerson = where === "in_person" || (where === "mix" && services.some((s) => per[s.id]));
  const placeLabel = data.address || "your place";
  const valueFor = (id: string) => (where === "in_person" ? true : where === "online" ? false : Boolean(per[id]));

  async function saveHours() {
    setSavingHours(true);
    try {
      await send("/api/knowledge", "POST", { kind: "hours", category: "hours", title: "Opening hours", body: "", data: { weekly: hours, lastOrdersMinutesBeforeClose: 0, exceptions: [] } });
      await onSaved();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSavingHours(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      if (mode !== data.stock.defaultMode || !data.stockSaved) await send("/api/settings", "PATCH", { stock: { ...data.stock, defaultMode: mode } });
      if (mode !== "tracked") {
        for (const p of data.products) if (p.stockMode === null && p.options.some((o) => o.stock !== null)) await send(`/api/knowledge/items/${p.id}`, "PATCH", { stockMode: "tracked" });
      }
      if (mode === "daily") {
        for (const p of data.products)
          for (const o of p.options) {
            const v = (qty[o.id] ?? "").trim();
            const n = v === "" ? null : Math.max(0, Math.min(100000, Math.round(Number(v))));
            if (n !== o.dailyQty && (n === null || Number.isFinite(n))) await send(`/api/knowledge/variants/${o.id}`, "PATCH", { dailyQty: n });
          }
      }

      if (services.length > 0) {
        for (const s of services) if (valueFor(s.id) !== s.inPerson) await send(`/api/knowledge/items/${s.id}`, "PATCH", { inPerson: valueFor(s.id) });
        if (wantsInPerson && !data.address && address.trim()) await send("/api/workspace", "PATCH", { business: { address: address.trim() } });
        await send(`/api/staff/${data.owner.userId}`, "PATCH", { takesAppointments: true });
        await send("/api/settings", "PATCH", { appointments: appt });
        for (const s of services) {
          const v = (durs[s.id] ?? "").trim();
          if (s.durationMinutes === null && v !== "" && Number(v) > 0) await send(`/api/knowledge/items/${s.id}`, "PATCH", { data: { ...s.data, durationMinutes: Math.round(Number(v)) } });
        }
      }
      await onSaved();
      onNext();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const noDur = services.filter((s) => s.durationMinutes === null);
  const setDay = (d: Day, v: [string, string][]) => setHours((h) => ({ ...h, [d]: v }));

  return (
    <div className="max-w-[760px] space-y-8">
      <p className="max-w-[62ch] text-[15px] text-fg-2">A few answers on how orders and bookings work. We guessed from your business, so check them. You can change all of this later in Settings.</p>

      <Section title="Stock" hint={data.stockSaved ? undefined : "We guessed this from your type of business."}>
        <div>
          <Label>How do you keep track of what you sell?</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {STOCK.map((s) => (
              <Choice key={s.mode} on={mode === s.mode} onClick={() => setMode(s.mode)} title={s.label} hint={s.hint} />
            ))}
          </div>
        </div>
        {mode === "daily" && data.products.length ? (
          <div>
            <Label hint="empty = no limit">Usual quantity per day</Label>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {data.products.map((p) =>
                p.options.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate text-[14px]">
                      {p.title}
                      {o.label ? <span className="text-muted"> · {o.label}</span> : null}
                    </span>
                    <Input type="number" min={0} max={100000} className="w-[100px]" value={qty[o.id] ?? ""} onChange={(e) => setQty((q) => ({ ...q, [o.id]: e.target.value }))} aria-label={`${p.title} ${o.label} usual quantity`} placeholder="Any" />
                  </li>
                )),
              )}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section title="Payments" hint={`When payments are on, the assistant sends your account details after an order and asks for a receipt. Yapoz checks each receipt, and the order's stock or booking time is held for ${data.stock.holdMinutes} minutes while the customer pays, then it expires.`}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice on={pay === "on"} onClick={() => setPay("on")} title="Ask customers to pay in chat" hint={data.payments?.enabled ? "On now." : undefined} />
          <Choice on={pay === "skip"} onClick={() => setPay("skip")} title="Skip, I'll take payment on pickup" />
        </div>
        {pay === "on" ? (
          <>
            <p className="text-[13px] text-muted">Press &ldquo;Save payment details&rdquo; below the accounts before you continue.</p>
            <Payments initial={data.payments ?? undefined} patch={patch} />
          </>
        ) : null}
      </Section>

      {services.length > 0 ? (
        <Section title="Bookings">
          {!hasHours ? (
            <div className="rounded-xl border border-signal/50 bg-signal/10 p-4">
              <p className="text-[14.5px] font-medium">Bookings need opening hours.</p>
              <p className="mt-1 text-[13px] text-fg-2">Set them here, or go back to Review and add them there.</p>
              <ul className="mt-3 divide-y divide-line">
                {DAYS.map((d) => {
                  const iv = hours[d] ?? [];
                  return (
                    <li key={d} className="flex flex-wrap items-center gap-3 py-2">
                      <span className="flex w-[110px] items-center gap-2">
                        <Switch checked={iv.length > 0} onCheckedChange={(v) => setDay(d, v ? [["09:00", "18:00"]] : [])} label={`${DAY_LABEL[d]} open`} />
                        <span className="text-[14px]">{DAY_LABEL[d].slice(0, 3)}</span>
                      </span>
                      {iv[0] ? (
                        <span className="flex items-center gap-1.5">
                          <Input type="time" className="w-[120px]" value={iv[0][0]} onChange={(e) => setDay(d, [[e.target.value, iv[0][1]]])} aria-label={`${DAY_LABEL[d]} opens`} />
                          <span className="text-muted">to</span>
                          <Input type="time" className="w-[120px]" value={iv[0][1]} onChange={(e) => setDay(d, [[iv[0][0], e.target.value]])} aria-label={`${DAY_LABEL[d]} closes`} />
                        </span>
                      ) : (
                        <span className="text-[14px] text-muted">Closed</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="brass" loading={savingHours} disabled={!Object.values(hours).some((x) => x.length)} onClick={saveHours}>
                  Save hours
                </Button>
                <button type="button" onClick={onBackToReview} className="text-[13px] text-muted underline-offset-4 hover:text-fg hover:underline">
                  Back to Review
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <Label>Where do appointments happen?</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <Choice on={where === "in_person"} onClick={() => setWhere("in_person")} title={`In person at ${placeLabel}`} />
              <Choice on={where === "online"} onClick={() => setWhere("online")} title="Online video call" />
              <Choice on={where === "mix"} onClick={() => setWhere("mix")} title="A mix" />
            </div>
            {where === "mix" ? (
              <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                {services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate text-[14px]">{s.title}</span>
                    <label className="flex items-center gap-2 text-[13px] text-fg-2">
                      <input type="checkbox" checked={Boolean(per[s.id])} onChange={(e) => setPer((x) => ({ ...x, [s.id]: e.target.checked }))} />
                      in person
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {wantsInPerson && !data.address ? (
            <div>
              <Label htmlFor="addr" hint="customers are told this">Business address</Label>
              <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" />
            </div>
          ) : null}

          <div>
            <Label>Who takes bookings?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice on={!team} onClick={() => setTeam(false)} title="Just me" />
              <Choice on={team} onClick={() => setTeam(true)} title="Me and my team" />
            </div>
            {team ? (
              <p className="mt-2 text-[13px] text-muted">
                <a href="/app/settings#team" target="_blank" className="font-medium text-fg underline decoration-brass underline-offset-4">
                  Invite your staff
                </a>{" "}
                in Settings. Each person sets their own hours on the{" "}
                <a href="/app/calendar" target="_blank" className="underline underline-offset-4">
                  Calendar page
                </a>
                .
              </p>
            ) : null}
          </div>

          <div>
            <Label>Who does which service?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice on={appt.assignment === "anyone"} onClick={() => setAppt({ ...appt, assignment: "anyone" })} title="Anyone does every service" />
              <Choice on={appt.assignment === "specific"} onClick={() => setAppt({ ...appt, assignment: "specific" })} title="Each person does specific services" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Pick id="slot" label="Slot length" value={appt.slotMinutes} onChange={(n) => setAppt({ ...appt, slotMinutes: n })} unit=" min" options={[15, 30, 45, 60, 90, 120].map((n) => [n, `${n} min`])} />
            <Pick id="ahead" label="How far ahead can people book?" value={appt.bookingDays} onChange={(n) => setAppt({ ...appt, bookingDays: n })} unit=" days" options={[7, 14, 30, 60, 90].map((n) => [n, `${n} days`])} />
            <Pick
              id="notice"
              label="Minimum notice"
              value={appt.minNoticeMinutes}
              onChange={(n) => setAppt({ ...appt, minNoticeMinutes: n })}
              unit=" min"
              options={[[0, "None"], [30, "30 min"], [60, "1 hour"], [120, "2 hours"], [240, "4 hours"], [720, "12 hours"], [1440, "24 hours"]]}
            />
            <Pick
              id="cutoff"
              label="Customers can change or cancel up to"
              value={appt.changeCutoffHours}
              onChange={(n) => setAppt({ ...appt, changeCutoffHours: n })}
              unit=" hours"
              options={[[0, "Any time"], [2, "2 hours before"], [12, "12 hours before"], [24, "24 hours before"], [48, "48 hours before"]]}
            />
          </div>

          {noDur.length ? (
            <div>
              <Label hint="how long each takes">Durations</Label>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {noDur.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate text-[14px]">{s.title}</span>
                    <span className="flex items-center gap-2 text-[13px] text-muted">
                      <Input type="number" min={5} max={1440} className="w-[90px]" value={durs[s.id] ?? ""} onChange={(e) => setDurs((x) => ({ ...x, [s.id]: e.target.value }))} aria-label={`${s.title} minutes`} placeholder="30" />
                      min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-bg/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Button variant="brass" size="lg" loading={busy} disabled={services.length > 0 && !hasHours} onClick={save}>
          Save and continue
        </Button>
        <button type="button" onClick={onNext} className="text-[13.5px] text-muted underline-offset-4 hover:text-fg hover:underline">
          Skip for now
        </button>
      </div>
    </div>
  );
}
