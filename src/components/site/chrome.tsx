"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cx } from "../ui/cx";

let loaderPlayed = false;

/** Three customers ask while the page loads; each question turns into an answer when the bell rings. */
const WARMUP = [
  { q: "Do you deliver today?", a: "Yes, until 9 pm", at: 3, done: 34, pos: "left-[5%] top-[17%] sm:left-[13%] sm:top-[24%]" },
  { q: "Can I book for 7 pm?", a: "Booked. See you at 7", at: 30, done: 67, pos: "right-[5%] top-[30%] sm:right-[12%] sm:top-[36%]" },
  { q: "Is the large in stock?", a: "Yes, 3 left", at: 62, done: 100, pos: "left-[8%] top-[66%] sm:left-[18%] sm:top-[60%]" },
];

const STATUS = ["Opening the counter", "Polishing the bell", "Learning the questions", "Ready for your customers"];

/**
 * The loading screen. It really waits: for the fonts and for the 3D bell to be ready (`assetsReady`), with a minimum
 * of about a second and a hard stop at seven. The bell rings at each third and once more when it's done, answering the
 * three questions on screen, then the whole screen lifts away. It plays on every full page load but not when you come back
 * by navigating inside the app, and it's skipped for people who prefer reduced motion.
 */
export function Preloader({ onDone, sound, assetsReady }: { onDone: () => void; sound: boolean; assetsReady: boolean }) {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"load" | "exit" | "gone">("load");
  const bell = useRef<HTMLDivElement>(null);
  const ready = useRef(assetsReady);
  ready.current = assetsReady;
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    if (loaderPlayed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      onDone();
      return;
    }
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const start = performance.now();
    let raf = 0;
    let value = 0;
    let ringAt = -10;
    let milestone = 0;
    let finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const target = t > 7 ? 1 : ready.current && t > 1.2 ? 1 : Math.min(0.9, (t / 2.4) * 0.9);
      value += (target - value) * 0.075;
      if (target === 1 && value > 0.996) value = 1;
      setPct(Math.round(value * 100));
      const m = Math.floor(Math.min(value, 0.999) * 3);
      if (m > milestone) {
        milestone = m;
        ringAt = now;
      }
      const dt = (now - ringAt) / 1000;
      if (bell.current) bell.current.style.transform = `rotate(${(dt < 2 ? Math.sin(dt * 34) * Math.exp(-dt * 4.5) * 9 : 0).toFixed(2)}deg)`;
      if (value >= 1 && !finished) {
        finished = true;
        ringAt = now;
        if (soundRef.current) void import("./sound").then((mod) => mod.ding(0.45));
        timers.push(
          setTimeout(() => {
            loaderPlayed = true;
            setPhase("exit");
            onDone();
            html.style.overflow = prevOverflow;
          }, 650),
          setTimeout(() => setPhase("gone"), 650 + 1100),
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      html.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "gone") return null;
  const status = STATUS[pct >= 100 ? 3 : Math.min(2, Math.floor(pct / 34))];
  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-yp-ink text-yp-frost" style={{ transform: phase === "exit" ? "translateY(-101%)" : "none", transition: "transform 1.05s cubic-bezier(0.76, 0, 0.24, 1)" }} role="status" aria-label="Loading Yapoz">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_42%_at_50%_46%,rgba(63,91,255,0.22),transparent_70%)]" aria-hidden />
      <div className="yp-floor absolute -bottom-[240px] -left-1/3 -right-1/3 h-[560px] opacity-80" aria-hidden />
      {WARMUP.map((w) => {
        const shown = pct >= w.at;
        const answered = pct >= w.done;
        return (
          <div key={w.q} className={cx("absolute", w.pos)} aria-hidden style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(-60px) scale(0.92)", transition: "opacity 0.5s, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <div className={cx("relative rounded-2xl px-4 py-2.5 text-[14px] font-medium transition-colors duration-300 sm:text-[15px]", answered ? "bg-yp-mint text-yp-ink shadow-[0_0_30px_rgba(44,245,187,0.35)]" : "border border-yp-line2 bg-yp-panel text-yp-frost")}>
              <span className="invisible block whitespace-nowrap">{w.q.length > w.a.length ? w.q : w.a}</span>
              <span className="absolute inset-0 grid place-items-center whitespace-nowrap">{answered ? w.a : w.q}</span>
            </div>
          </div>
        );
      })}
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <div ref={bell} className="relative" style={{ transformOrigin: "50% 12%" }}>
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yp-cobalt/30 blur-3xl" />
          <BellMark size={112} />
        </div>
        <div className="yp-display mt-6 text-[clamp(30px,5vw,44px)]" style={{ fontVariationSettings: '"wdth" 124', letterSpacing: "-0.03em" }}>
          Yapoz
        </div>
        <p className="yp-mono mt-3 h-4 text-[12px] uppercase text-yp-smoke">{status}</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-8 sm:px-10" aria-hidden>
        <span className="yp-mono text-[11px] uppercase text-yp-smoke">The front desk, opening</span>
        <span className="yp-display text-[clamp(56px,11vw,140px)] leading-[0.8]" style={{ fontVariationSettings: '"wdth" 110' }}>
          {String(pct).padStart(3, "0")}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-yp-line" aria-hidden>
        <div className="h-full origin-left bg-yp-mint shadow-[0_0_18px_2px_rgba(44,245,187,0.6)]" style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-yp-mint/0" />
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
