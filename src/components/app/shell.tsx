"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { LiveProvider, useLive, useLiveStatus } from "./live";
import { Alerts, BellToggle } from "./alerts";
import { turnOffPush } from "./push";
import { ToastProvider } from "./toast";
import { getJson } from "./fetcher";
import { cx } from "../ui/cx";
import type { Session } from "@/lib/session";

type Item = { href: string; label: string; badge?: "needs" | "drafts" | "orders" | "gaps" };
export type ShellWorkspace = { id: string; name: string; city: string; live: boolean; setupDone: boolean; sample: boolean };

// Orders first: approving them is the main job. Activity is the full log of who did what.
const NAV: Record<Session["role"], Item[]> = {
  owner: [
    { href: "/app/today", label: "Today" },
    { href: "/app/orders", label: "Orders", badge: "orders" },
    { href: "/app/calendar", label: "Calendar" },
    { href: "/app/inbox", label: "Inbox", badge: "drafts" },
    { href: "/app/needs-you", label: "Needs you", badge: "needs" },
    { href: "/app/activity", label: "Activity" },
    { href: "/app/knowledge", label: "Knowledge", badge: "gaps" },
    { href: "/app/settings", label: "Settings" },
  ],
  service: [
    { href: "/app/orders", label: "Orders", badge: "orders" },
    { href: "/app/calendar", label: "Calendar" },
    { href: "/app/inbox", label: "Inbox", badge: "drafts" },
    { href: "/app/needs-you", label: "Needs you", badge: "needs" },
    { href: "/app/activity", label: "Activity" },
    { href: "/app/knowledge", label: "Knowledge", badge: "gaps" },
  ],
};

const ROLE_NAME = { owner: "Owner", service: "Service" } as const;

/** 18px stroke icons for the nav items. An item without one falls back to a dot. */
const ICON: Record<string, string> = {
  "/app/setup": "M12 3l2.2 5.3L20 9l-4.2 3.8L17 18.5 12 15.6 7 18.5l1.2-5.7L4 9l5.8-.7z",
  "/app/today": "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  "/app/inbox": "M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5",
  "/app/needs-you": "M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0",
  "/app/orders": "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2",
  "/app/knowledge": "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",
  "/app/calendar": "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  "/app/activity": "M3 12h4l3-8 4 16 3-8h4",
  "/app/settings": "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4",
};

export function Shell(props: { session: Session; workspace: ShellWorkspace; demoMode: boolean; children: React.ReactNode }) {
  return (
    <ToastProvider>
      <LiveProvider>
        <ShellInner {...props} />
      </LiveProvider>
    </ToastProvider>
  );
}

function ShellInner({ session, workspace, children }: { session: Session; workspace: ShellWorkspace; demoMode: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const connected = useLiveStatus();
  const { data: counts, mutate } = useSWR<{ needs: number; drafts: number; orders: number; gaps: number }>("/api/nav-counts", getJson, { refreshInterval: 60_000, revalidateOnFocus: false });
  // Badges only move on real (non-demo) changes, at most every few seconds.
  useLive(["escalations", "messages", "orders", "knowledge_gaps"], () => mutate(), 1500, (e) => !e.demo);
  const onNew = useCallback(() => void mutate(), [mutate]);

  // The boot script in the app layout has already applied the user's choice (or their system setting); mirror it.
  useEffect(() => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark"), []);
  useEffect(() => setOpen(false), [pathname]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("yapoz-theme", next);
    } catch {}
  }
  async function signOut() {
    await turnOffPush().catch(() => {});
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const items: Item[] = session.role === "owner" && !workspace.setupDone ? [{ href: "/app/setup", label: "Set up" }] : NAV[session.role];
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const rail = (
    <nav className="flex h-full flex-col" aria-label="Main">
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
            <path d="M16 7.2a1.7 1.7 0 0 1 1.7 1.7v.6c4.3.8 7.3 4.6 7.3 9.2v1.1H7v-1.1c0-4.6 3-8.4 7.3-9.2v-.6A1.7 1.7 0 0 1 16 7.2Z" fill="var(--accent)" />
            <rect x="5" y="21.2" width="22" height="3.2" rx="1.6" fill="var(--accent)" />
          </svg>
          <span className="font-display text-[24px] font-extrabold">Yapoz</span>
        </Link>
        <div className="mt-5 rounded-xl border border-line-strong px-3.5 py-3">
          <div className="text-[14px] font-medium leading-tight">{workspace.name}</div>
          <div className="mt-0.5 flex items-center justify-between text-[12px] text-muted">
            <span>{workspace.city}</span>
            <span className="font-mono">{workspace.id}</span>
          </div>
        </div>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 scrollbar-thin">
        {items.map((it) => {
          const n = it.badge ? counts?.[it.badge] ?? 0 : 0;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active(it.href) ? "page" : undefined}
                className={cx(
                  "group relative flex items-center justify-between rounded-[10px] px-3 transition-colors",
                  "h-10 text-[14.5px]",
                  active(it.href) ? "nav-on font-semibold text-fg" : "text-fg-2 hover:bg-fg/[0.06] hover:text-fg",
                )}
              >
                <span className="flex items-center gap-2.5">
                  {ICON[it.href] ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cx("shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110", active(it.href) ? "text-accent" : "opacity-75")}>
                      <path d={ICON[it.href]} />
                    </svg>
                  ) : (
                    <span className={cx("h-1.5 w-1.5 rounded-full transition-colors", active(it.href) ? "bg-accent" : "bg-transparent")} aria-hidden />
                  )}
                  {it.label}
                </span>
                {n > 0 ? (
                  <span className={cx("num rounded-full px-1.5 text-[11px] leading-[18px]", it.badge === "needs" || it.badge === "gaps" ? "bg-accent text-on-primary" : "bg-line-strong text-fg")}>{n}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/app/account" className="group" title="Your account">
            <div className="text-[14px] font-medium group-hover:underline">{session.name}</div>
            <div className="text-[12px] text-muted">{ROLE_NAME[session.role]} desk</div>
          </Link>
          <span className="flex items-center gap-1.5 text-[12px] text-muted" title={connected ? "Live updates connected" : "Reconnecting; refreshing every few seconds"}>
            {connected ? <span className="ping text-accent" aria-hidden /> : <span className="h-2 w-2 rounded-full bg-line-strong" aria-hidden />}
            {connected ? "Live" : "Polling"}
          </span>
        </div>
        <div className="mt-3 flex flex-col items-start gap-3">
          <button type="button" role="switch" aria-checked={theme === "light"} aria-label="Light theme" onClick={toggleTheme} className="tswitch">
            <i />
            <span className="a">DARK</span>
            <span className="b">LIGHT</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={signOut} className="h-8 rounded-[10px] border border-line-strong px-3 text-[13px] font-medium text-fg hover:bg-raised">
              Sign out
            </button>
            <BellToggle />
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Alerts count={(counts?.orders ?? 0) + (counts?.needs ?? 0)} onNew={onNew} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-panel lg:block">{rail}</aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-panel px-4 lg:hidden">
        <span className="font-display text-[20px] font-extrabold">Yapoz</span>
        <button onClick={() => setOpen((v) => !v)} className="h-9 rounded-lg border border-line px-3 text-[13px]" aria-expanded={open}>
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open ? <div className="fixed inset-0 top-14 z-20 bg-panel lg:hidden">{rail}</div> : null}
      <main className="lg:pl-[248px]">
        {session.role === "owner" && !workspace.live && pathname !== "/app/setup" ? (
          <div className="border-b border-line bg-accent/10 px-4 py-2.5 text-[13px] sm:px-8">
            <span className="font-medium">Your assistant isn&apos;t answering customers yet.</span>{" "}
            <span className="text-fg-2">It only replies in the simulator until you go live.</span>{" "}
            <Link href={workspace.setupDone ? "/app/settings#assistant" : "/app/setup"} className="font-medium underline decoration-accent underline-offset-4">
              {workspace.setupDone ? "Go live" : "Finish setup"}
            </Link>
          </div>
        ) : null}
        <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}

/** A heading whose letters rise in one by one. The word matching `accent` is set in the serif italic, in the accent colour. */
export function KineticTitle({ text, accent }: { text: string; accent?: string }) {
  let i = 0;
  return (
    <>
      {text.split(" ").map((w, wi) => {
        const isAccent = Boolean(accent) && w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase() === accent!.toLowerCase();
        return (
          <span key={wi} className={cx("k-word", isAccent && "accent-word text-[1.1em] leading-[0.9]")} aria-hidden>
            {Array.from(w).map((ch, ci) => (
              <span key={ci} className="k-ch" style={{ "--i": i++ } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}

/** Page title block. Pass `title` as a string (with an optional `accent` word) for the kinetic heading, or a node to render as is. */
export function PageHeader({ title, accent, description, actions, eyebrow }: { title: React.ReactNode; accent?: string; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow k-fade mb-2.5">{eyebrow}</div> : null}
        {typeof title === "string" ? (
          <h1 aria-label={title} className="font-display flex flex-wrap gap-x-[0.26em] text-[36px] font-extrabold leading-none sm:text-[52px]">
            <KineticTitle text={title} accent={accent} />
          </h1>
        ) : (
          <h1 className="font-display text-[36px] font-extrabold leading-none sm:text-[52px]">{title}</h1>
        )}
        {description ? <p className="k-fade mt-3 max-w-[68ch] text-[15px] text-muted" style={{ "--d": 200 } as React.CSSProperties}>{description}</p> : null}
      </div>
      {actions ? <div className="k-fade flex flex-wrap items-center gap-2" style={{ "--d": 350 } as React.CSSProperties}>{actions}</div> : null}
    </div>
  );
}
