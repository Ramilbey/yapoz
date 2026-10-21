"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authButton, authError, authField, authLabel } from "@/components/auth/frame";

export function SignupForm() {
  const router = useRouter();
  const [f, setF] = useState({ businessName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    let timezone = "UTC";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {}
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, timezone }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return setError(j.error ?? "Sign-up failed.");
    }
    router.replace(j.home);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="font-display text-[26px] font-bold">Set up your business</h2>
        <p className="mt-1 text-[14px] text-paper/55">Takes two minutes. No card needed.</p>
      </div>
      <div>
        <label className={authLabel} htmlFor="biz">Business name</label>
        <input id="biz" className={authField} value={f.businessName} onChange={set("businessName")} placeholder="e.g. Kasih Hair Studio" autoComplete="organization" required minLength={2} />
      </div>
      <div>
        <label className={authLabel} htmlFor="name">Your name</label>
        <input id="name" className={authField} value={f.name} onChange={set("name")} autoComplete="name" required />
      </div>
      <div>
        <label className={authLabel} htmlFor="email">Email</label>
        <input id="email" type="email" className={authField} value={f.email} onChange={set("email")} autoComplete="email" required />
      </div>
      <div>
        <label className={authLabel} htmlFor="pw">Password</label>
        <input id="pw" type="password" className={authField} value={f.password} onChange={set("password")} autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
      </div>
      {error ? <p className={authError}>{error}</p> : null}
      <button disabled={busy} className={authButton}>{busy ? "Creating your workspace…" : "Create my workspace"}</button>
    </form>
  );
}
