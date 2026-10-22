"use client";
import useSWR from "swr";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Chip, ChannelMark } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";

type Item = { id: string; name: string; quantity: number; unitPriceMinor: number; note: string | null };
type Order = {
  id: string; threadId: string | null; refCode: string; customerName: string; phone: string | null; fulfilment: "pickup" | "delivery"; address: string | null; wanted: string | null; notes: string | null;
  status: "pending" | "confirmed" | "ready" | "completed" | "cancelled"; paid: boolean; totalMinor: number; currency: string; channel: string | null; cancelReason: string | null; isDemo: boolean;
  createdAt: string; confirmedAt: string | null; readyAt: string | null; completedAt: string | null; cancelledAt: string | null; handledByName: string | null; items: Item[];
};
type Data = { orders: Order[]; timezone: string; currency: string };
type Action = "confirm" | "ready" | "complete" | "cancel" | "paid" | "unpaid";
type Tab = "pending" | "active" | "done";

const TABS: { key: Tab; label: string; match: (o: Order) => boolean }[] = [
  { key: "pending", label: "Needs approval", match: (o) => o.status === "pending" },
  { key: "active", label: "In progress", match: (o) => o.status === "confirmed" || o.status === "ready" },
  { key: "done", label: "Done", match: (o) => o.status === "completed" || o.status === "cancelled" },
];

const STATUS_LABEL: Record<Order["status"], string> = { pending: "Waiting for you", confirmed: "Confirmed", ready: "Ready", completed: "Completed", cancelled: "Cancelled" };

function money(minor: number, currency: string) {
  const major = minor / 100;
  if (currency === "MYR") return `RM ${Number.isInteger(major) ? major : major.toFixed(2)}`;
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(major);
}

const stamp = (iso: string, tz: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: tz });

/** Each step with the time it happened: the order's activity log. */
function timeline(o: Order, tz: string) {
  return [
    ["Received", o.createdAt],
    ["Confirmed", o.confirmedAt],
    [o.fulfilment === "delivery" ? "Out for delivery" : "Ready", o.readyAt],
    ["Completed", o.completedAt],
    ["Cancelled", o.cancelledAt],
  ]
    .filter((x): x is [string, string] => Boolean(x[1]))
    .map(([label, at]) => `${label} ${stamp(at, tz)}`)
    .join(" · ");
}

export default function OrdersPage() {
  const toast = useToast();
  const { data, mutate } = useSWR<Data>("/api/orders", getJson);
  useLive(["orders"], () => mutate(), 150);
  const [tab, setTab] = useState<Tab | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const fresh = useMemo(() => {
    const ids = new Set((data?.orders ?? []).map((o) => o.id));
    const prev = seen.current;
    seen.current = ids;
    return prev ? new Set([...ids].filter((x) => !prev.has(x))) : new Set<string>();
  }, [data]);

  const orders = data?.orders ?? [];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, orders.filter(t.match).length])) as Record<Tab, number>;
  // Open on whatever needs attention first.
  const current: Tab = tab ?? (counts.pending ? "pending" : counts.active ? "active" : "pending");
  const shown = orders.filter(TABS.find((t) => t.key === current)!.match);

  async function act(o: Order, action: Action, reason?: string) {
    setBusy(`${o.id}:${action}`);
    try {
      const r = await send<{ notified: "sent" | "failed" | "no_chat" | null; notifyError?: string }>(`/api/orders/${o.id}`, "PATCH", { action, reason });
      await mutate();
      if (r.notified === "sent") toast(`${o.refCode}: customer told in chat.`);
      else if (r.notified === "failed") toast(`${o.refCode} updated, but the customer couldn't be messaged${r.notifyError ? `: ${r.notifyError}` : ""}. Message them yourself.`, "error");
      else if (r.notified === "no_chat") toast(`${o.refCode} updated. There's no chat to message the customer in.`);
      else toast(`${o.refCode} updated.`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  function cancel(o: Order) {
    const reason = window.prompt(`Cancel ${o.refCode}? The customer is told in chat. Reason (optional):`, "");
    if (reason !== null) void act(o, "cancel", reason);
  }

  const tz = data?.timezone ?? "UTC";
  return (
    <div>
      <PageHeader
        title="Orders"
        description="Orders customers place in chat. Jawab checks prices and stock, then waits for you: nothing is promised until you confirm, and the customer hears from you at each step."
      />
      {!data ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-1.5" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={current === t.key}
                onClick={() => setTab(t.key)}
                className={cx("h-8 rounded-full border px-3.5 text-[13px]", current === t.key ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}
              >
                {t.label}
                <span className={cx("num ml-1.5 text-[12px]", t.key === "pending" && counts.pending && current !== t.key ? "text-signal-ink" : "opacity-70")}>{counts[t.key]}</span>
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <div className="max-w-[56ch] border-t border-line pt-8">
              <p className="font-display text-[24px] font-bold">{orders.length ? "Nothing here." : "No orders yet."}</p>
              <p className="mt-2 text-[15px] text-muted">
                {orders.length
                  ? "Orders move through these tabs as you confirm them."
                  : "When a customer orders in chat, it shows up here for your approval. Try it in the simulator: order two large pizzas for pickup."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {shown.map((o) => {
                const pending = busy?.startsWith(o.id) ?? false;
                return (
                  <li key={o.id} className={cx("grid grid-cols-1 gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8", fresh.has(o.id) && "row-new", o.status === "cancelled" && "opacity-60")}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="num text-[15px] font-semibold">{o.refCode}</span>
                        <Chip tone={o.status === "pending" ? "signal" : o.status === "cancelled" ? "neutral" : "answered"}>{STATUS_LABEL[o.status]}</Chip>
                        <Chip>{o.fulfilment === "delivery" ? "Delivery" : "Pickup"}</Chip>
                        {o.paid ? <Chip tone="brass">Paid</Chip> : null}
                        {o.isDemo ? <Chip>Sample</Chip> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[15px] font-medium">{o.customerName}</span>
                        {o.channel ? <ChannelMark channel={o.channel} /> : null}
                        {o.phone ? <span className="num text-[12px] text-muted">{o.phone}</span> : null}
                      </div>
                      <ul className="mt-3 space-y-1 text-[15px]">
                        {o.items.map((i) => (
                          <li key={i.id} className="flex flex-wrap items-baseline gap-x-2">
                            <span className="num w-8 text-fg-2">{i.quantity}×</span>
                            <span>{i.name}</span>
                            {i.note ? <span className="text-[13px] text-muted">({i.note})</span> : null}
                            <span className="num ml-auto text-[13px] text-muted">{money(i.quantity * i.unitPriceMinor, o.currency)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-2 text-[15px] font-medium">
                        <span>Total{o.fulfilment === "delivery" ? " (items; add the delivery fee)" : ""}</span>
                        <span className="num">{money(o.totalMinor, o.currency)}</span>
                      </div>
                      {o.address ? <p className="mt-2 text-[14px]"><span className="text-muted">Deliver to:</span> {o.address}</p> : null}
                      {o.wanted ? <p className="mt-1 text-[14px]"><span className="text-muted">Wanted:</span> {o.wanted}</p> : null}
                      {o.notes ? <p className="mt-1 text-[14px]"><span className="text-muted">Notes:</span> {o.notes}</p> : null}
                      {o.cancelReason ? <p className="mt-1 text-[14px]"><span className="text-muted">Cancelled because:</span> {o.cancelReason}</p> : null}
                      <p className="num mt-3 text-[12px] text-muted">
                        {timeline(o, tz)}
                        {o.handledByName ? ` · by ${o.handledByName}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-start gap-2 lg:w-[210px] lg:flex-col lg:items-stretch">
                      {o.status === "pending" ? (
                        <Button size="sm" variant="primary" loading={busy === `${o.id}:confirm`} disabled={pending} onClick={() => act(o, "confirm")}>
                          Confirm order
                        </Button>
                      ) : null}
                      {o.status === "confirmed" ? (
                        <Button size="sm" variant="primary" loading={busy === `${o.id}:ready`} disabled={pending} onClick={() => act(o, "ready")}>
                          {o.fulfilment === "delivery" ? "Out for delivery" : "Ready for pickup"}
                        </Button>
                      ) : null}
                      {o.status === "confirmed" || o.status === "ready" ? (
                        <Button size="sm" variant={o.status === "ready" ? "primary" : "secondary"} loading={busy === `${o.id}:complete`} disabled={pending} onClick={() => act(o, "complete")}>
                          Mark completed
                        </Button>
                      ) : null}
                      {o.status !== "cancelled" ? (
                        <Button size="sm" variant="secondary" loading={busy === `${o.id}:${o.paid ? "unpaid" : "paid"}`} disabled={pending} onClick={() => act(o, o.paid ? "unpaid" : "paid")}>
                          {o.paid ? "Mark unpaid" : "Mark paid"}
                        </Button>
                      ) : null}
                      {o.status !== "completed" && o.status !== "cancelled" ? (
                        <Button size="sm" variant="danger" disabled={pending} onClick={() => cancel(o)}>
                          Cancel order
                        </Button>
                      ) : null}
                      {o.threadId ? (
                        <Link href={`/app/inbox?t=${o.threadId}`} className="inline-flex h-8 items-center justify-center rounded-[10px] px-3 text-[13px] text-fg-2 underline-offset-4 hover:text-fg hover:underline">
                          Open conversation
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
