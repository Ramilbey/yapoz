"use client";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Chip, ChannelMark } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL } from "@/components/app/labels";
import { cx } from "@/components/ui/cx";

type Esc = { id: string; threadId: string | null; category: string; priority: string; reason: string; summary: string; createdAt: string; channel: string | null; customerName: string | null; lastCustomerMessage: string | null };

export default function NeedsYou() {
  const toast = useToast();
  const { data, mutate } = useSWR<{ escalations: Esc[] }>("/api/escalations", getJson);
  useLive(["escalations", "threads"], () => mutate(), 150);
  const [busy, setBusy] = useState<string | null>(null);
  async function resolve(id: string) {
    setBusy(id);
    try {
      await send(`/api/escalations/${id}`, "POST");
      await mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div>
      <PageHeader
        title="Needs you"
        description="Conversations the AI handed to a person: partnerships, complaints, refunds, allergies, negotiations and anything it wasn't sure about. The customer already got a holding reply."
      />
      {!data ? (
        <p className="text-muted">Loading…</p>
      ) : data.escalations.length === 0 ? (
        <div className="max-w-[52ch] border-t border-line pt-8">
          <p className="font-display text-[24px] font-bold">Nothing is waiting.</p>
          <p className="mt-2 text-[15px] text-muted">When a message needs a human, it lands here with a one-line summary and the reason.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {data.escalations.map((e) => (
            <li key={e.id} className="row-new grid grid-cols-1 gap-3 py-5 md:grid-cols-[180px_1fr_auto] md:items-start md:gap-6">
              <div className="space-y-2">
                <Chip tone={e.priority === "high" || e.priority === "urgent" ? "signal" : "neutral"}>{CATEGORY_LABEL[e.category] ?? e.category}</Chip>
                <div className={cx("text-[12px]", e.priority === "high" || e.priority === "urgent" ? "text-signal-ink" : "text-muted")}>{e.priority} priority</div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {e.threadId ? <span className="text-[15px] font-medium">{e.customerName ?? "Customer"}</span> : null}
                  {e.threadId && e.channel ? <ChannelMark channel={e.channel} /> : null}
                  <span className="num text-[12px] text-muted">{new Date(e.createdAt).toLocaleString("en-MY", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}</span>
                </div>
                <p className="mt-1.5 text-[16px] leading-snug">{e.summary}</p>
                {e.lastCustomerMessage ? <p className="mt-1.5 text-[14px] text-muted">“{e.lastCustomerMessage}”</p> : null}
              </div>
              <div className="flex gap-2 md:justify-end">
                <Link href={e.threadId ? `/app/inbox?t=${e.threadId}` : "/app/knowledge"} className="inline-flex h-8 items-center rounded-[10px] bg-signal px-3 text-[13px] font-medium text-ink hover:brightness-110">
                  {e.threadId ? "Open conversation" : "Open Knowledge"}
                </Link>
                <Button size="sm" variant="secondary" loading={busy === e.id} onClick={() => resolve(e.id)}>Resolve</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
