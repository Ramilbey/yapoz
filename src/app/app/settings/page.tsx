"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { BusinessForm } from "@/components/app/business-form";
import { Channels } from "./channels";
import { TeamSection } from "./team";
import { Payments } from "./payments";
import { Appointments } from "./appointments";
import type { Patch, SettingsData } from "./types";

const SECTIONS = [
  ["assistant", "Assistant"],
  ["channels", "Channels"],
  ["business", "Business"],
  ["payments", "Payments"],
  ["stock", "Stock"],
  ["appointments", "Appointments"],
  ["team", "Team"],
  ["privacy", "Privacy"],
] as const;

export default function SettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const { data, mutate } = useSWR<SettingsData & { stock: StockSettings }>("/api/settings", getJson);
  const [busy, setBusy] = useState<string | null>(null);

  const patch: Patch = async (url, method, body, msg) => {
    try {
      const r = await send(url, method, body);
      await mutate();
      if (msg) toast(msg);
      return r;
    } catch (e) {
      toast((e as Error).message, "error");
      throw e;
    }
  };
  const quiet = (url: string, body: unknown, msg?: string) => patch(url, "PATCH", body, msg).then(() => router.refresh()).catch(() => {});

  async function reset() {
    if (!window.confirm("Reset the sample businesses to their seeded state? Live conversations and orders are wiped.")) return;
    setBusy("reset");
    try {
      await send("/api/demo/reset", "POST");
      toast("Sample data restored. Sign in again.");
      router.replace("/login");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  if (!data) return <p className="text-muted">Loading…</p>;
  const ws = data.workspace;
  const st = ws.settings;
  return (
    <div>
      <PageHeader title="Settings" description={<>{ws.name} · workspace <span className="num">{ws.id}</span></>} />
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[180px_1fr]">
        <nav aria-label="Settings sections" className="hidden xl:block">
          <ul className="sticky top-8 space-y-1 text-[14px]">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-lg px-3 py-1.5 text-fg-2 hover:bg-raised hover:text-fg">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-14">
          <section id="assistant" className="scroll-mt-6">
            <h2 className="font-display text-[22px] font-bold">Assistant</h2>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line p-5">
              <div className="max-w-[60ch]">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-semibold">{st.live ? "Live" : "Not live yet"}</span>
                  {st.live ? <Chip tone="answered">Answering customers</Chip> : <Chip tone="brass">Simulator only</Chip>}
                </div>
                <p className="mt-1 text-[13.5px] text-fg-2">
                  {st.live
                    ? "Customers on your connected channels get answers right away. Anything it can't answer goes to Needs you."
                    : "Messages on your channels are saved but not answered until you go live. Try it in the simulator first."}
                </p>
              </div>
              <Switch checked={st.live} onCheckedChange={(v) => quiet("/api/workspace", { live: v }, v ? "You're live." : "Paused. Messages wait for you in the inbox.")} label="Live" />
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <div>
                <label className="flex items-center justify-between text-[14px]">
                  <span>Ask a person when it&apos;s less sure than</span>
                  <span className="num">{st.confidenceThreshold.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={0.3}
                  max={0.9}
                  step={0.05}
                  defaultValue={st.confidenceThreshold}
                  onMouseUp={(e) => quiet("/api/settings", { confidenceThreshold: Number((e.target as HTMLInputElement).value) }, "Saved.")}
                  onKeyUp={(e) => quiet("/api/settings", { confidenceThreshold: Number((e.target as HTMLInputElement).value) }, "Saved.")}
                  className="mt-2 w-full accent-[var(--color-brass)]"
                  aria-label="Confidence threshold"
                />
                <p className="mt-1 text-[12.5px] text-muted">Higher sends more questions to your team. Complaints, refunds and allergy or medical questions always go to a person.</p>
              </div>
              <AiStatus ai={data.ai} />
            </div>
          </section>

          <Channels channels={data.channels} patch={patch} workspaceId={ws.id} />

          <section id="business" className="scroll-mt-6">
            <h2 className="font-display text-[22px] font-bold">Business</h2>
            <p className="mt-1 mb-4 max-w-[70ch] text-[14px] text-muted">
              The basics the assistant uses in every answer. Products, services, hours and policies live in{" "}
              <a href="/app/knowledge" className="underline decoration-brass underline-offset-4">Knowledge</a>.
            </p>
            <BusinessForm
              key={ws.id}
              withDescription
              initial={{ name: ws.name, city: ws.city, timezone: ws.timezone, currency: ws.currency, business: { ...st.business, phone: st.business.phone ?? null, website: st.business.website ?? null } }}
              onSave={async (v) => {
                await quiet("/api/workspace", v, "Business details saved.");
              }}
            />
          </section>

          <Payments key={ws.id} initial={st.payments} businessName={ws.name} patch={patch} />

          <Stock key={ws.id} initial={data.stock} patch={patch} />

          <Appointments key={ws.id} initial={data.appointments} patch={patch} />

          <TeamSection />

          <Privacy days={st.privacy?.retentionDays ?? null} onSave={(d) => quiet("/api/settings", { retentionDays: d }, d ? `Customer data older than ${d} days will be deleted.` : "Customer data is kept until you delete it.")} />

          {data.demoMode && st.sample ? (
            <section id="demo" className="scroll-mt-6">
              <h2 className="font-display text-[22px] font-bold">Sample business</h2>
              <p className="mt-1 text-[14px] text-muted">This is a sample workspace for trying Yapoz.</p>
              <label className="mt-4 flex items-center gap-3 text-[14px]">
                <Switch checked={st.demoTraffic} onCheckedChange={(v) => quiet("/api/settings", { demoTraffic: v }, "Saved.")} label="Demo traffic" />
                Demo traffic (replays sample conversations while Today is open)
              </label>
              <Button className="mt-5" variant="danger" loading={busy === "reset"} onClick={reset}>
                Reset sample data
              </Button>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Which AI providers this server can use, and what actually answered recently: prices and stock never come from these. */
function AiStatus({ ai }: { ai: SettingsData["ai"] }) {
  return (
    <div className="text-[13.5px]">
      {ai.providers.length ? <Chip tone="answered">{ai.providers.length} AI provider{ai.providers.length === 1 ? "" : "s"} configured</Chip> : <Chip tone="signal">No AI provider configured: every message gets the holding reply and goes to Needs you</Chip>}
      <ul className="mt-2 space-y-0.5 text-[12.5px] text-fg-2">
        {ai.providers.map((p, i) => (
          <li key={p.name} className="num">{i + 1}. {p.name}{p.vision ? " (reads receipts)" : ""}</li>
        ))}
      </ul>
      {ai.recent.length ? (
        <>
          <p className="mt-3 text-[12.5px] text-muted">Last 24 hours, by the model that actually replied:</p>
          <ul className="mt-1 space-y-0.5 text-[12.5px]">
            {ai.recent.map((r) => (
              <li key={r.model} className="num">{r.model === "none" ? "No AI (holding reply)" : r.model}: {r.n} repl{r.n === 1 ? "y" : "ies"}{r.failed ? <span className="text-signal-ink">, {r.failed} failed</span> : null}</li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-3 text-[12.5px] text-muted">Providers are tried in this order; if one is down or rate-limited the next answers. If all fail, the customer gets a short holding reply and the conversation lands in Needs you with the reason.</p>
    </div>
  );
}

const RETENTION = [null, 30, 90, 180, 365] as const;

function Privacy({ days, onSave }: { days: number | null; onSave: (d: number | null) => void }) {
  return (
    <section id="privacy" className="scroll-mt-6">
      <h2 className="font-display text-[22px] font-bold">Privacy</h2>
      <p className="mt-1 max-w-[70ch] text-[14px] text-muted">
        Customer messages, receipt images and order details are stored for your business only. Messages are sent to the AI providers above to write replies, and receipts to read them.
      </p>
      <div className="mt-4 max-w-[420px]">
        <label htmlFor="retention" className="text-[14px]">Delete conversations and receipt images after</label>
        <select id="retention" defaultValue={days ?? ""} onChange={(e) => onSave(e.target.value ? Number(e.target.value) : null)} className="mt-1.5 h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px]">
          {RETENTION.map((d) => (
            <option key={d ?? "never"} value={d ?? ""}>{d ? `${d} days` : "Keep until I delete them"}</option>
          ))}
        </select>
        <p className="mt-1.5 text-[12.5px] text-muted">Orders and their totals stay for your records; the chat history and receipt files go. To erase one customer now, open their conversation in the Inbox and choose “Delete customer data”.</p>
      </div>
      <div className="mt-6 max-w-[420px]">
        <p className="text-[14px]">Your data is yours. Download customers, conversations, orders and receipt details as one file, to keep or to take elsewhere.</p>
        <a href="/api/export" download className="mt-2 inline-flex h-10 items-center justify-center rounded-[10px] border border-line-strong px-4 text-sm font-medium text-fg hover:bg-raised">Download my data</a>
      </div>
    </section>
  );
}

type StockSettings = { defaultMode: "none" | "daily" | "tracked"; dayStartsAt: string; holdMinutes: number; preorderDays: number; lowStockDefault: number };

const STOCK_MODES: Record<StockSettings["defaultMode"], { label: string; hint: string }> = {
  none: { label: "Made to order", hint: "Restaurants: items are just on or off." },
  daily: { label: "Daily quantity", hint: "Bakeries: a fresh number every day." },
  tracked: { label: "Count stock", hint: "Shops: an on-hand count." },
};

function Stock({ initial, patch }: { initial: StockSettings; patch: Patch }) {
  const [mode, setMode] = useState(initial.defaultMode);
  const [dayStartsAt, setDayStartsAt] = useState(initial.dayStartsAt);
  const [holdMinutes, setHoldMinutes] = useState(String(initial.holdMinutes));
  const [preorderDays, setPreorderDays] = useState(String(initial.preorderDays));
  const [lowStock, setLowStock] = useState(String(initial.lowStockDefault));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await patch(
        "/api/settings",
        "PATCH",
        { stock: { defaultMode: mode, dayStartsAt, holdMinutes: Number(holdMinutes), preorderDays: Number(preorderDays), lowStockDefault: Number(lowStock) } },
        "Stock settings saved.",
      );
    } catch {
      // shown by patch()
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="stock" className="scroll-mt-6">
      <h2 className="font-display text-[22px] font-bold">Stock</h2>
      <p className="mt-1 max-w-[70ch] text-[14px] text-muted">How the assistant tracks what you can sell. Each item in Knowledge can override the default below.</p>
      <div className="mt-4 max-w-[760px] space-y-5">
        <div>
          <Label htmlFor="stock-mode">Default for items</Label>
          <select id="stock-mode" value={mode} onChange={(e) => setMode(e.target.value as StockSettings["defaultMode"])} className="h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px] sm:max-w-[320px]">
            {Object.entries(STOCK_MODES).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[12.5px] text-muted">{STOCK_MODES[mode].hint} Each item in Knowledge can override this.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="stock-day">Business day starts at</Label>
            <Input id="stock-day" type="time" value={dayStartsAt} onChange={(e) => setDayStartsAt(e.target.value)} />
            <p className="mt-1.5 text-[12.5px] text-muted">Daily quantities and &ldquo;sold out today&rdquo; reset then.</p>
          </div>
          <div>
            <Label htmlFor="stock-low">Low-stock alert below</Label>
            <Input id="stock-low" type="number" min={0} value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
            <p className="mt-1.5 text-[12.5px] text-muted">For counted items. Each option can have its own.</p>
          </div>
          <div>
            <Label htmlFor="stock-hold" hint="minutes">Hold unpaid orders for</Label>
            <Input id="stock-hold" type="number" min={5} max={1440} value={holdMinutes} onChange={(e) => setHoldMinutes(e.target.value)} />
            <p className="mt-1.5 text-[12.5px] text-muted">With payments on, an order&apos;s stock is held this long while the customer pays. A receipt that passes the checks keeps it; otherwise the order expires and the customer is told.</p>
          </div>
          <div>
            <Label htmlFor="stock-ahead" hint="days">Customers can order daily items up to</Label>
            <Input id="stock-ahead" type="number" min={0} max={60} value={preorderDays} onChange={(e) => setPreorderDays(e.target.value)} />
            <p className="mt-1.5 text-[12.5px] text-muted">days ahead.</p>
          </div>
        </div>
        <Button variant="primary" loading={busy} onClick={save}>
          Save stock settings
        </Button>
      </div>
    </section>
  );
}
