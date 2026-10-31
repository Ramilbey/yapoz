"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { getJson, send } from "./fetcher";
import { useLive } from "./live";
import { ringBell, unlockBell } from "./bell-sound";
import type { AlertPrefs } from "@/lib/alert-prefs";
import type { Alert } from "@/lib/alerts";

type Feed = { now: string; sound: boolean; volume: number; alerts: Alert[] };
export type AlertSettings = { prefs: AlertPrefs; pushKey: string | null };

export const SETTINGS_KEY = "/api/alerts/settings";

// A tab in the background gets no polling ticks, so it checks by itself in case the live stream is silent.
const CHECK_MS = 30_000;
// An order's time is set before it's saved, so look back a little: `seen` stops anything showing twice.
const OVERLAP_MS = 60_000;
const SHOW_MS = 12_000;
const RUNG_KEY = "yapoz-rung";
const PROMPT_KEY = "yapoz-bell-prompt";

/** Several tabs hear about the same order: the first to claim it rings, so the bell only sounds once. */
async function claim(ids: string[]) {
  const take = () => {
    try {
      const rung: string[] = JSON.parse(localStorage.getItem(RUNG_KEY) ?? "[]");
      const fresh = ids.filter((id) => !rung.includes(id));
      localStorage.setItem(RUNG_KEY, JSON.stringify([...rung, ...fresh].slice(-100)));
      return fresh;
    } catch {
      return ids;
    }
  };
  return navigator.locks ? navigator.locks.request("yapoz-bell", take) : take();
}

export function Alerts({ count, onNew }: { count: number; onNew: () => void }) {
  const pathname = usePathname();
  const [shown, setShown] = useState<Alert[]>([]);
  const [prompt, setPrompt] = useState(false);
  const started = useRef<number | null>(null);
  const since = useRef<string | null>(null);
  const seen = useRef(new Set<string>());

  const hide = useCallback((id: string) => setShown((x) => x.filter((a) => a.id !== id)), []);

  const check = useCallback(async () => {
    try {
      const feed = await getJson<Feed>(`/api/alerts${since.current ? `?since=${encodeURIComponent(since.current)}` : ""}`);
      const now = new Date(feed.now).getTime();
      started.current ??= now;
      since.current = new Date(Math.max(started.current, now - OVERLAP_MS)).toISOString();
      const fresh = feed.alerts.filter((a) => !seen.current.has(a.id));
      if (!fresh.length) return;
      fresh.forEach((a) => seen.current.add(a.id));
      setShown((x) => [...x, ...fresh].slice(-3));
      fresh.forEach((a) => setTimeout(() => hide(a.id), SHOW_MS));
      onNew();
      const rung = await claim(fresh.map((a) => a.id));
      if (feed.sound && rung.length) ringBell(fresh.some((a) => a.kind === "order") ? "order" : "needs", feed.volume);
    } catch {
      /* the next check catches up */
    }
  }, [hide, onNew]);

  useLive(["orders", "escalations"], check, 500, (e) => !e.demo);
  useEffect(() => {
    void check();
    const timer = setInterval(check, CHECK_MS);
    // Any click allows sound for the rest of the visit.
    const unlock = () => unlockBell();
    window.addEventListener("pointerdown", unlock, { once: true });
    try {
      setPrompt(!localStorage.getItem(PROMPT_KEY));
    } catch {}
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", unlock);
    };
  }, [check]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
  }, [count, pathname]);

  function closePrompt(ring: boolean) {
    if (ring) ringBell("order", 0.6);
    setPrompt(false);
    try {
      localStorage.setItem(PROMPT_KEY, "1");
    } catch {}
  }

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-5 top-5 z-[60] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2 max-lg:top-[68px]">
      {prompt ? (
        <div className="row-new pointer-events-auto rounded-xl border border-line-strong bg-panel px-4 py-3 text-[14px] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]">
          <div className="font-medium">Hear new orders?</div>
          <p className="mt-0.5 text-[13px] text-muted">We&apos;ll tap a counter bell when an order comes in.</p>
          <div className="mt-2.5 flex gap-2">
            <button onClick={() => closePrompt(true)} className="h-8 rounded-[10px] bg-accent px-3 text-[13px] font-medium text-on-primary">Turn on order bell</button>
            <button onClick={() => closePrompt(false)} className="h-8 rounded-[10px] px-2 text-[13px] text-muted hover:text-fg">Not now</button>
          </div>
        </div>
      ) : null}
      {shown.map((a) => (
        <div key={a.id} className="row-new pointer-events-auto flex items-start gap-2 rounded-xl border border-accent/60 bg-panel px-4 py-3 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]">
          <Link href={a.url} onClick={() => hide(a.id)} className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">{a.title}</span>
            <span className="mt-0.5 line-clamp-2 block text-[13px] text-fg-2">{a.body}</span>
          </Link>
          <button onClick={() => hide(a.id)} aria-label="Dismiss" className="text-[18px] leading-none text-muted hover:text-fg">×</button>
        </div>
      ))}
    </div>
  );
}

/** Quick mute beside the sign-out button. The rest of the choices are in Your account. */
export function BellToggle() {
  const { data, mutate } = useSWR<AlertSettings>(SETTINGS_KEY, getJson, { revalidateOnFocus: false });
  const on = data?.prefs.sound ?? true;
  async function toggle() {
    unlockBell();
    await mutate(await send<AlertSettings>(SETTINGS_KEY, "PATCH", { sound: !on }), { revalidate: false });
  }
  return (
    <button type="button" role="switch" aria-checked={on} onClick={toggle} className="h-8 rounded-[10px] border border-line-strong px-3 text-[13px] font-medium text-fg hover:bg-raised">
      Bell {on ? "on" : "off"}
    </button>
  );
}
