"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { LiveProvider, useLive, useLiveStatus } from "./live";
import { ToastProvider } from "./toast";
import { getJson } from "./fetcher";
import { cx } from "../ui/cx";
import type { Session } from "@/lib/session";

type Item = { href: string; label: string; badge?: "needs" | "drafts" | "approvals"; sub?: boolean; hiring?: boolean };
export type ShellWorkspace = { id: string; name: string; city: string; hiring: boolean; live: boolean; setupDone: boolean; sample: boolean };

const NAV: Record<Session["role"], Item[]> = {
  owner: [
    { href: "/app/today", label: "Today" },
    { href: "/app/inbox", label: "Inbox", badge: "drafts" },
    { href: "/app/needs-you", label: "Needs you", badge: "needs" },
    { href: "/app/knowledge", label: "Knowledge" },
    { href: "/app/bookings", label: "Bookings" },
    { href: "/app/hiring", label: "Hiring", hiring: true },
    { href: "/app/hiring/approvals", label: "Approvals", badge: "approvals", sub: true, hiring: true },
    { href: "/app/hiring/calendar", label: "Interviews", sub: true, hiring: true },
    { href: "/app/hiring/pipeline", label: "Pipeline", sub: true, hiring: true },
    { href: "/app/settings", label: "Settings" },
  ],
  service: [
    { href: "/app/inbox", label: "Inbox", badge: "drafts" },
    { href: "/app/needs-you", label: "Needs you", badge: "needs" },
    { href: "/app/knowledge", label: "Knowledge" },
    { href: "/app/bookings", label: "Bookings" },
  ],
  hr: [
    { href: "/app/hiring", label: "Roles and candidates" },
    { href: "/app/hiring/approvals", label: "Approvals", badge: "approvals" },
    { href: "/app/hiring/calendar", label: "Interviews" },
    { href: "/app/hiring/pipeline", label: "Pipeline" },
  ],
};

const ROLE_NAME = { owner: "Owner", service: "Service", hr: "HR" } as const;

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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const connected = useLiveStatus();
  const { data: counts, mutate } = useSWR<{ needs: number; drafts: number; approvals: number }>("/api/nav-counts", getJson, { refreshInterval: 30_000 });
  useLive(["escalations", "messages", "outreach"], () => mutate());

  useEffect(() => {
    let t: "light" | "dark" = "light";
    try {
      t = localStorage.getItem("jawab-theme") === "dark" ? "dark" : "light";
    } catch {}
    document.documentElement.dataset.theme = t;
    setTheme(t);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("jawab-theme", next);
    } catch {}
  }
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const items = [
    ...(session.role === "owner" && !workspace.setupDone ? [{ href: "/app/setup", label: "Set up" } as Item] : []),
    ...NAV[session.role].filter((it) => !it.hiring || workspace.hiring),
  ];
  const active = (href: string) => pathname === href || (href !== "/app/hiring" && pathname.startsWith(href + "/")) || (href === "/app/hiring" && /^\/app\/hiring(\/[0-9a-f-]{36})?$/.test(pathname));

  const rail = (
    <nav className="flex h-full flex-col" aria-label="Main">
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
            <path d="M16 7.2a1.7 1.7 0 0 1 1.7 1.7v.6c4.3.8 7.3 4.6 7.3 9.2v1.1H7v-1.1c0-4.6 3-8.4 7.3-9.2v-.6A1.7 1.7 0 0 1 16 7.2Z" fill="var(--color-brass)" />
            <rect x="5" y="21.2" width="22" height="3.2" rx="1.6" fill="var(--color-brass)" />
          </svg>
          <span className="font-display text-[22px] font-extrabold">Jawab</span>
        </Link>
        <div className="mt-5 rounded-xl border border-line px-3 py-2.5">
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
                  "group flex items-center justify-between rounded-[10px] px-3 transition-colors",
                  it.sub ? "ml-3 h-8 text-[13px]" : "h-9 text-[14px]",
                  active(it.href) ? "bg-raised text-fg font-medium" : "text-fg-2 hover:text-fg hover:bg-raised/60",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className={cx("h-1.5 w-1.5 rounded-full transition-colors", active(it.href) ? "bg-brass" : "bg-transparent")} aria-hidden />
                  {it.label}
                </span>
                {n > 0 ? (
                  <span className={cx("num rounded-full px-1.5 text-[11px] leading-[18px]", it.badge === "needs" ? "bg-signal text-ink" : "bg-line text-fg")}>{n}</span>
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
            <span className={cx("h-2 w-2 rounded-full", connected ? "live-dot bg-brass" : "bg-line-strong")} />
            {connected ? "Live" : "Polling"}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={toggleTheme} className="h-8 flex-1 rounded-lg border border-line text-[12px] text-fg-2 hover:bg-raised">
            {theme === "light" ? "Dark theme" : "Light theme"}
          </button>
          <button onClick={signOut} className="h-8 flex-1 rounded-lg border border-line text-[12px] text-fg-2 hover:bg-raised">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-panel lg:block">{rail}</aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-panel px-4 lg:hidden">
        <span className="font-display text-[20px] font-extrabold">Jawab</span>
        <button onClick={() => setOpen((v) => !v)} className="h-9 rounded-lg border border-line px-3 text-[13px]" aria-expanded={open}>
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open ? <div className="fixed inset-0 top-14 z-20 bg-panel lg:hidden">{rail}</div> : null}
      <main className="lg:pl-[248px]">
        {session.role === "owner" && !workspace.live && pathname !== "/app/setup" ? (
          <div className="border-b border-line bg-brass/10 px-4 py-2.5 text-[13px] sm:px-8">
            <span className="font-medium">Your assistant isn&apos;t answering customers yet.</span>{" "}
            <span className="text-fg-2">It only replies in the simulator until you go live.</span>{" "}
            <Link href={workspace.setupDone ? "/app/settings#assistant" : "/app/setup"} className="font-medium underline decoration-brass underline-offset-4">
              {workspace.setupDone ? "Go live" : "Finish setup"}
            </Link>
          </div>
        ) : null}
        <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[34px] font-extrabold leading-[1.02] sm:text-[42px]">{title}</h1>
        {description ? <p className="mt-2 max-w-[68ch] text-[15px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
