import Link from "next/link";

/** The dark two-column frame shared by sign in, sign up and invites. */
export function AuthFrame({ headline, lede, children, footer }: { headline: React.ReactNode; lede: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink text-paper">
      <div className="mx-auto grid min-h-dvh max-w-[1200px] grid-cols-1 gap-12 px-4 py-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <section>
          <Link href="/" className="inline-flex items-center gap-2 text-[15px] text-paper/80 hover:text-paper">
            <BellGlyph /> Yapoz
          </Link>
          <h1 className="font-display mt-10 text-[clamp(44px,7vw,96px)] font-extrabold leading-[0.92]">{headline}</h1>
          <div className="mt-6 max-w-[44ch] text-[17px] leading-relaxed text-paper/70">{lede}</div>
        </section>
        <section>
          <div className="rounded-[22px] border border-paper/10 bg-[#151411] p-6 sm:p-8">{children}</div>
          {footer ? <div className="mt-4 text-center text-[14px] text-paper/55">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}

export const authField = "h-12 w-full rounded-xl border border-paper/15 bg-ink px-4 text-[15px] text-paper placeholder:text-paper/35 focus:border-brass focus:outline-none";
export const authLabel = "mb-1.5 block text-[13px] text-paper/60";
export const authButton = "h-12 w-full rounded-xl bg-signal text-[15px] font-semibold text-ink transition hover:brightness-110 disabled:opacity-60";
export const authError = "rounded-lg border border-signal/40 bg-signal/10 px-3 py-2 text-[14px] text-[#ff8a6a]";

export function BellGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden>
      <path d="M16 7.2a1.7 1.7 0 0 1 1.7 1.7v.6c4.3.8 7.3 4.6 7.3 9.2v1.1H7v-1.1c0-4.6 3-8.4 7.3-9.2v-.6A1.7 1.7 0 0 1 16 7.2Z" fill="#C8A048" />
      <rect x="5" y="21.2" width="22" height="3.2" rx="1.6" fill="#C8A048" />
    </svg>
  );
}
