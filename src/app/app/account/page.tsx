"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/shell";
import { send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [busy, setBusy] = useState<string | null>(null);
  async function save(kind: "name" | "pw") {
    setBusy(kind);
    try {
      await send("/api/account", "PATCH", kind === "name" ? { name } : { currentPassword: pw.current, newPassword: pw.next });
      toast(kind === "name" ? "Name updated." : "Password changed.");
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
      <PageHeader title="Your account" description="Your name as teammates see it, and your password." />
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
      </div>
    </div>
  );
}
