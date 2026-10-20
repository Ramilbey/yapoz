"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/field";

type O = { id: string; kind: "invite" | "rejection"; channel: string; language: string; interviewMode: string | null; slots: { start: string; end: string }[]; draft: string; finalText: string | null; status: string; error: string | null; createdAt: string; sentAt: string | null; approverName: string | null; fullName: string; telegramUsername: string | null; role: string; score: number | null };

const CH: Record<string, string> = { telegram: "Telegram bot chat", whatsapp: "WhatsApp template", manual: "No automatic channel" };

export default function Approvals() {
  const { data, mutate } = useSWR<{ outreach: O[] }>("/api/hiring/outreach", getJson);
  useLive(["outreach", "interviews"], () => mutate(), 200);
  const drafts = (data?.outreach ?? []).filter((o) => o.status === "draft" || o.status === "failed");
  const done = (data?.outreach ?? []).filter((o) => o.status === "sent" || o.status === "approved");
  return (
    <div>
      <PageHeader title="Approvals" description="Every message to a candidate waits here. Edit it, then Approve to send. Interview times are offered as buttons the candidate taps." />
      {!data ? <p className="text-muted">Loading…</p> : null}
      {data && !drafts.length ? <p className="mb-10 text-[15px] text-muted">Nothing waiting for approval. Draft an invite from a ranked shortlist.</p> : null}
      <ul className="space-y-6">
        {drafts.map((o) => (
          <Draft key={o.id} o={o} onChange={mutate} />
        ))}
      </ul>
      {done.length ? (
        <section className="mt-14">
          <h2 className="font-display mb-3 text-[20px] font-bold">Sent</h2>
          <ul className="divide-y divide-line border-y border-line">
            {done.map((o) => (
              <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3 text-[14px]">
                <span><span className="font-medium">{o.fullName}</span> <span className="text-muted">{o.kind === "invite" ? `invited for ${o.role}` : `rejection for ${o.role}`}</span></span>
                <span className="text-muted">approved by {o.approverName ?? "–"}, {o.sentAt ? new Date(o.sentAt).toLocaleString("en-MY", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" }) : "sending"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Draft({ o, onChange }: { o: O; onChange: () => void }) {
  const toast = useToast();
  const [text, setText] = useState(o.draft);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => setText(o.draft), [o.draft]);
  async function act(action: "approve" | "cancel") {
    setBusy(action);
    try {
      const r = await send<{ ok?: boolean; error?: string; channel?: string }>(`/api/hiring/outreach/${o.id}`, "POST", action === "approve" ? { action, text } : { action });
      if (action === "approve") {
        if (r.ok) toast(`Sent to ${o.fullName.split(" ")[0]} via ${CH[r.channel ?? o.channel] ?? r.channel}.`);
        else toast(r.error ?? "Not sent", "error");
      }
      onChange();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  return (
    <li className="grid grid-cols-1 gap-6 rounded-2xl border border-line p-5 lg:grid-cols-[260px_1fr]">
      <div>
        <Chip tone={o.kind === "invite" ? "brass" : "neutral"}>{o.kind === "invite" ? (o.interviewMode === "video" ? "Video interview invite" : "Interview invite") : "Rejection"}</Chip>
        <h3 className="mt-3 text-[18px] font-semibold">{o.fullName}</h3>
        <p className="text-[14px] text-muted">{o.role}{o.score != null ? `, fit ${o.score}` : ""}</p>
        <p className="mt-3 text-[13px] text-fg-2">Sends via: {CH[o.channel] ?? o.channel}</p>
        {o.status === "failed" ? <p className="mt-2 text-[13px] text-signal-ink">Last attempt failed: {o.error}</p> : null}
      </div>
      <div>
        <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
        {o.kind === "invite" ? (
          <div className="mt-3">
            <p className="text-[12px] text-muted">Times offered as buttons (from the interview calendar):</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {o.slots.map((s) => (
                <span key={s.start} className="num rounded-lg border border-line-strong px-3 py-1.5 text-[13px]">
                  {new Date(s.start).toLocaleString("en-MY", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" loading={busy === "cancel"} onClick={() => act("cancel")}>Discard</Button>
          <Button variant="primary" size="lg" loading={busy === "approve"} disabled={o.channel === "manual" && o.status !== "failed" ? false : false} onClick={() => act("approve")}>
            Approve and send
          </Button>
        </div>
        {o.channel === "manual" ? <p className="mt-2 text-right text-[12px] text-muted">This candidate can&apos;t be messaged automatically yet; approving will show why.</p> : null}
      </div>
    </li>
  );
}
