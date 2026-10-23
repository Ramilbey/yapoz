"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { Preloader, ScrollProgress, SiteHeader, BellMark, StaticBell } from "./chrome";
import { Simulator, type SampleBusiness } from "./simulator";
import { AppIcon, ChatList, InstagramChat, TelegramChat, WhatsAppChat, type Chat } from "./phones";
import { FilmPlayer } from "./film-player";
import { cx } from "../ui/cx";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const HeroCanvas = dynamic(() => import("./hero-canvas"), { ssr: false });

export type SiteStats = { channels: { channel: string; n: number }[]; days: number; demoShare: number; botUsername: string | null; demoWorkspaceId: string; samples: SampleBusiness[] };

/** full: wide screen with a mouse (pinned 3D scenes). touch: phones and tablets (same story, no pinning). lite: reduced motion. */
type Mode = "full" | "touch" | "lite";

const STEPS = [
  { n: "01", t: "Sign up", d: "Your business name and an owner login. Two minutes, no card." },
  { n: "02", t: "Explain your business", d: "Describe it in your own words, the way you would brief a new hire, or upload a menu, a price list or a photo of the board. Claude drafts your products, prices, hours, booking rules and FAQs; you check each one." },
  { n: "03", t: "Connect your chats", d: "Telegram in one tap, WhatsApp with your Business Platform number, Instagram by signing in. Customers keep using the apps they already use." },
  { n: "04", t: "Go live", d: "Replies in seconds, bookings into free slots, orders held for your yes, and anything it isn't sure of handed to a person." },
];

const KINDS = [
  { t: "Restaurants and cafés", q: "table for 4 fri 8pm?", a: "Booked: Fri 8pm, 4 people. Ref F7-2K9M", how: "Tables by headcount, menu with sizes, delivery zones" },
  { t: "Salons and clinics", q: "women's cut tmr 3pm?", a: "Thu 3pm is free. Booked with your name, 60 min", how: "Appointments by service length, staff capacity" },
  { t: "Shops", q: "this dress in M, black?", a: "Black M: 2 left, RM 129", how: "Stock by size and colour, live from the dashboard" },
  { t: "Hotels and rentals", q: "room for 2 sat-sun?", a: "1 Deluxe left for Sat–Sun, RM 260 a night", how: "Bookings by the day, units per day" },
  { t: "Repairs and services", q: "iphone 13 screen how much", a: "RM 380, about 1 hour. Walk-ins until 6pm", how: "Quotes from your price list, slots for drop-offs" },
  { t: "Classes and studios", q: "yoga sat 9am got space?", a: "3 spots left for Saturday 9am", how: "Group sessions by headcount per class" },
];

const ASKS = ["how much for a long hair cut?", "are you open on Sunday?", "got the red one in M?", "can I book Saturday 11am?", "do you deliver to Bangsar?", "is it halal?", "can I change my booking?", "table for 4 tonight?", "how much for keratin?", "parking available?"];
const ANSWERS = ["Booked: Sat 11:00", "RM 52", "6 in stock", "Delivery RM 5, about 40 min", "Open 11:00 to 22:00", "Yes, halal kitchen", "Moved to Sun 3pm", "Table for 4 at 8:15", "RM 350 for long hair"];

const CHANNELS: { key: Chat; label: string }[] = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
  { key: "instagram", label: "Instagram" },
];

const H2 = ({ children, className }: { children: ReactNode; className?: string }) => <h2 className={cx("kinetic yp-display yp-h2", className)}>{children}</h2>;
const Lede = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cx("mt-5 max-w-[58ch] text-[17px] leading-relaxed text-yp-fog sm:text-[18px]", className)}>{children}</p>;

function Marquee({ items, reverse, alt }: { items: string[]; reverse?: boolean; alt?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden" aria-hidden>
      <div className="yp-marquee-track flex w-max gap-3 py-1.5" style={{ animation: `yp-marquee ${reverse ? 70 : 55}s linear infinite ${reverse ? "reverse" : ""}` }}>
        {row.map((t, i) => (
          <span key={i} className={cx("whitespace-nowrap rounded-full px-4 py-2 text-[14px]", (i % 2 === 1) === !!alt ? "bg-yp-mint font-medium text-yp-ink" : "border border-yp-line2 bg-yp-panel text-yp-fog")}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const Toast = ({ ch, text, className }: { ch: string; text: string; className?: string }) => (
  <div className={cx("toast absolute hidden w-[240px] items-center gap-3 rounded-2xl border border-yp-line2 bg-yp-panel/90 px-3.5 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur lg:flex", className)} aria-hidden>
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-yp-raised text-[11px] font-bold text-yp-ice">{ch[0]}</span>
    <span className="min-w-0 leading-tight">
      <span className="yp-mono block text-[10px] uppercase text-yp-smoke">{ch} · now</span>
      <span className="block truncate text-[13.5px] text-yp-frost">{text}</span>
    </span>
  </div>
);

function TeachCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="teach-card w-[min(78vw,360px)] shrink-0 snap-center rounded-3xl border border-yp-line2 bg-yp-panel p-5">
      <div className="yp-mono mb-4 text-[11px] uppercase text-yp-smoke">{title}</div>
      {children}
    </div>
  );
}

export function Site({ stats }: { stats: SiteStats }) {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [tab, setTab] = useState<Chat>("whatsapp");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setMode(reduce.matches ? "lite" : wide.matches ? "full" : "touch");
    update();
    reduce.addEventListener("change", update);
    wide.addEventListener("change", update);
    try {
      setSound(localStorage.getItem("yapoz-sound") === "1");
    } catch {}
    return () => {
      reduce.removeEventListener("change", update);
      wide.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("yapoz-sound", sound ? "1" : "0");
    } catch {}
  }, [sound]);

  // Smooth scroll on desktop, wired into ScrollTrigger. Phones keep native momentum.
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
      if (!mode || mode === "lite") return;
      const full = mode === "full";
      const q = gsap.utils.selector(root);

      /** Pinned and scrubbed on desktop; the same tweens play once, on entering view, on touch screens. */
      const scene = (trigger: string, build: (tl: gsap.core.Timeline) => void, pinLength = "+=150%", seconds = 1.8) => {
        if (full) {
          build(gsap.timeline({ scrollTrigger: { trigger, start: "top top", end: pinLength, scrub: 0.6, pin: true, pinSpacing: true, invalidateOnRefresh: true } }));
          return;
        }
        const tl = gsap.timeline({ paused: true });
        build(tl);
        tl.duration(seconds);
        ScrollTrigger.create({ trigger, start: "top 72%", once: true, onEnter: () => void tl.play() });
      };

      // 01: the headline rises once the preloader is gone.
      if (ready) {
        const split = SplitText.create(q(".hero-title"), { type: "lines,words", mask: "lines" });
        gsap.from(split.words, { yPercent: 115, rotate: 5, duration: 1.1, ease: "expo.out", stagger: 0.05 });
        gsap.fromTo(q(".hero-in"), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.5, stagger: 0.09, ease: "power3.out", clearProps: "opacity,transform" });
      }
      // The two lanes of messages drift apart as you leave the hero.
      if (full) {
        gsap.to(q(".lane-a"), { xPercent: -8, ease: "none", scrollTrigger: { trigger: "#lanes", start: "top bottom", end: "bottom top", scrub: 0.8 } });
        gsap.to(q(".lane-b"), { xPercent: 8, ease: "none", scrollTrigger: { trigger: "#lanes", start: "top bottom", end: "bottom top", scrub: 0.8 } });
      }

      // 02: the pile-up.
      scene("#pileup", (tl) => {
        tl.fromTo(q(".pile-phone"), { rotateY: full ? 30 : 12, rotateX: full ? 10 : 4, z: full ? -260 : 0, opacity: 0.15, transformPerspective: 1500 }, { rotateY: full ? -9 : 0, rotateX: full ? 3 : 0, z: 0, opacity: 1, duration: 1.1, ease: "power2.out" }, 0);
        tl.from(q(".pile-row"), { opacity: 0, x: -26, stagger: 0.1, ease: "power2.out", duration: 0.3 }, 0.1);
        q(".pile-badge").forEach((b, i) => {
          const o = { v: 0 };
          tl.to(o, { v: Number(b.dataset.n), ease: "none", duration: 0.5, onUpdate: () => (b.textContent = String(Math.round(o.v))) }, 0.15 + i * 0.07);
        });
        const counter = q(".pile-counter")[0];
        const cv = { v: 0 };
        tl.to(cv, { v: 148, ease: "power1.in", duration: 1.6, onUpdate: () => counter && (counter.textContent = String(Math.round(cv.v)).padStart(3, "0")) }, 0);
        if (full) {
          tl.fromTo(q(".toast"), { y: -280, rotateX: -55, opacity: 0, transformPerspective: 900 }, { y: 0, rotateX: 0, opacity: 1, stagger: 0.13, duration: 0.5, ease: "back.out(1.5)" }, 0.3);
          tl.to(q(".pile-phone"), { rotateY: 7, scale: 1.04, duration: 0.8, ease: "none" }, 1.3);
        }
      });

      // 03: the film grows out of the dark.
      scene(
        "#film",
        (tl) => {
          tl.fromTo(q(".film-head > *"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, ease: "power2.out" }, 0);
          tl.fromTo(q(".film-glow"), { scale: 0.4, opacity: 0 }, { scale: 1.3, opacity: 1, duration: 1, ease: "power1.out" }, 0);
          tl.fromTo(q(".film-stage"), { scale: full ? 0.55 : 0.92, rotateX: full ? 24 : 10, rotateY: full ? -16 : 0, y: full ? 120 : 40, opacity: 0.2, transformPerspective: 1700 }, { scale: 1, rotateX: 0, rotateY: 0, y: 0, opacity: 1, duration: 1, ease: "power2.out" }, 0);
          if (full) tl.to({}, { duration: 0.6 });
        },
        "+=130%",
      );

      // 04: how it works. The four steps rise in once, fully visible, and stay put (no scrubbing back and forth).
      {
        const tl = gsap.timeline({ paused: true });
        tl.from(q(".how-step"), { opacity: 0, y: 46, rotateX: -16, transformPerspective: 900, transformOrigin: "50% 100%", stagger: 0.14, duration: 0.85, ease: "power3.out" }, 0);
        tl.fromTo(q(".how-bar"), { scaleX: 0 }, { scaleX: 1, stagger: 0.14, duration: 0.9, ease: "power2.out" }, 0.15);
        ScrollTrigger.create({ trigger: "#how-steps", start: "top 82%", once: true, onEnter: () => void tl.play() });
      }

      // 05: teach it once (horizontal on desktop; swipeable on phones).
      const track = q(".teach-track")[0] as HTMLElement | undefined;
      if (track && full) {
        const dist = () => track.scrollWidth - window.innerWidth + 48;
        const teach = gsap.timeline({ scrollTrigger: { trigger: "#teach", start: "top top", end: () => `+=${dist() + window.innerHeight * 0.9}`, scrub: 0.7, pin: true, pinSpacing: true, invalidateOnRefresh: true } });
        teach.to(track, { x: () => -dist(), ease: "none", duration: 1 });
        teach.fromTo(q(".teach-card"), { rotateY: 0 }, { rotateY: -14, stagger: 0.02, duration: 0.5, ease: "none" }, 0);
        teach.to(q(".teach-card"), { x: () => window.innerWidth * 0.18, y: 40, scale: 0.12, opacity: 0, rotate: () => gsap.utils.random(-25, 25), stagger: 0.03, ease: "power2.in", duration: 0.5 }, 0.95);
        teach.fromTo(q(".teach-bell"), { scale: 0.8 }, { scale: 1.25, ease: "back.out(3)", duration: 0.25 }, 1.35);
        teach.from(q(".teach-done"), { opacity: 0, y: 20, duration: 0.25 }, 1.45);
      }

      // 06: any business.
      gsap.from(q(".kind"), { opacity: 0, y: 60, rotateX: 38, transformPerspective: 900, transformOrigin: "50% 100%", stagger: 0.08, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: "#any", start: "top 68%" } });

      // 07: answered everywhere. Three phones fill with real-looking chats while the page is pinned.
      const typeChat = (tl: gsap.core.Timeline, sel: string, start: number) => {
        let at = start;
        gsap.utils.toArray<HTMLElement>(q(`${sel} .typing-row, ${sel} .msg`)).forEach((el) => {
          if (el.classList.contains("typing-row")) {
            tl.fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.14 }, at);
            tl.to(el, { height: 0, opacity: 0, duration: 0.1 }, at + 0.26);
            at += 0.3;
          } else {
            tl.from(el, { height: 0, opacity: 0, y: 14, duration: 0.22, ease: "power2.out" }, at);
            at += 0.42;
          }
        });
        return at;
      };
      if (full) {
        const ev = gsap.timeline({ scrollTrigger: { trigger: "#everywhere", start: "top top", end: "+=220%", scrub: 0.7, pin: true, pinSpacing: true, invalidateOnRefresh: true } });
        ev.fromTo(q(".ph"), { y: 420, rotateX: 40, opacity: 0, transformPerspective: 1700 }, { y: 0, rotateX: 0, opacity: 1, stagger: 0.12, duration: 0.55, ease: "power3.out" }, 0);
        ev.fromTo(q(".phones-stage"), { rotateY: 12 }, { rotateY: -12, duration: 5.2, ease: "none" }, 0);
        typeChat(ev, ".ph-wa", 0.6);
        typeChat(ev, ".ph-tg", 1.0);
        typeChat(ev, ".ph-ig", 1.4);
        q(".lane-count").forEach((el) => {
          const o = { v: 0 };
          ev.to(o, { v: Number(el.dataset.n), duration: 3.5, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en")) }, 0.8);
        });
        ev.to({}, { duration: 0.4 }, 5.0);
      } else {
        q(".lane-count").forEach((el) => {
          const o = { v: 0 };
          gsap.to(o, { v: Number(el.dataset.n), duration: 1.8, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en")), scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        });
      }

      // 09: it knows when to stop.
      scene(
        "#stop",
        (tl) => {
          tl.fromTo(q(".stream-pill"), { y: -60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.4 }, 0);
          tl.to(q(".stream-pill:not(.is-signal)"), { y: full ? 380 : 120, opacity: 0, stagger: 0.06, duration: 0.6, ease: "power1.in" }, 0.55);
          tl.to(q(".stream-pill.is-signal"), { backgroundColor: "#FF4DA6", color: "#06080E", borderColor: "#FF4DA6", y: -30, scale: 1.06, duration: 0.25 }, 0.55);
          tl.to(q(".stream-pill.is-signal"), { x: () => (q(".tray")[0] as HTMLElement).getBoundingClientRect().left - (q(".stream-pill.is-signal")[0] as HTMLElement).getBoundingClientRect().left + 24, y: full ? 170 : 240, scale: 0.92, duration: 0.5, ease: "power2.inOut" }, 0.85);
          tl.to(q(".stream-pill.is-signal"), { opacity: 0, scale: 0.7, duration: 0.2 }, 1.28);
          tl.from(q(".tray-summary"), { opacity: 0, y: 10, duration: 0.2 }, 1.3);
        },
        "+=130%",
        2,
      );

      // 10: hiring, handled.
      scene(
        "#hiring",
        (tl) => {
          tl.from(q(".resume"), { x: -260, y: (i: number) => (i % 2 ? -80 : 60), rotate: (i: number) => (i % 2 ? -14 : 12), opacity: 0, stagger: 0.07, duration: 0.5, ease: "power2.out" }, 0);
          tl.from(q(".resume-score"), { opacity: 0, scale: 0.6, stagger: 0.07, duration: 0.25 }, 0.45);
          tl.fromTo(q(".cal-block"), { y: -140, opacity: 0 }, { y: 0, opacity: 1, ease: "bounce.out", duration: 0.45 }, 0.85);
          tl.to(q(".approve-btn"), { scale: 0.94, duration: 0.08 }, 1.35).to(q(".approve-btn"), { scale: 1, backgroundColor: "#2CF5BB", color: "#06080E", duration: 0.15 }, 1.43);
          tl.from(q(".approve-sent"), { opacity: 0, y: 8, duration: 0.15 }, 1.5);
        },
        "+=160%",
        2,
      );

      // 11: one door, every desk.
      scene(
        "#door",
        (tl) => {
          if (full) tl.to(q(".login-card"), { scale: 0.7, opacity: 0, duration: 0.5, ease: "power2.in" }, 0.15);
          tl.from(q(".desk"), { scale: full ? 0.35 : 0.85, opacity: 0, x: (i: number) => (full ? (i - 1) * -240 : 0), y: 60, rotateX: full ? 0 : 20, transformPerspective: 900, stagger: 0.08, duration: 0.6, ease: "power3.out" }, full ? 0.45 : 0);
        },
        "+=140%",
        1.4,
      );

      // Magnetic primary buttons (mouse only).
      const cleanups: (() => void)[] = [];
      if (full) {
        q(".mag").forEach((el) => {
          const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
          const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
            yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
          };
          const leave = () => {
            xTo(0);
            yTo(0);
          };
          el.addEventListener("pointermove", move as EventListener);
          el.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            el.removeEventListener("pointermove", move as EventListener);
            el.removeEventListener("pointerleave", leave);
          });
        });
      }

      // Section titles: words rise once on entry. Created after the pins so their positions include pin spacing.
      q(".kinetic").forEach((el) => {
        const s = SplitText.create(el, { type: "words", mask: "words" });
        gsap.from(s.words, { yPercent: 108, rotate: 4, duration: 0.95, ease: "expo.out", stagger: 0.045, scrollTrigger: { trigger: el, start: "top 86%" } });
      });
      return () => cleanups.forEach((fn) => fn());
    },
    { scope: root, dependencies: [mode, ready], revertOnUpdate: true },
  );

  // On phones the three chats live behind tabs; each tab types its conversation in when you pick it or scroll to it.
  useEffect(() => {
    if (mode !== "touch") return;
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>(".tab-stage .typing-row, .tab-stage .msg");
      const tl = gsap.timeline({ paused: true });
      let at = 0.2;
      els.forEach((el) => {
        if (el.classList.contains("typing-row")) {
          tl.fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.14 }, at);
          tl.to(el, { height: 0, opacity: 0, duration: 0.1 }, at + 0.55);
          at += 0.62;
        } else {
          tl.from(el, { height: 0, opacity: 0, y: 14, duration: 0.25, ease: "power2.out" }, at);
          at += 0.55;
        }
      });
      ScrollTrigger.create({ trigger: ".tab-stage", start: "top 82%", once: true, onEnter: () => void tl.play() });
    }, root);
    return () => ctx.revert();
  }, [tab, mode]);

  const total = stats.channels.reduce((s, c) => s + c.n, 0);
  const lane = (key: string) => stats.channels.find((c) => c.channel === key)?.n ?? 0;
  const sampleNames = stats.samples.map((s) => s.name);
  const lite = mode === "lite";
  const full = mode === "full";
  const phoneW = "w-[clamp(190px,calc((100dvh_-_420px)/2.07),280px)]";

  return (
    <div ref={root} data-theme="dark" className="yp relative overflow-x-clip">
      <Preloader onDone={() => setReady(true)} sound={sound} />
      <ScrollProgress />
      <SiteHeader sound={sound} onSound={setSound} showSound={mode !== "lite"} />

      {/* 01 HERO */}
      <section id="top" className="relative h-dvh min-h-[640px] overflow-hidden">
        <div className="absolute inset-0 bg-yp-ink">
          {(mode === "full" || mode === "touch") && ready ? <HeroCanvas sound={sound} active={heroVisible} lite={mode === "touch"} /> : null}
          {lite ? <StaticBell className="absolute right-[-10%] top-[14%] w-[120%] max-w-[760px] sm:right-0 sm:w-[70%]" /> : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-yp-ink via-yp-ink/75 to-transparent" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[1440px] px-4 pb-8 sm:px-8 sm:pb-12">
          <p className="hero-in yp-mono mb-4 flex items-center gap-2 text-[11px] uppercase text-yp-fog sm:text-[12px]">
            <span className="h-1.5 w-1.5 rounded-full bg-yp-mint" /> WhatsApp · Telegram · Instagram
          </p>
          <h1 className="hero-title yp-display text-[clamp(38px,8.6vw,132px)] leading-[0.88] lg:max-w-[12ch] lg:text-[clamp(60px,7vw,128px)]" style={{ fontVariationSettings: '"wdth" 112' }}>
            Every question, <span className="yp-accent text-[1.14em]">answered</span>.
          </h1>
          <div className="mt-6 flex flex-col gap-6 sm:mt-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="hero-in max-w-[50ch] text-[16px] leading-relaxed text-yp-fog sm:text-[18px]">
              Yapoz is the front desk for your business. It answers customers from your own prices, stock and calendar, takes bookings and orders, and brings in a person only when it should.
            </p>
            <div className="hero-in pointer-events-auto flex flex-wrap gap-3">
              <Link href="/signup" className="mag inline-flex h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-full bg-yp-mint px-7 text-[16px] font-semibold text-yp-ink transition-[filter] hover:brightness-110 sm:flex-none">
                Sign up free
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
                  <path d="M3 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/login" className="inline-flex h-[52px] flex-1 items-center justify-center rounded-full border border-yp-line2 bg-yp-ink/40 px-7 text-[16px] font-medium backdrop-blur transition hover:border-yp-ice sm:flex-none">
                Log in
              </Link>
              <a href="#film" className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full px-3 text-[15px] text-yp-fog transition hover:text-yp-frost">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-yp-frost text-yp-ink">
                  <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
                    <path d="M3.5 2l8 5-8 5z" fill="currentColor" />
                  </svg>
                </span>
                Watch the film <span className="yp-mono text-[12px] text-yp-smoke">1:00</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* messages in motion */}
      <div id="lanes" className="relative flex flex-col gap-1 overflow-hidden border-y border-yp-line bg-yp-ink py-4" aria-hidden>
        <div className="lane-a">
          <Marquee items={ASKS} />
        </div>
        <div className="lane-b">
          <Marquee items={ANSWERS} reverse alt />
        </div>
      </div>

      {/* 02 THE PILE-UP */}
      <section id="pileup" className="relative flex min-h-dvh items-center overflow-hidden px-4 py-20 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <H2>
              Your customers won&apos;t <span className="yp-accent text-[1.12em]">wait</span>.
            </H2>
            <p className="yp-display mt-6 text-[clamp(22px,2.6vw,38px)] leading-tight text-yp-smoke" style={{ fontVariationSettings: '"wdth" 100', fontWeight: 700 }}>
              And you can&apos;t answer every chat.
            </p>
            <Lede>The same questions all day: how much, are you open, is it in stock, can I book. Every slow reply is a customer who messaged someone else instead.</Lede>
            <div className="mt-10 flex items-baseline gap-4">
              <span className="pile-counter yp-display text-[clamp(64px,9vw,132px)] leading-none" style={{ fontVariationSettings: '"wdth" 100' }}>
                {lite ? "148" : "000"}
              </span>
              <span className="max-w-[16ch] text-[14px] leading-snug text-yp-smoke">unread on a busy Saturday night (illustration)</span>
            </div>
          </div>
          <div className="relative mx-auto flex w-full max-w-[460px] justify-center lg:max-w-none">
            <div className="pile-phone">
              <ChatList lite={lite} className="w-[min(300px,78vw,calc((100dvh_-_120px)/2.07))]" />
            </div>
            <Toast ch="WhatsApp" text="are you open on Sunday?" className="left-[-6%] top-[10%] z-10" />
            <Toast ch="Instagram" text="got the red one in M?" className="right-[-8%] top-[24%] z-10" />
            <Toast ch="Telegram" text="how much for a large pizza" className="left-[-12%] top-[50%] z-10" />
            <Toast ch="WhatsApp" text="can I change my booking?" className="right-[-10%] bottom-[20%] z-10" />
            <Toast ch="Instagram" text="do you deliver to Bangsar?" className="left-[-2%] bottom-[4%] z-10" />
          </div>
        </div>
      </section>

      {/* 03 THE FILM */}
      <section id="film" className="relative flex min-h-dvh items-center overflow-hidden border-t border-yp-line px-4 py-20 sm:px-8">
        <div className="film-glow pointer-events-none absolute left-1/2 top-1/2 h-[90vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(63,91,255,0.28),rgba(44,245,187,0.06)_55%,transparent)]" aria-hidden />
        <div className="relative mx-auto w-full max-w-[1100px]">
          <div className="film-head mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <H2 className="max-w-[16ch]">
                See it in <span className="yp-accent text-[1.12em]">sixty</span> seconds.
              </H2>
            </div>
            <p className="max-w-[34ch] text-[16px] leading-relaxed text-yp-fog">The problem, the setup and a real conversation, start to finish. Pick a chapter, or watch it through.</p>
          </div>
          <div className="film-stage mx-auto w-full max-w-[min(1000px,calc((100dvh_-_320px)*1.78))] min-w-[min(100%,300px)] rounded-[28px]">
            <FilmPlayer className="[&>div:first-child]:rounded-[24px] [&>div:first-child]:border [&>div:first-child]:border-yp-line2" />
          </div>
        </div>
      </section>

      {/* 04 HOW IT WORKS */}
      <section id="how" className="relative overflow-hidden border-t border-yp-line px-4 py-24 sm:px-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <H2>
            Open in <span className="yp-accent text-[1.12em]">ten minutes</span>.
          </H2>
          <Lede>No flows to build, no bot to train. You explain your business once, the way you would brief a new hire.</Lede>
          <ol id="how-steps" className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="how-step">
                <div className="relative h-[3px] rounded-full bg-yp-line2">
                  <div className="how-bar absolute inset-0 origin-left rounded-full bg-yp-mint" />
                </div>
                <div className="yp-mono mt-5 text-[12px] text-yp-mint">{s.n}</div>
                <h3 className="yp-display mt-1 text-[28px] leading-tight" style={{ fontVariationSettings: '"wdth" 105', fontWeight: 800 }}>
                  {s.t}
                </h3>
                <p className="mt-3 text-[15.5px] leading-relaxed text-yp-fog">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/signup" className="mag inline-flex h-[52px] items-center rounded-full bg-yp-mint px-7 text-[16px] font-semibold text-yp-ink transition-[filter] hover:brightness-110">
              Set up my business
            </Link>
            <Link href="/login" className="inline-flex h-[52px] items-center rounded-full border border-yp-line2 px-7 text-[16px] font-medium transition hover:border-yp-ice">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* 05 TEACH IT ONCE */}
      <section id="teach" className="relative flex min-h-dvh flex-col justify-center overflow-hidden border-t border-yp-line py-20">
        <div className="px-4 sm:px-8">
          <div className="mx-auto max-w-[1280px]">
            <H2>
              Teach it <span className="yp-accent text-[1.12em]">once</span>.
            </H2>
            <Lede>Type it, or upload the menu, the price list or a photo of the board. Claude turns it into prices, options, stock, hours, booking rules and FAQs. Change anything later and the next answer already knows.</Lede>
          </div>
        </div>
        <div className={cx("relative mt-12", !full && "yp-no-scrollbar snap-x snap-mandatory overflow-x-auto pb-4")}>
          <div className="teach-track flex w-max gap-5 px-4 sm:px-8">
            <TeachCard title="A voice-note style brief">
              <p className="text-[15px] leading-relaxed text-yp-frost/90">
                “We&apos;re a small salon in Mont Kiara, three stylists. Women&apos;s cut and blow-dry RM 85 short, RM 110 long. Closed Mondays. Book at least 2 hours ahead, free cancellation up to 24 hours…”
              </p>
            </TeachCard>
            <TeachCard title="Price list, from a photo">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-yp-smoke">
                    <th className="font-normal">Service</th>
                    <th className="text-right font-normal">Short</th>
                    <th className="text-right font-normal">Long</th>
                  </tr>
                </thead>
                <tbody className="yp-mono">
                  {[["Cut and blow-dry", 85, 110], ["Full colour", 180, 260], ["Keratin", 350, 420], ["Blow-dry", 50, 70]].map(([n, a, b]) => (
                    <tr key={n as string} className="border-t border-yp-line">
                      <td className="py-1.5 font-[family-name:var(--font-familjen)] tracking-normal">{n}</td>
                      <td className="text-right">{a}</td>
                      <td className="text-right">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TeachCard>
            <TeachCard title="Stock by size and colour">
              <div className="space-y-2.5 text-[14px]">
                {[["Charcoal", "#1c2233", [4, 9, 7, 3]], ["Ultramarine", "#3F5BFF", [2, 6, 5, 1]], ["Mint", "#2CF5BB", [0, 3, 4, 2]]].map(([c, hex, st]) => (
                  <div key={c as string} className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full border border-yp-frost/30" style={{ background: hex as string }} />
                    <span className="w-24">{c}</span>
                    <span className="yp-mono flex gap-3 text-yp-fog">
                      {(st as number[]).map((n, i) => (
                        <span key={i} className={n === 0 ? "text-yp-pink" : ""}>
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
              <dl className="yp-mono space-y-1 text-[13px]">
                {[["Mon", "closed"], ["Tue–Fri", "10:00–19:00"], ["Sat", "09:00–19:00"], ["Sun", "10:00–17:00"], ["Capacity", "3 stylists at once"], ["Notice", "2 hours ahead"]].map(([d, h]) => (
                  <div key={d} className="flex justify-between gap-6">
                    <dt className="font-[family-name:var(--font-familjen)] tracking-normal text-yp-smoke">{d}</dt>
                    <dd>{h}</dd>
                  </div>
                ))}
              </dl>
            </TeachCard>
            <TeachCard title="House rules">
              <p className="text-[15px] leading-relaxed text-yp-frost/90">Free cancellation up to 24 hours. Patch test 48 hours before first colour. Basement parking free for 2 hours. Refunds are decided by the owner only.</p>
            </TeachCard>
            <TeachCard title="FAQ, as customers type it">
              <p className="text-[15px] text-yp-fog">“how much for long hair cut ah”</p>
              <p className="mt-1 text-[15px] text-yp-fog">“got slot this sat?”</p>
              <p className="mt-1 text-[15px] text-yp-fog">“can pay tng?”</p>
            </TeachCard>
            <div className="flex w-[280px] shrink-0 snap-center items-center justify-center">
              <div className="text-center">
                <div className="teach-bell inline-block">
                  <BellMark size={120} />
                </div>
                <p className="teach-done mt-4 max-w-[26ch] text-[16px] text-yp-fog">Now it answers from your facts, and only your facts.</p>
              </div>
            </div>
          </div>
        </div>
        {!full ? <p className="yp-mono mt-2 px-4 text-[11px] uppercase text-yp-smoke">Swipe →</p> : null}
      </section>

      {/* 06 ANY BUSINESS */}
      <section id="any" className="relative border-t border-yp-line px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <H2>
            Whatever you <span className="yp-accent text-[1.12em]">sell</span>.
          </H2>
          <Lede>Tables, appointments, rooms or stock on a shelf: you describe how bookings work and Yapoz checks real availability before it promises anything.</Lede>
          <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {KINDS.map((k) => (
              <li key={k.t} className="kind">
                {/* The CSS transition sits on this inner card: GSAP animates the <li>, and a transition there would make it read the wrong end values. */}
                <div className="h-full rounded-3xl border border-yp-line bg-yp-panel p-6 transition duration-300 hover:-translate-y-1 hover:border-yp-ice/60">
                  <h3 className="yp-display text-[22px]" style={{ fontVariationSettings: '"wdth" 105', fontWeight: 800 }}>
                    {k.t}
                  </h3>
                  <div className="mt-5 space-y-2">
                    <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-yp-raised px-3.5 py-2 text-[14px]">{k.q}</p>
                    <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-yp-mint px-3.5 py-2 text-[14px] font-medium text-yp-ink">{k.a}</p>
                  </div>
                  <p className="mt-5 text-[13px] text-yp-smoke">{k.how}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 07 ANSWERED EVERYWHERE */}
      <section id="everywhere" className="relative flex min-h-dvh items-center overflow-hidden border-t border-yp-line px-4 py-20 sm:px-8 [@media(min-width:1024px)_and_(max-height:820px)]:py-14">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 lg:gap-6">
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
            <H2 className="!text-[clamp(36px,5vw,76px)]">
              Answered <span className="yp-accent text-[1.12em]">everywhere</span>.
            </H2>
            <p className="max-w-[40ch] text-[16px] leading-relaxed text-yp-fog sm:text-[17px]">
              WhatsApp through your Business Platform number, with a live “typing…” while it writes. Telegram as a bot, or from your own account with Telegram Business. Instagram DMs and comments. One assistant, the same facts behind each.
            </p>
          </div>

          {full ? (
            <div className="relative" style={{ perspective: 1900 }}>
              <div className="phones-stage mx-auto flex items-start justify-center gap-10 [transform-style:preserve-3d]">
                {(
                  [
                    ["tg", "telegram", <TelegramChat key="tg" className={phoneW} />],
                    ["wa", "whatsapp", <WhatsAppChat key="wa" className={phoneW} />],
                    ["ig", "instagram", <InstagramChat key="ig" className={phoneW} />],
                  ] as const
                ).map(([cls, key, phone]) => (
                  <div key={cls} className={`ph ph-${cls} flex flex-col items-center gap-4 [transform-style:preserve-3d]`}>
                    {phone}
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="flex items-center gap-2.5">
                        <AppIcon k={key} size={32} />
                        <span className="yp-display text-[20px]" style={{ fontVariationSettings: '"wdth" 105', fontWeight: 800 }}>
                          {CHANNELS.find((c) => c.key === key)!.label}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="lane-count yp-mono text-[26px] leading-none" data-n={lane(key)}>
                          0
                        </span>
                        <span className="text-[12px] text-yp-smoke">answered</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div role="tablist" aria-label="Channel" className="mx-auto mb-6 flex w-fit gap-1 rounded-full border border-yp-line2 p-1">
                {CHANNELS.map((c) => (
                  <button key={c.key} role="tab" aria-selected={tab === c.key} onClick={() => setTab(c.key)} className={cx("flex h-10 items-center gap-2 rounded-full pl-2 pr-4 text-[14px] transition", tab === c.key ? "bg-yp-frost font-medium text-yp-ink" : "text-yp-fog hover:text-yp-frost")}>
                    <AppIcon k={c.key} size={24} />
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="tab-stage flex justify-center">
                {tab === "whatsapp" ? <WhatsAppChat className="w-[min(310px,82vw)]" /> : null}
                {tab === "telegram" ? <TelegramChat className="w-[min(310px,82vw)]" /> : null}
                {tab === "instagram" ? <InstagramChat className="w-[min(310px,82vw)]" /> : null}
              </div>
              <div className="mx-auto mt-6 grid max-w-[420px] grid-cols-3 gap-3 text-center">
                {CHANNELS.map((c) => (
                  <div key={c.key} className="rounded-2xl border border-yp-line bg-yp-panel px-2 py-3">
                    <div className="lane-count yp-mono text-[22px] leading-none" data-n={lane(c.key)}>
                      {lite ? lane(c.key).toLocaleString("en") : "0"}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-yp-smoke">
                      <AppIcon k={c.key} size={16} />
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mx-auto max-w-[70ch] text-center text-[12.5px] leading-relaxed text-yp-smoke [@media(min-width:1024px)_and_(max-height:820px)]:hidden">
            Counts are live from the sample businesses{sampleNames.length ? ` (${sampleNames.join(" and ")})` : ""} over the last {stats.days} days: {total.toLocaleString("en")} answers{stats.demoShare > 0 ? `, ${Math.round(stats.demoShare * 100)}% of them seeded demo data` : ""}. Conversations shown are illustrations.
          </p>
        </div>
      </section>

      {/* 08 RING THE BELL (LIVE) */}
      <section id="ring" className="relative border-t border-yp-line px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <H2>
            Ring the <span className="yp-accent text-[1.12em]">bell</span>.
          </H2>
          <Lede className="mb-12">
            {sampleNames.length > 1 ? `${sampleNames.slice(0, -1).join(", ")} and ${sampleNames.at(-1)} are sample businesses that exist only for this demo.` : "This is a sample business that exists only for this demo."} Their assistants are live. Pick one and ask it something.
          </Lede>
          <Simulator samples={stats.samples} />
        </div>
      </section>

      {/* 09 IT KNOWS WHEN TO STOP */}
      <section id="stop" className="relative flex min-h-dvh items-center overflow-hidden border-t border-yp-line px-4 py-20 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <H2>
              It knows when to <span className="yp-accent text-[1.12em] !text-yp-pink">stop</span>.
            </H2>
            <Lede>Complaints, refunds, partnerships, legal and medical questions, price haggling, anything rude, anything it isn&apos;t sure of: the customer gets a holding reply, and a person gets a one-line summary. It never makes up an answer.</Lede>
          </div>
          <div className="relative grid min-h-[460px] grid-cols-[1fr_1fr] gap-6">
            <div className="flex flex-col gap-3 pt-6">
              {["do u deliver to TTDI?", "how much for keratin", "We'd like to stock your products in our 12 stores", "table for 3 sun lunch", "open on public holiday?"].map((t, i) => (
                <span key={t} className={cx("stream-pill w-fit max-w-full rounded-2xl border border-yp-line2 bg-yp-panel px-4 py-2.5 text-[14px]", i === 2 && "is-signal")}>
                  {t}
                </span>
              ))}
            </div>
            <div className="tray self-end rounded-3xl border border-yp-pink/50 bg-yp-pink/[0.06] p-5">
              <div className="flex items-center justify-between">
                <span className="yp-display text-[20px]" style={{ fontVariationSettings: '"wdth" 105', fontWeight: 800 }}>
                  Needs you
                </span>
                <span className="yp-mono rounded-full bg-yp-pink px-2 text-[12px] text-yp-ink">1</span>
              </div>
              <div className="tray-summary mt-4 border-t border-yp-pink/30 pt-4">
                <span className="rounded-full border border-yp-pink/60 px-2.5 py-0.5 text-[12px] text-yp-pink">Wholesale</span>
                <p className="mt-2 text-[15px]">Retail chain wants to stock your products in 12 stores.</p>
                <p className="mt-1 text-[13px] text-yp-smoke">Holding reply sent. No answer was invented.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10 HIRING, HANDLED */}
      <section id="hiring" className="relative flex min-h-dvh items-center overflow-hidden border-t border-yp-line px-4 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <H2>
            Hiring, <span className="yp-accent text-[1.12em]">handled</span>.
          </H2>
          <Lede className="max-w-[62ch]">Switch it on when you&apos;re hiring. Say who you need, like “Pizza cook, 3+ years wood-fired, evenings, near Bangsar.” Yapoz ranks people who applied through your bot or CVs you uploaded, quotes the evidence, offers three free times, and waits for your Approve.</Lede>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
            <ol className="space-y-2.5">
              {[["Aiman H.", 94, "“Ran the wood-fired oven alone on Friday and Saturday nights”"], ["Mei Ling T.", 91, "“4 years on a wood-fired oven doing 48-hour cold-fermented dough”"], ["Yusuf A.", 88, "“Evenings and weekends, 10 minutes from Bangsar”"], ["Priya N.", 84, "“3.5 years on wood-fired oven at Casa Fumo”"]].map(([n, s, ev]) => (
                <li key={n as string} className="resume flex items-center gap-4 rounded-2xl bg-yp-frost px-4 py-3 text-yp-ink">
                  <span className="resume-score yp-display w-14 text-[30px] leading-none" style={{ fontVariationSettings: '"wdth" 100', fontWeight: 800 }}>
                    {s}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{n}</span>
                    <span className="block truncate text-[14px] text-yp-ink/70 sm:text-[15px]">{ev}</span>
                  </span>
                </li>
              ))}
              <li className="px-1 pt-1 text-[12px] text-yp-smoke">Illustration with candidates from the sample pizzeria. Scores come from the model, with quotes checked against each CV.</li>
            </ol>
            <div className="rounded-3xl border border-yp-line2 bg-yp-panel p-4">
              <div className="grid grid-cols-5 gap-1.5 text-center text-[12px] text-yp-smoke">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="mt-2 grid h-[180px] grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((c) => (
                  <div key={c} className="relative rounded-md bg-yp-frost/[0.04]">
                    {c === 0 || c === 3 ? <div className="absolute inset-x-1 top-[18%] h-[22%] rounded bg-[repeating-linear-gradient(135deg,#2c3752_0_1px,transparent_1px_7px)]" /> : null}
                    {c === 2 ? <div className="cal-block absolute inset-x-1 top-[52%] h-[16%] rounded bg-yp-cobalt" /> : null}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[14px] text-yp-fog">Invite Aiman, Wed 2:30pm</span>
                <span className="approve-btn grid h-10 place-items-center rounded-full bg-yp-cobalt px-5 text-[14px] font-semibold text-white" aria-hidden>
                  Approve
                </span>
              </div>
              <p className="approve-sent mt-2 text-right text-[13px] text-yp-mint">Sent in the bot chat. He picked a time.</p>
            </div>
          </div>
          <p className="mt-8 text-[15px] text-yp-frost">
            <span className="font-medium">Ranked on skills and availability only.</span> <span className="text-yp-smoke">Never gender, age, religion, ethnicity, marital status or photos.</span>
          </p>
        </div>
      </section>

      {/* 11 ONE DOOR, EVERY DESK */}
      <section id="door" className="relative flex min-h-dvh items-center overflow-hidden border-t border-yp-line px-4 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <H2>
            One door, every <span className="yp-accent text-[1.12em]">desk</span>.
          </H2>
          <Lede>Invite your team with a link. Each person signs in to their own desk and sees only what their job needs.</Lede>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex h-12 items-center rounded-full bg-yp-mint px-6 text-[15px] font-semibold text-yp-ink transition-[filter] hover:brightness-110">
              Sign up free
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center rounded-full border border-yp-line2 px-6 text-[15px] font-medium transition hover:border-yp-ice">
              Log in
            </Link>
          </div>
          <div className="relative mt-12 min-h-[360px]">
            {full ? (
              <div className="login-card mx-auto w-full max-w-[360px] rounded-3xl border border-yp-line2 bg-yp-panel p-6">
                {["Email", "Password"].map((l, i) => (
                  <div key={l} className="mb-3">
                    <div className="text-[12px] text-yp-smoke">{l}</div>
                    <div className="yp-mono mt-1 h-10 rounded-xl border border-yp-line2 px-3 py-2 text-[13px] text-yp-fog">{["you@yourbusiness.com", "••••••••"][i]}</div>
                  </div>
                ))}
                <div className="mt-4 h-10 rounded-xl bg-yp-cobalt" />
              </div>
            ) : null}
            <div className={cx("grid grid-cols-1 gap-5 md:grid-cols-3", full && "absolute inset-0")}>
              {[
                { t: "Owner", d: "Everything: how many chats were answered, first-reply time, top questions, knowledge gaps, channels and team.", rows: [["Auto-resolved", "88%"], ["Median first reply", "2.4s"], ["Knowledge gaps", "3"]] },
                { t: "Service", d: "Live inbox across channels, the Needs-you queue, takeover, knowledge and bookings.", rows: [["Needs you", "2"], ["Drafts to approve", "1"], ["Bookings today", "14"]] },
                { t: "HR", d: "Hiring only: ranked candidates with evidence, approvals, interview calendar, pipeline.", rows: [["Shortlisted", "6"], ["Waiting for Approve", "2"], ["Interviews this week", "3"]] },
              ].map((x) => (
                <div key={x.t} className="desk rounded-3xl border border-yp-line2 bg-yp-frost p-5 text-yp-ink">
                  <div className="yp-display text-[26px]" style={{ fontVariationSettings: '"wdth" 108', fontWeight: 850 }}>
                    {x.t}
                  </div>
                  <p className="mt-1 text-[14px] text-yp-ink/70">{x.d}</p>
                  <dl className="mt-4 divide-y divide-yp-ink/10 border-y border-yp-ink/10">
                    {x.rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 text-[14px]">
                        <dt>{k}</dt>
                        <dd className="yp-mono">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-[11px] text-yp-ink/50">illustration</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 12 CLOSE */}
      <section id="open" className="relative overflow-hidden border-t border-yp-line px-4 pb-10 pt-24 sm:px-8">
        <div className="yp-floor pointer-events-none absolute -bottom-[260px] -left-1/3 -right-1/3 h-[620px] opacity-70" aria-hidden />
        <div className="relative mx-auto max-w-[1280px]">
          <div>
            <h2 className="kinetic yp-display text-[clamp(52px,12vw,200px)] leading-[0.86]" style={{ fontVariationSettings: '"wdth" 118' }}>
              Open the <span className="yp-accent text-[1.12em]">counter</span>.
            </h2>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/signup" className="mag inline-flex h-14 items-center rounded-full bg-yp-mint px-9 text-[17px] font-semibold text-yp-ink transition-[filter] hover:brightness-110">
                Sign up free
              </Link>
              <Link href="/login" className="inline-flex h-14 items-center rounded-full border border-yp-line2 px-9 text-[17px] font-medium transition hover:border-yp-ice">
                Log in
              </Link>
              <span className="w-full text-[14px] text-yp-smoke sm:w-auto">No card needed. Bring your own WhatsApp Business number.</span>
            </div>
          </div>
        </div>
        <footer className="relative mx-auto mt-24 flex max-w-[1280px] flex-col gap-3 border-t border-yp-line pt-6 text-[13px] text-yp-smoke sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2">
            <BellMark size={18} /> Yapoz only talks about your business.
          </span>
          <span>{sampleNames.length ? `${sampleNames.join(" and ")} ${sampleNames.length > 1 ? "are fictional businesses" : "is a fictional business"} made for this demo.` : "Sample businesses are fictional."}</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="text-yp-fog hover:text-yp-frost">
              Privacy
            </Link>
            <Link href="/login" className="text-yp-fog hover:text-yp-frost">
              Log in
            </Link>
            <Link href="/signup" className="text-yp-fog hover:text-yp-frost">
              Sign up
            </Link>
          </span>
        </footer>
      </section>
    </div>
  );
}
