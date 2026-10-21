"use client";
import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Textarea, Label } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cx } from "@/components/ui/cx";

type Variant = { id: string; size: string | null; color: string | null; option: string | null; priceMinor: number; stock: number | null };
type Item = { id: string; kind: string; category: string; slug: string; title: string; body: string; data: Record<string, unknown>; tags: string[]; available: boolean; availabilityNote: string | null; active: boolean; variants: Variant[] };
type Gap = { id: string; key: string; question: string; count: number };
type BookingType = { id: string; key: string; name: string; unit: "party" | "appointment" | "day"; capacity: number; durationMinutes: number; slotMinutes: number; maxPerBooking: number; leadMinutes: number; notes: string; active: boolean };
type HoursData = { weekly: Record<string, [string, string][]>; lastOrdersMinutesBeforeClose: number; exceptions: { date: string; hours: [string, string][]; note: string }[] };
type Data = { items: Item[]; gaps: Gap[]; bookingTypes: BookingType[]; currency: string; canEditBookings: boolean };

const TABS = [
  { key: "catalog", label: "Products and services" },
  { key: "bookings", label: "Bookings" },
  { key: "hours", label: "Hours" },
  { key: "policies", label: "Policies and info" },
  { key: "faqs", label: "FAQs" },
  { key: "gaps", label: "Gaps" },
] as const;

export default function KnowledgePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("catalog");
  const { data, mutate } = useSWR<Data>("/api/knowledge", getJson);
  useLive(["kb_items", "kb_variants", "knowledge_gaps", "booking_types"], () => mutate(), 400);
  const items = data?.items ?? [];
  return (
    <div>
      <PageHeader title="Knowledge" description="Everything the assistant is allowed to say comes from here. Edits apply to the very next message: no retraining, no publish step." />
      <div className="mb-8 flex flex-wrap gap-1.5" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cx("h-8 rounded-full border px-3.5 text-[13px]", tab === t.key ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}>
            {t.label}
            {t.key === "gaps" && data?.gaps.length ? <span className="num ml-1.5 opacity-70">{data.gaps.length}</span> : null}
          </button>
        ))}
      </div>
      {!data ? <p className="text-muted">Loading…</p> : null}
      {data && tab === "catalog" ? <Catalog items={items.filter((i) => i.kind === "product" || i.kind === "service")} types={data.bookingTypes} currency={data.currency} onChange={mutate} /> : null}
      {data && tab === "bookings" ? <Bookings types={data.bookingTypes} canEdit={data.canEditBookings} onChange={mutate} /> : null}
      {data && tab === "hours" ? <Hours item={items.find((i) => i.kind === "hours")} onChange={mutate} /> : null}
      {data && tab === "policies" ? <TextItems items={items.filter((i) => i.kind === "policy" || i.kind === "info")} currency={data.currency} onChange={mutate} /> : null}
      {data && tab === "faqs" ? <Faqs items={items.filter((i) => i.kind === "faq")} onChange={mutate} /> : null}
      {data && tab === "gaps" ? <Gaps gaps={data.gaps} onChange={mutate} /> : null}
    </div>
  );
}

function useSaver(onChange: () => void) {
  const toast = useToast();
  return async (url: string, method: "PATCH" | "POST" | "DELETE", body?: unknown, msg = "Saved. The assistant uses it from the next message.") => {
    try {
      await send(url, method, body);
      onChange();
      if (msg) toast(msg);
      return true;
    } catch (e) {
      toast((e as Error).message, "error");
      return false;
    }
  };
}
type Save = ReturnType<typeof useSaver>;

const major = (minor: number) => (minor / 100).toFixed(minor % 100 ? 2 : 0);
const toMinor = (v: string) => Math.round(Number(v) * 100);
const label = (v: Variant) => [v.size, v.color, v.option].filter(Boolean).join(" / ");

function Catalog({ items, types, currency, onChange }: { items: Item[]; types: BookingType[]; currency: string; onChange: () => void }) {
  const save = useSaver(onChange);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const groups = useMemo(() => {
    const n = q.trim().toLowerCase();
    const m = new Map<string, Item[]>();
    for (const i of items) if (!n || `${i.title} ${i.body} ${i.category}`.toLowerCase().includes(n)) m.set(i.category, [...(m.get(i.category) ?? []), i]);
    return [...m.entries()];
  }, [items, q]);
  const categories = [...new Set(items.map((i) => i.category))];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search products and services" className="max-w-[280px]" />
        <Button variant="brass" onClick={() => setAdding((v) => !v)}>
          {adding ? "Close" : "Add product or service"}
        </Button>
        <span className="text-[13px] text-muted">{items.length} total. Prices in {currency}.</span>
      </div>
      {adding ? <NewItem categories={categories} types={types} save={save} onDone={() => setAdding(false)} /> : null}
      {!items.length && !adding ? <p className="text-[15px] text-muted">Nothing here yet. Add what you sell, or run setup again to draft it from your menu or price list.</p> : null}
      <div className="space-y-10">
        {groups.map(([cat, list]) => (
          <section key={cat}>
            <h2 className="font-display mb-3 text-[20px] font-bold capitalize">{cat}</h2>
            <div className="divide-y divide-line border-y border-line">
              {list.map((i) => (
                <ItemRow key={i.id} item={i} types={types} save={save} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function NewItem({ categories, types, save, onDone }: { categories: string[]; types: BookingType[]; save: Save; onDone: () => void }) {
  const [f, setF] = useState({ kind: types.length ? "service" : "product", title: "", category: categories[0] ?? "", body: "", price: "", option: "", duration: "" });
  return (
    <form
      className="mb-10 grid max-w-[820px] gap-3 rounded-2xl border border-line p-5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await save(
          "/api/knowledge",
          "POST",
          {
            kind: f.kind,
            title: f.title,
            category: f.category || "general",
            body: f.body,
            data: f.kind === "service" ? { durationMinutes: f.duration ? Number(f.duration) : null, bookingType: types.length === 1 ? types[0].key : null } : {},
            variants: f.price ? [{ option: f.option || null, priceMinor: toMinor(f.price), stock: null }] : [],
          },
          `${f.title} added.`,
        );
        if (ok) onDone();
      }}
    >
      <div>
        <Label htmlFor="ni-t">Name</Label>
        <Input id="ni-t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ni-k">Kind</Label>
          <select id="ni-k" className="h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px]" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="product">Product</option>
            <option value="service">Service</option>
          </select>
        </div>
        <div>
          <Label htmlFor="ni-c">Category</Label>
          <Input id="ni-c" list="ni-cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="general" />
          <datalist id="ni-cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="ni-b">Description</Label>
        <Textarea id="ni-b" rows={2} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ni-o" hint="optional">Option</Label>
          <Input id="ni-o" value={f.option} onChange={(e) => setF({ ...f, option: e.target.value })} placeholder="e.g. Large" />
        </div>
        <div>
          <Label htmlFor="ni-p">Price</Label>
          <Input id="ni-p" type="number" min={0} step="0.01" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        </div>
      </div>
      {f.kind === "service" ? (
        <div>
          <Label htmlFor="ni-d">Takes (minutes)</Label>
          <Input id="ni-d" type="number" min={5} step={5} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} />
        </div>
      ) : (
        <div />
      )}
      <div className="sm:col-span-2">
        <Button type="submit" variant="primary" disabled={!f.title.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
}

function ItemRow({ item, types, save }: { item: Item; types: BookingType[]; save: Save }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [category, setCategory] = useState(item.category);
  const [note, setNote] = useState(item.availabilityNote ?? "");
  useEffect(() => setNote(item.availabilityNote ?? ""), [item.availabilityNote]);
  const d = item.data as { vegetarian?: boolean; vegan?: boolean; halal?: boolean; spicy?: boolean; allergens?: string[]; durationMinutes?: number | null; bookingType?: string | null };
  const dirty = title !== item.title || body !== item.body || category !== item.category;
  return (
    <div className={cx("grid grid-cols-1 gap-4 py-4 md:grid-cols-[1.2fr_1.4fr_1fr] md:items-start", !item.available && "bg-signal/[0.04]")}>
      <div>
        <button onClick={() => setOpen((v) => !v)} className="text-left" aria-expanded={open}>
          <span className="text-[15px] font-medium">{item.title}</span>
          <span className="ml-2 text-[12px] text-muted">{open ? "close" : "edit"}</span>
        </button>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.kind === "service" ? <Chip>Service{d.durationMinutes ? `, ${d.durationMinutes} min` : ""}</Chip> : null}
          {d.vegan ? <Chip>Vegan</Chip> : d.vegetarian ? <Chip>Vegetarian</Chip> : null}
          {d.halal === false ? <Chip tone="signal">Contains alcohol</Chip> : null}
          {d.spicy ? <Chip>Spicy</Chip> : null}
          {item.tags.filter((x) => !["vegan", "vegetarian", "spicy", "halal"].includes(x)).slice(0, 3).map((x) => (
            <Chip key={x}>{x}</Chip>
          ))}
          {d.allergens?.length ? <span className="text-[12px] text-muted">Allergens: {d.allergens.join(", ")}</span> : null}
        </div>
        {!open && item.body ? <p className="mt-1.5 line-clamp-2 text-[13px] text-muted">{item.body}</p> : null}
        {open ? (
          <div className="mt-3 space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Name" />
            <Input value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" />
            <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Description" />
            {item.kind === "service" ? (
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min={5} step={5} defaultValue={d.durationMinutes ?? ""} aria-label="Duration in minutes" placeholder="Minutes" onBlur={(e) => Number(e.target.value || 0) !== (d.durationMinutes ?? 0) && save(`/api/knowledge/items/${item.id}`, "PATCH", { data: { ...item.data, durationMinutes: e.target.value ? Number(e.target.value) : null } })} />
                <select className="h-10 rounded-[10px] border border-line bg-raised px-2 text-[13px]" defaultValue={d.bookingType ?? ""} aria-label="Booked as" onChange={(e) => save(`/api/knowledge/items/${item.id}`, "PATCH", { data: { ...item.data, bookingType: e.target.value || null } })}>
                  <option value="">Not bookable in chat</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.key}>
                      Booked as {t.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button size="sm" variant="brass" disabled={!dirty} onClick={() => save(`/api/knowledge/items/${item.id}`, "PATCH", { title, body, category })}>
                Save
              </Button>
              <Button size="sm" variant="danger" className="ml-auto" onClick={() => window.confirm(`Delete ${item.title}?`) && save(`/api/knowledge/items/${item.id}`, "DELETE", undefined, `${item.title} deleted.`)}>
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          {item.variants.map((v) => (
            <VariantInput key={v.id} v={v} save={save} editing={open} />
          ))}
          {!item.variants.length ? <span className="text-[13px] text-muted">No price yet</span> : null}
        </div>
        {open ? <AddVariant itemId={item.id} save={save} /> : null}
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2.5 text-[14px]">
          <Switch
            checked={item.available}
            onCheckedChange={(on) => save(`/api/knowledge/items/${item.id}`, "PATCH", { available: on, availabilityNote: on ? null : note || "Not available today" }, on ? `${item.title} is back on.` : `${item.title} marked unavailable today.`)}
            label="Available today"
          />
          {item.available ? "Available today" : <span className="text-signal-ink">Not available today</span>}
        </label>
        {!item.available ? (
          <div className="flex gap-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What to tell customers" className="h-8 text-[13px]" />
            <Button size="sm" onClick={() => save(`/api/knowledge/items/${item.id}`, "PATCH", { availabilityNote: note })}>
              Save
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VariantInput({ v, save, editing }: { v: Variant; save: Save; editing: boolean }) {
  const [price, setPrice] = useState(major(v.priceMinor));
  const [stock, setStock] = useState(v.stock === null ? "" : String(v.stock));
  useEffect(() => setPrice(major(v.priceMinor)), [v.priceMinor]);
  useEffect(() => setStock(v.stock === null ? "" : String(v.stock)), [v.stock]);
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1", v.stock === 0 ? "border-signal/50" : "border-line")}>
      <span className="text-[12px] text-muted">{label(v) || "Price"}</span>
      <input
        className="num w-14 bg-transparent text-[14px] focus:outline-none"
        value={price}
        inputMode="decimal"
        onChange={(e) => setPrice(e.target.value)}
        onBlur={() => {
          const m = toMinor(price);
          if (Number.isFinite(m) && m !== v.priceMinor) void save(`/api/knowledge/variants/${v.id}`, "PATCH", { priceMinor: m }, "Price updated.");
        }}
        aria-label={`Price ${label(v)}`}
      />
      {v.stock !== null || editing ? (
        <>
          <span className="text-[11px] text-muted">stock</span>
          <input
            className={cx("num w-9 bg-transparent text-[13px] focus:outline-none", v.stock === 0 && "text-signal-ink")}
            value={stock}
            placeholder="∞"
            inputMode="numeric"
            onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
            onBlur={() => {
              const n = stock === "" ? null : Number(stock);
              if (n !== v.stock) void save(`/api/knowledge/variants/${v.id}`, "PATCH", { stock: n }, "Stock updated.");
            }}
            aria-label={`Stock ${label(v)}`}
            title="Leave empty if it's made to order or there's no stock count"
          />
        </>
      ) : null}
      {editing ? (
        <button className="text-[12px] text-muted hover:text-signal-ink" aria-label={`Remove ${label(v) || "price"}`} onClick={() => save(`/api/knowledge/variants/${v.id}`, "DELETE", undefined, "Option removed.")}>
          ×
        </button>
      ) : null}
    </span>
  );
}

function AddVariant({ itemId, save }: { itemId: string; save: Save }) {
  const [opt, setOpt] = useState("");
  const [price, setPrice] = useState("");
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await save(`/api/knowledge/items/${itemId}/variants`, "POST", { option: opt || null, priceMinor: toMinor(price) }, "Option added.")) {
          setOpt("");
          setPrice("");
        }
      }}
    >
      <Input className="h-8 flex-1 text-[13px]" value={opt} onChange={(e) => setOpt(e.target.value)} placeholder="Option (e.g. Large, Long hair)" aria-label="New option" />
      <Input className="h-8 w-24 text-[13px]" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" aria-label="New option price" required />
      <Button size="sm" type="submit">
        Add
      </Button>
    </form>
  );
}

const UNIT: Record<BookingType["unit"], { label: string; capacity: string }> = {
  party: { label: "Tables / groups, by number of people", capacity: "Seats per time slot" },
  appointment: { label: "Appointments, one service per booking", capacity: "Staff or stations at once" },
  day: { label: "Whole days (rooms, rentals)", capacity: "Units per day" },
};

function Bookings({ types, canEdit, onChange }: { types: BookingType[]; canEdit: boolean; onChange: () => void }) {
  const save = useSaver(onChange);
  return (
    <div className="max-w-[900px]">
      <p className="mb-6 text-[14px] text-fg-2">How customers book with you in chat. The assistant checks your opening hours, these limits and existing bookings before offering a time.</p>
      {!types.length ? <p className="mb-6 text-[15px] text-muted">You don&apos;t take bookings in chat yet.</p> : null}
      <ul className="space-y-4">
        {types.map((b) => (
          <BookingTypeRow key={b.id} b={b} canEdit={canEdit} save={save} />
        ))}
      </ul>
      {canEdit ? (
        <Button className="mt-5" variant="brass" onClick={() => save("/api/knowledge/booking-types", "POST", { name: "Appointment", unit: "appointment", capacity: 1, durationMinutes: 60, slotMinutes: 30, maxPerBooking: 1, leadMinutes: 60 }, "Booking type added.")}>
          Add a way to book
        </Button>
      ) : (
        <p className="mt-5 text-[13px] text-muted">Only the owner can change booking rules.</p>
      )}
    </div>
  );
}

function BookingTypeRow({ b, canEdit, save }: { b: BookingType; canEdit: boolean; save: Save }) {
  const [f, setF] = useState(b);
  useEffect(() => setF(b), [b]);
  const dirty = JSON.stringify(f) !== JSON.stringify(b);
  const n = (k: keyof BookingType) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Math.max(0, Number(e.target.value || 0)) });
  return (
    <li className={cx("rounded-2xl border border-line p-5", !b.active && "opacity-60")}>
      <fieldset disabled={!canEdit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <div>
            <Label>Name</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div>
            <Label>Kind</Label>
            <select className="h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px]" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as BookingType["unit"] })}>
              {(Object.keys(UNIT) as BookingType["unit"][]).map((u) => (
                <option key={u} value={u}>
                  {UNIT[u].label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex h-10 items-center gap-2 text-[13px]">
            <Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} label="Active" disabled={!canEdit} />
            {f.active ? "On" : "Off"}
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          <div>
            <Label>{UNIT[f.unit].capacity}</Label>
            <Input type="number" min={1} value={f.capacity} onChange={n("capacity")} />
          </div>
          {f.unit !== "day" ? (
            <>
              <div>
                <Label>Lasts (min)</Label>
                <Input type="number" min={5} step={5} value={f.durationMinutes} onChange={n("durationMinutes")} />
              </div>
              <div>
                <Label>Starts every (min)</Label>
                <Input type="number" min={5} step={5} value={f.slotMinutes} onChange={n("slotMinutes")} />
              </div>
            </>
          ) : null}
          <div>
            <Label>{f.unit === "party" ? "Max people" : "Max per booking"}</Label>
            <Input type="number" min={1} value={f.maxPerBooking} onChange={n("maxPerBooking")} />
          </div>
          <div>
            <Label>Min notice (min)</Label>
            <Input type="number" min={0} step={15} value={f.leadMinutes} onChange={n("leadMinutes")} />
          </div>
        </div>
        <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes for customers: deposits, holding time, walk-ins…" aria-label="Notes" />
        {canEdit ? (
          <div className="flex gap-2">
            <Button size="sm" variant="brass" disabled={!dirty} onClick={() => save(`/api/knowledge/booking-types/${b.id}`, "PATCH", { name: f.name, unit: f.unit, capacity: Math.max(1, f.capacity), durationMinutes: Math.max(5, f.durationMinutes), slotMinutes: Math.max(5, f.slotMinutes), maxPerBooking: Math.max(1, f.maxPerBooking), leadMinutes: f.leadMinutes, notes: f.notes, active: f.active })}>
              Save
            </Button>
            <Button size="sm" variant="danger" className="ml-auto" onClick={() => window.confirm(`Delete “${b.name}”? Existing bookings stay in your diary.`) && save(`/api/knowledge/booking-types/${b.id}`, "DELETE", undefined, "Booking type deleted.")}>
              Delete
            </Button>
          </div>
        ) : null}
      </fieldset>
    </li>
  );
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABEL: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
const EMPTY_HOURS: HoursData = { weekly: {}, lastOrdersMinutesBeforeClose: 0, exceptions: [] };

function Hours({ item, onChange }: { item?: Item; onChange: () => void }) {
  const save = useSaver(onChange);
  const [h, setH] = useState<HoursData>(EMPTY_HOURS);
  useEffect(() => setH(item ? { ...EMPTY_HOURS, ...(structuredClone(item.data) as unknown as HoursData) } : EMPTY_HOURS), [item]);
  const setDay = (d: string, v: [string, string][]) => setH({ ...h, weekly: { ...h.weekly, [d]: v } });
  const persist = () => (item ? save(`/api/knowledge/items/${item.id}`, "PATCH", { data: h }, "Hours saved. Live now.") : save("/api/knowledge", "POST", { kind: "hours", category: "hours", title: "Opening hours", data: h }, "Hours saved. Live now."));
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <section>
        <h2 className="font-display mb-3 text-[20px] font-bold">Weekly hours</h2>
        {!item ? <p className="mb-3 text-[13px] text-muted">No hours on file yet: the assistant tells customers it doesn&apos;t know. Set them and save.</p> : null}
        <div className="divide-y divide-line border-y border-line">
          {DAYS.map((d) => {
            const iv = h.weekly[d] ?? [];
            return (
              <div key={d} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-24 text-[14px]">{DAY_LABEL[d]}</span>
                <Switch checked={iv.length > 0} onCheckedChange={(on) => setDay(d, on ? [["09:00", "18:00"]] : [])} label={`Open on ${DAY_LABEL[d]}`} />
                {iv.length ? (
                  <span className="flex flex-wrap items-center gap-2">
                    {iv.map(([a, b], i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <Input type="time" value={a} onChange={(e) => setDay(d, iv.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} className="num h-8 w-28" aria-label={`${DAY_LABEL[d]} opens`} />
                        <span className="text-muted">to</span>
                        <Input type="time" value={b} onChange={(e) => setDay(d, iv.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} className="num h-8 w-28" aria-label={`${DAY_LABEL[d]} closes`} />
                        {iv.length > 1 ? (
                          <button className="px-1 text-[12px] text-muted hover:text-signal-ink" onClick={() => setDay(d, iv.filter((_, j) => j !== i))} aria-label="Remove interval">
                            ×
                          </button>
                        ) : null}
                      </span>
                    ))}
                    {iv.length < 3 ? (
                      <button className="text-[12px] text-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => setDay(d, [...iv, ["17:00", "22:00"]])}>
                        add a break
                      </button>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-[13px] text-muted">Closed</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 max-w-[260px]">
          <Label htmlFor="lo">Last orders before closing (minutes)</Label>
          <Input id="lo" type="number" min={0} max={240} value={h.lastOrdersMinutesBeforeClose} onChange={(e) => setH({ ...h, lastOrdersMinutesBeforeClose: Number(e.target.value || 0) })} />
        </div>
      </section>
      <section>
        <h2 className="font-display mb-3 text-[20px] font-bold">Holidays and special days</h2>
        <div className="space-y-2">
          {h.exceptions.map((ex, idx) => (
            <div key={idx} className="grid grid-cols-[140px_1fr_auto] items-center gap-2">
              <Input type="date" value={ex.date} onChange={(e) => setH({ ...h, exceptions: h.exceptions.map((x, i) => (i === idx ? { ...x, date: e.target.value } : x)) })} className="num h-8" />
              <Input value={ex.note} onChange={(e) => setH({ ...h, exceptions: h.exceptions.map((x, i) => (i === idx ? { ...x, note: e.target.value } : x)) })} className="h-8" placeholder="What's different" />
              <div className="flex items-center gap-1">
                <Input type="time" value={ex.hours[0]?.[0] ?? ""} onChange={(e) => setH({ ...h, exceptions: h.exceptions.map((x, i) => (i === idx ? { ...x, hours: e.target.value ? [[e.target.value, x.hours[0]?.[1] ?? "18:00"]] : [] } : x)) })} className="num h-8 w-24" aria-label="Opens" />
                <Input type="time" value={ex.hours[0]?.[1] ?? ""} onChange={(e) => setH({ ...h, exceptions: h.exceptions.map((x, i) => (i === idx ? { ...x, hours: [[x.hours[0]?.[0] ?? "09:00", e.target.value]] } : x)) })} className="num h-8 w-24" aria-label="Closes" />
                <button className="px-2 text-[12px] text-muted hover:text-signal-ink" onClick={() => setH({ ...h, exceptions: h.exceptions.filter((_, i) => i !== idx) })}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <p className="text-[12.5px] text-muted">Leave the times empty to be closed that day.</p>
          <Button size="sm" variant="ghost" onClick={() => setH({ ...h, exceptions: [...h.exceptions, { date: new Date().toISOString().slice(0, 10), hours: [], note: "Closed" }] })}>
            Add a special day
          </Button>
        </div>
        <div className="mt-8">
          <Button variant="primary" onClick={persist}>
            Save hours
          </Button>
        </div>
      </section>
    </div>
  );
}

function TextItems({ items, currency, onChange }: { items: Item[]; currency: string; onChange: () => void }) {
  const save = useSaver(onChange);
  const [f, setF] = useState({ title: "", category: "", body: "" });
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px]">
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 xl:grid-cols-2">
        {!items.length ? <p className="text-[15px] text-muted">No policies yet. Payment, cancellations, returns and parking are the usual ones.</p> : null}
        {items.map((p) => (
          <PolicyEditor key={p.id} item={p} currency={currency} save={save} />
        ))}
      </div>
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <h2 className="font-display text-[20px] font-bold">Add a policy</h2>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="np-t">Title</Label>
            <Input id="np-t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Cancellations" />
          </div>
          <div>
            <Label htmlFor="np-c" hint="one word">Topic</Label>
            <Input id="np-c" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="booking" />
          </div>
          <div>
            <Label htmlFor="np-b">Text</Label>
            <Textarea id="np-b" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          </div>
          <Button variant="primary" disabled={!f.title.trim() || !f.body.trim()} onClick={async () => (await save("/api/knowledge", "POST", { kind: "policy", category: f.category || "general", title: f.title, body: f.body }, "Policy added. Live now.")) && setF({ title: "", category: "", body: "" })}>
            Add policy
          </Button>
        </div>
      </aside>
    </div>
  );
}

function PolicyEditor({ item, currency, save }: { item: Item; currency: string; save: Save }) {
  const [body, setBody] = useState(item.body);
  useEffect(() => setBody(item.body), [item.body]);
  const dirty = body !== item.body;
  const zones = (item.data.zones as { name: string; areas: string[]; fee: number; minOrder: number; eta: string }[] | undefined) ?? [];
  const extras = (item.data.extras as { name: string; priceMinor: number }[] | undefined) ?? [];
  return (
    <div className="border-t border-line pt-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-medium">{item.title}</h3>
        <span className="text-[12px] text-muted">{item.category}</span>
      </div>
      <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      {zones.length ? (
        <ul className="mt-2 space-y-1 text-[12.5px] text-fg-2">
          {zones.map((z) => (
            <li key={z.name}>
              <span className="font-medium">{z.name}</span>: {z.areas.join(", ")} · {currency} {z.fee} fee, {currency} {z.minOrder} minimum, {z.eta}
            </li>
          ))}
        </ul>
      ) : null}
      {extras.length ? <p className="mt-2 text-[12.5px] text-fg-2">{extras.map((e) => `${e.name} ${currency} ${major(e.priceMinor)}`).join(", ")}</p> : null}
      <div className="mt-2 flex h-8 gap-2">
        {dirty ? (
          <Button size="sm" variant="brass" onClick={() => save(`/api/knowledge/items/${item.id}`, "PATCH", { body })}>
            Save
          </Button>
        ) : null}
        <button className="ml-auto text-[12px] text-muted hover:text-signal-ink" onClick={() => window.confirm(`Delete “${item.title}”?`) && save(`/api/knowledge/items/${item.id}`, "DELETE", undefined, "Deleted.")}>
          Delete
        </button>
      </div>
    </div>
  );
}

function Faqs({ items, onChange }: { items: Item[]; onChange: () => void }) {
  const save = useSaver(onChange);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-line border-y border-line">
        {!items.length ? <li className="py-4 text-[15px] text-muted">No FAQs yet.</li> : null}
        {items.map((f) => (
          <FaqRow key={f.id} item={f} save={save} />
        ))}
      </ul>
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <h2 className="font-display text-[20px] font-bold">Add an FAQ</h2>
        <p className="mt-1 text-[13px] text-muted">Write the question the way customers type it. Typos and slang welcome.</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="nq">Question</Label>
            <Input id="nq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="can park nearby or not" />
          </div>
          <div>
            <Label htmlFor="na">Answer</Label>
            <Textarea id="na" rows={4} value={a} onChange={(e) => setA(e.target.value)} />
          </div>
          <Button
            variant="primary"
            disabled={q.trim().length < 2 || a.trim().length < 2}
            onClick={async () => {
              if (await save("/api/knowledge", "POST", { kind: "faq", category: "general", title: q, body: a }, "FAQ added. Live now.")) {
                setQ("");
                setA("");
              }
            }}
          >
            Add FAQ
          </Button>
        </div>
      </aside>
    </div>
  );
}

function FaqRow({ item, save }: { item: Item; save: Save }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  return (
    <li className="py-4">
      {edit ? (
        <div className="space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="brass" onClick={async () => (await save(`/api/knowledge/items/${item.id}`, "PATCH", { title, body })) && setEdit(false)}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEdit(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" className="ml-auto" onClick={() => save(`/api/knowledge/items/${item.id}`, "DELETE", undefined, "FAQ removed.")}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEdit(true)} className="block w-full text-left">
          <p className="text-[14px] text-muted">“{item.title}”</p>
          <p className="mt-1 text-[15px]">{item.body}</p>
        </button>
      )}
    </li>
  );
}

function Gaps({ gaps, onChange }: { gaps: Gap[]; onChange: () => void }) {
  const save = useSaver(onChange);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (!gaps.length) return <p className="text-[15px] text-muted">No open gaps. Questions the assistant couldn&apos;t answer show up here, so you can teach it once.</p>;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {gaps.map((g) => (
        <li key={g.id} className="grid grid-cols-1 gap-3 py-5 md:grid-cols-[260px_1fr_auto] md:items-start">
          <div>
            <p className="text-[15px] font-medium">{g.question}</p>
            <p className="num text-[12px] text-muted">
              asked {g.count}×, “{g.key}”
            </p>
          </div>
          <Textarea rows={2} value={answers[g.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [g.id]: e.target.value })} placeholder="Your answer" />
          <div className="flex gap-2">
            <Button size="sm" variant="brass" disabled={(answers[g.id] ?? "").trim().length < 2} onClick={() => save(`/api/knowledge/gaps/${g.id}`, "POST", { question: g.question, answer: answers[g.id], category: "general" }, "Answer added. Live now.")}>
              Publish
            </Button>
            <Button size="sm" variant="ghost" onClick={() => save(`/api/knowledge/gaps/${g.id}`, "DELETE", undefined, "Dismissed.")}>
              Dismiss
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
