"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Demo = { workspaceId: string; password: string } | null;

const ROLES = [
  { email: "owner@demo", label: "Owner", sees: "Everything" },
  { email: "service@demo", label: "Service", sees: "Inbox, Needs you, knowledge, bookings" },
  { email: "hr@demo", label: "HR", sees: "Hiring only" },
];

export function LoginForm({ demo, next }: { demo: Demo; next: string | null }) {
  const router = useRouter();
  const [workspaceId, setWs] = useState(demo?.workspaceId ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent, override?: { email: string; password: string }) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspaceId, email: override?.email ?? email, password: override?.password ?? password }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error ?? "Sign-in failed.");
    router.replace(next && next.startsWith("/app") ? next : j.home);
    router.refresh();
  }

  const field = "h-12 w-full rounded-xl border border-paper/15 bg-ink px-4 text-[15px] text-paper placeholder:text-paper/35 focus:border-brass focus:outline-none";
  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-display text-[26px] font-bold">Sign in</h2>
      <div>
        <label className="mb-1.5 block text-[13px] text-paper/60" htmlFor="ws">Workspace ID</label>
        <input id="ws" className={`${field} font-mono uppercase tracking-wide`} value={workspaceId} onChange={(e) => setWs(e.target.value)} autoComplete="organization" required />
      </div>
      <div>
        <label className="mb-1.5 block text-[13px] text-paper/60" htmlFor="email">Email</label>
        <input id="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </div>
      <div>
        <label className="mb-1.5 block text-[13px] text-paper/60" htmlFor="pw">Password</label>
        <input id="pw" type="password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </div>
      {error ? <p className="rounded-lg border border-signal/40 bg-signal/10 px-3 py-2 text-[14px] text-[#ff8a6a]">{error}</p> : null}
      <button disabled={busy} className="h-12 w-full rounded-xl bg-signal text-[15px] font-semibold text-ink transition hover:brightness-110 disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {demo ? (
        <div className="border-t border-paper/10 pt-5">
          <p className="text-[13px] text-paper/55">
            Demo workspace <span className="font-mono text-paper/80">{demo.workspaceId}</span>. Pick a desk to sign in as:
          </p>
          <div className="mt-3 grid gap-2">
            {ROLES.map((r) => (
              <button
                key={r.email}
                type="button"
                disabled={busy}
                onClick={() => {
                  setEmail(r.email);
                  setPassword(demo.password);
                  void submit(undefined, { email: r.email, password: demo.password });
                }}
                className="flex items-center justify-between rounded-xl border border-paper/10 px-4 py-3 text-left transition hover:border-brass/60 hover:bg-paper/[0.03]"
              >
                <span>
                  <span className="block text-[15px] font-medium">{r.label}</span>
                  <span className="block text-[13px] text-paper/50">{r.sees}</span>
                </span>
                <span className="font-mono text-[12px] text-paper/45">{r.email}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
