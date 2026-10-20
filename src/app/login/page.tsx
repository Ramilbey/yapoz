import { env } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/session";
import { redirect } from "next/navigation";
import { LoginForm } from "./form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const s = await getSession();
  if (s) redirect(ROLE_HOME[s.role]);
  const { next } = await searchParams;
  const demo = env.demoMode ? { workspaceId: env.demoWorkspaceId, password: process.env.DEMO_PASSWORD ?? "forno7demo" } : null;
  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink text-paper">
      <div className="mx-auto grid min-h-dvh max-w-[1200px] grid-cols-1 gap-12 px-4 py-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <section>
          <Link href="/" className="inline-flex items-center gap-2 text-[15px] text-paper/80 hover:text-paper">
            <BellGlyph /> Jawab
          </Link>
          <h1 className="font-display mt-10 text-[clamp(44px,7vw,96px)] font-extrabold leading-[0.92]">
            One door,
            <br />
            every <span className="accent-word text-brass">desk</span>.
          </h1>
          <p className="mt-6 max-w-[44ch] text-[17px] leading-relaxed text-paper/70">
            Owners see the whole counter. Service staff get the inbox and the Needs-you queue. HR gets hiring, and nothing else.
          </p>
        </section>
        <section className="rounded-[22px] border border-paper/10 bg-[#151411] p-6 sm:p-8">
          <LoginForm demo={demo} next={next ?? null} />
        </section>
      </div>
    </main>
  );
}

function BellGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden>
      <path d="M16 7.2a1.7 1.7 0 0 1 1.7 1.7v.6c4.3.8 7.3 4.6 7.3 9.2v1.1H7v-1.1c0-4.6 3-8.4 7.3-9.2v-.6A1.7 1.7 0 0 1 16 7.2Z" fill="#C8A048" />
      <rect x="5" y="21.2" width="22" height="3.2" rx="1.6" fill="#C8A048" />
    </svg>
  );
}
