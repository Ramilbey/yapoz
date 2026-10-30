import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { Shell } from "@/components/app/shell";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { Martian_Mono } from "next/font/google";

export const dynamic = "force-dynamic";

// The user picks dark or light. First visit follows the system setting; the choice is remembered.
const THEME_BOOT = `try{var t=localStorage.getItem('jawab-theme');if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}`;

// Martian Mono for numbers, codes and times inside the app (the landing page already loads it).
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap" });
const MONO_STACK = { "--font-mono": 'var(--font-martian), "JetBrains Mono Variable", ui-monospace, monospace' } as React.CSSProperties;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  const [ws] = await db.select({ name: t.workspaces.name, city: t.workspaces.city, settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const st = ws?.settings;
  const workspace = {
    id: s.workspaceId,
    name: ws?.name ?? s.workspaceId,
    city: ws?.city ?? "",
    hiring: Boolean(st?.modules?.hiring),
    live: Boolean(st?.live),
    setupDone: Boolean(st?.onboarding?.completedAt),
    sample: Boolean(st?.sample),
  };
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      <div className={martian.variable} style={MONO_STACK}>
        <Shell session={s} workspace={workspace} demoMode={env.demoMode}>
          {children}
        </Shell>
      </div>
    </>
  );
}
