import { getSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { ROLE_HOME } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/frame";
import { SignupForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up your business · Yapoz" };

export default async function SignupPage() {
  const s = await getSession();
  if (s) redirect(ROLE_HOME[s.role]);
  return (
    <AuthFrame
      headline={<>Put a bell<br />on your <span className="accent-word text-brass">counter</span>.</>}
      lede={
        <ol className="space-y-3">
          {[
            ["Sign up", "your business and your owner account, then confirm your email."],
            ["Explain your business", "in your own words, or upload your menu or price list. Yapoz drafts the rest."],
            ["Connect", "Telegram and WhatsApp."],
            ["Go live.", "Customers get answers, orders wait for your yes, anything tricky comes to you."],
          ].map(([a, b], i) => (
            <li key={a} className="flex gap-3">
              <span className="num mt-0.5 text-[13px] text-brass">{String(i + 1).padStart(2, "0")}</span>
              <span><span className="text-paper">{a}</span> {b}</span>
            </li>
          ))}
        </ol>
      }
      footer={<>Already on Yapoz? <Link href="/login" className="text-paper underline decoration-brass underline-offset-4">Sign in</Link></>}
    >
      <SignupForm captchaSiteKey={env.turnstile.siteKey || null} />
    </AuthFrame>
  );
}
