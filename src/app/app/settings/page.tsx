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
import type { Patch, SettingsData } from "./types";

const SECTIONS = [
  ["assistant", "Assistant"],
  ["channels", "Channels"],
  ["business", "Business"],
  ["payments", "Payments"],
  ["team", "Team"],
  ["modules", "Hiring"],
] as const;

export default function SettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const { data, mutate } = useSWR<SettingsData>("/api/settings", getJson);
  const [busy, setBusy] = useState<string | null>(null);

  // Coming back from Instagram's approval screen.
  useEffect(() => {
    const ig = params.get("instagram");
    if (!ig) return;
    if (ig === "connected") toast(`Instagram connected${params.get("username") ? ` as @${params.get("username")}` : ""}.`, "ok");
    else toast(params.get("reason") ?? "Instagram didn't connect.", "error");
    router.replace("/app/settings#channels");
  }, [params, router, toast]);

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
    if (!window.confirm("Reset the sample businesses to their seeded state? Live conversations, bookings and hiring progress are wiped.")) return;
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
              <div className="text-[13.5px]">
                {data.ai.configured ? <Chip tone="answered">Claude connected</Chip> : <Chip tone="signal">ANTHROPIC_API_KEY missing: answers come from the knowledge base only</Chip>}
                <p className="num mt-2 text-[12.5px] text-fg-2">everyday answers: {data.ai.fast}</p>
                <p className="num text-[12.5px] text-fg-2">setup, hiring and hard cases: {data.ai.smart}</p>
              </div>
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

          <Payments key={ws.id} initial={st.payments} patch={patch} />

          <TeamSection hiring={Boolean(st.modules?.hiring)} />

          <section id="modules" className="scroll-mt-6">
            <h2 className="font-display text-[22px] font-bold">Hiring</h2>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line p-5">
              <p className="max-w-[60ch] text-[13.5px] text-fg-2">
                Optional. Candidates apply through your Telegram bot or you upload CVs; Claude shortlists against each role and books interviews after you approve the invite.
              </p>
              <Switch checked={Boolean(st.modules?.hiring)} onCheckedChange={(v) => quiet("/api/workspace", { modules: { hiring: v } }, v ? "Hiring is on." : "Hiring is off.")} label="Hiring module" />
            </div>
            {st.modules?.hiring ? (
              <div className="mt-6 grid max-w-[760px] gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="hr-loc">Where interviews happen</Label>
                  <Input id="hr-loc" defaultValue={st.hr.location} onBlur={(e) => e.target.value !== st.hr.location && quiet("/api/workspace", { hr: { location: e.target.value } }, "Saved.")} placeholder="Address, or “Video call”" />
                </div>
                <div>
                  <Label htmlFor="hr-ret">Delete CVs after</Label>
                  <select id="hr-ret" defaultValue={st.resumeRetentionDays} onChange={(e) => quiet("/api/settings", { resumeRetentionDays: Number(e.target.value) }, "Saved.")} className="h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px]">
                    {[30, 90, 180, 365].map((d) => (
                      <option key={d} value={d}>
                        {d} days
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[13px] text-muted sm:col-span-2">
                  Apply link: {data.channels.telegram.applyLink ? <span className="num">{data.channels.telegram.applyLink}</span> : "connect Telegram first"}. Candidates can delete their data any time with /delete_my_data.
                  {" "}Google Calendar: {data.google.connected ? "connected" : data.google.configured ? "not connected (connect from Interviews)" : "not configured, using the built-in calendar"}.
                </p>
              </div>
            ) : null}
          </section>

          {data.demoMode && st.sample ? (
            <section id="demo" className="scroll-mt-6">
              <h2 className="font-display text-[22px] font-bold">Sample business</h2>
              <p className="mt-1 text-[14px] text-muted">This is a sample workspace for trying Jawab.</p>
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
