import { requireSession } from "@/lib/auth";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/app/shell";
import { EnableHiring } from "@/components/app/enable-hiring";

export const dynamic = "force-dynamic";

/** Hiring is an optional module: when it's off, the section explains itself instead of showing empty pages. */
export default async function HiringLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession(["owner", "hr"]);
  const [ws] = await db.select({ settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  if (ws?.settings.modules?.hiring) return <>{children}</>;
  return (
    <div>
      <PageHeader title="Hiring" description="Optional. Post a role, collect applications through your Telegram bot or uploaded CVs, and let Jawab shortlist and book interviews." />
      <div className="max-w-[60ch] space-y-4 text-[15px]">
        <p>Hiring is switched off for this business.</p>
        <ul className="list-disc space-y-1 pl-5 text-fg-2">
          <li>Candidates apply through your Telegram bot with /apply, or you upload CVs and spreadsheets.</li>
          <li>Claude reads every CV against the role and explains its ranking.</li>
          <li>You approve each invite before it goes out; candidates pick an interview slot in the chat.</li>
        </ul>
        {s.role === "owner" ? <EnableHiring /> : <p className="text-muted">Ask the owner to turn it on in Settings.</p>}
      </div>
    </div>
  );
}
