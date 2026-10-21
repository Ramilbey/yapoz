"use client";
import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { cx } from "@/components/ui/cx";

type Line = { who: "me" | "ai" | "note"; text: string; meta?: string };
type Reply = { reply: string | null; skipped: string | null; tools: { name: string; label?: string; ok: boolean }[]; escalated: { category?: string; reason?: string }[]; booking: { refCode?: string } | null; latencyMs: number | null; aiConfigured: boolean; error?: string };

/** Talks to the owner's own assistant through the simulator channel (same pipeline as real customers). */
export function TestChat({ suggestions }: { suggestions: string[] }) {
  const [sessionId] = useState(() => `setup-${Math.random().toString(36).slice(2, 12)}`);
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), [lines]);

  async function ask(q: string) {
    const msg = q.trim();
    if (!msg || busy) return;
    setText("");
    setBusy(true);
    setLines((l) => [...l, { who: "me", text: msg }]);
    try {
      const res = await fetch("/api/simulator/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, text: msg, accent: "whatsapp" }) });
      const r = (await res.json()) as Reply;
      if (!res.ok) throw new Error(r.error ?? "Something went wrong");
      const meta = [r.tools?.length ? `looked up: ${r.tools.map((x) => x.label ?? x.name).join(", ")}` : null, r.latencyMs ? `${(r.latencyMs / 1000).toFixed(1)}s` : null].filter(Boolean).join(" · ");
      if (r.reply) setLines((l) => [...l, { who: "ai", text: r.reply!, meta }]);
      if (r.escalated?.length) setLines((l) => [...l, { who: "note", text: `Sent to Needs you${r.escalated[0].category ? ` (${r.escalated[0].category})` : ""}: a person on your team would take this one.` }]);
      if (r.booking?.refCode) setLines((l) => [...l, { who: "note", text: `Test booking ${r.booking!.refCode} created. You can cancel it in Bookings.` }]);
      if (!r.reply && !r.escalated?.length) setLines((l) => [...l, { who: "note", text: r.skipped ? `No reply (${r.skipped}).` : "No reply." }]);
    } catch (e) {
      setLines((l) => [...l, { who: "note", text: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-[14px] font-medium">Test chat</span>
        <Chip>Simulator: nothing goes to real customers</Chip>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin">
        {!lines.length ? <p className="text-[13.5px] text-muted">Ask what your customers ask. Try a price, a booking for tomorrow, something you don&apos;t sell, or a complaint.</p> : null}
        {lines.map((l, i) =>
          l.who === "note" ? (
            <p key={i} className="text-center text-[12.5px] text-muted">
              {l.text}
            </p>
          ) : (
            <div key={i} className={cx("flex", l.who === "me" ? "justify-end" : "justify-start")}>
              <div className={cx("max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug", l.who === "me" ? "rounded-br-sm bg-fg text-bg" : "rounded-bl-sm border border-line bg-raised")}>
                <p className="whitespace-pre-wrap">{l.text}</p>
                {l.meta ? <p className="mt-1 text-[11.5px] text-muted">{l.meta}</p> : null}
              </div>
            </div>
          ),
        )}
        {busy ? <p className="text-[12.5px] text-muted">Typing…</p> : null}
        <div ref={end} />
      </div>
      {suggestions.length ? (
        <div className="flex gap-1.5 overflow-x-auto border-t border-line px-3 py-2 scrollbar-thin">
          {suggestions.map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => ask(s)} className="h-7 shrink-0 rounded-full border border-line px-3 text-[12.5px] text-fg-2 hover:border-line-strong hover:text-fg disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(text);
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message as a customer…" aria-label="Message" className="h-10 flex-1 rounded-[10px] border border-line bg-raised px-3 text-[14px] focus:border-brass focus:outline-none" maxLength={500} />
        <button disabled={busy || !text.trim()} className="h-10 rounded-[10px] bg-signal px-4 text-[14px] font-medium text-ink disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}
