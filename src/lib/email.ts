// Transactional email through Resend's REST API. Without a key, dev prints the message to the server console.

export const canSendEmail = () => Boolean(process.env.RESEND_API_KEY) || process.env.NODE_ENV !== "production";

export async function sendEmail(m: { to: string; subject: string; text: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] to ${m.to}: ${m.subject}\n${m.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "Yapoz <onboarding@resend.dev>", to: [m.to], subject: m.subject, text: m.text, html: m.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
