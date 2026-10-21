import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/frame";
import { SignupForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up your business · Jawab" };

export default async function SignupPage() {
  const s = await getSession();
  if (s) redirect(s.role === "owner" ? "/app/setup" : "/app");
  return (
    <AuthFrame
      headline={<>Put a bell<br />on your <span className="accent-word text-brass">counter</span>.</>}
      lede={
        <ol className="space-y-3">
          {[
            ["Sign up", "your business and your owner account."],
            ["Explain your business", "in your own words, or upload your menu or price list. Jawab drafts the rest."],
            ["Connect", "Telegram, WhatsApp and Instagram."],
            ["Go live.", "Customers get answers, bookings land in your diary, anything tricky comes to you."],
          ].map(([a, b], i) => (
            <li key={a} className="flex gap-3">
              <span className="num mt-0.5 text-[13px] text-brass">{String(i + 1).padStart(2, "0")}</span>
              <span><span className="text-paper">{a}</span> {b}</span>
            </li>
          ))}
        </ol>
      }
      footer={<>Already on Jawab? <Link href="/login" className="text-paper underline decoration-brass underline-offset-4">Sign in</Link></>}
    >
      <SignupForm />
    </AuthFrame>
  );
}
