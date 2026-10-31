"use client";
import useSWR from "swr";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tz as tzIn } from "@date-fns/tz";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Chip, ChannelMark } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/field";
import { cx } from "@/components/ui/cx";
import { AiTimeline, EditDialog, StopDialog } from "./order-tools";
import type { ReasonCode } from "@/lib/order-reasons";
import type { OrderAppointment } from "@/lib/appointment-types";
import { cardIssues, cardNotes, displayText, holdText, issueLine, itemsLine, money, moreActions, nextStep, type CardIssue, type MoreAction } from "@/lib/order-card";

type Check = { code: string; level: "pass" | "warn" | "fail"; message: string };
type Receipt = {
  id: string; mime: string; verdict: "consistent" | "review" | "mismatch" | "unreadable"; checks: Check[]; createdAt: string; model: string | null; rejectedAt: string | null; rejectedReason: string | null;
  reading: { amount: number | null; currency: string | null; paidAt: string | null; payeeName: string | null; payeeAccount: string | null; reference: string | null; method: string | null } | null;
};
type Item = { id: string; name: string; quantity: number; unitPriceMinor: number; note: string | null };
type Attention = { level: "block" | "warn" | "info"; text: string };
type Notification = { kind: string; status: "sent" | "failed" | "no_chat" | "draft"; error?: string | null; at: string; deliveredAt: string | null; readAt: string | null };
type Order = {
  kind: "order" | "appointment"; appointment: OrderAppointment | null;
  id: string; threadId: string | null; refCode: string; customerName: string; phone: string | null; fulfilment: "pickup" | "delivery"; address: string | null; wanted: string | null; notes: string | null;
  status: "pending" | "confirmed" | "ready" | "completed" | "cancelled" | "expired"; paid: boolean; totalMinor: number; currency: string; channel: string | null; cancelReason: string | null; isDemo: boolean;
  createdAt: string; confirmedAt: string | null; readyAt: string | null; completedAt: string | null; cancelledAt: string | null; holdExpiresAt: string | null; firmedBy: "receipt" | "staff" | null; expiredAt: string | null; wantedDate: string | null; handledByName: string | null; items: Item[]; receipts: Receipt[];
  receiptRequest: { reason: string; kind: "replace" | "top_up"; expectedMinor: number; requestedAt: string; fulfilledAt?: string | null } | null;
  attention: Attention[]; recommendation: string | null; notificationsView: Notification[];
};
type Data = { orders: Order[]; holdMinutes: number; now: string; timezone: string; currency: string; payments: { enabled: boolean; receiptRequired: boolean } };
type Action = "confirm" | "ready" | "complete" | "reject" | "cancel" | "paid" | "unpaid" | "keep_reserved";
type Notified = { status: Notification["status"]; error?: string | null } | null;
type Tab = "pending" | "active" | "done";
type Kind = "all" | "order" | "appointment";
const ATTENDANCE = { present: "Attended", late: "Arrived late", no_show: "No-show" } as const;

const TABS: { key: Tab; label: string; match: (o: Order) => boolean }[] = [
  { key: "pending", label: "Needs approval", match: (o) => o.status === "pending" },
  { key: "active", label: "In progress", match: (o) => o.status === "confirmed" || o.status === "ready" },
  { key: "done", label: "Done", match: (o) => o.status === "completed" || o.status === "cancelled" || o.status === "expired" },
];

const statusLabel = (o: Order) => (o.status === "cancelled" ? (o.confirmedAt ? "Cancelled" : "Rejected") : { pending: "Waiting for you", confirmed: "Confirmed", ready: "Ready", completed: "Completed", expired: "Expired" }[o.status]);
const forDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
const KIND: Record<string, string> = { confirmed: "the order is confirmed", ready: "it's ready", rejected: "the order was rejected", cancelled: "the order was cancelled", receipt_request: "you need another receipt" };

const VERDICT: Record<Receipt["verdict"], { label: string; tone: "answered" | "brass" | "signal" | "neutral" }> = {
  consistent: { label: "Looks consistent", tone: "answered" },
  review: { label: "Take a look", tone: "brass" },
  mismatch: { label: "Doesn't add up", tone: "signal" },
  unreadable: { label: "Couldn't read", tone: "neutral" },
};
const MARK: Record<Check["level"], string> = { pass: "✓", warn: "!", fail: "✗" };
const stamp = (iso: string, tz: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: tz });

/** What Orbyte would receive at each stage of this order. Loaded on request, from the same records; nothing is sent anywhere. */
function OrbytePreview({ orderId, status }: { orderId: string; status: string }) {
  const [open, setOpen] = useState(false);
  const { data, error } = useSWR<{ events: { stage: string; event: unknown }[] }>(open ? `/api/orders/${orderId}/orbyte?status=${status}` : null, getJson, { shouldRetryOnError: false, revalidateOnFocus: false });
  return (
    <div className="mt-2 text-[13px]">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="font-medium text-accent underline-offset-4 hover:underline">{open ? "Hide Orbyte events" : "Orbyte events"}</button>
      {open ? (
        <div className="mt-2 rounded-lg border border-line p-3">
          <p className="text-muted">Preview only. This is our assumed format, not a real Orbyte API, and it isn't sent anywhere.</p>
          {error ? <p className="mt-2 text-signal-ink">{(error as Error).message}</p> : data ? data.events.map((e) => (
            <div key={e.stage} className="mt-3">
              <p className="font-medium">{e.stage}</p>
              <pre className="num mt-1 max-h-64 overflow-auto text-[12px]">{JSON.stringify(e.event, null, 2)}</pre>
            </div>
          )) : <p className="mt-2 text-muted">Loading…</p>}
        </div>
      ) : null}
    </div>
  );
}

/** A receipt the customer sent, what Yapoz read off it, and each check against the order and your accounts. Advice only. */
function ReceiptCard({ order, r, tz }: { order: Order; r: Receipt; tz: string }) {
  const v = VERDICT[r.verdict];
  const url = `/api/orders/${order.id}/receipts/${r.id}`;
  const rd = r.reading;
  return (
    <div className={cx("mt-3 flex gap-3 rounded-xl border border-line-strong bg-raised p-3.5", r.rejectedAt && "opacity-60")}>
      <a href={url} target="_blank" rel="noreferrer" className="block h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-raised" aria-label="Open the receipt">
        {r.mime === "application/pdf" ? <span className="grid h-full place-items-center text-[12px] text-muted">PDF</span> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt="Payment receipt" className="h-full w-full object-cover" />}
      </a>
      <div className="min-w-0 flex-1 text-[13.5px]">
        <div className="flex flex-wrap items-center gap-2">
          {r.rejectedAt ? <Chip>Turned down</Chip> : <Chip tone={v.tone}>{v.label}</Chip>}
          <span className="num text-[12px] text-muted">{stamp(r.createdAt, tz)}</span>
        </div>
        {r.rejectedAt ? <p className="mt-1 text-[12.5px] text-fg-2">You asked for another: “{displayText(r.rejectedReason ?? "")}”</p> : null}
        {rd && (rd.amount !== null || rd.payeeName || rd.reference) ? (
          <p className="num mt-1.5 text-[12.5px] text-fg-2">
            {[rd.amount !== null ? `${rd.currency ?? ""} ${rd.amount.toFixed(2)}`.trim() : null, rd.payeeName, rd.payeeAccount, rd.method, rd.reference ? `ref ${rd.reference}` : null].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <ul className="mt-1.5 space-y-0.5">
          {r.checks.map((c, i) => (
            <li key={i} className={cx("flex gap-2", c.level === "fail" ? "text-signal-ink" : c.level === "pass" ? "text-fg-2" : "text-fg")}>
              <span aria-hidden className="num w-3 shrink-0">{MARK[c.level]}</span>
              <span>{displayText(c.message)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[12px] text-muted">Read by {r.model ?? "AI"} from the image. It can&apos;t see your bank: check your own statement before you rely on it.</p>
      </div>
    </div>
  );
}

/** The booked slot, in the business timezone. */
function AppointmentBox({ a, tz }: { a: OrderAppointment; tz: string }) {
  const start = new Date(a.startsAt);
  const end = new Date(a.endsAt);
  return (
    <div className="mt-3 rounded-xl border border-line bg-raised/50 px-3.5 py-3 text-[14px]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-medium">Appointment</p>
        <Link href="/app/calendar" className="text-[13px] text-fg-2 underline-offset-4 hover:text-fg hover:underline">Open calendar</Link>
      </div>
      <p className="num mt-1">{format(start, "EEE d MMM, h:mmaaa", { in: tzIn(tz) })} to {format(end, "h:mmaaa", { in: tzIn(tz) })}</p>
      <p className="mt-1 text-fg-2">
        {a.staffName ?? "Anyone"}
        {" · "}
        {a.inPerson ? "In person" : a.meetLink ? <>Online, <a href={a.meetLink} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-fg">meet link</a></> : "Online"}
        {a.attendance ? ` · ${ATTENDANCE[a.attendance]}` : ""}
      </p>
    </div>
  );
}

/** Everything worth knowing about this order, each meaning once, then what to do about it. */
function IssueList({ o, issues }: { o: Order; issues: CardIssue[] }) {
  const notes = cardNotes(o);
  if (!issues.length && !notes.length && !o.recommendation) return null;
  return (
    <div className={cx("rounded-xl border px-3.5 py-3 text-[13.5px]", issues.some((i) => i.blocks) ? "border-signal/50 bg-signal/[0.06]" : "border-line bg-raised/50")}>
      <ul className="space-y-1">
        {issues.map((i) => (
          <li key={i.key} className={cx("flex gap-2", i.rank <= 1 ? "text-signal-ink" : "text-fg")}>
            <span aria-hidden className="num w-3 shrink-0">{i.blocks ? "✗" : "!"}</span>
            <span className="min-w-0">{i.text}</span>
          </li>
        ))}
        {notes.map((n) => (
          <li key={n} className="flex gap-2 text-fg-2">
            <span aria-hidden className="num w-3 shrink-0">i</span>
            <span className="min-w-0">{n}</span>
          </li>
        ))}
      </ul>
      {o.recommendation ? <p className={cx("font-medium", (issues.length > 0 || notes.length > 0) && "mt-2 border-t border-line pt-2")}>Suggested: {displayText(o.recommendation)}</p> : null}
    </div>
  );
}

/** "Order confirmed" and "customer told" are separate facts: this is the second one, with delivery receipts where the channel sends them. */
function Delivery({ o, tz }: { o: Order; tz: string }) {
  const last = o.notificationsView.at(-1);
  if (!last || last.status === "failed" || last.status === "no_chat") return null;
  const what = KIND[last.kind] ?? last.kind;
  return last.status === "sent" ? (
    <p className="text-[13px] text-fg-2">
      ✓ Customer told {what} · {stamp(last.at, tz)}
      {last.readAt ? " · read" : last.deliveredAt ? " · delivered to their phone" : o.channel === "whatsapp" ? " · sent, not delivered yet" : ""}
    </p>
  ) : (
    <p className="text-[13px] text-brass-ink">Message to the customer is waiting for approval in the Inbox.</p>
  );
}

function timeline(o: Order, tz: string) {
  return [
    ["Received", o.createdAt],
    ["Confirmed", o.confirmedAt],
    [o.fulfilment === "delivery" ? "Out for delivery" : "Ready", o.readyAt],
    ["Completed", o.completedAt],
    [o.confirmedAt ? "Cancelled" : "Rejected", o.cancelledAt],
    ["Expired", o.expiredAt],
  ]
    .filter((x): x is [string, string] => Boolean(x[1]))
    .map(([label, at]) => `${label} ${stamp(at, tz)}`)
    .join(" · ");
}

const REASONS: { text: string; kind: "replace" | "top_up" }[] = [
  { text: "The amount paid is less than the order total", kind: "top_up" },
  { text: "This receipt is for a different payment", kind: "replace" },
  { text: "The receipt is too blurry or cropped to read", kind: "replace" },
  { text: "The money went to the wrong account", kind: "replace" },
  { text: "The payment still shows as pending", kind: "replace" },
];

/** Turn the receipt down with a reason. The customer gets a fixed message (shown here first) and the chat waits for the new receipt. */
function ReceiptRequestDialog({ order, onClose, onSent }: { order: Order | null; onClose: () => void; onSent: (o: Order, n: Notified) => void }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [kind, setKind] = useState<"replace" | "top_up">("replace");
  const [preview, setPreview] = useState<{ message: string; expectedMinor: number } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!order) return;
    const short = order.receipts.find((r) => !r.rejectedAt)?.checks.some((c) => c.code === "amount" && c.level === "fail");
    setKind(short ? "top_up" : "replace");
    setReason(short ? REASONS[0].text : "");
    setPreview(null);
  }, [order]);
  useEffect(() => {
    if (!order || reason.trim().length < 3) return setPreview(null);
    const id = setTimeout(() => {
      send<{ message: string; expectedMinor: number }>(`/api/orders/${order.id}/receipt-request`, "POST", { reason, kind, preview: true })
        .then((r) => (setPreview(r), setPreviewError(null)))
        .catch((e) => (setPreview(null), setPreviewError((e as Error).message)));
    }, 350);
    return () => clearTimeout(id);
  }, [order, reason, kind]);
  async function submit() {
    if (!order) return;
    setBusy(true);
    try {
      const r = await send<{ notified: Notified }>(`/api/orders/${order.id}/receipt-request`, "POST", { reason, kind });
      onSent(order, r.notified);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={Boolean(order)} onOpenChange={(v) => !v && onClose()} title={`Ask for another receipt${order ? `: ${order.refCode}` : ""}`} description="Say what's wrong. The customer gets the message below, the chat waits for their new receipt, and the assistant knows what to expect.">
      <div className="space-y-4">
        <div className="flex rounded-lg border border-line p-0.5 text-[13px]" role="radiogroup" aria-label="What should the customer send">
          {(
            [
              ["replace", "Send a correct receipt"],
              ["top_up", "Pay the difference"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cx("h-8 flex-1 rounded-md px-3", kind === k ? "bg-fg text-bg" : "text-fg-2 hover:text-fg")}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REASONS.map((r) => (
            <button key={r.text} onClick={() => (setReason(r.text), setKind(r.kind))} className={cx("rounded-full border px-2.5 py-1 text-[12px]", reason === r.text ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}>
              {r.text}
            </button>
          ))}
        </div>
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Why, in your own words" aria-label="Reason" />
        <div className="rounded-xl border border-line bg-raised/50 p-3 text-[13.5px]">
          <p className="text-[12px] text-muted">The customer will read</p>
          <p className="mt-1 whitespace-pre-wrap">{preview?.message ?? (previewError ? <span className="text-signal-ink">{previewError}</span> : "Write a reason to see the message.")}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} disabled={!preview} onClick={submit}>Send to customer</Button>
        </div>
      </div>
    </Dialog>
  );
}

const MENU_LABEL = (o: Order): Record<MoreAction, string> => ({
  keep_reserved: "Keep reserved", complete: "Mark completed", correct: "Correct order", ask_receipt: "Ask for another receipt", paid: "Mark paid", unpaid: "Mark unpaid", retry: "Retry message to customer",
  cancel: o.kind === "appointment" ? "Cancel booking" : "Cancel order",
});

/** Every action besides the next step. Each one does what its button always did, confirmations included. */
function MoreMenu({ o, actions, busy, disabled, onPick }: { o: Order; actions: MoreAction[]; busy: boolean; disabled: boolean; onPick: (a: MoreAction) => void }) {
  const label = MENU_LABEL(o);
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <Button size="sm" variant="secondary" loading={busy} disabled={disabled} aria-label={`More actions for ${o.refCode}`}>···</Button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={6} collisionPadding={16} className="z-30 min-w-[210px] max-w-[calc(100vw-32px)] rounded-xl border border-line-strong bg-bg p-1 shadow-lg">
          {actions.map((a) => (
            <Menu.Item key={a} onSelect={() => onPick(a)} className={cx("cursor-pointer rounded-lg px-3 py-2 text-[14px] outline-none data-[highlighted]:bg-raised", a === "cancel" && "text-signal-ink")}>
              {label[a]}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** The full record behind a card. Only built while open; whether it's open lives in the page, so live refreshes leave it alone. */
function OrderDetails({ o, tz, issues }: { o: Order; tz: string; issues: CardIssue[] }) {
  return (
    <div className="mt-3 min-w-0 space-y-3 border-t border-line pt-3 text-[14px]">
      <IssueList o={o} issues={issues} />
      {o.appointment ? <AppointmentBox a={o.appointment} tz={tz} /> : null}
      <div>
        <ul className="space-y-1 text-[15px]">
          {o.items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-baseline gap-x-2">
              <span className="num w-8 text-fg-2">{i.quantity}×</span>
              <span className="min-w-0 break-words">{i.name}</span>
              {i.note ? <span className="text-[13px] text-muted">({i.note})</span> : null}
              <span className="num ml-auto text-[13px] text-muted">{money(i.quantity * i.unitPriceMinor, o.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-line pt-2 text-[15px] font-medium">
          <span>Total{o.kind === "order" && o.fulfilment === "delivery" ? " (items; add the delivery fee)" : ""}</span>
          <span className="num shrink-0">{money(o.totalMinor, o.currency)}</span>
        </div>
      </div>
      {o.phone || o.address || o.wanted || o.wantedDate || o.notes || o.cancelReason ? (
        <div className="space-y-1 break-words">
          {o.phone ? <p><span className="text-muted">Phone:</span> <span className="num">{o.phone}</span></p> : null}
          {o.address ? <p><span className="text-muted">Deliver to:</span> {o.address}</p> : null}
          {o.wanted ? <p><span className="text-muted">Wanted:</span> {o.wanted}</p> : null}
          {o.wantedDate ? <p><span className="text-muted">For</span> {forDate(o.wantedDate)}</p> : null}
          {o.notes ? <p><span className="text-muted">Notes:</span> {o.notes}</p> : null}
          {o.cancelReason ? <p><span className="text-muted">{o.status === "expired" ? "Expired" : o.confirmedAt ? "Cancelled" : "Rejected"} because:</span> {o.cancelReason}</p> : null}
        </div>
      ) : null}
      {o.receipts.map((r) => (
        <ReceiptCard key={r.id} order={o} r={r} tz={tz} />
      ))}
      <Delivery o={o} tz={tz} />
      {o.kind === "order" ? <AiTimeline orderId={o.id} /> : null}
      <p className="num break-words text-[12px] text-muted">
        {timeline(o, tz)}
        {o.handledByName ? ` · by ${o.handledByName}` : ""}
        {" · "}
        <Link href={`/app/activity?order=${o.id}`} className="underline-offset-4 hover:text-fg hover:underline">Full activity</Link>
      </p>
      {o.threadId ? <Link href={`/app/inbox?t=${o.threadId}`} className="inline-block text-[13px] font-medium text-accent underline-offset-4 hover:underline">Open conversation</Link> : null}
      <OrbytePreview orderId={o.id} status={o.status} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const toast = useToast();
  const params = useSearchParams();
  const focus = params.get("o");
  const { data, mutate } = useSWR<Data>("/api/orders", getJson, { revalidateOnFocus: false });
  useLive(["orders", "order_receipts", "stock_holds", "messages"], () => mutate(), 400, (e) => e.t !== "messages" || e.op === "UPDATE");
  const [tab, setTab] = useState<Tab | null>(null);
  const [kind, setKind] = useState<Kind>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [asking, setAsking] = useState<Order | null>(null);
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const setDetails = (id: string, open: boolean) => setOpened((now) => { const next = new Set(now); if (open) next.add(id); else next.delete(id); return next; });
  const [stopping, setStopping] = useState<{ order: Order; action: "reject" | "cancel" } | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  // Server time minus client time, so countdowns stay right when this device's clock is off.
  const skew = useMemo(() => (data?.now ? new Date(data.now).getTime() - Date.now() : 0), [data]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20000);
    return () => clearInterval(id);
  }, []);
  const nowMs = Date.now() + skew + tick * 0;
  const seen = useRef<Set<string> | null>(null);
  const fresh = useMemo(() => {
    const ids = new Set((data?.orders ?? []).map((o) => o.id));
    const prev = seen.current;
    seen.current = ids;
    return prev ? new Set([...ids].filter((x) => !prev.has(x))) : new Set<string>();
  }, [data]);

  const all = data?.orders ?? [];
  const hasBookings = all.some((o) => o.kind === "appointment");
  const orders = all.filter((o) => kind === "all" || o.kind === kind);
  const counts = Object.fromEntries(TABS.map((t) => [t.key, orders.filter(t.match).length])) as Record<Tab, number>;
  const focused = focus ? all.find((o) => o.id === focus) : undefined;
  // Open on the linked order's tab, else on whatever needs attention first.
  const current: Tab = tab ?? (focused ? TABS.find((t) => t.match(focused))!.key : counts.pending ? "pending" : counts.active ? "active" : "pending");
  const shown = orders.filter(TABS.find((t) => t.key === current)!.match);
  const word = (o: Order) => (o.kind === "appointment" ? "booking" : "order");
  useEffect(() => {
    if (focused) document.getElementById(`order-${focused.id}`)?.scrollIntoView({ block: "center" });
  }, [focused]);

  function report(o: Order, n: Notified, done: string) {
    if (!n) toast(`${o.refCode}: ${done}.`);
    else if (n.status === "sent") toast(`${o.refCode}: ${done}. Customer told in chat.`);
    else if (n.status === "failed") toast(`${o.refCode}: ${done}, but the customer was NOT told${n.error ? ` (${n.error})` : ""}. Retry from the order or message them yourself.`, "error");
    else if (n.status === "no_chat") toast(`${o.refCode}: ${done}. There's no chat to tell the customer in.`, "error");
    else toast(`${o.refCode}: ${done}. The message waits for approval in the Inbox.`);
  }

  async function act(o: Order, action: Action, reason?: string, reasonCode?: ReasonCode) {
    if (busy) return;
    setBusy(`${o.id}:${action}`);
    const DONE: Record<Action, string> = { keep_reserved: "kept reserved", confirm: "confirmed", ready: "marked ready", complete: "completed", reject: "rejected", cancel: "cancelled", paid: "marked paid", unpaid: "marked unpaid" };
    try {
      const r = await send<{ notified: Notified }>(`/api/orders/${o.id}`, "PATCH", { action, reason: reason || undefined, reasonCode });
      report(o, r.notified, DONE[action]);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      await mutate();
      setBusy(null);
    }
  }

  async function retry(o: Order) {
    setBusy(`${o.id}:retry`);
    try {
      const r = await send<{ notified: Notified }>(`/api/orders/${o.id}/notify`, "POST");
      report(o, r.notified, "message resent");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      await mutate();
      setBusy(null);
    }
  }

  function confirm(o: Order) {
    const issues = o.attention.filter((a) => a.level !== "info");
    if (issues.length && !window.confirm(`Before you confirm ${o.refCode}:\n\n${issues.map((a) => `• ${displayText(a.text)}`).join("\n")}\n\nConfirm the ${word(o)} anyway?`)) return;
    void act(o, "confirm");
  }

  function stop(o: Order, action: "reject" | "cancel") {
    setStopping({ order: o, action });
  }

  const tz = data?.timezone ?? "UTC";
  return (
    <div>
      <PageHeader
        eyebrow={data ? `Orders · ${orders.filter((o) => o.status === "pending").length} waiting for you` : undefined}
        title="Orders, approved by you"
        accent="approved"
        description="Orders customers place in chat. Yapoz checks prices and stock and tells you anything that needs a look; nothing is promised until you confirm, and the customer hears from you at each step."
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
                className={cx("h-9 rounded-full border px-4 text-[13.5px] transition-colors", current === t.key ? "border-fg bg-fg font-semibold text-bg" : "border-line-strong text-fg-2 hover:border-fg hover:text-fg")}
              >
                {t.label}
                <span className={cx("num ml-1.5 text-[12px]", t.key === "pending" && counts.pending && current !== t.key ? "text-signal-ink" : "opacity-70")}>{counts[t.key]}</span>
              </button>
            ))}
          </div>
          {hasBookings ? (
            <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Show">
              {(["all", "order", "appointment"] as const).map((k) => (
                <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)} className={cx("h-7 rounded-full border px-3 text-[12px]", kind === k ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}>
                  {{ all: "All", order: "Orders", appointment: "Bookings" }[k]}
                </button>
              ))}
            </div>
          ) : null}
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
            <ul className="space-y-4">
              {shown.map((o) => {
                const pending = busy?.startsWith(o.id) ?? false;
                const asked = o.receiptRequest && !o.receiptRequest.fulfilledAt;
                const liveReceipts = o.receipts.filter((r) => !r.rejectedAt).length;
                const canAsk = data.payments.enabled && (o.status === "pending" || o.status === "confirmed" || o.status === "ready") && !asked && o.receipts.length > 0;
                const closed = o.status === "cancelled" || o.status === "expired";
                const issues = cardIssues(o, nowMs);
                const line = issueLine(o, issues);
                const next = nextStep(o);
                const more = moreActions(o, canAsk);
                const open = opened.has(o.id);
                const panel = `order-details-${o.id}`;
                const pick = (a: MoreAction) => {
                  if (a === "ask_receipt") setAsking(o);
                  else if (a === "correct") setEditing(o);
                  else if (a === "retry") void retry(o);
                  else if (a === "cancel") stop(o, "cancel");
                  else void act(o, a);
                };
                return (
                  <li key={o.id} id={`order-${o.id}`} className={cx("panel k-slide min-w-0 p-5", o.status === "pending" && "border-accent!", fresh.has(o.id) && "row-new", closed && "opacity-60", focus === o.id && "bg-raised!")}>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <span className="num text-[15px] font-semibold">{o.refCode}</span>
                      <span className="min-w-0 break-words text-[15px] font-medium">{o.customerName}</span>
                      {o.channel ? <ChannelMark channel={o.channel} /> : null}
                      <Chip tone={o.status === "pending" ? "signal" : closed ? "neutral" : "answered"}>{statusLabel(o)}</Chip>
                      {o.kind === "appointment" ? <Chip tone="brass">Booking</Chip> : <Chip>{o.fulfilment === "delivery" ? "Delivery" : "Pickup"}</Chip>}
                      {o.paid ? <Chip tone="brass">Paid</Chip> : closed ? null : <Chip>Not paid</Chip>}
                      {o.isDemo ? <Chip>Sample</Chip> : null}
                    </div>
                    <p className="mt-2 break-words text-[15px]">
                      {itemsLine(o)}
                      {o.appointment ? ` · ${format(new Date(o.appointment.startsAt), "EEE d MMM, h:mmaaa", { in: tzIn(tz) })}` : ""}
                    </p>
                    {line.shown.length ? (
                      <ul className="mt-1.5 space-y-0.5 text-[14px]">
                        {line.shown.map((i, n) => (
                          <li key={i.key} className={cx("flex flex-wrap items-baseline gap-x-2 font-medium", i.rank <= 1 ? "text-signal-ink" : "text-fg")}>
                            <span className="min-w-0 break-words">{i.text}</span>
                            {n === line.shown.length - 1 && line.more ? (
                              <button type="button" onClick={() => setDetails(o.id, true)} className="shrink-0 font-normal text-fg-2 underline underline-offset-4 hover:text-fg">+{line.more} more</button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : line.receiptOk ? (
                      <p className="mt-1.5 text-[14px] text-fg-2">✓ Receipt matches</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {next === "confirm" ? (
                        <>
                          <Button size="sm" variant="primary" loading={busy === `${o.id}:confirm`} disabled={pending || Boolean(asked) || (data.payments.receiptRequired && liveReceipts === 0)} onClick={() => confirm(o)}>
                            {o.kind === "appointment" ? "Confirm booking" : "Confirm order"}
                          </Button>
                          <Button size="sm" variant="danger" disabled={pending} onClick={() => stop(o, "reject")}>{o.kind === "appointment" ? "Reject booking" : "Reject order"}</Button>
                        </>
                      ) : next === "ready" ? (
                        <Button size="sm" variant="primary" loading={busy === `${o.id}:ready`} disabled={pending} onClick={() => act(o, "ready")}>
                          {o.fulfilment === "delivery" ? "Out for delivery" : "Ready for pickup"}
                        </Button>
                      ) : next === "complete" ? (
                        <Button size="sm" variant="primary" loading={busy === `${o.id}:complete`} disabled={pending} onClick={() => act(o, "complete")}>Mark completed</Button>
                      ) : o.kind === "appointment" && o.status === "confirmed" ? (
                        <Link href="/app/calendar" className="inline-flex h-8 items-center justify-center rounded-[10px] border border-line-strong px-3 text-[13px] font-medium hover:bg-raised">Open calendar</Link>
                      ) : null}
                      {more.length ? <MoreMenu o={o} actions={more} busy={more.some((a) => busy === `${o.id}:${a}`)} disabled={pending} onPick={pick} /> : null}
                      <button type="button" aria-expanded={open} aria-controls={panel} onClick={() => setDetails(o.id, !open)} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2 text-[13px] font-medium text-fg-2 hover:text-fg">
                        Details <span aria-hidden className={cx("transition-transform", open && "rotate-180")}>▾</span>
                      </button>
                    </div>
                    <div id={panel} hidden={!open}>{open ? <OrderDetails o={o} tz={tz} issues={issues} /> : null}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <StopDialog
        order={stopping?.order ?? null}
        action={stopping?.action ?? "reject"}
        onClose={() => setStopping(null)}
        onDone={(code, reason) => {
          const x = stopping;
          setStopping(null);
          if (x) void act(x.order, x.action, reason, code);
        }}
      />
      <EditDialog order={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void mutate(); }} />
      <ReceiptRequestDialog
        order={asking}
        onClose={() => setAsking(null)}
        onSent={(o, n) => {
          setAsking(null);
          report(o, n, "asked for another receipt");
          void mutate();
        }}
      />
    </div>
  );
}
