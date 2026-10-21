"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { Preloader, Cursor, SoundToggle, BellMark, StaticBell } from "./chrome";
import { Simulator, type SampleBusiness } from "./simulator";
import { cx } from "../ui/cx";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const HeroCanvas = dynamic(() => import("./hero-canvas"), { ssr: false });

export type SiteStats = { channels: { channel: string; n: number }[]; days: number; demoShare: number; botUsername: string | null; demoWorkspaceId: string; samples: SampleBusiness[] };

const NAMES = ["Aisha Rahman", "+60 12-4•• ••81", "@jun.wei", "Kavitha S.", "Hakim", "@melissa.eats", "Sharon Lee", "+60 17-2•• ••09", "Ganesh", "@bryan.ooi", "Nur Amira", "Chloe Ng"];
const PREVIEWS = ["got slot tmr 3pm?", "large margherita how much", "size M in red ada?", "deliver to mont kiara?", "how much for keratin", "open on monday?", "room for 2 this sat?", "screen repair iphone 13?", "table for 6 sat", "can cancel my booking", "parking got or not", "still got stock?"];

const STEPS = [
  { n: "01", t: "Sign up", d: "Your business name and your owner login. Two minutes, no card." },
  { n: "02", t: "Explain your business", d: "In your own words, like briefing a new staff member. Add your menu, price list or a photo of the board. Claude drafts your products, prices, hours, bookings and FAQs; you check them." },
  { n: "03", t: "Connect your chats", d: "Telegram in one tap, WhatsApp with your Business Platform number, Instagram by logging in. Customers keep messaging you where they already do." },
  { n: "04", t: "Go live", d: "It answers in seconds, books into your diary, and hands complaints, refunds and anything it isn't sure of to a person." },
];

const KINDS = [
  { t: "Restaurants and cafés", q: "table for 4 fri 8pm?", a: "Booked: Fri 8pm, 4 people. Ref F7-2K9M", how: "Tables by headcount, menu with sizes, delivery zones" },
  { t: "Salons and clinics", q: "women's cut tmr 3pm?", a: "Thu 3pm is free. Booked with your name, 60 min", how: "Appointments by service length, staff capacity" },
  { t: "Shops", q: "this dress in M, black?", a: "Black M: 2 left, RM 129", how: "Stock by size and colour, live from the dashboard" },
  { t: "Hotels and rentals", q: "room for 2 sat-sun?", a: "1 Deluxe left for Sat–Sun, RM 260 a night", how: "Bookings by the day, units per day" },
  { t: "Repairs and services", q: "iphone 13 screen how much", a: "RM 380, about 1 hour. Walk-ins until 6pm", how: "Quotes from your price list, slots for drop-offs" },
  { t: "Classes and studios", q: "yoga sat 9am got space?", a: "3 spots left for Saturday 9am", how: "Group sessions by headcount per class" },
];

export function Site({ stats }: { stats: SiteStats }) {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"full" | "lite" | null>(null);
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 900 || window.matchMedia("(pointer: coarse)").matches;
    setMode(reduce || small ? "lite" : "full");
    try {
      setSound(localStorage.getItem("jawab-sound") === "1");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("jawab-sound", sound ? "1" : "0");
    } catch {}
  }, [sound]);

  // Smooth scroll, wired into ScrollTrigger.
  useEffect(() => {
    if (mode !== "full") return;
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      lenis.scrollTo(a.getAttribute("href")!, { offset: 0, duration: 1.4 });
    };
    document.addEventListener("click", onAnchor);
    return () => {
      document.removeEventListener("click", onAnchor);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [mode]);

  // Pause the WebGL scene when the hero is off screen.
  useEffect(() => {
    const el = document.getElementById("top");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      if (!mode) return;
      const q = gsap.utils.selector(root);
      if (mode === "lite") return;

      // 01: headline rises once, after the preloader.
      if (ready) {
        const split = SplitText.create(q(".hero-title"), { type: "lines,words", mask: "lines" });
        gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.05 });
        gsap.fromTo(q(".hero-sub, .hero-cta"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.5, stagger: 0.08, ease: "power3.out", clearProps: "opacity,transform" });
      }

      // 02: the pile-up.
      const pile = gsap.timeline({ scrollTrigger: { trigger: "#pileup", start: "top top", end: "+=140%", scrub: 0.6, pin: true, pinSpacing: true } });
      pile.from(q(".pile-row"), { opacity: 0, y: -24, stagger: 0.12, ease: "power2.out" }, 0);
      q(".pile-badge").forEach((b, i) => {
        const target = Number(b.dataset.n);
        const o = { v: 0 };
        pile.to(o, { v: target, ease: "none", onUpdate: () => (b.textContent = String(Math.round(o.v))) }, 0.1 + i * 0.05);
      });
      const counter = q(".pile-counter")[0];
      const cv = { v: 0 };
      pile.to(cv, { v: 148, ease: "power1.in", duration: 1.6, onUpdate: () => counter && (counter.textContent = String(Math.round(cv.v)).padStart(3, "0")) }, 0);
      pile.to(q(".pile-phone"), { rotate: -2.5, scale: 1.02, ease: "none" }, 0.4);

      // 03: how it works, one step at a time while pinned.
      const how = gsap.timeline({ scrollTrigger: { trigger: "#how", start: "top top", end: "+=160%", scrub: 0.6, pin: true, pinSpacing: true } });
      q(".how-step").forEach((el, i) => {
        how.fromTo(el, { opacity: 0.18, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, i * 0.45);
        how.fromTo(el.querySelector(".how-bar"), { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "none" }, i * 0.45);
      });

      // 04: teach it once (horizontal).
      const track = q(".teach-track")[0] as HTMLElement | undefined;
      if (track) {
        const dist = () => track.scrollWidth - window.innerWidth + 120;
        const teach = gsap.timeline({ scrollTrigger: { trigger: "#teach", start: "top top", end: () => `+=${dist() + window.innerHeight * 0.9}`, scrub: 0.7, pin: true, pinSpacing: true, invalidateOnRefresh: true } });
        teach.to(track, { x: () => -dist(), ease: "none", duration: 1 });
        teach.to(q(".teach-card"), { x: () => window.innerWidth * 0.18, y: 40, scale: 0.12, opacity: 0, rotate: () => gsap.utils.random(-25, 25), stagger: 0.03, ease: "power2.in", duration: 0.5 }, 0.95);
        teach.fromTo(q(".teach-bell"), { scale: 0.8 }, { scale: 1.25, ease: "back.out(3)", duration: 0.25 }, 1.35);
        teach.from(q(".teach-done"), { opacity: 0, y: 20, duration: 0.25 }, 1.45);
      }

      // 05: any business.
      gsap.from(q(".kind"), { opacity: 0, y: 40, stagger: 0.07, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: "#any", start: "top 70%" } });

      // 06: lanes counters tick when visible.
      q(".lane-count").forEach((el) => {
        const o = { v: 0 };
        gsap.to(o, { v: Number(el.dataset.n), duration: 1.8, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en")), scrollTrigger: { trigger: el, start: "top 85%" } });
      });

      // 08: it knows when to stop.
      const stop = gsap.timeline({ scrollTrigger: { trigger: "#stop", start: "top top", end: "+=130%", scrub: 0.6, pin: true, pinSpacing: true } });
      stop.fromTo(q(".stream-pill"), { y: -60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.4 }, 0);
      stop.to(q(".stream-pill:not(.is-signal)"), { y: 380, opacity: 0, stagger: 0.06, duration: 0.6, ease: "power1.in" }, 0.55);
      stop.to(q(".stream-pill.is-signal"), { backgroundColor: "#FF4A1C", color: "#0E0D0B", borderColor: "#FF4A1C", y: -30, scale: 1.06, duration: 0.25 }, 0.55);
      stop.to(q(".stream-pill.is-signal"), { x: () => (q(".tray")[0] as HTMLElement).getBoundingClientRect().left - (q(".stream-pill.is-signal")[0] as HTMLElement).getBoundingClientRect().left + 24, y: 170, scale: 0.92, duration: 0.5, ease: "power2.inOut" }, 0.85);
      stop.to(q(".stream-pill.is-signal"), { opacity: 0, scale: 0.7, duration: 0.2 }, 1.28);
      stop.from(q(".tray-summary"), { opacity: 0, y: 10, duration: 0.2 }, 1.3);

      // 09: hiring, handled.
      const hire = gsap.timeline({ scrollTrigger: { trigger: "#hiring", start: "top top", end: "+=160%", scrub: 0.6, pin: true, pinSpacing: true } });
      hire.from(q(".resume"), { x: -260, y: (i: number) => (i % 2 ? -80 : 60), rotate: (i: number) => (i % 2 ? -14 : 12), opacity: 0, stagger: 0.07, duration: 0.5, ease: "power2.out" }, 0);
      hire.from(q(".resume-score"), { opacity: 0, scale: 0.6, stagger: 0.07, duration: 0.25 }, 0.45);
      hire.fromTo(q(".cal-block"), { y: -140, opacity: 0 }, { y: 0, opacity: 1, ease: "bounce.out", duration: 0.45 }, 0.85);
      hire.to(q(".approve-btn"), { scale: 0.94, duration: 0.08 }, 1.35).to(q(".approve-btn"), { scale: 1, backgroundColor: "#D4FF3A", duration: 0.15 }, 1.43);
      hire.from(q(".approve-sent"), { opacity: 0, y: 8, duration: 0.15 }, 1.5);

      // 10: one door, every desk.
      const door = gsap.timeline({ scrollTrigger: { trigger: "#door", start: "top top", end: "+=140%", scrub: 0.7, pin: true, pinSpacing: true } });
      door.to(q(".login-card"), { scale: 0.7, opacity: 0, duration: 0.5, ease: "power2.in" }, 0.15);
      door.from(q(".desk"), { scale: 0.35, opacity: 0, x: (i: number) => (i - 1) * -240, y: 60, stagger: 0.06, duration: 0.6, ease: "power3.out" }, 0.45);

      // Section titles: words rise once on entry. Created after the pins so their positions include pin spacing.
      q(".kinetic").forEach((el) => {
        const s = SplitText.create(el, { type: "words", mask: "words" });
        gsap.from(s.words, { yPercent: 105, duration: 0.9, ease: "expo.out", stagger: 0.04, scrollTrigger: { trigger: el, start: "top 82%" } });
      });
    },
    { scope: root, dependencies: [mode, ready], revertOnUpdate: true },
  );

  const total = stats.channels.reduce((s, c) => s + c.n, 0);
  const lane = (key: string) => stats.channels.find((c) => c.channel === key)?.n ?? 0;
  const sampleNames = stats.samples.map((s) => s.name);
  const qrTarget = stats.botUsername ? `https://t.me/${stats.botUsername}?start=${stats.demoWorkspaceId}` : "#ring";

  return (
    <div ref={root} data-theme="dark" className={cx("relative bg-ink text-paper", mode === "full" && "[&_*]:cursor-none")}>
      <Preloader onDone={() => setReady(true)} sound={sound} />
      {mode === "full" ? <Cursor /> : null}

      {/* 01 HERO */}
      <section id="top" className="relative h-dvh min-h-[640px] overflow-hidden">
        <div className="absolute inset-0">
          {mode === "full" && ready ? <HeroCanvas sound={sound} active={heroVisible} /> : null}
          {mode === "lite" ? (
            <div className="absolute inset-0 bg-ink">
              <StaticBell className="absolute right-[-10%] top-[8%] w-[120%] max-w-[760px] sm:right-0 sm:w-[70%]" />
              <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#17150f] to-transparent" />
            </div>
          ) : null}
        </div>
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-2 font-display text-[20px] font-extrabold" data-cursor>
            <BellMark /> Jawab
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block">
              <SoundToggle on={sound} onChange={setSound} />
            </span>
            <a href="#how" className="hidden h-9 items-center px-2 text-[13px] text-paper/70 hover:text-paper md:inline-flex" data-cursor>
              How it works
            </a>
            <Link href="/login" className="inline-flex h-9 items-center rounded-full border border-paper/20 px-4 text-[13px] hover:border-paper/50" data-cursor>
              Sign in
            </Link>
            <Link href="/signup" className="inline-flex h-9 items-center rounded-full bg-paper px-4 text-[13px] font-medium text-ink hover:brightness-95" data-cursor>
              Get started
            </Link>
          </nav>
        </header>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-10 sm:px-10 sm:pb-14">
          <h1 className="hero-title font-display max-w-[13ch] text-[clamp(56px,8.2vw,176px)] font-extrabold leading-[0.86] tracking-[-0.045em]">
            Every question, <span className="accent-word tracking-[-0.02em] text-brass">answered</span>.
          </h1>
          <div className="mt-6 flex flex-col gap-6 sm:mt-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="hero-sub max-w-[48ch] text-[17px] leading-relaxed text-paper/75 sm:text-[19px]">
              Jawab is the front desk for your business on WhatsApp, Telegram and Instagram. It answers customers from your own prices, stock and calendar, takes bookings, and only calls you when it should.
            </p>
            <div className="pointer-events-auto flex flex-wrap gap-3">
              <Link href="/signup" className="hero-cta inline-flex h-12 items-center rounded-full bg-signal px-6 text-[15px] font-semibold text-ink transition hover:brightness-110" data-cursor>
                Get started
              </Link>
              <a href="#ring" className="hero-cta inline-flex h-12 items-center rounded-full border border-paper/30 px-6 text-[15px] text-paper hover:border-paper/70" data-cursor>
                Ring the bell
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 02 THE PILE-UP */}
      <section id="pileup" className="relative flex min-h-dvh items-center overflow-hidden border-t border-paper/10 px-4 py-20 sm:px-10">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
              Your customers don&apos;t <span className="accent-word text-brass">wait</span>.
            </h2>
            <p className="mt-6 font-display text-[clamp(26px,3vw,44px)] font-bold leading-tight text-paper/55">And you can&apos;t answer every chat.</p>
            <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-paper/60">The same questions, all day: how much, are you open, got stock, can I book. Every slow reply is a customer who asked someone else.</p>
            <div className="mt-10 flex items-baseline gap-4">
              <span className="pile-counter num text-[clamp(64px,9vw,128px)] leading-none text-paper">{mode === "lite" ? "148" : "000"}</span>
              <span className="max-w-[16ch] text-[14px] text-paper/55">unread on a busy Saturday, illustration</span>
            </div>
          </div>
          <div className="pile-phone mx-auto w-full max-w-[380px] rounded-[36px] border border-paper/15 bg-[#151411] p-3">
            <div className="rounded-[26px] bg-ink p-2">
              <div className="flex items-center justify-between px-3 py-2 text-[13px] text-paper/60">
                <span>Chats</span>
                <span className="num">20:14</span>
              </div>
              <ul>
                {NAMES.map((n, i) => (
                  <li key={n} className="pile-row flex items-center gap-3 border-t border-paper/[0.06] px-3 py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper/10 text-[13px] text-paper/70">{n.replace(/[^A-Za-z]/g, "").slice(0, 1) || "#"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-paper">{n}</span>
                      <span className="block truncate text-[12px] text-paper/50">{PREVIEWS[i]}</span>
                    </span>
                    <span className="pile-badge num grid h-6 min-w-6 place-items-center rounded-full bg-signal px-1.5 text-[11px] font-semibold text-ink" data-n={[7, 3, 12, 2, 5, 9, 1, 4, 6, 3, 8, 2][i]}>
                      {mode === "lite" ? [7, 3, 12, 2, 5, 9, 1, 4, 6, 3, 8, 2][i] : 0}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 03 HOW IT WORKS */}
      <section id="how" className="relative flex min-h-dvh items-center overflow-hidden border-t border-paper/10 px-4 py-20 sm:px-10">
        <div className="mx-auto w-full max-w-[1280px]">
          <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Open in <span className="accent-word text-brass">ten minutes</span>.
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] text-paper/70">No flows to build, no bot to train. You explain your business once, the way you&apos;d brief a new hire.</p>
          <ol className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="how-step">
                <div className="relative h-[2px] bg-paper/15">
                  <div className="how-bar absolute inset-0 origin-left bg-brass" />
                </div>
                <div className="num mt-5 text-[13px] text-brass">{s.n}</div>
                <h3 className="font-display mt-1 text-[28px] font-bold leading-tight">{s.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-paper/65">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <Link href="/signup" className="inline-flex h-12 items-center rounded-full bg-signal px-6 text-[15px] font-semibold text-ink transition hover:brightness-110" data-cursor>
              Set up my business
            </Link>
          </div>
        </div>
      </section>

      {/* 04 TEACH IT ONCE */}
      <section id="teach" className="relative min-h-dvh overflow-hidden border-t border-paper/10 py-20">
        <div className="px-4 sm:px-10">
          <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Teach it <span className="accent-word text-brass">once</span>.
          </h2>
          <p className="mt-4 max-w-[56ch] text-[17px] text-paper/70">
            Type it, or upload the menu, the price list or a photo of the board. Claude turns it into prices, options, stock, hours, booking rules and FAQs. Change anything later and the next answer already knows.
          </p>
        </div>
        <div className={cx("relative mt-12", mode === "lite" ? "overflow-x-auto px-4 pb-4" : "")}>
          <div className="teach-track flex w-max gap-5 px-4 sm:px-10">
            <TeachCard title="A voice-note style brief">
              <p className="text-[15px] leading-relaxed text-paper/85">
                “We&apos;re a small salon in Mont Kiara, three stylists. Women&apos;s cut and blow-dry RM 85 short, RM 110 long. Closed Mondays. Book at least 2 hours ahead, free cancellation up to 24 hours…”
              </p>
            </TeachCard>
            <TeachCard title="Price list, from a photo">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-paper/50">
                    <th className="font-normal">Service</th>
                    <th className="text-right font-normal">Short</th>
                    <th className="text-right font-normal">Long</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {[["Cut and blow-dry", 85, 110], ["Full colour", 180, 260], ["Keratin", 350, 420], ["Blow-dry", 50, 70]].map(([n, a, b]) => (
                    <tr key={n as string} className="border-t border-paper/10">
                      <td className="py-1.5 font-sans">{n}</td>
                      <td className="text-right">{a}</td>
                      <td className="text-right">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TeachCard>
            <TeachCard title="Stock by size and colour">
              <div className="space-y-2.5 text-[14px]">
                {[["Black", "#2a2823", [4, 9, 7, 3]], ["Brick Red", "#FF4A1C", [2, 6, 5, 1]], ["Cream", "#F2ECE0", [0, 3, 4, 2]]].map(([c, hex, st]) => (
                  <div key={c as string} className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full border border-paper/30" style={{ background: hex as string }} />
                    <span className="w-24">{c}</span>
                    <span className="num flex gap-3 text-paper/70">
                      {(st as number[]).map((n, i) => (
                        <span key={i} className={n === 0 ? "text-signal" : ""}>
                          {["S", "M", "L", "XL"][i]}
                          {n}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </TeachCard>
            <TeachCard title="Hours and bookings">
              <dl className="num space-y-1 text-[14px]">
                {[["Mon", "closed"], ["Tue–Fri", "10:00–19:00"], ["Sat", "09:00–19:00"], ["Sun", "10:00–17:00"], ["Capacity", "3 stylists at once"], ["Notice", "2 hours ahead"]].map(([d, h]) => (
                  <div key={d} className="flex justify-between gap-6">
                    <dt className="font-sans text-paper/60">{d}</dt>
                    <dd>{h}</dd>
                  </div>
                ))}
              </dl>
            </TeachCard>
            <TeachCard title="House rules">
              <p className="text-[15px] leading-relaxed text-paper/85">Free cancellation up to 24 hours. Patch test 48 hours before first colour. Basement parking free for 2 hours. Refunds are decided by the owner only.</p>
            </TeachCard>
            <TeachCard title="FAQ, as customers type it">
              <p className="text-[15px] text-paper/60">“how much for long hair cut ah”</p>
              <p className="mt-1 text-[15px] text-paper/60">“got slot this sat?”</p>
              <p className="mt-1 text-[15px] text-paper/60">“can pay tng?”</p>
            </TeachCard>
            <div className="flex w-[40vw] min-w-[280px] items-center justify-center">
              <div className="text-center">
                <div className="teach-bell inline-block">
                  <BellMark size={120} />
                </div>
                <p className="teach-done mt-4 max-w-[26ch] text-[16px] text-paper/75">Now it answers from your facts, and only your facts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05 ANY BUSINESS */}
      <section id="any" className="relative border-t border-paper/10 px-4 py-24 sm:px-10">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Whatever you <span className="accent-word text-brass">sell</span>.
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] text-paper/70">Tables, appointments, rooms or stock on a shelf: you describe how bookings work and Jawab checks real availability before it promises anything.</p>
          <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-paper/10 bg-paper/10 sm:grid-cols-2 xl:grid-cols-3">
            {KINDS.map((k) => (
              <li key={k.t} className="kind bg-ink p-6">
                <h3 className="font-display text-[22px] font-bold">{k.t}</h3>
                <div className="mt-5 space-y-2">
                  <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-paper/[0.08] px-3.5 py-2 text-[14px]">{k.q}</p>
                  <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-answered px-3.5 py-2 text-[14px] text-ink">{k.a}</p>
                </div>
                <p className="mt-5 text-[13px] text-paper/50">{k.how}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 06 ANSWERED EVERYWHERE */}
      <section id="everywhere" className="relative border-t border-paper/10 px-4 py-24 sm:px-10">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Answered <span className="accent-word text-brass">everywhere</span>.
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] text-paper/70">One assistant behind every door your customers use. On Telegram it can reply from your own account through Telegram Business; on Instagram it answers DMs and comments.</p>
          <div className="mt-14 divide-y divide-paper/10 border-y border-paper/10">
            {[["telegram", "Telegram"], ["whatsapp", "WhatsApp"], ["instagram", "Instagram"]].map(([key, label], li) => (
              <div key={key} className="relative grid grid-cols-[1fr_auto] items-center gap-6 overflow-hidden py-6 sm:grid-cols-[180px_1fr_auto]">
                <div className="font-display text-[26px] font-bold">{label}</div>
                <div className="relative hidden h-10 overflow-hidden sm:block" aria-hidden>
                  {[0, 1, 2, 3].map((k) => (
                    <span
                      key={k}
                      className={cx("absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px]", k % 2 ? "bg-answered text-ink" : "border border-paper/20 bg-paper/[0.06] text-paper")}
                      style={{ animation: mode === "full" ? `lane ${7 + li}s linear ${k * (1.8 + li * 0.2)}s infinite` : undefined, left: mode === "full" ? undefined : `${k * 24}%` }}
                    >
                      {[["haircut sat 11am?", "Booked, Sat 11:00"], ["Large Margherita?", "RM 52"], ["red one size M?", "3 in stock"]][li][k % 2]}
                    </span>
                  ))}
                </div>
                <div className="text-right">
                  <div className="lane-count num text-[clamp(32px,4vw,56px)] leading-none" data-n={lane(key)}>
                    {mode === "lite" ? lane(key).toLocaleString("en") : "0"}
                  </div>
                  <div className="text-[12px] text-paper/50">answered</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-[80ch] text-[13px] text-paper/50">
            Counts are live from the sample businesses{sampleNames.length ? ` (${sampleNames.join(" and ")})` : ""} over the last {stats.days} days: {total.toLocaleString("en")} answers{stats.demoShare > 0 ? `, ${Math.round(stats.demoShare * 100)}% of them seeded demo data` : ""}.
          </p>
        </div>
      </section>

      {/* 07 RING THE BELL (LIVE) */}
      <section id="ring" className="relative border-t border-paper/10 px-4 py-24 sm:px-10">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Ring the <span className="accent-word text-brass">bell</span>.
          </h2>
          <p className="mb-12 mt-4 max-w-[58ch] text-[17px] text-paper/70">
            {sampleNames.length > 1 ? `${sampleNames.slice(0, -1).join(", ")} and ${sampleNames.at(-1)} are sample businesses that exist only for this demo.` : "This is a sample business that exists only for this demo."} Their assistants are live. Pick one and ask it something.
          </p>
          <Simulator samples={stats.samples} />
        </div>
      </section>

      {/* 08 IT KNOWS WHEN TO STOP */}
      <section id="stop" className="relative flex min-h-dvh items-center overflow-hidden border-t border-paper/10 px-4 py-20 sm:px-10">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
              It knows when to <span className="accent-word text-signal">stop</span>.
            </h2>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-paper/70">
              Complaints, refunds, partnerships, legal and medical questions, price haggling, anything rude, anything it isn&apos;t sure of: the customer gets a holding reply, and a person gets a one-line summary. It never makes up an answer.
            </p>
          </div>
          <div className="relative grid min-h-[460px] grid-cols-[1fr_1fr] gap-6">
            <div className="flex flex-col gap-3 pt-6">
              {["do u deliver to TTDI?", "how much for keratin", "We'd like to stock your products in our 12 stores", "table for 3 sun lunch", "open on public holiday?"].map((t, i) => (
                <span key={t} className={cx("stream-pill w-fit max-w-full rounded-2xl border border-paper/20 bg-paper/[0.06] px-4 py-2.5 text-[14px]", i === 2 && "is-signal")}>
                  {t}
                </span>
              ))}
            </div>
            <div className="tray self-end rounded-2xl border border-signal/50 bg-signal/[0.06] p-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-[20px] font-bold">Needs you</span>
                <span className="num rounded-full bg-signal px-2 text-[12px] text-ink">1</span>
              </div>
              <div className="tray-summary mt-4 border-t border-signal/30 pt-4">
                <span className="rounded-full border border-signal/60 px-2.5 py-0.5 text-[12px] text-signal">Wholesale</span>
                <p className="mt-2 text-[15px]">Retail chain wants to stock your products in 12 stores.</p>
                <p className="mt-1 text-[13px] text-paper/55">Holding reply sent. No answer was invented.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 09 HIRING, HANDLED */}
      <section id="hiring" className="relative flex min-h-dvh items-center overflow-hidden border-t border-paper/10 px-4 py-20 sm:px-10">
        <div className="mx-auto w-full max-w-[1280px]">
          <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Hiring, <span className="accent-word text-brass">handled</span>.
          </h2>
          <p className="mt-4 max-w-[62ch] text-[17px] text-paper/70">
            Optional: switch it on when you&apos;re hiring. Say who you need, like “Pizza cook, 3+ years wood-fired, evenings, near Bangsar.” Jawab ranks people who applied through your bot or CVs you uploaded, quotes the evidence, offers three free times, and waits for your Approve.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
            <ol className="space-y-2.5">
              {[["Aiman H.", 94, "“Ran the wood-fired oven alone on Friday and Saturday nights”"], ["Mei Ling T.", 91, "“4 years on a wood-fired oven doing 48-hour cold-fermented dough”"], ["Yusuf A.", 88, "“Evenings and weekends, 10 minutes from Bangsar”"], ["Priya N.", 84, "“3.5 years on wood-fired oven at Casa Fumo”"]].map(([n, s, ev]) => (
                <li key={n as string} className="resume flex items-center gap-4 rounded-xl bg-paper px-4 py-3 text-ink">
                  <span className="resume-score num w-12 text-[28px] font-medium leading-none">{s}</span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{n}</span>
                    <span className="accent-word block truncate text-[16px] text-ink/70">{ev}</span>
                  </span>
                </li>
              ))}
              <li className="px-1 pt-1 text-[12px] text-paper/50">Illustration with candidates from the sample pizzeria. Scores come from the model, with quotes checked against each CV.</li>
            </ol>
            <div className="rounded-2xl border border-paper/15 p-4">
              <div className="grid grid-cols-5 gap-1.5 text-center text-[12px] text-paper/50">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="mt-2 grid h-[180px] grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((c) => (
                  <div key={c} className="relative rounded-md bg-paper/[0.04]">
                    {c === 0 || c === 3 ? <div className="hatch absolute inset-x-1 top-[18%] h-[22%] rounded" /> : null}
                    {c === 2 ? <div className="cal-block absolute inset-x-1 top-[52%] h-[16%] rounded bg-brass" /> : null}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[14px] text-paper/70">Invite Aiman, Wed 2:30pm</span>
                <button className="approve-btn h-10 rounded-full bg-signal px-5 text-[14px] font-semibold text-ink" tabIndex={-1} aria-hidden>
                  Approve
                </button>
              </div>
              <p className="approve-sent mt-2 text-right text-[13px] text-answered">Sent in the bot chat. He picked a time.</p>
            </div>
          </div>
          <p className="mt-8 text-[15px] text-paper">
            <span className="font-medium">Ranked on skills and availability only.</span> <span className="text-paper/60">Never gender, age, religion, ethnicity, marital status or photos.</span>
          </p>
        </div>
      </section>

      {/* 10 ONE DOOR, EVERY DESK */}
      <section id="door" className="relative flex min-h-dvh items-center overflow-hidden border-t border-paper/10 px-4 py-20 sm:px-10">
        <div className="mx-auto w-full max-w-[1280px]">
          <h2 className="kinetic font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            One door, every <span className="accent-word text-brass">desk</span>.
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] text-paper/70">Invite your team with a link. Each person signs in to their own desk and sees only what their job needs.</p>
          <div className="relative mt-12 min-h-[360px]">
            <div className={cx("login-card mx-auto w-full max-w-[360px] rounded-2xl border border-paper/15 bg-[#151411] p-6", mode === "lite" && "hidden")}>
              {["Email", "Password"].map((l, i) => (
                <div key={l} className="mb-3">
                  <div className="text-[12px] text-paper/50">{l}</div>
                  <div className="num mt-1 h-10 rounded-lg border border-paper/15 px-3 py-2 text-[14px] text-paper/80">{["you@yourbusiness.com", "••••••••"][i]}</div>
                </div>
              ))}
              <div className="mt-4 h-10 rounded-lg bg-signal" />
            </div>
            <div className={cx("grid grid-cols-1 gap-5 md:grid-cols-3", mode === "full" && "absolute inset-0")}>
              {[
                { t: "Owner", d: "Everything: how many chats were answered, first-reply time, top questions, knowledge gaps, channels and team.", rows: [["Auto-resolved", "88%"], ["Median first reply", "2.4s"], ["Knowledge gaps", "3"]] },
                { t: "Service", d: "Live inbox across channels, the Needs-you queue, takeover, knowledge and bookings.", rows: [["Needs you", "2"], ["Drafts to approve", "1"], ["Bookings today", "14"]] },
                { t: "HR", d: "Hiring only: ranked candidates with evidence, approvals, interview calendar, pipeline.", rows: [["Shortlisted", "6"], ["Waiting for Approve", "2"], ["Interviews this week", "3"]] },
              ].map((x) => (
                <div key={x.t} className="desk rounded-2xl border border-paper/15 bg-paper p-5 text-ink">
                  <div className="font-display text-[26px] font-extrabold">{x.t}</div>
                  <p className="mt-1 text-[14px] text-ink/70">{x.d}</p>
                  <dl className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                    {x.rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 text-[14px]">
                        <dt>{k}</dt>
                        <dd className="num">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-[11px] text-ink/50">illustration</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11 CLOSE */}
      <section id="open" className="relative border-t border-paper/10 px-4 pb-10 pt-24 sm:px-10">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-end gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="kinetic font-display text-[clamp(64px,13vw,220px)] font-extrabold leading-[0.84] tracking-[-0.05em]">
              Open the <span className="accent-word tracking-[-0.02em] text-brass">counter</span>.
            </h2>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/signup" className="inline-flex h-14 items-center rounded-full bg-signal px-8 text-[17px] font-semibold text-ink transition hover:brightness-110" data-cursor>
                Get started
              </Link>
              <span className="text-[14px] text-paper/55">No card needed. Bring your own WhatsApp Business number.</span>
            </div>
          </div>
          <div className="flex items-end gap-5">
            <a href={qrTarget} className="block rounded-2xl border border-paper/20 p-4" data-cursor>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr?start=${stats.demoWorkspaceId}`} alt={stats.botUsername ? `QR code to message the sample pizzeria through @${stats.botUsername} on Telegram` : "QR code for the live demo"} width={148} height={148} className="h-[148px] w-[148px]" />
            </a>
            <div className="pb-1 text-[14px] text-paper/70">
              <p className="text-paper">{stats.botUsername ? `@${stats.botUsername}` : "Live demo"}</p>
              <p className="max-w-[20ch]">{stats.botUsername ? "Scan to message the sample pizzeria on Telegram." : "Scan to try the assistant on your phone."}</p>
            </div>
          </div>
        </div>
        <footer className="mx-auto mt-24 flex max-w-[1280px] flex-col gap-3 border-t border-paper/10 pt-6 text-[13px] text-paper/50 sm:flex-row sm:justify-between">
          <span>Business-scoped by design: Jawab only talks about your business.</span>
          <span>{sampleNames.length ? `${sampleNames.join(" and ")} ${sampleNames.length > 1 ? "are fictional businesses" : "is a fictional business"} made for this demo.` : "Sample businesses are fictional."}</span>
          <span className="flex gap-4">
            <Link href="/login" className="text-paper/80 hover:text-paper" data-cursor>
              Sign in
            </Link>
            <Link href="/signup" className="text-paper/80 hover:text-paper" data-cursor>
              Get started
            </Link>
          </span>
        </footer>
      </section>
      <style>{`@keyframes lane { from { left: -30%; } to { left: 105%; } }`}</style>
    </div>
  );
}

function TeachCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="teach-card w-[min(78vw,360px)] shrink-0 rounded-2xl border border-paper/15 bg-[#151411] p-5">
      <div className="mb-4 text-[13px] text-paper/50">{title}</div>
      {children}
    </div>
  );
}
