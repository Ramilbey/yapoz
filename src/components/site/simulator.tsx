"use client";
import { useEffect, useRef, useState } from "react";
import { cx } from "../ui/cx";
import { Phone } from "./phones";

type Accent = "telegram" | "whatsapp";
type Tool = { name: string; label: string; ok: boolean; ms: number };
type Msg = { id: string; from: "me" | "them" | "staff"; text: string; at: string; tools?: Tool[]; meta?: string; escalated?: { category: string; summary?: string }[]; pending?: boolean };

export type SampleBusiness = { id: string; name: string; type: string | null };

/** What to try with each sample business; anything else falls back to generic questions. */
const SUGGESTIONS: Record<string, string[]> = {
  FORNO7: [
    "Do you have the Margherita in large? I'd like 2, delivered to Bangsar tonight.",
    "apron in red size M ada?",
    "u guys halal ah?",
    "is the truffle pizza available today?",
    "I want to discuss a franchise partnership",
    "can you write my essay about Italy",
  ],
  KASIH1: [
    "how much is a women's cut?",
    "balayage for long hair how much",
    "open on monday?",
    "heat protect spray got stock?",
    "my colour last week came out orange, not happy",
    "can you write my essay about Italy",
  ],
};
const GENERIC = ["what do you sell?", "open on sunday?", "how much?", "can I place an order for tomorrow?", "I want to make a complaint"];

const CATEGORY: Record<string, string> = { partnership: "partnership", wholesale: "wholesale", complaint: "complaint", refund: "refund", allergy: "allergy", negotiation: "price negotiation", knowledge_gap: "question it couldn't answer", other: "needs a person", low_confidence: "unsure", legal: "legal", abuse: "abusive message", events_lead: "event lead", large_group: "large group" };

/** The chat window dresses itself as the app you pick, so what you see is what a customer would see. */
const SKIN: Record<Accent, { label: string; bg: string; head: string; ink: string; sub: string; me: string; biz: string; staff: string; input: string; accent: string; meR: string; bizR: string; glow: string }> = {
  whatsapp: { label: "WhatsApp", bg: "#0B141A", head: "#1F2C34", ink: "#E9EDEF", sub: "#8696A0", me: "#005C4B", biz: "#202C33", staff: "#2A3942", input: "#1F2C34", accent: "#00A884", meR: "rounded-[10px] rounded-tr-[2px]", bizR: "rounded-[10px] rounded-tl-[2px]", glow: "rgba(37,211,102,0.2)" },
  telegram: { label: "Telegram", bg: "#0E1621", head: "#17212B", ink: "#F5F5F5", sub: "#6D7F8F", me: "#2B5278", biz: "#182533", staff: "#22313F", input: "#17212B", accent: "#6AB2F2", meR: "rounded-[16px] rounded-br-[4px]", bizR: "rounded-[16px] rounded-bl-[4px]", glow: "rgba(106,178,242,0.22)" },
};

function sessionId(ws: string) {
  const make = () => `web_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
  try {
    const k = `yapoz-sim-${ws}`;
    const v = sessionStorage.getItem(k) ?? make();
    sessionStorage.setItem(k, v);
    return v;
  } catch {
    return make();
  }
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const Icon = ({ k }: { k: Accent }) =>
  k === "whatsapp" ? (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
      <path d="M8 1.8 A6.2 6.2 0 1 1 3 12.4 L1.8 14.2 L2.4 11.4 A6.2 6.2 0 0 1 8 1.8 Z" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
      <path d="M14 2 L2 7.2 L6.5 8.8 L8.2 13.5 Z M6.5 8.8 L14 2" />
    </svg>
  );

export function Simulator({ samples = [] }: { compact?: boolean; samples?: SampleBusiness[] }) {
  const [accent, setAccent] = useState<Accent>("whatsapp");
  const [biz, setBiz] = useState<SampleBusiness>(samples[0] ?? { id: "FORNO7", name: "Forno Sette", type: "pizzeria" });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sid, setSid] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);
  const skin = SKIN[accent];

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
          setMsgs((m) => [...m, ...fresh.map((s) => ({ id: s.id, from: "staff" as const, text: s.text, at: clock() }))]);
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
    setMsgs((m) => [...m, { id: `m${Date.now()}`, from: "me", text: body, at: clock() }]);
    setBusy(true);
    try {
      const res = await fetch("/api/simulator/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: sid, text: body, accent, workspace: biz.id }) });
      const j = await res.json();
      if (!res.ok) {
        setNotice(j.error ?? "No answer this time. Try again.");
        return;
      }
      if (!j.aiConfigured) setNotice("This server has no AI key yet, so every message is passed to the team. Add GROQ_API_KEY or GEMINI_API_KEY to .env.local and restart to see real answers.");
      if (j.skipped === "takeover") {
        setNotice("A team member has taken over this chat; their reply will appear here.");
        return;
      }
      const meta = [j.latencyMs != null ? `${(j.latencyMs / 1000).toFixed(1)}s` : null, j.model && j.model !== "none" ? j.model.replace("claude-", "") : null].filter(Boolean).join(" · ");
      setMsgs((m) => [...m, { id: `r${Date.now()}`, from: "them", text: j.reply ?? "", at: clock(), tools: j.tools, meta, escalated: j.escalated, pending: j.status === "pending_approval" }]);
    } catch {
      setNotice("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const bubbleStyle = (who: Msg["from"]) => ({ background: who === "me" ? skin.me : who === "staff" ? skin.staff : skin.biz, color: skin.ink });

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
      <div className="mx-auto">
        <Phone className="w-[min(360px,88vw)]" glow={skin.glow}>
          <div className="flex items-center gap-2.5 px-4 pb-2.5 pt-9" style={{ background: skin.head, color: skin.ink }}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-yp-cobalt text-[13px] font-bold text-white">{initials(biz.name)}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[15px] font-medium">{biz.name}</span>
              <span className="block text-[12px]" style={{ color: busy ? skin.accent : skin.sub }}>
                {busy ? "typing…" : accent === "telegram" ? "bot" : "online"}
              </span>
            </span>
            <span className="text-[11px] uppercase tracking-wide" style={{ color: skin.sub }}>
              {skin.label}
            </span>
          </div>

          <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 scrollbar-thin" style={{ background: skin.bg }} aria-live="polite">
            {msgs.length === 0 ? (
              <p className="mx-auto mt-16 max-w-[26ch] text-center text-[14px] leading-relaxed" style={{ color: skin.sub }}>
                Ask {biz.name} anything a customer would. Tap a suggestion below, or type your own.
              </p>
            ) : null}
            {msgs.map((m) => (
              <div key={m.id} className={cx("flex flex-col", m.from === "me" ? "items-end" : "items-start")}>
                <div className={cx("max-w-[86%] whitespace-pre-wrap px-3 py-2 text-[14.5px] leading-snug", m.from === "me" ? skin.meR : skin.bizR)} style={bubbleStyle(m.from)}>
                  {m.text}
                  <span className="float-right ml-3 mt-1.5 text-[10px]" style={{ color: skin.sub }}>
                    {m.at}
                  </span>
                </div>
                {m.from === "staff" ? (
                  <span className="mt-1 text-[11px]" style={{ color: skin.sub }}>
                    a person from the team
                  </span>
                ) : null}
                {m.tools?.length ? (
                  <ul className="mt-1.5 space-y-0.5 pl-1">
                    {m.tools.map((t, i) => (
                      <li key={i} className={cx("yp-mono text-[10.5px]", t.ok ? "text-yp-mint" : "text-yp-pink")}>
                        {t.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {m.escalated?.length ? <span className="mt-1 pl-1 text-[11px] text-yp-pink">Handed to the team: {CATEGORY[m.escalated[0].category] ?? m.escalated[0].category}</span> : null}
                {m.pending ? <span className="mt-1 pl-1 text-[11px] text-yp-ice">Copilot mode: drafted, waiting for staff approval</span> : null}
                {m.meta ? (
                  <span className="yp-mono mt-0.5 pl-1 text-[10px]" style={{ color: skin.sub }}>
                    {m.meta}
                  </span>
                ) : null}
              </div>
            ))}
            {busy ? (
              <div className="flex">
                <span className={cx("yp-typing inline-flex gap-1 px-3.5 py-3", skin.bizR)} style={{ background: skin.biz }} aria-label={`${biz.name} is typing`}>
                  {[0, 1, 2].map((i) => (
                    <i key={i} className="block h-1.5 w-1.5 rounded-full" style={{ background: skin.sub }} />
                  ))}
                </span>
              </div>
            ) : null}
          </div>

          {notice ? (
            <p className="px-3 py-2 text-[11.5px] leading-snug" style={{ background: skin.bg, color: "#8DA0FF", borderTop: `1px solid ${skin.head}` }}>
              {notice}
            </p>
          ) : null}
          <div className="yp-no-scrollbar flex gap-1.5 overflow-x-auto px-3 py-2" style={{ background: skin.bg, borderTop: `1px solid ${skin.head}` }}>
            {suggestions.map((s) => (
              <button key={s} disabled={busy} onClick={() => sendMsg(s)} className="shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition hover:brightness-125 disabled:opacity-40" style={{ borderColor: skin.sub + "66", color: skin.ink }}>
                {s.length > 34 ? s.slice(0, 32) + "…" : s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMsg(text);
            }}
            className="flex items-center gap-2 px-2.5 pb-5 pt-2"
            style={{ background: skin.bg }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Message" aria-label={`Message ${biz.name}`} className="h-10 min-w-0 flex-1 rounded-full px-4 text-[14px] focus:outline-none focus:ring-1" style={{ background: skin.input, color: skin.ink, ["--tw-ring-color" as string]: skin.accent }} />
            <button disabled={busy || !text.trim()} className="grid h-10 shrink-0 place-items-center rounded-full px-4 text-[14px] font-semibold text-white transition disabled:opacity-40" style={{ background: skin.accent }} aria-label="Send">
              Send
            </button>
          </form>
        </Phone>
      </div>

      <div className="flex flex-col gap-8 self-center">
        {samples.length > 1 ? (
          <div>
            <p className="yp-mono mb-3 text-[11px] uppercase text-yp-smoke">1 · Pick a business</p>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Sample business">
              {samples.map((b) => (
                <button key={b.id} role="radio" aria-checked={biz.id === b.id} onClick={() => setBiz(b)} className={cx("flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition", biz.id === b.id ? "border-yp-mint bg-yp-mint/10" : "border-yp-line2 hover:border-yp-smoke")}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yp-cobalt text-[13px] font-bold text-white">{initials(b.name)}</span>
                  <span>
                    <span className="block text-[16px] text-yp-frost">{b.name}</span>
                    <span className="block text-[13px] capitalize text-yp-smoke">{b.type ?? "business"}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="yp-mono mb-3 text-[11px] uppercase text-yp-smoke">2 · See it as your customer would</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Show the chat as">
            {(Object.keys(SKIN) as Accent[]).map((k) => (
              <button key={k} role="radio" aria-checked={accent === k} onClick={() => setAccent(k)} className={cx("flex h-12 items-center justify-center gap-2 rounded-2xl border text-[14px] transition", accent === k ? "border-yp-frost bg-yp-frost font-medium text-yp-ink" : "border-yp-line2 text-yp-fog hover:border-yp-smoke hover:text-yp-frost")}>
                <Icon k={k} />
                {SKIN[k].label}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            ["This is the real assistant.", "Same pipeline, tools and knowledge as on WhatsApp and Telegram. Only the window is different."],
            ["Every fact is checked.", "The green lines under each reply are the lookups it made: prices, stock, options, hours."],
            ["It stays on topic.", "Ask it for an essay and it politely declines. Complain, and it hands you to a person."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-2xl border border-yp-line bg-yp-panel px-4 py-3.5">
              <p className="text-[15px] font-medium text-yp-frost">{t}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-yp-fog">{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
