import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy · Yapoz",
  description: "Plain-language notes on what Yapoz keeps, who can see it, and how to get it deleted.",
};

const sections: { id?: string; title: string; body: React.ReactNode }[] = [
  {
    title: "What Yapoz is",
    body: (
      <>
        Yapoz helps a home-food seller answer customer messages on WhatsApp and Telegram, take orders, and check payment receipts. The seller owns the shop, the customers and the
        chats. Yapoz stores them for the seller and does not use them for its own purposes. This page is a plain explanation, not a legal contract, and it has not been certified or
        audited by anyone.
      </>
    ),
  },
  {
    title: "What we keep",
    body: (
      <>
        Customer messages and the name, username or phone number the chat app gives us. Orders: what was ordered, the total, and any name, phone and address the customer gave for
        delivery. Receipt photos or PDFs that customers send as proof of payment, plus what Yapoz read from them. For the seller: their email, name and shop details.
      </>
    ),
  },
  {
    title: "Why we keep it",
    body: (
      <>
        To reply to customers, take orders, check receipts, and show the seller what is going on. We found no advertising or data-selling code in Yapoz. We do not sell customer data.
      </>
    ),
  },
  {
    title: "Who can see it",
    body: (
      <>
        Each shop sees only its own data. Inside a shop there are two roles. The <strong>owner</strong> can see everything, change settings, download all the data and delete a
        customer&apos;s data. A <strong>service</strong> team member can work with orders, the calendar, chats and the shop&apos;s knowledge, but cannot open Settings, download the full
        data or delete customers. The people who run this Yapoz server can also reach the database. How many people that is, and how they are controlled, depends on how this
        deployment is set up.
      </>
    ),
  },
  {
    title: "AI helpers (this part matters)",
    body: (
      <>
        To write replies, Yapoz sends the text of the conversation to an AI service. To read a receipt, it sends the receipt image or PDF. Which services get this depends on how
        this deployment is set up. The code can use any of these: a hackathon gateway run by a third party (KrackedDevs, a proxy that forwards to model vendors; customer messages and receipt images pass through it, and we do not yet know its retention or training terms), Groq, Google Gemini, OpenRouter, OpenAI, Anthropic, or a model running on the server itself (Ollama). The shop
        owner can see which ones are switched on in Settings. If one is busy, Yapoz tries the next. Once your message goes to one of them, it follows that company&apos;s own rules. We
        cannot promise how long they keep it or whether they train on it. Please check each provider&apos;s own terms. Not every provider can read images, so receipt images only go to
        the ones that can.
      </>
    ),
  },
  {
    title: "Chat apps",
    body: (
      <>
        Messages travel through WhatsApp (Meta) or Telegram first. Those companies have their own privacy rules, and we do not control them.
      </>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <>
        By default, nothing is deleted until the owner deletes it. The owner can set an automatic clean-up of 30, 90, 180 or 365 days in Settings. Once it is on, a daily job deletes
        chats with no new messages inside that time, and receipt photos for orders that are finished or cancelled. The job only runs if this deployment has it scheduled. Orders
        and their totals stay for the seller&apos;s records, and they can still show the customer&apos;s name, phone and address. Backups kept by the database host may hold deleted data
        for a while. How long depends on how this deployment is set up.
      </>
    ),
  },
  {
    id: "delete",
    title: "Seeing or deleting your data",
    body: (
      <>
        If you are a customer, ask the shop you messaged. The owner can erase you from the Inbox with &ldquo;Delete customer data&rdquo;. That removes your profile, your chats and your
        receipt files. Your orders stay for the seller&apos;s records but lose your name, phone, address and notes. It cannot be undone. If you are a seller, the owner can download
        customers, chats, orders and receipt details as one file from Settings. The file holds receipt details, not the receipt images themselves.
      </>
    ),
  },
  {
    title: "Keeping it safe",
    body: (
      <>
        Logins use a signed cookie that lasts 7 days. Chat-app access tokens are stored encrypted. Our logs hide passwords, keys and tokens, and the code we checked does not write
        message text into logs. Receipt images and messages are stored in the database as normal data, not specially encrypted by us. No system is perfectly safe, and we cannot
        promise that nothing will ever go wrong.
      </>
    ),
  },
  {
    title: "Cookies",
    body: (
      <>
        We use a sign-in cookie for shop staff. We use no advertising or analytics cookies that we know of. The sign-up page loads Cloudflare Turnstile, a check that you are a human,
        which is run by Cloudflare under its own terms.
      </>
    ),
  },
  {
    title: "Malaysian law (PDPA)",
    body: (
      <>
        Malaysia&apos;s Personal Data Protection Act 2010 covers customer details like names and phone numbers. The shop decides what to collect and why, so the shop is the one mainly
        responsible. We are not claiming Yapoz is PDPA compliant or certified. A lawyer should review this page and how the service is run before it is relied on.
      </>
    ),
  },
  {
    title: "Questions",
    body: <>Contact the shop you messaged. For anything about Yapoz itself, contact whoever runs this deployment. They have not put a contact address on this page yet.</>,
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
        <p className="mt-4 text-[17px] text-paper/70">What Yapoz keeps, who can see it, and how to get it deleted, in plain words.</p>
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
