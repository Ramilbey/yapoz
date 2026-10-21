"use client";
import useSWR from "swr";
import { useState } from "react";
import { getJson, send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { CopyField } from "@/components/ui/copy";

type Role = "owner" | "service" | "hr";
type Team = {
  me: string;
  members: { id: string; name: string; email: string; role: Role }[];
  invites: { token: string; email: string; role: Role; expiresAt: string; url: string }[];
};

const ROLES: { value: Role; label: string; sees: string }[] = [
  { value: "owner", label: "Owner", sees: "Everything, including settings and channels" },
  { value: "service", label: "Service", sees: "Inbox, Needs you, knowledge and bookings" },
  { value: "hr", label: "HR", sees: "Hiring only" },
];

const select = "h-9 rounded-lg border border-line bg-raised px-2 text-[13px]";

export function TeamSection({ hiring }: { hiring: boolean }) {
  const toast = useToast();
  const { data, mutate } = useSWR<Team>("/api/team", getJson);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("service");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const roles = ROLES.filter((r) => hiring || r.value !== "hr");

  async function act(fn: () => Promise<unknown>, msg?: string) {
    try {
      await fn();
      await mutate();
      if (msg) toast(msg);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <section id="team" className="scroll-mt-6">
      <h2 className="font-display text-[22px] font-bold">Team</h2>
      <p className="mt-1 max-w-[70ch] text-[14px] text-muted">Each person signs in to their own desk. Invite links work once and last 7 days; send them however you like.</p>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {data?.members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="text-[14px] font-medium">
                {m.name} {m.id === data.me ? <span className="text-muted">(you)</span> : null}
              </div>
              <div className="truncate text-[13px] text-muted">{m.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <select aria-label={`Role for ${m.name}`} className={select} value={m.role} disabled={m.id === data.me} onChange={(e) => act(() => send(`/api/team/members/${m.id}`, "PATCH", { role: e.target.value }), "Role changed.")}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {m.id !== data.me ? (
                <Button size="sm" variant="ghost" onClick={() => window.confirm(`Remove ${m.name}? They can't sign in any more.`) && act(() => send(`/api/team/members/${m.id}`, "DELETE"), "Removed.")}>
                  Remove
                </Button>
              ) : null}
            </div>
          </li>
        ))}
        {data?.invites.map((i) => (
          <li key={i.token} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px]">
                  {i.email} <span className="text-muted">· invited as {ROLES.find((r) => r.value === i.role)?.label}</span>
                </div>
                <div className="text-[12px] text-muted">Link valid until {new Date(i.expiresAt).toLocaleDateString()}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => act(() => send(`/api/team/invites/${i.token}`, "DELETE"), "Invite cancelled.")}>
                Cancel invite
              </Button>
            </div>
            {fresh === i.token ? <CopyField className="mt-2 max-w-[560px]" value={i.url} label="Invite link" /> : (
              <button className="mt-1 text-[12.5px] text-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => setFresh(i.token)}>
                Show link
              </button>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-4 grid max-w-[720px] gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await act(async () => {
            const r = await send<{ token: string }>("/api/team/invites", "POST", { email, role });
            setFresh(r.token);
            setEmail("");
          }, "Invite link ready. Copy it and send it to them.");
          setBusy(false);
        }}
      >
        <div>
          <Label htmlFor="inv-email">Invite by email</Label>
          <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
        </div>
        <div>
          <Label htmlFor="inv-role">Desk</Label>
          <select id="inv-role" className={`${select} h-10 w-full`} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={busy}>
          Create invite link
        </Button>
        <p className="text-[12.5px] text-muted sm:col-span-3">{roles.find((r) => r.value === role)?.sees}</p>
      </form>
    </section>
  );
}
