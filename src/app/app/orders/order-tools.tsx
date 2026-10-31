"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { getJson, send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Chip } from "@/components/ui/chip";
import { Input, Textarea } from "@/components/ui/field";
import { cx } from "@/components/ui/cx";
import { REASON_CODES, REASON_LABELS, type ReasonCode } from "@/lib/order-reasons";
import type { TimelineLine } from "@/lib/order-timeline";

type Target = { id: string; refCode: string; kind: "order" | "appointment"; status: string };

/** Reject or cancel with a reason code (counted) and optional words (the customer reads these). */
export function StopDialog({ order, action, onClose, onDone }: { order: Target | null; action: "reject" | "cancel"; onClose: () => void; onDone: (reasonCode: ReasonCode, reason: string) => void }) {
  const [code, setCode] = useState<ReasonCode | null>(null);
  const [reason, setReason] = useState("");
  useEffect(() => { setCode(null); setReason(""); }, [order?.id, action]);
  return (
    <Dialog open={Boolean(order)} onOpenChange={(v) => !v && onClose()} title={`${action === "reject" ? "Reject" : "Cancel"} ${order?.refCode ?? ""}`} description={`The customer is told in chat${order && order.status !== "pending" ? " and the stock goes back" : ""}. Pick the main reason so you can see later why orders fall through.`}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Reason">
          {REASON_CODES.map((c) => (
            <button key={c} role="radio" aria-checked={code === c} onClick={() => setCode(c)} className={cx("rounded-full border px-3 py-1.5 text-[13px]", code === c ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}>
              {REASON_LABELS[c]}
            </button>
          ))}
        </div>
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder={code === "other" ? "Say why: the customer reads this" : "Optional: what the customer should read"} aria-label="Message to the customer" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Back</Button>
          <Button variant="danger" disabled={!code || (action === "reject" && code === "other" && !reason.trim())} onClick={() => code && onDone(code, reason)}>{action === "reject" ? "Reject" : "Cancel"}</Button>
        </div>
      </div>
    </Dialog>
  );
}

type EditItem = { id: string; name: string; quantity: number };
type EditTarget = Target & { items: EditItem[]; notes: string | null; wanted: string | null; address: string | null; fulfilment: "pickup" | "delivery" };

/** Fix what the AI saved before you decide. Prices stay the catalogue's; stock is held again for the new quantities. */
export function EditDialog({ order, onClose, onSaved }: { order: EditTarget | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [wanted, setWanted] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!order) return;
    setQty(Object.fromEntries(order.items.map((i) => [i.id, i.quantity])));
    setNotes(order.notes ?? ""); setWanted(order.wanted ?? ""); setAddress(order.address ?? "");
  }, [order]);
  async function save() {
    if (!order) return;
    setBusy(true);
    try {
      const lines = order.items.filter((i) => qty[i.id] !== i.quantity).map((i) => ({ id: i.id, quantity: qty[i.id] }));
      await send(`/api/orders/${order.id}`, "PUT", {
        ...(lines.length ? { lines } : {}),
        ...(notes !== (order.notes ?? "") ? { notes: notes || null } : {}),
        ...(wanted !== (order.wanted ?? "") ? { wanted: wanted || null } : {}),
        ...(order.fulfilment === "delivery" && address !== (order.address ?? "") ? { address: address || null } : {}),
      });
      toast(`${order.refCode}: corrected.`);
      onSaved();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={Boolean(order)} onOpenChange={(v) => !v && onClose()} title={`Correct ${order?.refCode ?? ""}`} description="Change what the AI got wrong before you confirm. Set a quantity to 0 to remove a line. Prices come from your catalogue and can't be edited here.">
      <div className="space-y-4">
        <ul className="space-y-2">
          {order?.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 text-[14px]">
              <span>{i.name}</span>
              <Input type="number" min={0} max={50} className="w-20" value={qty[i.id] ?? i.quantity} onChange={(e) => setQty({ ...qty, [i.id]: Math.max(0, Math.min(50, Math.floor(Number(e.target.value) || 0))) })} aria-label={`Quantity of ${i.name}`} />
            </li>
          ))}
        </ul>
        <Input value={wanted} onChange={(e) => setWanted(e.target.value)} maxLength={120} placeholder="When the customer wants it" aria-label="When wanted" />
        {order?.fulfilment === "delivery" ? <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} placeholder="Delivery address" aria-label="Delivery address" /> : null}
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Notes for the kitchen" aria-label="Notes" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Back</Button>
          <Button variant="primary" loading={busy} onClick={save}>Save correction</Button>
        </div>
      </div>
    </Dialog>
  );
}

const WHO = { ai: "AI", team: "You / team", system: "System" } as const;

/** What the AI did and didn't do on this order, in time order, and what is waiting on a person. */
export function AiTimeline({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useSWR<{ lines: TimelineLine[]; limits: string[] }>(open ? `/api/orders/${orderId}/timeline` : null, getJson, { revalidateOnFocus: false });
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="text-[13px] text-fg-2 underline-offset-4 hover:text-fg hover:underline">
        {open ? "Hide" : "Show"} what the AI did and didn&apos;t do
      </button>
      {open ? (
        !data ? <p className="mt-2 text-[13px] text-muted">Loading…</p> : (
          <div className="mt-2 rounded-xl border border-line p-3">
            <ol className="space-y-1.5 text-[13.5px]">
              {data.lines.map((l, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-2">
                  <Chip tone={l.kind === "didnt" ? "signal" : l.kind === "waiting" ? "brass" : l.who === "ai" ? "answered" : undefined}>{l.kind === "didnt" ? "AI did not" : l.kind === "waiting" ? "Waiting" : WHO[l.who]}</Chip>
                  <span>{l.text}</span>
                  <span className="num text-[12px] text-muted">{new Date(l.at).toLocaleString([], { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}</span>
                </li>
              ))}
            </ol>
            <ul className="mt-3 list-disc space-y-0.5 border-t border-line pt-2 pl-5 text-[12.5px] text-muted">
              {data.limits.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
        )
      ) : null}
    </div>
  );
}
