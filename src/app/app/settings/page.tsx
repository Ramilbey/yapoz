"use client";
import useSWR from "swr";
import { useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Chip, CHANNEL_LABEL } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type S = {
  workspace: { id: string; name: string; settings: { confidenceThreshold: number; demoTraffic: boolean; resumeRetentionDays: number } };
  channels: { type: string; mode: "autopilot" | "copilot"; enabled: boolean; configured: boolean; config: Record<string, unknown> }[];
  telegram: { botUsername: string | null; businessConnections: { id: string; canReply: boolean; isEnabled: boolean; updatedAt: string }[] };
  webhooks: Record<string, string>;
  ai: { configured: boolean; fast: string; smart: string };
  google: { configured: boolean; connected: boolean };
  demoMode: boolean;
};

const ORDER = ["telegram", "whatsapp", "instagram", "simulator"];
const NOTES: Record<string, string> = {
  telegram: "Bot chats and Telegram Business: answers appear from the shop's own account.",
  whatsapp: "Cloud API. Free-form replies inside the 24-hour window; approved templates outside it. Business-scoped by design.",
  instagram: "DMs (24-hour window) and one private reply per comment within 7 days.",
  simulator: "The web phone on the home page. Same pipeline, always available as the on-stage fallback.",
};

export default function SettingsPage() {
  const toast = useToast();
  const { data, mutate } = useSWR<S>("/api/settings", getJson);
  const [busy, setBusy] = useState<string | null>(null);
  async function patch(body: Record<string, unknown>, msg = "Saved.") {
    try {
      await send("/api/settings", "PATCH", body);
      await mutate();
      toast(msg);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function reset() {
    if (!window.confirm("Reset Forno Sette to the seeded demo state? Live conversations, bookings and hiring progress are wiped.")) return;
    setBusy("reset");
    try {
      await send("/api/demo/reset", "POST");
      toast("Demo data restored.");
      await mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  if (!data) return <p className="text-muted">Loading…</p>;
  const st = data.workspace.settings;
  return (
    <div>
      <PageHeader title="Settings" description={`${data.workspace.name}, workspace ${data.workspace.id}.`} />
      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="font-display text-[20px] font-bold">Channels</h2>
          <p className="mt-1 text-[14px] text-muted">Autopilot sends replies on its own. Copilot drafts them for staff to approve in the inbox.</p>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {ORDER.map((type) => {
              const c = data.channels.find((x) => x.type === type);
              if (!c) return null;
              return (
                <li key={type} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium">{CHANNEL_LABEL[type]}</span>
                      {c.configured ? <Chip tone="answered">Connected</Chip> : <Chip>Not configured</Chip>}
                    </div>
                    <p className="mt-1 max-w-[60ch] text-[13px] text-muted">{NOTES[type]}</p>
                    {type !== "simulator" ? <p className="num mt-1 break-all text-[12px] text-fg-2">{data.webhooks[type]}</p> : null}
                  </div>
                  <div className="flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label={`${CHANNEL_LABEL[type]} mode`}>
                    {(["autopilot", "copilot"] as const).map((m) => (
                      <button key={m} role="radio" aria-checked={c.mode === m} onClick={() => patch({ channelModes: { [type]: m } }, `${CHANNEL_LABEL[type]} set to ${m}.`)} className={`h-8 rounded-md px-3 text-[13px] capitalize ${c.mode === m ? "bg-fg text-bg" : "text-fg-2 hover:text-fg"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>

          <h2 className="font-display mt-10 text-[20px] font-bold">Telegram Business</h2>
          {data.telegram.botUsername ? <p className="mt-1 text-[14px]">Bot: <span className="num">@{data.telegram.botUsername}</span></p> : <p className="mt-1 text-[14px] text-muted">Set TELEGRAM_BOT_USERNAME to show the bot here.</p>}
          <p className="mt-1 text-[13px] text-muted">To answer from the shop&apos;s own account: in Telegram, Settings, Business, Chatbots, add the bot and allow it to reply. The connection shows up below.</p>
          <ul className="mt-3 space-y-2">
            {data.telegram.businessConnections.length ? (
              data.telegram.businessConnections.map((b) => (
                <li key={b.id} className="flex items-center gap-3 text-[14px]">
                  <span className="num text-fg-2">{b.id.slice(0, 10)}…</span>
                  {b.isEnabled ? <Chip tone="answered">Active</Chip> : <Chip>Disabled</Chip>}
                  {b.canReply ? <Chip>Can reply</Chip> : <Chip tone="signal">Reply permission missing</Chip>}
                </li>
              ))
            ) : (
              <li className="text-[13px] text-muted">No business account connected yet.</li>
            )}
          </ul>
        </section>

        <section className="space-y-10">
          <div>
            <h2 className="font-display text-[20px] font-bold">AI</h2>
            {data.ai.configured ? <Chip tone="answered" className="mt-2">Claude connected</Chip> : <Chip tone="signal" className="mt-2">ANTHROPIC_API_KEY missing</Chip>}
            <p className="num mt-2 text-[13px] text-fg-2">routine: {data.ai.fast}</p>
            <p className="num text-[13px] text-fg-2">complex and hiring: {data.ai.smart}</p>
            <div className="mt-5">
              <label className="flex items-center justify-between text-[14px]">
                <span>Escalate below this confidence</span>
                <span className="num">{st.confidenceThreshold.toFixed(2)}</span>
              </label>
              <input type="range" min={0.3} max={0.9} step={0.05} defaultValue={st.confidenceThreshold} onMouseUp={(e) => patch({ confidenceThreshold: Number((e.target as HTMLInputElement).value) })} onKeyUp={(e) => patch({ confidenceThreshold: Number((e.target as HTMLInputElement).value) })} className="mt-2 w-full accent-[var(--color-brass)]" aria-label="Confidence threshold" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-[20px] font-bold">Hiring data</h2>
            <label className="mt-3 flex items-center justify-between gap-3 text-[14px]">
              <span>Delete resumes after</span>
              <select defaultValue={st.resumeRetentionDays} onChange={(e) => patch({ resumeRetentionDays: Number(e.target.value) })} className="h-9 rounded-lg border border-line bg-raised px-2 text-[14px]">
                {[30, 90, 180, 365].map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-[13px] text-muted">Candidates can delete their own data any time by sending /delete_my_data to the bot.</p>
            <p className="mt-3 text-[14px]">Google Calendar: {data.google.connected ? "connected" : data.google.configured ? "not connected yet (connect from Interviews)" : "not configured, using the built-in calendar"}</p>
          </div>
          {data.demoMode ? (
            <div>
              <h2 className="font-display text-[20px] font-bold">Demo</h2>
              <label className="mt-3 flex items-center gap-3 text-[14px]">
                <Switch checked={st.demoTraffic} onCheckedChange={(v) => patch({ demoTraffic: v })} label="Demo traffic" />
                Demo traffic (replays seeded conversations while Today is open)
              </label>
              <Button className="mt-5" variant="danger" loading={busy === "reset"} onClick={reset}>Reset demo data</Button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
