import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/frame";
import { pendingUser } from "@/lib/verification";
import { VerifyForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify your email · Yapoz" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  const user = await pendingUser();
  if (!user) redirect("/login");
  const { failed } = await searchParams;
  return (
    <AuthFrame
      headline={<>One quick<br /><span className="accent-word text-brass">check</span>.</>}
      lede="Your account opens once we know this email is really yours. You only do this once."
      footer={<>Wrong email? <Link href="/signup" className="text-paper underline decoration-brass underline-offset-4">Sign up again</Link></>}
    >
      <VerifyForm email={user.email} sendFailed={Boolean(failed)} />
    </AuthFrame>
  );
}
