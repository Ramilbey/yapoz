import { cx } from "./cx";

type Tone = "neutral" | "brass" | "signal" | "answered" | "solid";
const tones: Record<Tone, string> = {
  neutral: "border-line-strong text-fg-2",
  brass: "border-brass/60 text-brass-ink bg-brass/10",
  signal: "border-signal/50 text-signal-ink bg-signal/10",
  answered: "border-answered-ink/40 text-answered-ink bg-answered/15",
  solid: "border-transparent bg-fg text-bg",
};

export function Chip({ tone = "neutral", className, children, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span className={cx("inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-[12px] leading-none whitespace-nowrap", tones[tone], className)} {...p}>
      {children}
    </span>
  );
}

export const CHANNEL_LABEL: Record<string, string> = { telegram: "Telegram", whatsapp: "WhatsApp", simulator: "Simulator" };

/** Our own channel glyphs (a letter in a ring), not the platforms' logos or colours. */
export function ChannelMark({ channel, className, showLabel = true }: { channel: string; className?: string; showLabel?: boolean }) {
  const label = CHANNEL_LABEL[channel] ?? channel;
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[12px] text-fg-2", className)} title={label}>
      <span aria-hidden className="grid h-[18px] w-[18px] place-items-center rounded-full border border-line-strong font-mono text-[10px] font-semibold leading-none text-fg">
        {channel === "simulator" ? "S" : label[0]}
      </span>
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}
