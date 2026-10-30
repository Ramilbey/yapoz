"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authButton, authError, authField, authLabel } from "@/components/auth/frame";
import { Turnstile } from "@/components/auth/turnstile";
import { SignupFields, fieldErrors } from "@/lib/validation";

export function SignupForm({ captchaSiteKey }: { captchaSiteKey: string | null }) {
  const router = useRouter();
  const [f, setF] = useState({ businessName: "", name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setErrors(({ [k]: _cleared, ...rest }) => rest);
  };
  const hint = (k: keyof typeof f) => (errors[k] ? <p id={`${k}-error`} className="mt-1.5 text-[13px] text-[#ff8a6a]">{errors[k]}</p> : null);
  const aria = (k: keyof typeof f) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `${k}-error` : undefined });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = SignupFields.safeParse(f);
    setErrors(parsed.success ? {} : fieldErrors(parsed.error));
    if (!parsed.success) return;
    if (captchaSiteKey && !captchaToken) return setError("Please complete the human check first.");
    setBusy(true);
    let timezone = "UTC";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {}
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, timezone, captchaToken }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setCaptchaToken("");
      setCaptchaReset((n) => n + 1);
      return setError(j.error ?? "Sign-up failed.");
    }
    router.replace(j.home);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <h2 className="font-display text-[26px] font-bold">Set up your business</h2>
        <p className="mt-1 text-[14px] text-paper/55">Takes two minutes. No card needed.</p>
      </div>
      <div>
        <label className={authLabel} htmlFor="biz">Business name</label>
        <input id="biz" className={authField} value={f.businessName} onChange={set("businessName")} placeholder="e.g. Kasih Hair Studio" autoComplete="organization" required {...aria("businessName")} />
        {hint("businessName")}
      </div>
      <div>
        <label className={authLabel} htmlFor="name">Your name</label>
        <input id="name" className={authField} value={f.name} onChange={set("name")} autoComplete="name" required {...aria("name")} />
        {hint("name")}
      </div>
      <div>
        <label className={authLabel} htmlFor="email">Email</label>
        <input id="email" type="email" className={authField} value={f.email} onChange={set("email")} autoComplete="email" required {...aria("email")} />
        {hint("email")}
      </div>
      <div>
        <label className={authLabel} htmlFor="pw">Password</label>
        <input id="pw" type="password" className={authField} value={f.password} onChange={set("password")} autoComplete="new-password" required placeholder="8+ characters, a letter and a number" {...aria("password")} />
        {hint("password")}
      </div>
      {captchaSiteKey ? <Turnstile siteKey={captchaSiteKey} onToken={setCaptchaToken} resetKey={captchaReset} /> : null}
      {error ? <p className={authError} role="alert">{error}</p> : null}
      <button disabled={busy} className={authButton}>{busy ? "Creating your workspace…" : "Create my workspace"}</button>
    </form>
  );
}
