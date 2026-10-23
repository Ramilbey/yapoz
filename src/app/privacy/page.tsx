import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy · Yapoz", description: "What Yapoz does with the messages and details it handles for businesses and their customers." };

const sections: { id?: string; title: string; body: React.ReactNode }[] = [
  {
    title: "Who we are",
    body: (
      <>
        Yapoz is an AI front desk that answers a business&apos;s customer messages on WhatsApp, Telegram, Instagram and its website. It is a prototype built for the SDC Hackathon; the
        sample businesses on this site and their customers are made up. Each business that signs up decides what its assistant knows and is responsible for its own customers&apos; data.
      </>
    ),
  },
  {
    title: "What we handle",
    body: (
      <>
        The messages you send to a business that uses Yapoz, and the name, username or phone number the messaging app shares with them; bookings you make; and, if you apply for a job
        through Yapoz, the CV and details you send with your consent. Businesses add their own products, prices, hours and policies.
      </>
    ),
  },
  {
    title: "Why",
    body: (
      <>
        Only to answer your questions and handle your requests on that business&apos;s behalf, hand anything sensitive to its staff, and show the business what customers ask about. We
        don&apos;t sell data or use it for advertising.
      </>
    ),
  },
  {
    title: "Who else sees it",
    body: (
      <>
        The business&apos;s own staff, according to their role. To write replies, the text of a conversation is sent to the AI providers the service uses (currently Groq and Google
        Gemini). Messages travel through the messaging app you chose (Meta for WhatsApp and Instagram, Telegram), under that app&apos;s own terms.
      </>
    ),
  },
  {
    title: "How long, and how it's protected",
    body: (
      <>
        Conversations stay while the business uses Yapoz. CVs are deleted automatically after the business&apos;s retention period (180 days unless it sets another). Access tokens for
        a business&apos;s messaging accounts are stored encrypted and are never shown in the browser.
      </>
    ),
  },
  {
    id: "delete",
    title: "Seeing or deleting your data",
    body: (
      <>
        Ask the business you messaged to show you or delete what it holds about you. Job applicants on Telegram can also send{" "}
        <span className="num">/delete_my_data</span> to the bot to remove their application and CV straight away.
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <main className="min-h-dvh bg-ink px-4 py-12 text-paper sm:px-12 sm:py-16">
      <div className="mx-auto max-w-[68ch]">
        <Link href="/" className="text-[14px] text-paper/60 underline-offset-4 hover:underline">
          ← Yapoz
        </Link>
        <h1 className="mt-6 text-[clamp(32px,6vw,52px)] font-semibold leading-[1.05]">Privacy</h1>
        <p className="mt-4 text-[17px] text-paper/70">What Yapoz does with the messages and details it handles for businesses and their customers.</p>
        {sections.map((s) => (
          <section key={s.title} id={s.id} className="mt-10">
            <h2 className="text-[20px] font-semibold">{s.title}</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-paper/80">{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
