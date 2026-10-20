"use client";
import { useEffect, useRef, useState } from "react";
import { cx } from "../ui/cx";

/** 00: mono counter 000 → 100, ends on a bell ding (if sound is on). Shown once per session. */
export function Preloader({ onDone, sound }: { onDone: () => void; sound: boolean }) {
  const [n, setN] = useState(0);
  const [gone, setGone] = useState(false);
  const done = useRef(false);
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("jawab-preloaded") === "1";
      sessionStorage.setItem("jawab-preloaded", "1");
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      setGone(true);
      onDone();
      return;
    }
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        if (sound) import("./sound").then((m) => m.ding(0.45));
        setTimeout(() => {
          setGone(true);
          onDone();
        }, 380);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (gone) return null;
  return (
    <div className={cx("fixed inset-0 z-[80] flex items-end justify-between bg-ink p-6 text-paper transition-opacity duration-300 sm:p-10", n >= 100 && "opacity-0")} aria-hidden>
      <span className="text-[13px] text-paper/50">messages answered</span>
      <span className="num text-[clamp(64px,14vw,180px)] leading-[0.8] text-paper">{String(n).padStart(3, "0")}</span>
    </div>
  );
}

/** Brass dot that turns into a speech bubble over anything you can press. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [bubble, setBubble] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setOn(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const el = e.target as HTMLElement | null;
      setBubble(Boolean(el?.closest("a,button,[data-cursor],input,select,textarea,canvas")));
    };
    const loop = () => {
      x += (tx - x) * (reduce ? 1 : 0.22);
      y += (ty - y) * (reduce ? 1 : 0.22);
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  if (!on) return null;
  return (
    <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[90] mix-blend-normal" aria-hidden>
      <div
        className={cx(
          "-translate-x-1/2 -translate-y-1/2 bg-brass transition-[width,height,border-radius] duration-200 ease-out",
          bubble ? "h-6 w-9 rounded-[12px] rounded-bl-[3px] opacity-90" : "h-2.5 w-2.5 rounded-full",
        )}
      />
    </div>
  );
}

export function SoundToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} className="inline-flex h-9 items-center gap-2 rounded-full border border-paper/20 px-3.5 text-[13px] text-paper/80 hover:border-paper/40 hover:text-paper" data-cursor>
      <span className={cx("h-1.5 w-1.5 rounded-full", on ? "bg-brass" : "bg-paper/30")} />
      Sound {on ? "on" : "off"}
    </button>
  );
}

export function BellMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 7.2a1.7 1.7 0 0 1 1.7 1.7v.6c4.3.8 7.3 4.6 7.3 9.2v1.1H7v-1.1c0-4.6 3-8.4 7.3-9.2v-.6A1.7 1.7 0 0 1 16 7.2Z" fill="#C8A048" />
      <rect x="5" y="21.2" width="22" height="3.2" rx="1.6" fill="#C8A048" />
    </svg>
  );
}

/** The 2D bell for phones and reduced motion. */
export function StaticBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="A brass service bell on a dark stone counter">
      <defs>
        <radialGradient id="sb-light" cx="45%" cy="10%" r="70%">
          <stop offset="0" stopColor="#ffd49a" stopOpacity="0.32" />
          <stop offset="1" stopColor="#0E0D0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sb-dome" x1="0" x2="1">
          <stop offset="0" stopColor="#6d5214" />
          <stop offset="0.35" stopColor="#e9c977" />
          <stop offset="0.55" stopColor="#C8A048" />
          <stop offset="1" stopColor="#4a370c" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sb-light)" />
      <ellipse cx="200" cy="236" rx="150" ry="16" fill="#000" opacity="0.5" />
      <rect x="70" y="214" width="260" height="22" rx="11" fill="#0b0a08" stroke="#C8A048" strokeOpacity="0.5" />
      <path d="M90 214c0-66 50-112 110-112s110 46 110 112z" fill="url(#sb-dome)" />
      <rect x="192" y="84" width="16" height="20" rx="4" fill="#C8A048" />
      <ellipse cx="200" cy="80" rx="18" ry="9" fill="#e9c977" />
    </svg>
  );
}
