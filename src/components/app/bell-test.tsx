"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { getJson, send } from "./fetcher";
import { SETTINGS_KEY, showTestPopup, type AlertSettings } from "./alerts";
import { ringBell } from "./bell-sound";
import { pushState, type PushState } from "./push";
import { useToast } from "./toast";
import { Button } from "../ui/button";
import { Chip } from "../ui/chip";

type Status = { devices: number; pushReady: boolean; emailReady: boolean; emailTo: string; quietNow: boolean };
const STATUS_KEY = "/api/alerts/test";

const DEVICE: Record<PushState, string> = {
  on: "On",
  off: "Off. Turn on Notifications on this device above.",
  blocked: "Blocked in your browser's site settings",
  unsupported: "This browser can't show notifications",
  "home-screen": "Add Yapoz to your Home Screen first",
};

/** Tries each part of the bell on the person using it. Nothing here creates an order or reaches anyone else. */
export function BellTestPanel() {
  const toast = useToast();
  const { data: settings } = useSWR<AlertSettings>(SETTINGS_KEY, getJson);
  const { data: status, mutate } = useSWR<Status>(STATUS_KEY, getJson);
  const [device, setDevice] = useState<PushState | null>(null);
  const [busy, setBusy] = useState<"push" | "email" | null>(null);
  useEffect(() => {
    void pushState().then(setDevice);
  }, [settings]);

  async function sendTest(channel: "push" | "email") {
    setBusy(channel);
    try {
      const r = await send<{ ok: boolean; message: string }>(STATUS_KEY, "POST", { channel });
      toast(r.message, r.ok ? undefined : "error");
      await mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  if (!settings || !status) return null;
  const volume = settings.prefs.volume;
  const rows: [string, string, boolean][] = [
    ["Bell sound", settings.prefs.sound ? `On, volume ${Math.round(volume * 100)}%` : "Off", settings.prefs.sound],
    ["Quiet hours", status.quietNow ? "Active now: real alerts stay silent" : settings.prefs.quietHours ? `Off until ${settings.prefs.quietHours.start}` : "Not set", !status.quietNow],
    ["Notifications here", status.pushReady ? (device ? DEVICE[device] : "Checking…") : "Not set up on Yapoz yet", status.pushReady && device === "on"],
    ["Your devices", `${status.devices} registered`, status.devices > 0],
    ["Alert email", !settings.prefs.email ? "Off" : status.emailReady ? status.emailTo : "Not set up on Yapoz yet", settings.prefs.email && status.emailReady],
  ];
  return (
    <section className="space-y-3 md:col-span-2" aria-label="Test the bell">
      <h2 className="font-display text-[20px] font-bold">Test the bell</h2>
      <p className="max-w-[60ch] text-[14px] text-muted">Try each part on yourself. No order is created, and nobody else is alerted.</p>
      <dl className="max-w-[560px] divide-y divide-line text-[14px]">
        {rows.map(([label, value, good]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2">
            <dt className="shrink-0 font-medium">{label}</dt>
            <dd className="flex min-w-0 items-center gap-2 text-right text-fg-2">
              <span className="min-w-0 break-words">{value}</span>
              <Chip tone={good ? "answered" : "brass"}>{good ? "Ready" : "Check"}</Chip>
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex max-w-[560px] flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => ringBell("order", volume)}>Ring: new order</Button>
        <Button size="sm" variant="secondary" onClick={() => ringBell("needs", volume)}>Ring: customer waiting</Button>
        <Button size="sm" variant="secondary" onClick={showTestPopup}>Show pop-up</Button>
        <Button size="sm" variant="secondary" loading={busy === "push"} disabled={Boolean(busy) || !status.pushReady || !status.devices} onClick={() => sendTest("push")}>Send to my devices</Button>
        <Button size="sm" variant="secondary" loading={busy === "email"} disabled={Boolean(busy) || !status.emailReady || !settings.prefs.email} onClick={() => sendTest("email")}>Send test email</Button>
      </div>
    </section>
  );
}
