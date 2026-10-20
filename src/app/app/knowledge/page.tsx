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

type Variant = { id: string; size: string | null; color: string | null; priceMinor: number; stock: number | null };
type Item = { id: string; kind: string; category: string; slug: string; title: string; body: string; data: Record<string, unknown>; available: boolean; availabilityNote: string | null; active: boolean; variants: Variant[] };
type Gap = { id: string; key: string; question: string; count: number };
type HoursData = { weekly: Record<string, [string, string][]>; lastOrdersMinutesBeforeClose: number; exceptions: { date: string; hours: [string, string][]; note: string }[] };

const TABS = [
  { key: "menu", label: "Menu and stock" },
  { key: "merch", label: "Merch" },
  { key: "hours", label: "Hours" },
  { key: "policies", label: "Policies" },
  { key: "faqs", label: "FAQs" },
  { key: "gaps", label: "Gaps" },
] as const;

export default function KnowledgePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("menu");
  const { data, mutate } = useSWR<{ items: Item[]; gaps: Gap[] }>("/api/knowledge", getJson);
  useLive(["kb_items", "kb_variants", "knowledge_gaps"], () => mutate(), 400);
  const items = data?.items ?? [];
  return (
    <div>
      <PageHeader title="Knowledge" description="Everything the agent is allowed to say comes from here. Edits go live on the next message: no retraining, no publish step." />
      <div className="mb-8 flex flex-wrap gap-1.5" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cx("h-8 rounded-full border px-3.5 text-[13px]", tab === t.key ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}>
            {t.label}
            {t.key === "gaps" && data?.gaps.length ? <span className="num ml-1.5 opacity-70">{data.gaps.length}</span> : null}
          </button>
        ))}
      </div>
      {!data ? <p className="text-muted">Loading…</p> : null}
      {data && tab === "menu" ? <Menu items={items.filter((i) => i.kind === "product" && i.category !== "merch")} extras={items.find((i) => i.slug === "extras")} onChange={mutate} /> : null}
      {data && tab === "merch" ? <Merch items={items.filter((i) => i.category === "merch")} onChange={mutate} /> : null}
      {data && tab === "hours" ? <Hours item={items.find((i) => i.kind === "hours")} delivery={items.find((i) => i.slug === "delivery")} onChange={mutate} /> : null}
      {data && tab === "policies" ? <TextItems items={items.filter((i) => i.kind === "policy")} onChange={mutate} /> : null}
      {data && tab === "faqs" ? <Faqs items={items.filter((i) => i.kind === "faq")} onChange={mutate} /> : null}
      {data && tab === "gaps" ? <Gaps gaps={data.gaps} onChange={mutate} /> : null}
    </div>
  );
}

function useSaver(onChange: () => void) {
  const toast = useToast();
  return async (url: string, method: "PATCH" | "POST" | "DELETE", body?: unknown, msg = "Saved. The agent uses it from the next message.") => {
    try {
      await send(url, method, body);
      onChange();
      toast(msg);
      return true;
    } catch (e) {
      toast((e as Error).message, "error");
      return false;
    }
  };
}

const rm = (minor: number) => (minor / 100).toFixed(minor % 100 ? 2 : 0);

function Menu({ items, extras, onChange }: { items: Item[]; extras?: Item; onChange: () => void }) {
  const save = useSaver(onChange);
  const groups = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of items) m.set(i.category, [...(m.get(i.category) ?? []), i]);
    return [...m.entries()];
  }, [items]);
  return (
    <div className="space-y-10">
      {groups.map(([cat, list]) => (
        <section key={cat}>
          <h2 className="font-display mb-3 text-[20px] font-bold capitalize">{cat}</h2>
          <div className="divide-y divide-line border-y border-line">
            {list.map((i) => (
              <ProductRow key={i.id} item={i} save={save} />
            ))}
          </div>
        </section>
      ))}
      {extras ? (
        <section>
          <h2 className="font-display mb-3 text-[20px] font-bold">Extras</h2>
          <p className="text-[14px] text-fg-2">{((extras.data.extras as { name: string; priceMinor: number }[]) ?? []).map((e) => `${e.name} RM ${rm(e.priceMinor)}`).join(", ")}</p>
        </section>
      ) : null}
    </div>
  );
}

function ProductRow({ item, save }: { item: Item; save: ReturnType<typeof useSaver> }) {
  const [note, setNote] = useState(item.availabilityNote ?? "");
  const [body, setBody] = useState(item.body);
  const [open, setOpen] = useState(false);
  useEffect(() => setNote(item.availabilityNote ?? ""), [item.availabilityNote]);
  const d = item.data as { vegetarian?: boolean; vegan?: boolean; halal?: boolean; spicy?: boolean; allergens?: string[] };
  return (
    <div className={cx("grid grid-cols-1 gap-4 py-4 md:grid-cols-[1.4fr_1fr_1.2fr] md:items-start", !item.available && "bg-signal/[0.04]")}>
      <div>
        <button onClick={() => setOpen((v) => !v)} className="text-left">
          <span className="text-[15px] font-medium">{item.title}</span>
        </button>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {d.vegan ? <Chip>Vegan</Chip> : d.vegetarian ? <Chip>Vegetarian</Chip> : null}
          {d.halal === false ? <Chip tone="signal">Contains alcohol</Chip> : null}
          {d.spicy ? <Chip>Spicy</Chip> : null}
          {d.allergens?.length ? <span className="text-[12px] text-muted">Allergens: {d.allergens.join(", ")}</span> : null}
        </div>
        {open ? (
          <div className="mt-3 space-y-2">
            <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
            <Button size="sm" onClick={() => save(`/api/knowledge/items/${item.id}`, "PATCH", { body })}>Save description</Button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {item.variants.map((v) => (
          <PriceInput key={v.id} v={v} save={save} />
        ))}
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2.5 text-[14px]">
          <Switch checked={item.available} onCheckedChange={(on) => save(`/api/knowledge/items/${item.id}`, "PATCH", { available: on, availabilityNote: on ? null : note || "Sold out today" }, on ? `${item.title} is back on.` : `${item.title} marked sold out today.`)} label="Available today" />
          {item.available ? "Available today" : <span className="text-signal-ink">Sold out today</span>}
        </label>
        {!item.available ? (
          <div className="flex gap-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What to tell customers" className="h-8 text-[13px]" />
            <Button size="sm" onClick={() => save(`/api/knowledge/items/${item.id}`, "PATCH", { availabilityNote: note })}>Save</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PriceInput({ v, save }: { v: Variant; save: ReturnType<typeof useSaver> }) {
  const [val, setVal] = useState(rm(v.priceMinor));
  useEffect(() => setVal(rm(v.priceMinor)), [v.priceMinor]);
  return (
    <label className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1">
      <span className="text-[12px] text-muted">{v.size ?? "Price"}</span>
      <span className="text-[12px] text-muted">RM</span>
      <input
        className="num w-12 bg-transparent text-[14px] focus:outline-none"
        value={val}
        inputMode="decimal"
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          const minor = Math.round(Number(val) * 100);
          if (Number.isFinite(minor) && minor !== v.priceMinor) void save(`/api/knowledge/variants/${v.id}`, "PATCH", { priceMinor: minor }, "Price updated.");
        }}
        aria-label={`Price ${v.size ?? ""}`}
      />
    </label>
  );
}

function Merch({ items, onChange }: { items: Item[]; onChange: () => void }) {
  const save = useSaver(onChange);
  return (
    <div className="space-y-10">
      {items.map((i) => {
        const colors = [...new Set(i.variants.map((v) => v.color))] as string[];
        const sizes = [...new Set(i.variants.map((v) => v.size))] as string[];
        return (
          <section key={i.id}>
            <h2 className="font-display text-[20px] font-bold">{i.title}</h2>
            <p className="mt-1 text-[14px] text-muted">RM {rm(i.variants[0]?.priceMinor ?? 0)}. {i.body}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted">
                    <th className="py-2 pr-6 font-normal">Stock by colour and size</th>
                    {sizes.map((s) => (
                      <th key={s} className="px-2 py-2 text-center font-normal">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colors.map((c) => (
                    <tr key={c} className="border-t border-line">
                      <td className="py-2 pr-6">{c}</td>
                      {sizes.map((s) => {
                        const v = i.variants.find((x) => x.color === c && x.size === s)!;
                        return (
                          <td key={s} className="px-2 py-2">
                            <StockInput v={v} save={save} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StockInput({ v, save }: { v: Variant; save: ReturnType<typeof useSaver> }) {
  const [val, setVal] = useState(String(v.stock ?? 0));
  useEffect(() => setVal(String(v.stock ?? 0)), [v.stock]);
  return (
    <input
      className={cx("num h-9 w-16 rounded-lg border bg-raised text-center text-[14px] focus:border-brass focus:outline-none", Number(val) === 0 ? "border-signal/50 text-signal-ink" : "border-line")}
      value={val}
      inputMode="numeric"
      onChange={(e) => setVal(e.target.value.replace(/\D/g, ""))}
      onBlur={() => {
        const n = Number(val || 0);
        if (n !== v.stock) void save(`/api/knowledge/variants/${v.id}`, "PATCH", { stock: n }, "Stock updated.");
      }}
      aria-label={`Stock ${v.color} ${v.size}`}
    />
  );
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABEL: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

function Hours({ item, delivery, onChange }: { item?: Item; delivery?: Item; onChange: () => void }) {
  const save = useSaver(onChange);
  const [h, setH] = useState<HoursData | null>(null);
  useEffect(() => setH(item ? (structuredClone(item.data) as unknown as HoursData) : null), [item]);
  if (!item || !h) return <p className="text-muted">No hours on file.</p>;
  const setDay = (d: string, v: [string, string][]) => setH({ ...h, weekly: { ...h.weekly, [d]: v } });
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <section>
        <h2 className="font-display mb-3 text-[20px] font-bold">Weekly hours</h2>
        <div className="divide-y divide-line border-y border-line">
          {DAYS.map((d) => {
            const iv = h.weekly[d] ?? [];
            const closed = iv.length === 0;
            return (
              <div key={d} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-28 text-[14px]">{DAY_LABEL[d]}</span>
                <label className="flex items-center gap-2 text-[13px] text-muted">
                  <Switch checked={!closed} onCheckedChange={(on) => setDay(d, on ? [["12:00", "22:00"]] : [])} label={`Open on ${DAY_LABEL[d]}`} />
                  {closed ? "Closed" : "Open"}
                </label>
                {!closed ? (
                  <span className="flex items-center gap-2">
                    <Input type="time" value={iv[0][0]} onChange={(e) => setDay(d, [[e.target.value, iv[0][1]]])} className="h-8 w-28 num" />
                    <span className="text-muted">to</span>
                    <Input type="time" value={iv[0][1]} onChange={(e) => setDay(d, [[iv[0][0], e.target.value]])} className="h-8 w-28 num" />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        <h2 className="font-display mb-3 mt-10 text-[20px] font-bold">Holiday and special days</h2>
        <div className="space-y-2">
          {h.exceptions.map((ex, idx) => (
            <div key={idx} className="grid grid-cols-[140px_1fr_auto] items-center gap-2">
              <Input type="date" value={ex.date} onChange={(e) => setH({ ...h, exceptions: h.exceptions.map((x, i) => (i === idx ? { ...x, date: e.target.value } : x)) })} className="h-8 num" />
              <Input value={ex.note} onChange={(e) => setH({ ...h, exceptions: h.exceptions.map((x, i) => (i === idx ? { ...x, note: e.target.value } : x)) })} className="h-8" placeholder="What's different" />
              <div className="flex items-center gap-1">
                <Input type="time" value={ex.hours[0]?.[0] ?? ""} onChange={(e) => setH({ ...h, exceptions: h.exceptions.map((x, i) => (i === idx ? { ...x, hours: e.target.value ? [[e.target.value, x.hours[0]?.[1] ?? "22:00"]] : [] } : x)) })} className="h-8 w-24 num" aria-label="Opens" />
                <Input type="time" value={ex.hours[0]?.[1] ?? ""} onChange={(e) => setH({ ...h, exceptions: h.exceptions.map((x, i) => (i === idx ? { ...x, hours: [[x.hours[0]?.[0] ?? "12:00", e.target.value]] } : x)) })} className="h-8 w-24 num" aria-label="Closes" />
                <button className="px-2 text-[12px] text-muted hover:text-signal-ink" onClick={() => setH({ ...h, exceptions: h.exceptions.filter((_, i) => i !== idx) })}>Remove</button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setH({ ...h, exceptions: [...h.exceptions, { date: new Date().toISOString().slice(0, 10), hours: [], note: "Closed" }] })}>Add a special day</Button>
        </div>
        <div className="mt-6">
          <Button variant="primary" onClick={() => save(`/api/knowledge/items/${item.id}`, "PATCH", { data: h }, "Hours saved. Live now.")}>Save hours</Button>
        </div>
      </section>
      <section>
        <h2 className="font-display mb-3 text-[20px] font-bold">Delivery zones</h2>
        {delivery ? (
          <div className="divide-y divide-line border-y border-line">
            {((delivery.data.zones as { name: string; areas: string[]; fee: number; minOrder: number; eta: string }[]) ?? []).map((z) => (
              <div key={z.name} className="py-3">
                <div className="flex justify-between text-[14px]">
                  <span className="font-medium">{z.name}</span>
                  <span className="num text-fg-2">RM {z.fee} fee, RM {z.minOrder} minimum, {z.eta}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">{z.areas.join(", ")}</p>
              </div>
            ))}
            <p className="py-3 text-[13px] text-muted">{delivery.body}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function TextItems({ items, onChange }: { items: Item[]; onChange: () => void }) {
  const save = useSaver(onChange);
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
      {items.map((p) => (
        <PolicyEditor key={p.id} item={p} save={save} />
      ))}
    </div>
  );
}

function PolicyEditor({ item, save }: { item: Item; save: ReturnType<typeof useSaver> }) {
  const [body, setBody] = useState(item.body);
  const dirty = body !== item.body;
  return (
    <div className="border-t border-line pt-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[15px] font-medium">{item.title}</h3>
        <span className="text-[12px] text-muted">{item.category}</span>
      </div>
      <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="mt-2 h-8">{dirty ? <Button size="sm" variant="brass" onClick={() => save(`/api/knowledge/items/${item.id}`, "PATCH", { body })}>Save</Button> : null}</div>
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
        {items.map((f) => (
          <FaqRow key={f.id} item={f} save={save} />
        ))}
      </ul>
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <h2 className="font-display text-[20px] font-bold">Add an FAQ</h2>
        <p className="mt-1 text-[13px] text-muted">Write the question the way customers type it. Typos welcome.</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="nq">Question</Label>
            <Input id="nq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="got gluten free or not" />
          </div>
          <div>
            <Label htmlFor="na">Answer</Label>
            <Textarea id="na" rows={4} value={a} onChange={(e) => setA(e.target.value)} />
          </div>
          <Button variant="primary" disabled={q.trim().length < 2 || a.trim().length < 2} onClick={async () => { if (await save("/api/knowledge", "POST", { kind: "faq", category: "menu", title: q, body: a }, "FAQ added. Live now.")) { setQ(""); setA(""); } }}>
            Add FAQ
          </Button>
        </div>
      </aside>
    </div>
  );
}

function FaqRow({ item, save }: { item: Item; save: ReturnType<typeof useSaver> }) {
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
            <Button size="sm" variant="brass" onClick={async () => (await save(`/api/knowledge/items/${item.id}`, "PATCH", { title, body })) && setEdit(false)}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button>
            <Button size="sm" variant="danger" className="ml-auto" onClick={() => save(`/api/knowledge/items/${item.id}`, "DELETE", undefined, "FAQ removed.")}>Delete</Button>
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
  if (!gaps.length) return <p className="text-[15px] text-muted">No open gaps. Questions the agent couldn&apos;t answer show up here.</p>;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {gaps.map((g) => (
        <li key={g.id} className="grid grid-cols-1 gap-3 py-5 md:grid-cols-[260px_1fr_auto] md:items-start">
          <div>
            <p className="text-[15px] font-medium">{g.question}</p>
            <p className="num text-[12px] text-muted">asked {g.count}×, “{g.key}”</p>
          </div>
          <Textarea rows={2} value={answers[g.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [g.id]: e.target.value })} placeholder="The house answer" />
          <div className="flex gap-2">
            <Button size="sm" variant="brass" disabled={(answers[g.id] ?? "").trim().length < 2} onClick={() => save(`/api/knowledge/gaps/${g.id}`, "POST", { question: g.question, answer: answers[g.id] }, "Answer added. Live now.")}>Publish</Button>
            <Button size="sm" variant="ghost" onClick={() => save(`/api/knowledge/gaps/${g.id}`, "DELETE", undefined, "Dismissed.")}>Dismiss</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
