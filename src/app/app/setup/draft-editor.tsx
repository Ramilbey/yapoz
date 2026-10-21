"use client";
import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cx } from "@/components/ui/cx";
import { DAYS, type Day, type Draft, type DraftItem, type DraftBookingType } from "@/setup/types";

const DAY_LABEL: Record<Day, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
const UNIT_HELP: Record<DraftBookingType["unit"], string> = {
  party: "Tables or group sessions, booked by number of people",
  appointment: "One service per booking, e.g. a haircut or a repair slot",
  day: "Whole days, e.g. rooms, rentals or equipment",
};
const CAPACITY_HELP: Record<DraftBookingType["unit"], string> = {
  party: "Seats per time slot",
  appointment: "Staff or stations working at the same time",
  day: "Units available per day",
};
const select = "h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px]";
const num = (v: string) => (v === "" ? null : Number(v));

function Section({ title, count, hint, children, defaultOpen = true }: { title: string; count?: number; hint?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-line pt-6">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-baseline justify-between gap-3 text-left" aria-expanded={open}>
        <span>
          <span className="font-display text-[20px] font-bold">{title}</span>
          {count !== undefined ? <span className="num ml-2 text-[13px] text-muted">{count}</span> : null}
          {hint ? <span className="mt-0.5 block text-[13px] text-muted">{hint}</span> : null}
        </span>
        <span className="text-[13px] text-muted">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function Remove({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="h-8 shrink-0 rounded-md px-2 text-[13px] text-muted hover:bg-raised hover:text-signal-ink">
      Remove
    </button>
  );
}

function ItemEditor({ item, types, currency, onChange, onRemove }: { item: DraftItem; types: DraftBookingType[]; currency: string; onChange: (i: DraftItem) => void; onRemove: () => void }) {
  const set = (p: Partial<DraftItem>) => onChange({ ...item, ...p });
  return (
    <li className="rounded-xl border border-line p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_160px_auto]">
        <Input value={item.name} onChange={(e) => set({ name: e.target.value })} aria-label="Name" placeholder="Name" />
        <select className={select} value={item.kind} onChange={(e) => set({ kind: e.target.value as DraftItem["kind"] })} aria-label="Kind">
          <option value="product">Product</option>
          <option value="service">Service</option>
        </select>
        <Input value={item.category} onChange={(e) => set({ category: e.target.value })} aria-label="Category" placeholder="Category" />
        <Remove onClick={onRemove} label={`Remove ${item.name}`} />
      </div>
      <Textarea className="mt-3" rows={2} value={item.description} onChange={(e) => set({ description: e.target.value })} aria-label="Description" placeholder="What it is, what's included, ingredients or allergens…" />
      <div className="mt-3">
        <p className="mb-1.5 text-[13px] text-fg-2">Prices ({currency})</p>
        <ul className="space-y-2">
          {item.options.map((o, i) => (
            <li key={i} className="flex gap-2">
              <Input className="flex-1" value={o.label ?? ""} onChange={(e) => set({ options: item.options.map((x, j) => (j === i ? { ...x, label: e.target.value || null } : x)) })} placeholder="Option (e.g. Large, Long hair) or leave empty" aria-label="Option" />
              <Input className="w-32" type="number" min={0} step="0.01" inputMode="decimal" value={o.price ?? ""} onChange={(e) => set({ options: item.options.map((x, j) => (j === i ? { ...x, price: num(e.target.value) } : x)) })} placeholder="Price" aria-label="Price" />
              <Remove onClick={() => set({ options: item.options.filter((_, j) => j !== i) })} label="Remove price" />
            </li>
          ))}
        </ul>
        <button type="button" className="mt-2 text-[13px] font-medium underline decoration-brass underline-offset-4" onClick={() => set({ options: [...item.options, { label: null, price: null, stock: null }] })}>
          Add a price
        </button>
      </div>
      {item.kind === "service" ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`dur-${item.name}`}>Takes (minutes)</Label>
            <Input id={`dur-${item.name}`} type="number" min={5} step={5} value={item.durationMinutes ?? ""} onChange={(e) => set({ durationMinutes: num(e.target.value) })} />
          </div>
          <div>
            <Label>Booked as</Label>
            <select className={select} value={item.bookingType ?? ""} onChange={(e) => set({ bookingType: e.target.value || null })} aria-label="Booking type">
              <option value="">Not bookable in chat</option>
              {types.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function DraftEditor({ draft, onChange, currency }: { draft: Draft; onChange: (d: Draft) => void; currency: string }) {
  const set = (p: Partial<Draft>) => onChange({ ...draft, ...p });
  const hours = draft.hours ?? { weekly: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }, lastOrdersMinutesBeforeClose: 0, notes: "" };
  const setDay = (d: Day, v: [string, string][]) => set({ hours: { ...hours, weekly: { ...hours.weekly, [d]: v } } });
  const categories = [...new Set(draft.items.map((i) => i.category || "general"))];
  const [filter, setFilter] = useState<string | null>(null);
  const shown = draft.items.map((it, idx) => ({ it, idx })).filter(({ it }) => !filter || it.category === filter);

  return (
    <div className="space-y-8">
      {draft.openQuestions.length ? (
        <section className="rounded-2xl border border-brass/50 bg-brass/10 p-5">
          <h3 className="font-display text-[20px] font-bold">A few questions for you</h3>
          <p className="mt-1 text-[13.5px] text-fg-2">Customers will ask these and your files didn&apos;t say. Answer what you can; each answer becomes something the assistant knows. Skip the rest.</p>
          <ul className="mt-4 space-y-4">
            {draft.openQuestions.map((q, i) => (
              <li key={i}>
                <p className="text-[14.5px] font-medium">{q.question}</p>
                {q.why ? <p className="text-[12.5px] text-muted">{q.why}</p> : null}
                <Textarea className="mt-1.5" rows={2} value={q.answer} onChange={(e) => set({ openQuestions: draft.openQuestions.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} aria-label={q.question} placeholder="Your answer" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Section title="About" hint="How the assistant understands your business. Customers don't see this text.">
        <Textarea rows={3} value={draft.summary} onChange={(e) => set({ summary: e.target.value })} aria-label="Summary" />
      </Section>

      <Section title="Opening hours" hint={draft.hours ? undefined : "Not found in what you gave us. Set them here, or leave empty and the assistant will say it doesn't know."}>
        <ul className="divide-y divide-line">
          {DAYS.map((d) => {
            const iv = hours.weekly[d] ?? [];
            return (
              <li key={d} className="grid grid-cols-[110px_1fr] items-start gap-3 py-2.5 sm:grid-cols-[130px_1fr]">
                <div className="flex items-center gap-2 pt-1.5">
                  <Switch checked={iv.length > 0} onCheckedChange={(v) => setDay(d, v ? [["09:00", "18:00"]] : [])} label={`${DAY_LABEL[d]} open`} />
                  <span className="text-[14px]">{DAY_LABEL[d].slice(0, 3)}</span>
                </div>
                {iv.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {iv.map(([a, b], i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <Input type="time" className="w-[120px]" value={a} onChange={(e) => setDay(d, iv.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} aria-label={`${DAY_LABEL[d]} opens`} />
                        <span className="text-muted">to</span>
                        <Input type="time" className="w-[120px]" value={b} onChange={(e) => setDay(d, iv.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} aria-label={`${DAY_LABEL[d]} closes`} />
                        {iv.length > 1 ? <Remove onClick={() => setDay(d, iv.filter((_, j) => j !== i))} label="Remove interval" /> : null}
                      </span>
                    ))}
                    {iv.length < 3 ? (
                      <button type="button" className="text-[13px] text-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => setDay(d, [...iv, ["17:00", "22:00"]])}>
                        Add a break
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <span className="pt-2 text-[14px] text-muted">Closed</span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr]">
          <div>
            <Label htmlFor="lo" hint="optional">Last orders before close (min)</Label>
            <Input id="lo" type="number" min={0} max={240} value={hours.lastOrdersMinutesBeforeClose} onChange={(e) => set({ hours: { ...hours, lastOrdersMinutesBeforeClose: Number(e.target.value || 0) } })} />
          </div>
          <div>
            <Label htmlFor="hn" hint="optional">Notes</Label>
            <Input id="hn" value={hours.notes} onChange={(e) => set({ hours: { ...hours, notes: e.target.value } })} placeholder="e.g. Closed on public holidays" />
          </div>
        </div>
      </Section>

      <Section title="Products and services" count={draft.items.length} hint="Everything you sell or offer, with prices. The assistant quotes these and nothing else.">
        {categories.length > 1 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {[null, ...categories].map((c) => (
              <button key={c ?? "all"} type="button" onClick={() => setFilter(c)} className={cx("h-7 rounded-full border px-3 text-[12.5px]", filter === c ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:border-line-strong")}>
                {c ?? "All"}
              </button>
            ))}
          </div>
        ) : null}
        <ul className="space-y-3">
          {shown.map(({ it, idx }) => (
            <ItemEditor
              key={idx}
              item={it}
              types={draft.bookingTypes}
              currency={currency}
              onChange={(n) => set({ items: draft.items.map((x, j) => (j === idx ? n : x)) })}
              onRemove={() => set({ items: draft.items.filter((_, j) => j !== idx) })}
            />
          ))}
        </ul>
        <Button
          type="button"
          size="sm"
          className="mt-3"
          onClick={() => set({ items: [...draft.items, { kind: draft.bookingTypes.length ? "service" : "product", name: "", category: filter ?? categories[0] ?? "general", description: "", options: [{ label: null, price: null, stock: null }], durationMinutes: null, bookingType: null, tags: [] }] })}
        >
          Add product or service
        </Button>
      </Section>

      <Section title="Bookings" count={draft.bookingTypes.length} hint="How customers book with you in chat. Leave empty if you don't take bookings.">
        <ul className="space-y-3">
          {draft.bookingTypes.map((b, i) => {
            const upd = (p: Partial<DraftBookingType>) => set({ bookingTypes: draft.bookingTypes.map((x, j) => (j === i ? { ...x, ...p } : x)) });
            return (
              <li key={i} className="rounded-xl border border-line p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <Label>Name</Label>
                    <Input value={b.name} onChange={(e) => upd({ name: e.target.value })} aria-label="Booking name" />
                  </div>
                  <div>
                    <Label>Kind</Label>
                    <select className={select} value={b.unit} onChange={(e) => upd({ unit: e.target.value as DraftBookingType["unit"] })} aria-label="Booking kind">
                      <option value="party">Tables / groups</option>
                      <option value="appointment">Appointments</option>
                      <option value="day">Days (rooms, rentals)</option>
                    </select>
                  </div>
                  <div className="self-end">
                    <Remove onClick={() => set({ bookingTypes: draft.bookingTypes.filter((_, j) => j !== i) })} label={`Remove ${b.name}`} />
                  </div>
                </div>
                <p className="mt-1.5 text-[12.5px] text-muted">{UNIT_HELP[b.unit]}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <div>
                    <Label>{CAPACITY_HELP[b.unit]}</Label>
                    <Input type="number" min={1} value={b.capacity} onChange={(e) => upd({ capacity: Math.max(1, Number(e.target.value || 1)) })} />
                  </div>
                  {b.unit !== "day" ? (
                    <>
                      <div>
                        <Label>Lasts (min)</Label>
                        <Input type="number" min={5} step={5} value={b.durationMinutes} onChange={(e) => upd({ durationMinutes: Math.max(5, Number(e.target.value || 60)) })} />
                      </div>
                      <div>
                        <Label>Starts every (min)</Label>
                        <Input type="number" min={5} step={5} value={b.slotMinutes} onChange={(e) => upd({ slotMinutes: Math.max(5, Number(e.target.value || 30)) })} />
                      </div>
                    </>
                  ) : null}
                  <div>
                    <Label>{b.unit === "party" ? "Max people per booking" : "Max per booking"}</Label>
                    <Input type="number" min={1} value={b.maxPerBooking} onChange={(e) => upd({ maxPerBooking: Math.max(1, Number(e.target.value || 1)) })} />
                  </div>
                  <div>
                    <Label>Book at least (min ahead)</Label>
                    <Input type="number" min={0} step={15} value={b.leadMinutes} onChange={(e) => upd({ leadMinutes: Math.max(0, Number(e.target.value || 0)) })} />
                  </div>
                </div>
                <Input className="mt-3" value={b.notes} onChange={(e) => upd({ notes: e.target.value })} placeholder="Notes for customers: deposits, how long you hold a booking, walk-ins…" aria-label="Booking notes" />
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          size="sm"
          className="mt-3"
          onClick={() => {
            const base = draft.bookingTypes.length ? `booking-${draft.bookingTypes.length + 1}` : "booking";
            set({ bookingTypes: [...draft.bookingTypes, { key: base, name: "Appointment", unit: "appointment", capacity: 1, durationMinutes: 60, slotMinutes: 30, maxPerBooking: 1, leadMinutes: 60, notes: "" }] });
          }}
        >
          Add a way to book
        </Button>
      </Section>

      <Section title="Delivery" defaultOpen={Boolean(draft.delivery)}>
        <label className="flex items-center gap-3 text-[14px]">
          <Switch checked={Boolean(draft.delivery?.offered)} onCheckedChange={(v) => set({ delivery: { offered: v, details: draft.delivery?.details ?? "" } })} label="We deliver" />
          We deliver
        </label>
        {draft.delivery?.offered ? <Textarea className="mt-3" rows={3} value={draft.delivery.details} onChange={(e) => set({ delivery: { offered: true, details: e.target.value } })} placeholder="Areas, fees, minimum order, delivery times, Grab/Foodpanda…" aria-label="Delivery details" /> : null}
      </Section>

      <Section title="Policies" count={draft.policies.length} hint="Payment, cancellations, returns, parking, anything with rules.">
        <ul className="space-y-3">
          {draft.policies.map((p, i) => {
            const upd = (x: Partial<typeof p>) => set({ policies: draft.policies.map((y, j) => (j === i ? { ...y, ...x } : y)) });
            return (
              <li key={i} className="rounded-xl border border-line p-4">
                <div className="flex gap-2">
                  <Input className="flex-1" value={p.title} onChange={(e) => upd({ title: e.target.value })} aria-label="Policy title" placeholder="Title" />
                  <Input className="w-36" value={p.topic} onChange={(e) => upd({ topic: e.target.value })} aria-label="Topic" placeholder="topic" />
                  <Remove onClick={() => set({ policies: draft.policies.filter((_, j) => j !== i) })} label={`Remove ${p.title}`} />
                </div>
                <Textarea className="mt-2" rows={2} value={p.body} onChange={(e) => upd({ body: e.target.value })} aria-label="Policy text" />
              </li>
            );
          })}
        </ul>
        <Button type="button" size="sm" className="mt-3" onClick={() => set({ policies: [...draft.policies, { topic: "general", title: "", body: "" }] })}>
          Add a policy
        </Button>
      </Section>

      <Section title="Common questions" count={draft.faqs.length} hint="Written the way customers ask. Edit the answers in your own voice." defaultOpen={draft.faqs.length <= 12}>
        <ul className="divide-y divide-line">
          {draft.faqs.map((f, i) => {
            const upd = (x: Partial<typeof f>) => set({ faqs: draft.faqs.map((y, j) => (j === i ? { ...y, ...x } : y)) });
            return (
              <li key={i} className="grid gap-2 py-3 sm:grid-cols-[1fr_1.4fr_auto]">
                <Input value={f.question} onChange={(e) => upd({ question: e.target.value })} aria-label="Question" placeholder="How a customer asks" />
                <Textarea rows={2} value={f.answer} onChange={(e) => upd({ answer: e.target.value })} aria-label="Answer" placeholder="Your answer" />
                <Remove onClick={() => set({ faqs: draft.faqs.filter((_, j) => j !== i) })} label="Remove question" />
              </li>
            );
          })}
        </ul>
        <Button type="button" size="sm" className="mt-3" onClick={() => set({ faqs: [...draft.faqs, { question: "", answer: "", topic: "general" }] })}>
          Add a question
        </Button>
      </Section>
    </div>
  );
}

/** Drops half-filled rows before saving so validation doesn't reject the whole draft. */
export function cleanDraft(d: Draft): Draft {
  const used = new Set<string>();
  const bookingTypes = d.bookingTypes
    .filter((b) => b.name.trim())
    .map((b) => {
      let key = (b.key || b.name).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "booking";
      if (key.length < 2) key = `${key}-1`;
      while (used.has(key)) key = `${key.slice(0, 27)}-${used.size + 1}`;
      used.add(key);
      return { ...b, key };
    });
  return {
    ...d,
    items: d.items.filter((i) => i.name.trim()).map((i) => ({ ...i, category: i.category.trim() || "general", options: i.options.filter((o) => o.price !== null || (o.label ?? "").trim()) })),
    bookingTypes,
    policies: d.policies.filter((p) => p.title.trim() && p.body.trim()).map((p) => ({ ...p, topic: p.topic.trim() || "general" })),
    faqs: d.faqs.filter((f) => f.question.trim() && f.answer.trim()),
    hours: d.hours && Object.values(d.hours.weekly).some((x) => x.length) ? d.hours : null,
  };
}
