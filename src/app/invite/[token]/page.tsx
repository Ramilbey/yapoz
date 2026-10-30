import { db, t } from "@/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/frame";
import { AcceptForm } from "./form";

export const dynamic = "force-dynamic";

const DESK = { owner: "the owner desk (everything)", service: "the service desk (inbox, Needs you, orders and knowledge)" } as const;

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [inv] = await db
    .select({ email: t.invites.email, role: t.invites.role, ws: t.workspaces.name, wsId: t.workspaces.id })
    .from(t.invites)
    .innerJoin(t.workspaces, eq(t.workspaces.id, t.invites.workspaceId))
    .where(and(eq(t.invites.token, token), isNull(t.invites.acceptedAt), gt(t.invites.expiresAt, new Date())));
  return (
    <AuthFrame
      headline={inv ? <>Join<br /><span className="accent-word text-brass">{inv.ws}</span>.</> : <>This link<br />has <span className="accent-word text-brass">expired</span>.</>}
      lede={inv ? <>You&apos;ve been invited to {DESK[inv.role]} on Yapoz.</> : "Invites last 7 days and work once. Ask the owner for a new link."}
      footer={<Link href="/login" className="underline decoration-brass underline-offset-4">Sign in instead</Link>}
    >
      {inv ? <AcceptForm token={token} email={inv.email} workspaceId={inv.wsId} /> : <p className="text-paper/70">Nothing to do here.</p>}
    </AuthFrame>
  );
}
