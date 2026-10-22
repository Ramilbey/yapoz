"use client";
import { useEffect, useRef, useState } from "react";
import { cx } from "../ui/cx";

type Accent = "telegram" | "whatsapp" | "instagram";
type Tool = { name: string; label: string; ok: boolean; ms: number };
type Msg = { id: string; from: "me" | "them" | "staff"; text: string; tools?: Tool[]; meta?: string; escalated?: { category: string; summary?: string }[]; pending?: boolean };

export type SampleBusiness = { id: string; name: string; type: string | null };

/** What to try with each sample business; anything else falls back to generic questions. */
const SUGGESTIONS: Record<string, string[]> = {
  FORNO7: [
    "Do you have the Margherita in large, and can I book a table for 4 at 8pm Friday?",
    "apron in red size M ada?",
    "u guys halal ah?",
    "is the truffle pizza available today?",
    "I want to discuss a franchise partnership",
    "can you write my essay about Italy",
  ],
  KASIH1: [
    "can book women's cut tmr 3pm?",
    "balayage for long hair how much",
    "open on monday?",
    "heat protect spray got stock?",
    "my colour last week came out orange, not happy",
    "can you write my essay about Italy",
  ],
};
const GENERIC = ["what do you sell?", "open on sunday?", "how much?", "can I book for tomorrow?", "I want to make a complaint"];

const ACCENTS: { key: Accent; label: string }[] = [
  { key: "telegram", label: "Telegram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
];

const CATEGORY: Record<string, string> = { partnership: "partnership", wholesale: "wholesale", complaint: "complaint", refund: "refund", allergy: "allergy", negotiation: "price negotiation", knowledge_gap: "question it couldn't answer", other: "needs a person", low_confidence: "unsure", legal: "legal", abuse: "abusive message", events_lead: "event lead", large_group: "large group" };

function sessionId(ws: string) {
  const make = () => `web_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
  try {
    const k = `jawab-sim-${ws}`;
    const v = sessionStorage.getItem(k) ?? make();
    sessionStorage.setItem(k, v);
    return v;
  } catch {
    return make();
  }
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function Simulator({ compact = false, samples = [] }: { compact?: boolean; samples?: SampleBusiness[] }) {
  const [accent, setAccent] = useState<Accent>("telegram");
  const [biz, setBiz] = useState<SampleBusiness>(samples[0] ?? { id: "FORNO7", name: "Forno Sette", type: "pizzeria" });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sid, setSid] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  useEffect(() => {
    setSid(sessionId(biz.id));
    setMsgs([]);
    setNotice(null);
    lastCount.current = 0;
  }, [biz.id]);
  const suggestions = SUGGESTIONS[biz.id] ?? GENERIC;
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, busy]);

  // Staff replies (after a takeover in the dashboard) show up here too.
  useEffect(() => {
    if (!sid || !msgs.length) return;
    const id = setInterval(async () => {
      if (document.hidden || busy) return;
      try {
        const r = await fetch(`/api/simulator/thread?sessionId=${sid}&workspace=${biz.id}`);
        const j = (await r.json()) as { messages: { id: string; author: string; text: string; direction: string }[] };
        const staff = j.messages.filter((m) => m.author === "staff");
        if (staff.length > lastCount.current) {
          const fresh = staff.slice(lastCount.current);
          lastCount.current = staff.length;
          setMsgs((m) => [...m, ...fresh.map((s) => ({ id: s.id, from: "staff" as const, text: s.text }))]);
        }
      } catch {}
    }, 4000);
    return () => clearInterval(id);
  }, [sid, msgs.length, busy, biz.id]);

  async function sendMsg(t: string) {
    const body = t.trim();
    if (!body || busy || !sid) return;
    setText("");
    setNotice(null);
    const mine: Msg = { id: `m${Date.now()}`, from: "me", text: body };
    setMsgs((m) => [...m, mine]);
    setBusy(true);
    try {
      const res = await fetch("/api/simulator/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: sid, text: body, accent, workspace: biz.id }) });
      const j = await res.json();
      if (!res.ok) {
        setNotice(j.error ?? "No answer this time. Try again.");
        return;
      }
      if (!j.aiConfigured) setNotice("The AI isn't configured on this server yet, so every message goes to the team.");
      if (j.skipped === "takeover") {
        setNotice("A team member has taken over this chat; their reply will appear here.");
        return;
      }
      const meta = [j.latencyMs != null ? `${(j.latencyMs / 1000).toFixed(1)}s` : null, j.model && j.model !== "none" ? j.model.replace("claude-", "") : null].filter(Boolean).join(", ");
      setMsgs((m) => [...m, { id: `r${Date.now()}`, from: "them", text: j.reply ?? "", tools: j.tools, meta, escalated: j.escalated, pending: j.status === "pending_approval" }]);
    } catch {
      setNotice("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const bubbleShape = {
    telegram: { me: "rounded-[18px] rounded-br-[6px]", them: "rounded-[18px] rounded-bl-[6px]" },
    whatsapp: { me: "rounded-[10px] rounded-tr-[2px]", them: "rounded-[10px] rounded-tl-[2px]" },
    instagram: { me: "rounded-[22px]", them: "rounded-[22px]" },
  }[accent];

  return (
    <div className={cx("grid gap-6", compact ? "" : "lg:grid-cols-[minmax(320px,400px)_1fr]")}>
      <div className="mx-auto w-full max-w-[400px] rounded-[38px] border border-paper/15 bg-[#151411] p-2.5 shadow-[0_40px_120px_-40px_rgba(200,160,72,0.25)]">
        <div className="flex h-[620px] max-h-[78vh] flex-col overflow-hidden rounded-[30px] bg-ink">
          <div className="flex items-center gap-3 border-b border-paper/10 px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brass font-display text-[15px] font-extrabold text-ink">{initials(biz.name)}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-medium text-paper">{biz.name}</div>
              <div className="text-[12px] text-paper/50">{busy ? "typing…" : `Simulator, shown as ${ACCENTS.find((a) => a.key === accent)?.label}`}</div>
            </div>
          </div>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4 scrollbar-thin" aria-live="polite">
            {msgs.length === 0 ? (
              <p className="mx-auto mt-10 max-w-[30ch] text-center text-[13px] text-paper/45">Ask {biz.name} anything a customer would. Pick a suggestion below or type your own.</p>
            ) : null}
            {msgs.map((m) => (
              <div key={m.id} className={cx("flex flex-col", m.from === "me" ? "items-end" : "items-start")}>
                <div className={cx("max-w-[85%] whitespace-pre-wrap px-3.5 py-2 text-[14.5px] leading-snug", m.from === "me" ? `bg-paper text-ink ${bubbleShape.me}` : m.from === "staff" ? `border border-paper/30 text-paper ${bubbleShape.them}` : `bg-[#24221d] text-paper ${bubbleShape.them}`)}>
                  {m.text}
                </div>
                {m.from === "staff" ? <span className="mt-1 text-[11px] text-paper/45">a person from the team</span> : null}
                {m.tools?.length ? (
                  <ul className="mt-1.5 space-y-0.5 pl-1">
                    {m.tools.map((t, i) => (
                      <li key={i} className={cx("font-mono text-[11px]", t.ok ? "text-answered/85" : "text-signal")}>{t.label}</li>
                    ))}
                  </ul>
                ) : null}
                {m.escalated?.length ? <span className="mt-1 pl-1 text-[11px] text-signal">Handed to the team: {CATEGORY[m.escalated[0].category] ?? m.escalated[0].category}</span> : null}
                {m.pending ? <span className="mt-1 pl-1 text-[11px] text-brass">Copilot mode: drafted, waiting for staff approval</span> : null}
                {m.meta ? <span className="mt-0.5 pl-1 font-mono text-[10.5px] text-paper/35">{m.meta}</span> : null}
              </div>
            ))}
            {busy ? (
              <div className="flex items-center gap-1 pl-2" aria-label={`${biz.name} is typing`}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper/50" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            ) : null}
          </div>
          {notice ? <p className="border-t border-paper/10 px-4 py-2 text-[12px] text-brass">{notice}</p> : null}
          <div className="flex gap-1.5 overflow-x-auto border-t border-paper/10 px-3 py-2 scrollbar-thin">
            {suggestions.map((s) => (
              <button key={s} disabled={busy} onClick={() => sendMsg(s)} className="shrink-0 rounded-full border border-paper/15 px-3 py-1.5 text-[12px] text-paper/80 hover:border-brass hover:text-paper disabled:opacity-40" data-cursor>
                {s.length > 34 ? s.slice(0, 32) + "…" : s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMsg(text);
            }}
            className="flex items-center gap-2 border-t border-paper/10 p-2.5"
          >
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Message" aria-label={`Message ${biz.name}`} className="h-10 flex-1 rounded-full bg-[#1d1b17] px-4 text-[14px] text-paper placeholder:text-paper/35 focus:outline-none focus:ring-1 focus:ring-brass" />
            <button disabled={busy || !text.trim()} className="h-10 rounded-full bg-signal px-4 text-[14px] font-semibold text-ink disabled:opacity-40" data-cursor>
              Send
            </button>
          </form>
        </div>
      </div>
      {!compact ? (
        <div className="self-center">
          {samples.length > 1 ? (
            <div className="mb-6">
              <p className="mb-2 text-[13px] text-paper/50">Sample business</p>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Sample business">
                {samples.map((b) => (
                  <button key={b.id} role="radio" aria-checked={biz.id === b.id} onClick={() => setBiz(b)} className={cx("rounded-2xl border px-4 py-3 text-left transition", biz.id === b.id ? "border-brass bg-brass/10" : "border-paper/15 hover:border-paper/40")} data-cursor>
                    <span className="block text-[15px] text-paper">{b.name}</span>
                    <span className="block text-[12.5px] capitalize text-paper/55">{b.type ?? "business"}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mb-2 text-[13px] text-paper/50">Shown as</p>
          <div className="flex gap-1 rounded-full border border-paper/15 p-1" role="radiogroup" aria-label="Show the simulator as">
            {ACCENTS.map((a) => (
              <button key={a.key} role="radio" aria-checked={accent === a.key} onClick={() => setAccent(a.key)} className={cx("h-9 flex-1 rounded-full px-4 text-[13px]", accent === a.key ? "bg-paper text-ink" : "text-paper/70 hover:text-paper")} data-cursor>
                {a.label}
              </button>
            ))}
          </div>
          <ul className="mt-8 space-y-5 text-[16px] leading-relaxed text-paper/75">
            <li><span className="text-paper">This is the real assistant.</span> Same pipeline, tools and knowledge as on Telegram, WhatsApp and Instagram; only the window is different.</li>
            <li><span className="text-paper">Every fact is checked.</span> The lines under each reply are the lookups it made: prices, stock, free slots, hours.</li>
            <li><span className="text-paper">It stays on topic.</span> Ask it for an essay and it politely declines. Complain, and it hands you to a person.</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
