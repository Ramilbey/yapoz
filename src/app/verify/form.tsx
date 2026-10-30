"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authButton, authError, authField, authLabel } from "@/components/auth/frame";
import { verificationCode } from "@/lib/validation";

const WAIT_SECONDS = 60;

export function VerifyForm({ email, sendFailed }: { email: string; sendFailed: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(sendFailed ? "We couldn't send your code. Send a new one below." : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(sendFailed ? 0 : WAIT_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const parsed = verificationCode.safeParse(code);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: parsed.data }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setCode("");
      return setError(j.error ?? "Verification failed.");
    }
    router.replace(j.home);
    router.refresh();
  }

  async function resend() {
    setError(null);
    setNotice(null);
    const res = await fetch("/api/auth/verify/resend", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setError(j.error ?? "Couldn't send a new code.");
    setNotice("New code sent. It replaces the old one.");
    setWait(WAIT_SECONDS);
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <h2 className="font-display text-[26px] font-bold">Check your email</h2>
        <p className="mt-1 text-[14px] text-paper/55">We sent a 6-digit code to <span className="text-paper">{email}</span>. It expires in 15 minutes.</p>
      </div>
      <div>
        <label className={authLabel} htmlFor="code">Verification code</label>
        <input id="code" className={`${authField} font-mono text-[20px] tracking-[0.4em]`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus aria-invalid={Boolean(error)} />
      </div>
      {error ? <p className={authError} role="alert">{error}</p> : null}
      {notice ? <p className="text-[14px] text-paper/70" role="status">{notice}</p> : null}
      <button disabled={busy} className={authButton}>{busy ? "Checking…" : "Verify and continue"}</button>
      <button type="button" onClick={resend} disabled={wait > 0} className="w-full text-center text-[13.5px] text-paper/60 underline-offset-4 hover:text-paper hover:underline disabled:no-underline disabled:opacity-60">
        {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
      </button>
    </form>
  );
}
