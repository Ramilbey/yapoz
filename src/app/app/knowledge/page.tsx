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

type StockMode = "none" | "daily" | "tracked";
type StockInfo = { defaultMode: StockMode; lowStockDefault: number; today: string };
type Variant = { id: string; size: string | null; color: string | null; option: string | null; priceMinor: number; stock: number | null; dailyQty: number | null; lowStockAt: number | null };
type Item = { id: string; kind: string; category: string; slug: string; title: string; body: string; data: Record<string, unknown>; tags: string[]; available: boolean; inPerson: boolean; stockMode: StockMode | null; unavailableUntil: string | null; availabilityNote: string | null; active: boolean; variants: Variant[] };
type Gap = { id: string; key: string; question: string; count: number };
type HoursData = { weekly: Record<string, [string, string][]>; lastOrdersMinutesBeforeClose: number; exceptions: { date: string; hours: [string, string][]; note: string }[] };
type Data = { items: Item[]; gaps: Gap[]; dismissed: Gap[]; currency: string; stock: StockInfo };

const MODE_LABEL: Record<StockMode, string> = { none: "Made to order", daily: "Daily quantity", tracked: "Count stock" };
const intOrNull = (v: string) => (v === "" ? null : Number(v));

const TABS = [
  { key: "catalog", label: "Products and services" },
  { key: "hours", label: "Hours" },
  { key: "policies", label: "Policies and info" },
  { key: "faqs", label: "FAQs" },
  { key: "gaps", label: "Gaps" },
] as const;

export default function KnowledgePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("catalog");
  const { data, mutate } = useSWR<Data>("/api/knowledge", getJson);
  useLive(["kb_items", "kb_variants", "knowledge_gaps"],() => mutate(), 400);
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
      {data && tab === "catalog" ? <Catalog items={items.filter((i) => i.kind === "product" || i.kind === "service")} currency={data.currency} stock={data.stock} onChange={mutate} /> : null}
      {data && tab === "hours" ? <Hours item={items.find((i) => i.kind === "hours")} onChange={mutate} /> : null}
      {data && tab === "policies" ? <TextItems items={items.filter((i) => i.kind === "policy" || i.kind === "info")} currency={data.currency} onChange={mutate} /> : null}
      {data && tab === "faqs" ? <Faqs items={items.filter((i) => i.kind === "faq")} onChange={mutate} /> : null}
      {data && tab === "gaps" ? <Gaps gaps={data.gaps} dismissed={data.dismissed} onChange={mutate} /> : null}
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

function Catalog({ items, currency, stock, onChange }: { items: Item[]; currency: string; stock: StockInfo; onChange: () => void }) {
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
      {adding ? <NewItem categories={categories} save={save} onDone={() => setAdding(false)} /> : null}
      {!items.length && !adding ? <p className="text-[15px] text-muted">Nothing here yet. Add what you sell, or run setup again to draft it from your menu or price list.</p> : null}
      <div className="space-y-10">
        {groups.map(([cat, list]) => (
          <section key={cat}>
            <h2 className="font-display mb-3 text-[20px] font-bold capitalize">{cat}</h2>
            <div className="divide-y divide-line border-y border-line">
              {list.map((i) => (
                <ItemRow key={i.id} item={i} save={save} stock={stock} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function NewItem({ categories, save, onDone }: { categories: string[]; save: Save; onDone: () => void }) {
  const [f, setF] = useState({ kind: "product",title: "", category: categories[0] ?? "", body: "", price: "", option: "", duration: "" });
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
            data: f.kind === "service" ? { durationMinutes: f.duration ? Number(f.duration) : null } : {},
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

function ItemRow({ item, save, stock }: { item: Item; save: Save; stock: StockInfo }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [category, setCategory] = useState(item.category);
  const [note, setNote] = useState(item.availabilityNote ?? "");
  useEffect(() => setNote(item.availabilityNote ?? ""), [item.availabilityNote]);
  const d = item.data as { vegetarian?: boolean; vegan?: boolean; halal?: boolean; spicy?: boolean; allergens?: string[]; durationMinutes?: number | null };
  const mode: StockMode = item.kind === "product" ? item.stockMode ?? stock.defaultMode : "none";
  const offState = !item.available ? "until_on" : item.unavailableUntil && stock.today < item.unavailableUntil ? "today" : "on";
  const dirty = title !== item.title || body !== item.body || category !== item.category;
  return (
    <div className={cx("grid grid-cols-1 gap-4 py-4 md:grid-cols-[1.2fr_1.4fr_1fr] md:items-start", !item.available && "bg-signal/[0.04]")}>
      <div>
        <button onClick={() => setOpen((v) => !v)} className="text-left" aria-expanded={open}>
          <span className="text-[15px] font-medium">{item.title}</span>
          <span className="ml-2 text-[12px] text-muted">{open ? "close" : "edit"}</span>
        </button>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.kind === "service" ? <Chip>{item.inPerson ? "In person" : "Online"}{d.durationMinutes ? ` · ${d.durationMinutes} min` : ""}</Chip> : null}
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
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-[14px]">
                  <Switch checked={item.inPerson} onCheckedChange={(on) => save(`/api/knowledge/items/${item.id}`, "PATCH", { inPerson: on }, "Saved.")} label="In person (no meeting link)" />
                  In person (no meeting link)
                </label>
                <p className="text-[12px] text-muted">Online bookings get a video meeting link; in-person ones get your address.</p>
                <Label htmlFor={`dur-${item.id}`}>Duration (minutes)</Label>
                <Input
                  id={`dur-${item.id}`}
                  type="number"
                  min={5}
                  step={5}
                  defaultValue={d.durationMinutes ?? ""}
                  placeholder="Minutes"
                  onBlur={(e) => {
                    const n = e.target.value ? Number(e.target.value) : null;
                    if ((n ?? 0) === (d.durationMinutes ?? 0)) return;
                    const { durationMinutes: _old, ...rest } = item.data;
                    void _old;
                    save(`/api/knowledge/items/${item.id}`, "PATCH", { data: n ? { ...rest, durationMinutes: n } : rest }, "Saved.");
                  }}
                />
                <p className="text-[12px] text-muted">How long a booking takes. Empty = your time grid in Settings → Appointments.</p>
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
            <VariantInput key={v.id} v={v} save={save} editing={open} mode={mode} lowDefault={stock.lowStockDefault} />
          ))}
          {!item.variants.length ? <span className="text-[13px] text-muted">No price yet</span> : null}
        </div>
        {mode === "daily" ? <p className="mt-2 text-[12px] text-muted">You can plan each day on the Today page.</p> : null}
        {open ? <AddVariant itemId={item.id} save={save} /> : null}
      </div>
      <div className="space-y-2">
        {item.kind === "product" ? (
          <div className="space-y-2">
            <select
              className="h-9 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px]"
              value={item.stockMode ?? ""}
              aria-label={`Stock for ${item.title}`}
              onChange={(e) => save(`/api/knowledge/items/${item.id}`, "PATCH", { stockMode: e.target.value || null }, "Stock updated.")}
            >
              <option value="">Use business default ({MODE_LABEL[stock.defaultMode]})</option>
              <option value="none">Made to order</option>
              <option value="daily">Daily quantity</option>
              <option value="tracked">Count stock</option>
            </select>
            <select
              className={cx("h-9 w-full rounded-[10px] border bg-raised px-2 text-[14px]", offState === "on" ? "border-line" : "border-signal/50 text-signal-ink")}
              value={offState}
              aria-label={`Availability of ${item.title}`}
              onChange={(e) => save(`/api/knowledge/items/${item.id}`, "PATCH", { off: e.target.value }, e.target.value === "on" ? `${item.title} is back on.` : `${item.title} turned off.`)}
            >
              <option value="on">Available</option>
              <option value="today">Sold out today</option>
              <option value="until_on">Off until I turn it on</option>
            </select>
            {offState === "today" ? <p className="text-[12px] text-muted">Back on {item.unavailableUntil} automatically.</p> : null}
          </div>
        ) : (
          <label className="flex items-center gap-2.5 text-[14px]">
            <Switch
              checked={item.available}
              onCheckedChange={(on) => save(`/api/knowledge/items/${item.id}`, "PATCH", { available: on, availabilityNote: on ? null : note || "Not available today" }, on ? `${item.title} is back on.` : `${item.title} marked unavailable today.`)}
              label="Available today"
            />
            {item.available ? "Available today" : <span className="text-signal-ink">Not available today</span>}
          </label>
        )}
        {offState === "until_on" ? (
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

function VariantInput({ v, save, editing, mode, lowDefault }: { v: Variant; save: Save; editing: boolean; mode: StockMode; lowDefault: number }) {
  const [price, setPrice] = useState(major(v.priceMinor));
  const [stock, setStock] = useState(v.stock === null ? "" : String(v.stock));
  const [daily, setDaily] = useState(v.dailyQty === null ? "" : String(v.dailyQty));
  const [low, setLow] = useState(v.lowStockAt === null ? "" : String(v.lowStockAt));
  useEffect(() => setDaily(v.dailyQty === null ? "" : String(v.dailyQty)), [v.dailyQty]);
  useEffect(() => setLow(v.lowStockAt === null ? "" : String(v.lowStockAt)), [v.lowStockAt]);
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
      {mode === "daily" ? (
        <>
          <span className="text-[11px] text-muted">usual per day</span>
          <input
            className="num w-9 bg-transparent text-[13px] focus:outline-none"
            value={daily}
            placeholder="–"
            inputMode="numeric"
            onChange={(e) => setDaily(e.target.value.replace(/\D/g, ""))}
            onBlur={() => {
              const n = intOrNull(daily);
              if (n !== v.dailyQty) void save(`/api/knowledge/variants/${v.id}`, "PATCH", { dailyQty: n }, "Daily quantity updated.");
            }}
            aria-label={`Usual per day ${label(v)}`}
          />
          {v.dailyQty === null ? <span className="text-[11px] text-muted">not counted</span> : null}
        </>
      ) : null}
      {mode === "tracked" ? (
        <>
          <span className="text-[11px] text-muted">in stock</span>
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
            title="Leave empty if there's no stock count"
          />
          <span className="text-[11px] text-muted">alert below</span>
          <input
            className="num w-9 bg-transparent text-[13px] focus:outline-none"
            value={low}
            placeholder={String(lowDefault)}
            inputMode="numeric"
            onChange={(e) => setLow(e.target.value.replace(/\D/g, ""))}
            onBlur={() => {
              const n = intOrNull(low);
              if (n !== v.lowStockAt) void save(`/api/knowledge/variants/${v.id}`, "PATCH", { lowStockAt: n }, "Alert level updated.");
            }}
            aria-label={`Alert below ${label(v)}`}
            title="Empty uses the business default. 0 means never alert."
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
            <Input id="np-c" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="payment" />
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

function Gaps({ gaps, dismissed, onChange }: { gaps: Gap[]; dismissed: Gap[]; onChange: () => void }) {
  const save = useSaver(onChange);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showDismissed, setShowDismissed] = useState(false);
  return (
    <div>
      {!gaps.length ? (
        <p className="text-[15px] text-muted">No open gaps. Questions the assistant couldn&apos;t answer show up here, so you can teach it once.</p>
      ) : (
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
                <Button size="sm" variant="ghost" title="Not a real question: remove it from this list" onClick={() => save(`/api/knowledge/gaps/${g.id}`, "DELETE", undefined, "Dismissed. It won't come back, but you can restore it below.")}>
                  Dismiss
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {dismissed.length ? (
        <div className="mt-8">
          <button type="button" className="text-[13px] text-fg-2 underline decoration-brass underline-offset-4" aria-expanded={showDismissed} onClick={() => setShowDismissed((v) => !v)}>
            {showDismissed ? "Hide" : "Show"} dismissed ({dismissed.length})
          </button>
          {showDismissed ? (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {dismissed.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] text-fg-2">{g.question}</p>
                    <p className="num text-[12px] text-muted">asked {g.count}×</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => save(`/api/knowledge/gaps/${g.id}`, "PATCH", undefined, "Restored.")}>
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
