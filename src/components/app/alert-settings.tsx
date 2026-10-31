"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { getJson, send } from "./fetcher";
import { SETTINGS_KEY, type AlertSettings } from "./alerts";
import { ringBell } from "./bell-sound";
import { pushState, turnOffPush, turnOnPush, type PushState } from "./push";
import { useToast } from "./toast";
import { Button } from "../ui/button";
import { Input, Label } from "../ui/field";
import { Switch } from "../ui/switch";
import type { AlertPrefs } from "@/lib/alert-prefs";

const PUSH_NOTE: Record<Exclude<PushState, "off" | "on">, string> = {
  unsupported: "This browser can't show notifications when Yapoz is closed.",
  "home-screen": "On iPhone: tap Share, then Add to Home Screen, and open Yapoz from there to turn these on.",
  blocked: "Notifications are blocked for Yapoz. Allow them in your browser's site settings.",
};

export function AlertSettingsForm() {
  const toast = useToast();
  const { data, mutate } = useSWR<AlertSettings>(SETTINGS_KEY, getJson);
  const [push, setPush] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void pushState().then(setPush);
  }, []);

  async function save(patch: Partial<AlertPrefs>) {
    try {
      await mutate(await send<AlertSettings>(SETTINGS_KEY, "PATCH", patch), { revalidate: false });
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function togglePush(on: boolean) {
    setBusy(true);
    try {
      setPush(on ? await turnOnPush(data!.pushKey!) : await turnOffPush());
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  if (!data) return null;
  const p = data.prefs;
  const row = (label: string, hint: string, control: React.ReactNode) => (
    <div className="flex items-center justify-between gap-6 py-2.5">
      <div>
        <div className="text-[14px] font-medium">{label}</div>
        <div className="text-[13px] text-muted">{hint}</div>
      </div>
      {control}
    </div>
  );
  return (
    <section className="space-y-3 md:col-span-2">
      <h2 className="font-display text-[20px] font-bold">Alerts</h2>
      <p className="max-w-[60ch] text-[14px] text-muted">These are yours alone: each teammate chooses their own.</p>
      <div className="max-w-[560px] divide-y divide-line">
        {row("New orders", "Orders and bookings from customers.", <Switch checked={p.orders} onCheckedChange={(v) => save({ orders: v })} label="New orders" />)}
        {row("Customers waiting", "When someone needs a person. Two taps of the bell.", <Switch checked={p.needsYou} onCheckedChange={(v) => save({ needsYou: v })} label="Customers waiting" />)}
        {row("Bell sound", "Plays on this dashboard while it's open.", <Switch checked={p.sound} onCheckedChange={(v) => save({ sound: v })} label="Bell sound" />)}
        <div className="py-3">
          <Label htmlFor="bell-volume">Volume</Label>
          <div className="flex items-center gap-3">
            <input id="bell-volume" type="range" min={0.1} max={1} step={0.1} defaultValue={p.volume} onChange={(e) => ringBell("order", Number(e.target.value))} onPointerUp={(e) => save({ volume: Number(e.currentTarget.value) })} onKeyUp={(e) => save({ volume: Number(e.currentTarget.value) })} className="w-48 accent-[var(--accent)]" />
            <Button variant="secondary" onClick={() => ringBell("order", p.volume)}>Test the bell</Button>
          </div>
        </div>
        {row(
          "Notifications on this device",
          push === "on" || push === "off" ? (data.pushKey ? "Reaches you when Yapoz is closed, with your device's own alert sound." : "Not set up on Yapoz yet.") : push ? PUSH_NOTE[push] : "",
          <Switch checked={push === "on"} disabled={busy || !data.pushKey || (push !== "on" && push !== "off")} onCheckedChange={togglePush} label="Notifications on this device" />,
        )}
        {row("Email backup", "If no device got the notification. Up to 20 a day for each business.", <Switch checked={p.email} onCheckedChange={(v) => save({ email: v })} label="Email backup" />)}
        {row("Quiet hours", "No bell, notifications or emails. Business time zone.", <Switch checked={Boolean(p.quietHours)} onCheckedChange={(v) => save({ quietHours: v ? { start: "22:00", end: "07:00" } : null })} label="Quiet hours" />)}
        {p.quietHours ? (
          <div className="flex gap-4 py-3">
            <div>
              <Label htmlFor="quiet-from">From</Label>
              <Input id="quiet-from" type="time" key={`s${p.quietHours.start}`} defaultValue={p.quietHours.start} onBlur={(e) => e.target.value && save({ quietHours: { ...p.quietHours!, start: e.target.value } })} />
            </div>
            <div>
              <Label htmlFor="quiet-to">Until</Label>
              <Input id="quiet-to" type="time" key={`e${p.quietHours.end}`} defaultValue={p.quietHours.end} onBlur={(e) => e.target.value && save({ quietHours: { ...p.quietHours!, end: e.target.value } })} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
