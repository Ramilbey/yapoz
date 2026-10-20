import Link from "next/link";

export default function NotFound() {
  return (
    <main data-theme="dark" className="flex min-h-dvh flex-col items-start justify-end bg-ink p-6 text-paper sm:p-12">
      <p className="num text-[clamp(80px,16vw,220px)] leading-[0.8] text-paper/90">404</p>
      <p className="mt-6 max-w-[40ch] text-[18px] text-paper/70">Nobody rang this bell. The page you asked for doesn&apos;t exist.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-full bg-signal px-5 text-[15px] font-semibold text-ink">Back to the counter</Link>
        <Link href="/login" className="inline-flex h-11 items-center rounded-full border border-paper/30 px-5 text-[15px]">Sign in</Link>
      </div>
    </main>
  );
}
