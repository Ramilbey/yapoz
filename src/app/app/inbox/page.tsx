"use client";
import useSWR from "swr";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Chip, ChannelMark } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cx } from "@/components/ui/cx";
import { CATEGORY_LABEL } from "@/components/app/labels";
import { KineticTitle } from "@/components/app/shell";

type ThreadRow = {
  id: string; channel: string; status: "open" | "needs_human" | "resolved"; aiPaused: boolean; isDemo: boolean; lastMessageAt: string; lastPreview: string | null;
  customerName: string | null; username: string | null; drafts: number; openEscalations: number; lastDirection: "in" | "out" | null; routing: Record<string, unknown>;
  escalation: { category: string; priority: string; summary: string } | null;
};
type Msg = {
  id: string; direction: "in" | "out"; author: "customer" | "ai" | "staff" | "system"; text: string; status: string; createdAt: string; error: string | null; authorName: string | null;
  deliveredAt?: string | null; readAt?: string | null;
  attachments: { kind: string; name?: string }[];
  run: { model: string; intent: string | null; topic: string | null; language: string | null; sentiment: string | null; confidence: number | null; latencyMs: number | null; outcome: string; tokens: number; cacheRead: number; tools: { name: string; label: string; ok: boolean; ms: number }[]; error: string | null } | null;
};
type Detail = {
  thread: { id: string; channel: string; status: string; aiPaused: boolean; takenOverByName: string | null; routing: Record<string, unknown>; accent: string | null; isDemo: boolean; createdAt: string };
  customer: { displayName: string | null; username: string | null; language: string | null; phone: string | null; createdAt: string };
  messages: Msg[];
  escalations: { id: string; category: string; priority: string; reason: string; summary: string; status: string; createdAt: string }[];
  orders: { id: string; refCode: string; status: string; totalMinor: number; currency: string; createdAt: string; confirmedAt: string | null; receiptRequest: { reason: string; fulfilledAt?: string | null } | null }[];
  more: boolean;
  canDelete: boolean;
};

const ORDER_STATUS: Record<string, string> = { pending: "Waiting for approval", confirmed: "Confirmed", ready: "Ready", completed: "Completed", cancelled: "Cancelled" };
const money = (minor: number, currency: string) => (currency === "MYR" ? `RM ${Number.isInteger(minor / 100) ? minor / 100 : (minor / 100).toFixed(2)}` : new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100));

const FILTERS = [
  { key: "all", label: "All" },
  { key: "needs", label: "Needs you" },
  { key: "drafts", label: "Drafts" },
  { key: "takeover", label: "Taken over" },
] as const;


function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
}

export default function InboxPage() {
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  );
}

function Inbox() {
  const router = useRouter();
  const params = useSearchParams();
  const selected = params.get("t");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>((params.get("f") as "all") ?? "all");
  const [channel, setChannel] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const key = `/api/inbox/threads?filter=${filter}${channel ? `&channel=${channel}` : ""}&demo=${demo ? 1 : 0}`;
  // keepPreviousData: switching filters keeps the old list on screen until the new one arrives, instead of flashing "Loading…".
  const { data, mutate } = useSWR<{ threads: ThreadRow[]; counts: Record<string, number>; sample?: boolean }>(key, getJson, { keepPreviousData: true, revalidateOnFocus: false, dedupingInterval: 1500 });
  // Demo replays write constantly: unless they're shown, their changes don't refetch the list.
  useLive(["threads", "messages", "escalations"], () => mutate(), 700, (e) => demo || !e.demo);

  const seen = useRef<Set<string> | null>(null);
  const fresh = useMemo(() => {
    const ids = new Set((data?.threads ?? []).map((t) => `${t.id}:${t.lastMessageAt}`));
    const prev = seen.current;
    seen.current = ids;
    if (!prev) return new Set<string>();
    return new Set([...ids].filter((x) => !prev.has(x)));
  }, [data]);

  const open = (id: string) => router.replace(`/app/inbox?t=${id}`, { scroll: false });

  return (
    <div className="grid h-[calc(100dvh-104px)] grid-cols-1 gap-5 sm:h-[calc(100dvh-120px)] lg:h-[calc(100dvh-64px)] lg:grid-cols-[360px_1fr] xl:grid-cols-[360px_1fr_300px]">
      <aside className={cx("panel flex min-h-0 flex-col overflow-hidden !p-0", selected ? "max-lg:hidden" : "")}>
        <div className="border-b border-line px-5 pb-4 pt-6">
          <h1 aria-label="Inbox" className="font-display flex gap-x-[0.26em] text-[34px] font-extrabold leading-none">
            <KineticTitle text="Inbox" />
          </h1>
          <p className="k-fade mt-2 text-[13px] text-muted" style={{ "--d": 200 } as React.CSSProperties}>Every channel, one list. Newest first.</p>
          <div className="mt-4 flex flex-wrap gap-1.5" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cx("h-7 rounded-full border px-3 text-[12px] transition-colors", filter === f.key ? "border-fg bg-fg text-bg" : "border-line-strong text-fg-2 hover:text-fg")}
              >
                {f.label}
                {data?.counts && f.key !== "all" && data.counts[f.key] ? <span className="num ml-1.5 opacity-70">{data.counts[f.key]}</span> : null}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <select value={channel ?? ""} onChange={(e) => setChannel(e.target.value || null)} className="h-8 rounded-lg border border-line bg-raised px-2 text-[12px] text-fg-2" aria-label="Channel">
              <option value="">All channels</option>
              <option value="telegram">Telegram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="simulator">Simulator</option>
            </select>
            {data?.sample ? (
              <label className="flex items-center gap-2 text-[12px] text-muted">
                <Switch checked={demo} onCheckedChange={setDemo} label="Show demo replays" />
                Demo replays
              </label>
            ) : null}
          </div>
        </div>
        {/* relative: the sr-only labels inside are absolutely positioned and would otherwise escape this scroller and stretch the page */}
        <ul className="relative min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {!data ? (
            <li className="p-5 text-[14px] text-muted">Loading…</li>
          ) : data.threads.length === 0 ? (
            <li className="p-5 text-[14px] text-muted">
              {filter === "needs" ? "Nothing needs you right now." : "No conversations yet. Message your WhatsApp or Telegram, or try the Simulator on the home page, and they appear here as they happen."}
            </li>
          ) : (
            data.threads.map((t) => (
              <li key={t.id} className={cx(fresh.has(`${t.id}:${t.lastMessageAt}`) && "row-new")}>
                <button
                  onClick={() => open(t.id)}
                  className={cx("block w-full border-b border-line px-5 py-3.5 text-left transition-colors", selected === t.id ? "bg-raised shadow-[inset_3px_0_0_var(--accent)]" : "hover:bg-raised/60")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-medium">{t.customerName ?? t.username ?? "Customer"}</span>
                    <span className="num shrink-0 text-[11px] text-muted">{ago(t.lastMessageAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <ChannelMark channel={t.channel} showLabel={false} />
                    <span className={cx("truncate text-[13px]", t.lastDirection === "in" ? "text-fg" : "text-muted")}>{t.lastPreview ?? ""}</span>
                  </div>
                  {t.status === "needs_human" || t.aiPaused || t.drafts || t.isDemo || t.routing?.source === "comment" ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {t.status === "needs_human" ? <Chip tone="signal">{t.escalation ? CATEGORY_LABEL[t.escalation.category] ?? "Needs you" : "Needs you"}</Chip> : null}
                      {t.aiPaused ? <Chip>Taken over</Chip> : null}
                      {t.drafts ? <Chip tone="brass">Draft to approve</Chip> : null}
                      {t.routing?.source === "comment" ? <Chip>From a comment</Chip> : null}
                      {t.isDemo ? <Chip>Demo replay</Chip> : null}
                    </div>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>
      {selected ? (
        <ThreadView id={selected} onBack={() => router.replace("/app/inbox", { scroll: false })} onChanged={() => mutate()} />
      ) : (
        <div className="panel hidden items-center justify-center p-10 text-center lg:flex xl:col-span-2">
          <div className="max-w-[40ch]">
            <p className="font-display text-[26px] font-bold">Pick a conversation</p>
            <p className="mt-2 text-[14px] text-muted">You&apos;ll see what the customer asked, what the AI checked before answering, and you can take over at any time.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadView({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const { data, mutate } = useSWR<Detail>(`/api/inbox/threads/${id}`, getJson, { revalidateOnFocus: false, dedupingInterval: 1000 });
  // Only changes to this chat refetch it.
  useLive(["messages", "threads", "escalations", "orders"], () => void mutate(), 300, (e) => e.thread === id || (e.t === "threads" && e.id === id));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const count = data?.messages.length ?? 0;
  // Follow new messages only when already at the bottom, and scroll this pane only (scrollIntoView moved the whole page).
  useEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [count, id]);
  useEffect(() => {
    pinned.current = true;
  }, [id]);

  async function act(action: string, extra?: Record<string, unknown>) {
    setBusy(action);
    try {
      await send(`/api/inbox/threads/${id}`, "POST", { action, ...extra });
      await mutate();
      onChanged();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  async function reply() {
    const body = text.trim();
    if (!body || busy === "reply") return;
    setBusy("reply");
    setText("");
    pinned.current = true;
    // Shown at once as "Sending…"; the real row replaces it when the server answers.
    const temp: Msg = { id: `temp-${Date.now()}`, direction: "out", author: "staff", text: body, status: "sending", createdAt: new Date().toISOString(), error: null, authorName: "You", attachments: [], run: null };
    void mutate((d) => (d ? { ...d, messages: [...d.messages, temp], thread: { ...d.thread, aiPaused: true } } : d), { revalidate: false });
    try {
      const r = await send<{ status?: string; error?: string }>(`/api/inbox/threads/${id}`, "POST", { action: "reply", text: body });
      if (r.status === "failed") toast(`Not delivered: ${r.error ?? "channel error"}`, "error");
    } catch (e) {
      setText(body);
      toast((e as Error).message, "error");
    } finally {
      await mutate();
      onChanged();
      setBusy(null);
    }
  }
  async function draft(msgId: string, action: "approve" | "discard", newText?: string) {
    setBusy(msgId);
    try {
      const r = await send<{ status?: string; error?: string }>(`/api/inbox/messages/${msgId}`, "POST", { action, text: newText });
      if (r.status === "failed") toast(`Not delivered: ${r.error ?? "channel error"}`, "error");
      await mutate();
      onChanged();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  async function eraseCustomer() {
    if (!window.confirm("Delete this customer's data? Their chats, messages and receipt files are erased for good. Orders stay for your records without their name, phone or address.")) return;
    setBusy("erase");
    try {
      await send(`/api/inbox/threads/${id}`, "DELETE");
      toast("Customer data deleted.");
      onChanged();
      router.replace("/app/inbox", { scroll: false });
    } catch (e) {
      toast((e as Error).message, "error");
      setBusy(null);
    }
  }

  if (!data) return <div className="p-8 text-[14px] text-muted">Loading conversation…</div>;
  const th = data.thread;
  const openEsc = data.escalations.filter((e) => e.status === "open");
  const name = data.customer.displayName ?? data.customer.username ?? "Customer";
  const waiting = data.orders.find((o) => o.receiptRequest && !o.receiptRequest.fulfilledAt && o.status !== "cancelled");

  return (
    <>
      <section className="panel flex min-h-0 flex-col overflow-hidden !p-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <button onClick={onBack} className="mb-1 text-[12px] text-muted hover:text-fg lg:hidden">Back to inbox</button>
            <h2 className="truncate font-display text-[22px] font-bold leading-tight">{name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <ChannelMark channel={th.channel} />
              {th.channel === "simulator" && th.accent ? <span className="text-[12px] text-muted">shown as {th.accent}</span> : null}
              {th.routing?.mode === "business" ? <Chip>Business account</Chip> : null}
              {th.status === "needs_human" ? <Chip tone="signal">Needs you</Chip> : th.status === "resolved" ? <Chip>Resolved</Chip> : null}
              {th.aiPaused ? <Chip>Taken over{th.takenOverByName ? ` by ${th.takenOverByName}` : ""}</Chip> : <Chip tone="brass">AI answering</Chip>}
              {waiting ? <Chip tone="signal">Waiting for a new receipt ({waiting.refCode})</Chip> : null}
            </div>
          </div>
          <div className="flex gap-2">
            {th.aiPaused ? (
              <Button size="sm" variant="brass" loading={busy === "release"} onClick={() => act("release")}>Hand back to AI</Button>
            ) : (
              <Button size="sm" variant="secondary" loading={busy === "takeover"} onClick={() => act("takeover")}>Take over</Button>
            )}
            {th.status !== "resolved" ? (
              <Button size="sm" variant="ghost" loading={busy === "resolve"} onClick={() => act("resolve")}>Mark resolved</Button>
            ) : (
              <Button size="sm" variant="ghost" loading={busy === "reopen"} onClick={() => act("reopen")}>Reopen</Button>
            )}
          </div>
        </header>

        {openEsc.length ? (
          <div className="border-b border-signal/40 bg-signal/[0.07] px-6 py-3">
            {openEsc.map((e) => (
              <div key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px]">
                <Chip tone="signal">{CATEGORY_LABEL[e.category] ?? e.category}</Chip>
                <span className="text-fg">{e.summary}</span>
                <span className="text-[12px] text-muted">{e.reason}, {e.priority} priority</span>
              </div>
            ))}
          </div>
        ) : null}

        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="relative min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 scrollbar-thin sm:px-8"
        >
          {data.more ? <p className="text-center text-[12px] text-muted">Showing the latest 200 messages.</p> : null}
          {data.messages.map((m) => (
            <MessageRow key={m.id} m={m} busy={busy === m.id} onApprove={(t) => draft(m.id, "approve", t)} onDiscard={() => draft(m.id, "discard")} />
          ))}
        </div>

        <form
          className="border-t border-line px-5 py-4 sm:px-8"
          onSubmit={(e) => {
            e.preventDefault();
            void reply();
          }}
        >
          <Textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void reply();
            }}
            placeholder={`Reply to ${name} as ${th.channel === "simulator" ? "staff" : "the business"}…`}
            aria-label="Reply"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[12px] text-muted">{th.aiPaused ? "The AI is paused in this conversation." : "Sending pauses the AI here until you hand it back."}</p>
            <Button type="submit" variant="primary" size="sm" loading={busy === "reply"} disabled={!text.trim()}>
              Send reply
            </Button>
          </div>
        </form>
      </section>

      <aside className="panel hidden min-h-0 overflow-y-auto px-5 py-6 scrollbar-thin xl:block">
        <h3 className="eyebrow">Customer</h3>
        <dl className="mt-2 space-y-2 text-[14px]">
          <Row k="Name" v={name} />
          {data.customer.username ? <Row k="Username" v={`@${data.customer.username}`} /> : null}
          {data.customer.phone ? <Row k="Phone" v={data.customer.phone} /> : null}
          <Row k="Language" v={data.customer.language ?? "not detected yet"} />
          <Row k="First message" v={new Date(data.customer.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short" })} />
        </dl>
        <h3 className="eyebrow mt-8">Orders from this chat</h3>
        {data.orders.length ? (
          <ul className="mt-2 space-y-2">
            {data.orders.map((o) => (
              <li key={o.id}>
                <a href={`/app/orders?o=${o.id}`} className="block rounded-xl border border-line px-3 py-2.5 hover:bg-raised">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="num text-[13px] font-semibold">{o.refCode}</span>
                    <span className="num text-[13px]">{money(o.totalMinor, o.currency)}</span>
                  </div>
                  <div className={cx("text-[12px]", o.status === "pending" ? "text-signal-ink" : "text-muted")}>
                    {o.status === "cancelled" && !o.confirmedAt ? "Rejected" : ORDER_STATUS[o.status] ?? o.status}
                    {o.receiptRequest && !o.receiptRequest.fulfilledAt && o.status !== "cancelled" ? " · new receipt requested" : ""}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-muted">None yet.</p>
        )}
        <h3 className="eyebrow mt-8">Escalations</h3>
        {data.escalations.length ? (
          <ul className="mt-2 space-y-2">
            {data.escalations.map((e) => (
              <li key={e.id} className="text-[13px]">
                <span className={e.status === "open" ? "text-signal-ink" : "text-muted"}>{CATEGORY_LABEL[e.category] ?? e.category}</span>
                <span className="text-muted">, {e.status}</span>
                <div className="text-fg-2">{e.summary}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-muted">None.</p>
        )}
        <a href={`/app/activity?thread=${th.id}`} className="mt-8 block text-[13px] text-accent underline-offset-4 hover:underline">Activity for this chat</a>
        {data.canDelete ? (
          <button onClick={eraseCustomer} disabled={busy === "erase"} className="mt-3 block text-[13px] text-signal-ink underline-offset-4 hover:underline disabled:opacity-50">
            Delete customer data
          </button>
        ) : null}
      </aside>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="truncate text-right">{v}</dd>
    </div>
  );
}

function MessageRow({ m, busy, onApprove, onDiscard }: { m: Msg; busy: boolean; onApprove: (t?: string) => void; onDiscard: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(m.text);
  const inbound = m.direction === "in";
  const draft = m.status === "pending_approval";
  const who = inbound ? null : m.author === "ai" ? "Yapoz" : m.authorName ?? "Staff";
  return (
    <div className={cx("flex", inbound ? "justify-start" : "justify-end")}>
      <div className={cx("max-w-[min(560px,85%)]", inbound ? "" : "text-right")}>
        <div
          className={cx(
            "inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-left text-[14.5px] leading-relaxed",
            inbound && "rounded-bl-md border border-line-strong bg-raised",
            !inbound && m.author === "ai" && !draft && "rounded-br-md bg-fg text-bg",
            !inbound && m.author === "staff" && "rounded-br-md bg-accent text-on-primary",
            draft && "rounded-br-md border border-dashed border-accent bg-transparent",
            m.status === "failed" && "border border-signal/60",
            m.status === "discarded" && "opacity-40 line-through",
          )}
        >
          {editing ? <Textarea rows={3} value={val} onChange={(e) => setVal(e.target.value)} className="min-w-[280px]" /> : m.text || (m.attachments[0] ? `[${m.attachments[0].kind}${m.attachments[0].name ? `: ${m.attachments[0].name}` : ""}]` : "")}
        </div>
        <div className={cx("mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted", inbound ? "" : "justify-end")}>
          {who ? <span>{who}</span> : null}
          <span className="num">{clock(m.createdAt)}</span>
          {draft ? <span className="text-accent">Draft, waiting for approval</span> : null}
          {m.status === "sending" || (m.status === "received" && !inbound) ? <span>Sending…</span> : null}
          {m.status === "failed" ? <span className="text-signal-ink">Not delivered{m.error ? `: ${m.error}` : ""}</span> : null}
          {!inbound && m.status === "sent" ? <span title={m.readAt ? "Read by the customer" : m.deliveredAt ? "Delivered to the customer's phone" : "Sent to the channel"}>{m.readAt ? "✓✓ read" : m.deliveredAt ? "✓✓ delivered" : "✓ sent"}</span> : null}
        </div>
        {m.run && m.run.tools.length ? (
          <ul className="mt-2 space-y-0.5 text-right">
            {m.run.tools.map((tc, i) => (
              <li key={i} className={cx("font-mono text-[11.5px]", tc.ok ? "text-fg-2" : "text-signal-ink")}>
                {tc.label}
              </li>
            ))}
          </ul>
        ) : null}
        {m.run ? (
          <div className="mt-1 font-mono text-[11px] text-muted">
            {m.run.model === "none" ? "AI offline: no API key on the server" : [m.run.model.replace("claude-", ""), m.run.latencyMs != null ? `${(m.run.latencyMs / 1000).toFixed(1)}s` : null, m.run.tokens ? `${(m.run.tokens / 1000).toFixed(1)}k tokens${m.run.cacheRead ? `, ${(m.run.cacheRead / 1000).toFixed(1)}k cached` : ""}` : null, m.run.intent, m.run.tools.length ? null : "answered from knowledge"].filter(Boolean).join("  /  ")}
          </div>
        ) : null}
        {draft ? (
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onDiscard} disabled={busy}>Discard</Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing((v) => !v)} disabled={busy}>{editing ? "Stop editing" : "Edit"}</Button>
            <Button size="sm" variant="brass" loading={busy} onClick={() => onApprove(editing ? val : undefined)}>Approve and send</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
