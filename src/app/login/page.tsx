import { env } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "./form";
import { AuthFrame } from "@/components/auth/frame";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; ws?: string }> }) {
  const s = await getSession();
  if (s) redirect(ROLE_HOME[s.role]);
  const { next, ws } = await searchParams;
  const demo = env.demoMode ? { workspaceId: env.demoWorkspaceId, password: process.env.DEMO_PASSWORD ?? "forno7demo" } : null;
  return (
    <AuthFrame
      headline={<>One door,<br />every <span className="accent-word text-brass">desk</span>.</>}
      lede="Owners see the whole counter. Service staff get the inbox, the Needs-you queue, orders and knowledge."
      footer={<>New to Yapoz? <Link href="/signup" className="text-paper underline decoration-brass underline-offset-4">Set up your business</Link></>}
    >
      <LoginForm demo={demo} next={next ?? null} initialWorkspace={ws ?? ""} />
    </AuthFrame>
  );
}
