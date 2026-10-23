import type { ReactNode } from "react";
import { cx } from "../ui/cx";

// Faithful-enough dark-mode chat screens for WhatsApp, Telegram and Instagram, as the customer sees them.
// Every message is a `.msg` row and every "typing" bubble a `.typing-row`, so the page's timelines can type them in.

export type Chat = "whatsapp" | "telegram" | "instagram";
type Line = { who: "me" | "biz"; text: string; at: string };

export const THREADS: Record<Chat, { name: string; sub: string; lines: Line[] }> = {
  whatsapp: {
    name: "Forno Sette",
    sub: "online",
    lines: [
      { who: "me", text: "hi, are you open Sunday?", at: "23:46" },
      { who: "biz", text: "Hi! Yes: on Sundays we're open 11:00 to 22:00, and the kitchen takes last orders at 21:30. Would you like a table, or an order for pickup?", at: "23:46" },
      { who: "me", text: "table for 4, 7pm", at: "23:47" },
      { who: "biz", text: "Sunday 19:00 for 4 is free. What name should I put it under?", at: "23:47" },
      { who: "me", text: "Daniel", at: "23:47" },
      { who: "biz", text: "Booked: Daniel, 4 people, Sunday 19:00. Your reference is F7-2K9M. See you then!", at: "23:47" },
    ],
  },
  telegram: {
    name: "Forno Sette",
    sub: "bot",
    lines: [
      { who: "me", text: "how much is a large Margherita?", at: "23:41" },
      { who: "biz", text: "A large Margherita (15\") is RM 52. Shall I start an order?", at: "23:41" },
      { who: "me", text: "yes, plus a large Diavola", at: "23:42" },
      { who: "biz", text: "1 × Large Margherita RM 52 and 1 × Large Diavola RM 62: RM 114. Pickup or delivery?", at: "23:42" },
      { who: "me", text: "delivery to Bangsar", at: "23:42" },
      { who: "biz", text: "Bangsar is in our delivery zone: RM 5, about 30–40 minutes. What address, and who is it for? Then I'll send it to the team to confirm.", at: "23:42" },
    ],
  },
  instagram: {
    name: "forno.sette",
    sub: "Active now",
    lines: [
      { who: "me", text: "the apron in red size M ada?", at: "23:38" },
      { who: "biz", text: "Yes! The Forno Sette canvas apron in Brick Red, size M: 6 in stock, RM 69.", at: "23:38" },
      { who: "me", text: "can u deliver it with my pizza order", at: "23:39" },
      { who: "biz", text: "Of course. I'll add it to the same order so it arrives together. Want me to do that?", at: "23:39" },
      { who: "me", text: "yes pls", at: "23:39" },
    ],
  },
};

const Ticks = ({ color }: { color: string }) => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 6l3 3 6-7.5M6 8.5l.7.8L13 1.5" />
  </svg>
);

const StatusBar = ({ tone = "#E9EDEF" }: { tone?: string }) => (
  <div className="flex items-center justify-between px-5 pb-1 pt-2 text-[10.5px] font-semibold" style={{ color: tone }}>
    <span>23:47</span>
    <span className="flex items-center gap-1" aria-hidden>
      <svg width="15" height="10" viewBox="0 0 15 10" fill={tone}>
        <rect x="0" y="6" width="2.4" height="4" rx=".6" />
        <rect x="4" y="4" width="2.4" height="6" rx=".6" />
        <rect x="8" y="2" width="2.4" height="8" rx=".6" />
        <rect x="12" y="0" width="2.4" height="10" rx=".6" opacity=".4" />
      </svg>
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke={tone} strokeWidth="1">
        <rect x=".5" y=".5" width="18" height="9" rx="2.4" />
        <rect x="2" y="2" width="12" height="6" rx="1.2" fill={tone} stroke="none" />
        <rect x="19.6" y="3.2" width="1.6" height="3.6" rx=".8" fill={tone} stroke="none" />
      </svg>
    </span>
  </div>
);

/** The device: a rounded body, a thin bezel and a pill camera. Children are the screen. Callers set the width. */
export function Phone({ children, className, glow }: { children: ReactNode; className?: string; glow?: string }) {
  return (
    <div className={cx("relative aspect-[9/18.6] shrink-0 rounded-[40px] border border-[#2c3752] bg-[#05070c] p-[7px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)]", className)} style={glow ? { boxShadow: `0 50px 120px -30px rgba(0,0,0,.9), 0 0 80px -20px ${glow}` } : undefined}>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[33px] bg-black">
        <div className="absolute left-1/2 top-[7px] z-10 h-[15px] w-[74px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
        {children}
      </div>
    </div>
  );
}

const Typing = ({ bg, dot }: { bg: string; dot: string }) => (
  <div className="typing-row overflow-hidden">
    <div className="yp-typing inline-flex gap-1 rounded-2xl px-3 py-2.5" style={{ background: bg }}>
      {[0, 1, 2].map((i) => (
        <i key={i} className="block h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      ))}
    </div>
  </div>
);

export function WhatsAppChat({ className }: { className?: string }) {
  const t = THREADS.whatsapp;
  return (
    <Phone className={className} glow="rgba(37,211,102,0.18)">
      <StatusBar />
      <div className="flex items-center gap-2.5 bg-[#1F2C34] px-3 pb-2.5 pt-2 text-[#E9EDEF]">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#E9EDEF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 3L5 9l6 6" />
        </svg>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#3F5BFF] text-[12px] font-bold">FS</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[14px] font-medium">{t.name}</span>
          <span className="block text-[11px] text-[#8696A0]">{t.sub}</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#E9EDEF" strokeWidth="1.6" aria-hidden>
          <rect x="1.5" y="4.5" width="10" height="9" rx="2" />
          <path d="M11.5 8l5-3v8l-5-3" />
        </svg>
        <svg width="4" height="16" viewBox="0 0 4 16" fill="#E9EDEF" aria-hidden>
          <circle cx="2" cy="2" r="1.6" />
          <circle cx="2" cy="8" r="1.6" />
          <circle cx="2" cy="14" r="1.6" />
        </svg>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden bg-[#0B141A] px-2.5 py-2.5 [background-image:radial-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="mx-auto mb-1 rounded-md bg-[#182229] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#8696A0]">Today</div>
        {t.lines.map((l, i) => (
          <div key={i} className="contents">
            {l.who === "biz" ? <Typing bg="#202C33" dot="#8696A0" /> : null}
            <div className={cx("msg overflow-hidden", l.who === "me" ? "self-end" : "self-start")} style={{ maxWidth: "86%" }}>
              <div className={cx("px-2.5 py-1.5 text-[12.5px] leading-snug text-[#E9EDEF]", l.who === "me" ? "rounded-[9px] rounded-tr-[2px] bg-[#005C4B]" : "rounded-[9px] rounded-tl-[2px] bg-[#202C33]")}>
                {l.text}
                <span className="float-right ml-2 mt-1.5 flex items-center gap-1 text-[9.5px] text-[#8696A0]">
                  {l.at}
                  {l.who === "me" ? <Ticks color="#53BDEB" /> : null}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-[#0B141A] px-2 pb-3 pt-1.5">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-[#1F2C34] px-3 text-[12.5px] text-[#8696A0]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8696A0" strokeWidth="1.4" aria-hidden>
            <circle cx="8" cy="8" r="6.2" />
            <path d="M5.4 9.6c.7 1.2 1.7 1.7 2.6 1.7s1.9-.5 2.6-1.7" strokeLinecap="round" />
            <circle cx="5.9" cy="6.5" r=".6" fill="#8696A0" />
            <circle cx="10.1" cy="6.5" r=".6" fill="#8696A0" />
          </svg>
          Message
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#00A884]" aria-hidden>
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="#0B141A" strokeWidth="1.6" strokeLinecap="round">
            <rect x="4.5" y="1" width="5" height="9" rx="2.5" fill="#0B141A" />
            <path d="M1.5 7.5a5.5 5.5 0 0 0 11 0M7 13v2.5" />
          </svg>
        </span>
      </div>
    </Phone>
  );
}

export function TelegramChat({ className }: { className?: string }) {
  const t = THREADS.telegram;
  return (
    <Phone className={className} glow="rgba(106,178,242,0.2)">
      <StatusBar tone="#F5F5F5" />
      <div className="flex items-center gap-2.5 bg-[#17212B] px-3 pb-2.5 pt-2 text-[#F5F5F5]">
        <span className="flex items-center gap-1 text-[#6AB2F2]">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#6AB2F2" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 3L5 9l6 6" />
          </svg>
          <span className="rounded-full bg-[#2B5278] px-1.5 text-[10px] font-semibold text-white">3</span>
        </span>
        <span className="min-w-0 flex-1 text-center leading-tight">
          <span className="block truncate text-[14px] font-medium">{t.name}</span>
          <span className="block text-[11px] text-[#6D7F8F]">{t.sub}</span>
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#4E6BFF] to-[#2CF5BB] text-[12px] font-bold text-[#06080E]">FS</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden bg-[#0E1621] px-2.5 py-2.5 [background-image:radial-gradient(circle_at_20%_10%,rgba(63,91,255,0.12),transparent_55%),radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:auto,18px_18px]">
        {t.lines.map((l, i) => (
          <div key={i} className="contents">
            {l.who === "biz" ? <Typing bg="#182533" dot="#6D7F8F" /> : null}
            <div className={cx("msg overflow-hidden", l.who === "me" ? "self-end" : "self-start")} style={{ maxWidth: "86%" }}>
              <div className={cx("px-2.5 py-1.5 text-[12.5px] leading-snug text-[#F5F5F5]", l.who === "me" ? "rounded-[14px] rounded-br-[4px] bg-[#2B5278]" : "rounded-[14px] rounded-bl-[4px] bg-[#182533]")}>
                {l.text}
                <span className="float-right ml-2 mt-1.5 flex items-center gap-1 text-[9.5px] text-[#6D7F8F]">
                  {l.at}
                  {l.who === "me" ? <Ticks color="#6AB2F2" /> : null}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-[#17212B] px-3 pb-3 pt-2 text-[12.5px] text-[#6D7F8F]">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#6D7F8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14.5 8.2l-5.6 5.6a3.2 3.2 0 0 1-4.5-4.5l6-6a2.1 2.1 0 0 1 3 3l-6 6a1.1 1.1 0 0 1-1.5-1.5l5.4-5.4" />
        </svg>
        <span className="flex-1">Message</span>
        <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="#6D7F8F" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <rect x="5" y="1.5" width="6" height="9.5" rx="3" />
          <path d="M2 8.5a6 6 0 0 0 12 0M8 14.5v2" />
        </svg>
      </div>
    </Phone>
  );
}

export function InstagramChat({ className }: { className?: string }) {
  const t = THREADS.instagram;
  return (
    <Phone className={className} glow="rgba(160,90,255,0.2)">
      <StatusBar tone="#fff" />
      <div className="flex items-center gap-2.5 border-b border-[#262626] bg-black px-3 pb-2.5 pt-2 text-white">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 3L5 9l6 6" />
        </svg>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-[#7B3FF2] via-[#D62976] to-[#3B82F6] p-[2px]">
          <span className="grid h-full w-full place-items-center rounded-full bg-black text-[11px] font-bold">FS</span>
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13.5px] font-semibold">{t.name}</span>
          <span className="block text-[11px] text-[#A8A8A8]">{t.sub}</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
          <path d="M4 2.5l2.4 3-1.5 1.7a9 9 0 0 0 4 4l1.7-1.5 3 2.4-1.2 2.5c-6 .5-11.2-4.7-10.7-10.7z" />
        </svg>
        <svg width="20" height="18" viewBox="0 0 20 18" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
          <rect x="1.5" y="4" width="11.5" height="10" rx="2.6" />
          <path d="M13 8l5-3v8l-5-3" />
        </svg>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden bg-black px-2.5 py-2.5">
        {t.lines.map((l, i) => (
          <div key={i} className="contents">
            {l.who === "biz" ? <Typing bg="#262626" dot="#A8A8A8" /> : null}
            <div className={cx("msg overflow-hidden", l.who === "me" ? "self-end" : "self-start")} style={{ maxWidth: "84%" }}>
              <div className={cx("px-3 py-2 text-[12.5px] leading-snug text-white", l.who === "me" ? "rounded-[20px] bg-gradient-to-b from-[#7B3FF2] to-[#3B82F6]" : "rounded-[20px] bg-[#262626]")}>{l.text}</div>
            </div>
          </div>
        ))}
        <div className="msg self-end pr-1 text-[10px] text-[#A8A8A8]">Seen</div>
      </div>
      <div className="flex items-center gap-2 bg-black px-2.5 pb-3 pt-1.5">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-full border border-[#363636] pl-1 pr-3 text-[12.5px] text-[#A8A8A8]">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3B82F6]" aria-hidden>
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round">
              <path d="M1.5 3.5h2l1-1.8h4l1 1.8h2v7h-10z" />
              <circle cx="7" cy="7" r="2" />
            </svg>
          </span>
          Message...
        </div>
      </div>
    </Phone>
  );
}

const LIST = [
  ["Aisha Rahman", "got slot tmr 3pm?", "23:47", 7, "#3F5BFF"],
  ["+60 12-4•• ••81", "large margherita how much", "23:46", 3, "#8DA0FF"],
  ["jun.wei", "size M in red ada?", "23:44", 12, "#2CF5BB"],
  ["Kavitha S.", "deliver to mont kiara?", "23:41", 2, "#FF4DA6"],
  ["Hakim", "how much for keratin", "23:39", 5, "#3F5BFF"],
  ["melissa.eats", "open on monday?", "23:33", 9, "#8DA0FF"],
  ["Sharon Lee", "room for 2 this sat?", "23:30", 1, "#2CF5BB"],
  ["Ganesh", "table for 6 sat", "23:22", 4, "#FF4DA6"],
  ["Nur Amira", "can cancel my booking", "23:15", 6, "#3F5BFF"],
] as const;

/** The WhatsApp inbox on a bad evening: every row has an unread badge that counts up (`.pile-badge[data-n]`). */
export function ChatList({ className, lite }: { className?: string; lite?: boolean }) {
  return (
    <Phone className={className} glow="rgba(37,211,102,0.16)">
      <StatusBar />
      <div className="flex items-center justify-between bg-[#0B141A] px-4 pb-1.5 pt-2 text-[#E9EDEF]">
        <span className="text-[19px] font-semibold tracking-tight">WhatsApp</span>
        <span className="flex gap-3.5" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#E9EDEF" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M2 5.5h2.2l1.2-2h5.2l1.2 2H14a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 14 14.5H4A1.5 1.5 0 0 1 2.5 13V7" />
            <circle cx="9" cy="9.6" r="2.6" />
          </svg>
          <svg width="4" height="16" viewBox="0 0 4 16" fill="#E9EDEF">
            <circle cx="2" cy="2" r="1.6" />
            <circle cx="2" cy="8" r="1.6" />
            <circle cx="2" cy="14" r="1.6" />
          </svg>
        </span>
      </div>
      <div className="flex gap-1.5 bg-[#0B141A] px-3 pb-2 pt-1 text-[11.5px]">
        <span className="rounded-full bg-[#103629] px-2.5 py-1 font-medium text-[#25D366]">All</span>
        <span className="rounded-full bg-[#1F2C34] px-2.5 py-1 text-[#8696A0]">Unread 148</span>
        <span className="rounded-full bg-[#1F2C34] px-2.5 py-1 text-[#8696A0]">Groups</span>
      </div>
      <ul className="min-h-0 flex-1 overflow-hidden bg-[#0B141A]">
        {LIST.map(([name, preview, time, n, hue]) => (
          <li key={name} className="pile-row flex items-center gap-2.5 px-3 py-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-bold text-[#06080E]" style={{ background: hue }}>
              {name.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase() || "#"}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13.5px] font-medium text-[#E9EDEF]">{name}</span>
                <span className="shrink-0 text-[10px] text-[#25D366]">{time}</span>
              </span>
              <span className="mt-0.5 flex items-center justify-between gap-2">
                <span className="truncate text-[12px] text-[#8696A0]">{preview}</span>
                <span className="pile-badge grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-[#25D366] px-1 text-[10px] font-bold text-[#0B141A]" data-n={n}>
                  {lite ? n : 0}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Phone>
  );
}
