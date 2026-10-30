import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { Shell } from "@/components/app/shell";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const THEME_BOOT = `try{var t=localStorage.getItem('jawab-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  const [ws] = await db.select({ name: t.workspaces.name, city: t.workspaces.city, settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const st = ws?.settings;
  const workspace = {
    id: s.workspaceId,
    name: ws?.name ?? s.workspaceId,
    city: ws?.city ?? "",
    live: Boolean(st?.live),
    setupDone: Boolean(st?.onboarding?.completedAt),
    sample: Boolean(st?.sample),
  };
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      <Shell session={s} workspace={workspace} demoMode={env.demoMode}>
        {children}
      </Shell>
    </>
  );
}
