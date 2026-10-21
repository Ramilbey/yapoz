"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authButton, authError, authField, authLabel } from "@/components/auth/frame";

export function AcceptForm({ token, email, workspaceId }: { token: string; email: string; workspaceId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/invites/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, password }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return setError(j.error ?? "Couldn't accept the invite.");
    }
    router.replace(j.home);
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-display text-[26px] font-bold">Create your login</h2>
      <p className="text-[14px] text-paper/55">
        Email <span className="text-paper/85">{email}</span> · Workspace <span className="font-mono text-paper/85">{workspaceId}</span>
      </p>
      <div>
        <label className={authLabel} htmlFor="name">Your name</label>
        <input id="name" className={authField} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </div>
      <div>
        <label className={authLabel} htmlFor="pw">Password</label>
        <input id="pw" type="password" className={authField} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
      </div>
      {error ? <p className={authError}>{error}</p> : null}
      <button disabled={busy} className={authButton}>{busy ? "Joining…" : "Join the team"}</button>
    </form>
  );
}
