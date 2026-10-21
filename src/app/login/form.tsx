"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authButton, authError, authField, authLabel } from "@/components/auth/frame";

type Demo = { workspaceId: string; password: string } | null;

const ROLES = [
  { email: "owner@demo", label: "Owner", sees: "Everything" },
  { email: "service@demo", label: "Service", sees: "Inbox, Needs you, knowledge, bookings" },
  { email: "hr@demo", label: "HR", sees: "Hiring only" },
];

export function LoginForm({ demo, next, initialWorkspace }: { demo: Demo; next: string | null; initialWorkspace: string }) {
  const router = useRouter();
  const [workspaceId, setWs] = useState(initialWorkspace);
  const [showWs, setShowWs] = useState(Boolean(initialWorkspace));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent, override?: { email: string; password: string; workspaceId: string }) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId: override?.workspaceId ?? workspaceId, email: override?.email ?? email, password: override?.password ?? password }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      if (j.needWorkspace) setShowWs(true);
      return setError(j.error ?? "Sign-in failed.");
    }
    router.replace(next && next.startsWith("/app") ? next : j.home);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-display text-[26px] font-bold">Sign in</h2>
      <div>
        <label className={authLabel} htmlFor="email">Email</label>
        <input id="email" type="email" className={authField} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </div>
      <div>
        <label className={authLabel} htmlFor="pw">Password</label>
        <input id="pw" type="password" className={authField} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </div>
      {showWs ? (
        <div>
          <label className={authLabel} htmlFor="ws">Workspace ID</label>
          <input id="ws" className={`${authField} font-mono uppercase tracking-wide`} value={workspaceId} onChange={(e) => setWs(e.target.value)} placeholder="e.g. KASIH42" autoComplete="organization" />
        </div>
      ) : (
        <button type="button" onClick={() => setShowWs(true)} className="text-[13px] text-paper/50 underline-offset-4 hover:text-paper/80 hover:underline">
          On more than one business? Add your Workspace ID
        </button>
      )}
      {error ? <p className={authError}>{error}</p> : null}
      <button disabled={busy} className={authButton}>{busy ? "Signing in…" : "Sign in"}</button>
      {demo ? (
        <div className="border-t border-paper/10 pt-5">
          <p className="text-[13px] text-paper/55">
            Try the sample business <span className="font-mono text-paper/80">{demo.workspaceId}</span> (Forno Sette). Pick a desk to sign in as:
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
                  setWs(demo.workspaceId);
                  setShowWs(true);
                  void submit(undefined, { email: r.email, password: demo.password, workspaceId: demo.workspaceId });
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
