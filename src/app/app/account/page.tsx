"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/shell";
import { send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AlertSettingsForm } from "@/components/app/alert-settings";

export default function AccountPage() {
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [busy, setBusy] = useState<string | null>(null);
  async function save(kind: "name" | "pw" | "everywhere") {
    if (kind === "everywhere" && !window.confirm("Sign out on every other phone and computer? This one stays signed in.")) return;
    setBusy(kind);
    try {
      await send("/api/account", "PATCH", kind === "name" ? { name } : kind === "pw" ? { currentPassword: pw.current, newPassword: pw.next } : { signOutEverywhere: true });
      toast(kind === "name" ? "Name updated." : kind === "pw" ? "Password changed. Other devices were signed out." : "Signed out on every other device.");
      if (kind === "pw") setPw({ current: "", next: "" });
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div>
      <PageHeader title="Your account" description="Your name as teammates see it, your password, your alerts, and where you're signed in." />
      <div className="grid max-w-[880px] grid-cols-1 gap-12 md:grid-cols-2">
        <form onSubmit={(e) => { e.preventDefault(); void save("name"); }} className="space-y-3">
          <h2 className="font-display text-[20px] font-bold">Name</h2>
          <div>
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit" loading={busy === "name"} disabled={!name.trim()}>Save name</Button>
        </form>
        <form onSubmit={(e) => { e.preventDefault(); void save("pw"); }} className="space-y-3">
          <h2 className="font-display text-[20px] font-bold">Password</h2>
          <div>
            <Label htmlFor="cur">Current password</Label>
            <Input id="cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="new" hint="8+ characters">New password</Label>
            <Input id="new" type="password" autoComplete="new-password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
          </div>
          <Button type="submit" loading={busy === "pw"}>Change password</Button>
        </form>
        <AlertSettingsForm />
        <section className="space-y-3 md:col-span-2">
          <h2 className="font-display text-[20px] font-bold">Signed-in devices</h2>
          <p className="max-w-[60ch] text-[14px] text-muted">Lost a phone, or used a shared computer? Sign out everywhere else. Changing your password does this too.</p>
          <Button variant="secondary" loading={busy === "everywhere"} onClick={() => save("everywhere")}>Sign out on every other device</Button>
        </section>
      </div>
    </div>
  );
}
