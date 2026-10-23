"use client";
import Link from "next/link";
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
      seen = sessionStorage.getItem("yapoz-preloaded") === "1";
      sessionStorage.setItem("yapoz-preloaded", "1");
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      setGone(true);
      onDone();
      return;
    }
    const start = performance.now();
    const dur = 1300;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        if (sound) import("./sound").then((m) => m.ding(0.45));
        setTimeout(() => {
          setGone(true);
          onDone();
        }, 360);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (gone) return null;
  return (
    <div className={cx("fixed inset-0 z-[80] flex flex-col justify-between bg-yp-ink p-6 text-yp-frost transition-opacity duration-300 sm:p-10", n >= 100 && "opacity-0")} aria-hidden>
      <span className="flex items-center gap-2.5">
        <BellMark size={26} />
        <span className="yp-display text-[18px]">Yapoz</span>
      </span>
      <div className="flex items-end justify-between">
        <span className="yp-mono text-[12px] uppercase text-yp-smoke">questions answered</span>
        <span className="yp-display text-[clamp(72px,16vw,200px)] leading-[0.78]" style={{ fontVariationSettings: '"wdth" 110' }}>
          {String(n).padStart(3, "0")}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-yp-line">
        <div className="h-full origin-left bg-yp-mint" style={{ transform: `scaleX(${n / 100})` }} />
      </div>
    </div>
  );
}

/** Thin mint line along the top that fills as you scroll. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden>
      <div ref={bar} className="h-full origin-left scale-x-0 bg-yp-mint" />
    </div>
  );
}

export function SoundToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} aria-label={on ? "Turn bell sound off" : "Turn bell sound on"} className="grid h-10 w-10 place-items-center rounded-full border border-yp-line2 text-yp-fog transition hover:border-yp-ice hover:text-yp-frost">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 7.2h2.6L9 4.2v9.6l-3.4-3H3z" />
        {on ? <path d="M11.6 6.4a3.6 3.6 0 0 1 0 5.2M13.4 4.6a6.2 6.2 0 0 1 0 8.8" /> : <path d="M12 7l4 4M16 7l-4 4" />}
      </svg>
    </button>
  );
}

/** A chrome service bell with a mint spark: the logo mark. */
export function BellMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="yp-bell-d" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EAF0FB" />
          <stop offset="1" stopColor="#8DA0FF" />
        </linearGradient>
      </defs>
      <path d="M16 7.2a1.7 1.7 0 0 1 1.7 1.7v.6c4.3.8 7.3 4.6 7.3 9.2v1.1H7v-1.1c0-4.6 3-8.4 7.3-9.2v-.6A1.7 1.7 0 0 1 16 7.2Z" fill="url(#yp-bell-d)" />
      <rect x="5" y="21.2" width="22" height="3.2" rx="1.6" fill="#3F5BFF" />
      <circle cx="16" cy="5.6" r="1.7" fill="#2CF5BB" />
    </svg>
  );
}

/** The 2D bell for reduced motion and while WebGL loads or isn't available. */
export function StaticBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="A chrome service bell on a dark glass counter">
      <defs>
        <radialGradient id="sb-light" cx="45%" cy="8%" r="75%">
          <stop offset="0" stopColor="#bcd0ff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#06080E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sb-dome" x1="0" x2="1">
          <stop offset="0" stopColor="#1c2440" />
          <stop offset="0.3" stopColor="#dfe8ff" />
          <stop offset="0.52" stopColor="#8da0ff" />
          <stop offset="1" stopColor="#0f1428" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sb-light)" />
      <ellipse cx="200" cy="238" rx="150" ry="16" fill="#3F5BFF" opacity="0.35" />
      <rect x="70" y="214" width="260" height="22" rx="11" fill="#070a14" stroke="#8da0ff" strokeOpacity="0.55" />
      <path d="M90 214c0-66 50-112 110-112s110 46 110 112z" fill="url(#sb-dome)" />
      <rect x="192" y="84" width="16" height="20" rx="4" fill="#cfd9f5" />
      <ellipse cx="200" cy="80" rx="18" ry="9" fill="#eaf0fb" />
      <circle cx="200" cy="64" r="4" fill="#2CF5BB" />
    </svg>
  );
}

const NAV = [
  ["#film", "The film"],
  ["#how", "How it works"],
  ["#everywhere", "Channels"],
  ["#ring", "Live demo"],
] as const;

/** Always-visible header: logo, sections, and both ways in (log in, sign up) at every screen size. */
export function SiteHeader({ sound, onSound, showSound }: { sound: boolean; onSound: (v: boolean) => void; showSound: boolean }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(scrollY > 24);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cx("fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300", solid ? "border-b border-yp-line bg-yp-ink/80 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-8">
        <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="Yapoz, back to the top">
          <BellMark size={28} />
          <span className="yp-display text-[22px]" style={{ fontVariationSettings: '"wdth" 120', letterSpacing: "-0.02em" }}>
            Yapoz
          </span>
        </a>
        <nav className="hidden items-center gap-1 text-[14px] lg:flex" aria-label="Sections">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 text-yp-fog transition hover:bg-yp-raised hover:text-yp-frost">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {showSound ? (
            <span className="hidden sm:block">
              <SoundToggle on={sound} onChange={onSound} />
            </span>
          ) : null}
          <Link href="/login" className="inline-flex h-10 items-center rounded-full border border-yp-line2 px-4 text-[14px] font-medium text-yp-frost transition hover:border-yp-ice sm:px-5">
            Log in
          </Link>
          <Link href="/signup" className="inline-flex h-10 items-center rounded-full bg-yp-mint px-4 text-[14px] font-semibold text-yp-ink transition hover:brightness-110 sm:px-5">
            Sign up<span className="hidden sm:inline">&nbsp;free</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
