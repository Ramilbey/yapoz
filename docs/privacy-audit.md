# Privacy page audit

Checked `src/app/privacy/page.tsx` (old version) against code. Not legal advice; no compliance claim is made.

## Old claims

| # | Old claim | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Answers messages on WhatsApp, Telegram **and its website** | Partly wrong | `channelTypeEnum` = telegram, whatsapp, simulator (src/db/schema.ts:28). No real website channel. |
| 2 | Prototype for SDC Hackathon; sample businesses are made up | Unverifiable / stale | `DEMO_MODE` defaults true (src/lib/env.ts) but real businesses can sign up (Turnstile sign-up). Dropped. |
| 3 | Handles messages, name/username/phone, orders | Verified (incomplete) | export.ts fields; orders also hold address, notes; receipts omitted from old page. |
| 4 | Used only to answer, hand off to staff, show analytics; no selling/ads | Unverifiable | No ad/analytics code found (grep), but a negative cannot be proven. Reworded to "found no ... code". |
| 5 | Business staff see it "according to role" | Verified | ROLE_SECTIONS in src/lib/session.ts; export/delete are owner-only (api/export/route.ts, DELETE in api/inbox/threads/[id]/route.ts). |
| 6 | AI providers are "currently Groq and Google Gemini" | Wrong | getProviders() in src/agent/ai-router.ts supports the KrackedDevs hackathon gateway (opt-in, first choice), Groq, Gemini, OpenRouter, OpenAI, Anthropic, Ollama, enabled by env keys. |
| 7 | Messages travel via Meta / Telegram | Verified | src/channels/. |
| 8 | "Conversations stay while the business uses Yapoz" | Wrong | Owner can set 30/90/180/365-day purge (settings page; src/lib/retention.ts; run by api/jobs/sweep). Default is keep (null). |
| 9 | Channel access tokens stored encrypted | Verified | `encryptJson` AES-256-GCM (src/lib/crypto.ts) used in channels/connections.ts, telegram/connect.ts. "Never shown in browser" not exhaustively checked; kept as "stored encrypted". |
| 10 | Ask the business to see/delete | Incomplete | Owner has export (`/api/export`) and "Delete customer data" (privacy.customer_deleted). Now described. |

## New claims and evidence

- Retention: only workspaces with `retentionDays` >= 7; deletes receipts of completed/cancelled orders, threads (cascade messages, AI runs, escalations), orphan customers. Orders keep name/phone/address (retention.ts).
- Customer delete: removes customer, threads, receipts; orders anonymised (name, phone, address, notes); some events deleted.
- Export: customers, threads, messages, orders+items, receipt metadata; no image bytes (export.ts).
- Receipt images are sent as base64 only to vision-capable providers (ai-router.ts `userParts`, receipts.ts `answeredByVision`).
- Logs: key-name and value-pattern redaction (log.ts); message bodies not logged in code searched. `email.dev_print` logs email text in dev (src/lib/email.ts:9), not customer chat. Redaction is for secrets, not personal data in free-text fields.
- Cookies: `jawab_session` (7 days, httpOnly, sameSite lax) and a verification cookie (1 day, src/lib/verification.ts). Page mentions only "sign-in cookie"; the verification one is also sign-in related. Turnstile script on sign-up.
- Hosting: DEPLOYMENT.md says Vercel plus Supabase Postgres (ap-northeast-2 pooler region, i.e. Seoul). Not stated on the page because this deployment may change; page says "depends on how this deployment is set up".

## Deliberately "we don't know / depends"

- Which AI providers are active, and their retention/training policies (check each provider's terms). For the KrackedDevs gateway see the finding below.
- Who at the operator can access the database.
- Whether the daily sweep is scheduled (Vercel Hobby cron is daily; docs suggest external cron) and backup retention at the host.
- Hosting location and legal entity / contact address.
- Whether the Cloudflare Turnstile / Meta / Telegram terms suit the seller.

## Finding: KrackedDevs gateway

When `KRACKEDDEVS_API_KEY` and `KRACKEDDEVS_FAST_MODEL` are set, customer messages and receipt images (if `KRACKEDDEVS_VISION=true`) go first to `https://litellm.rapidscreen.io/v1`, a third-party LiteLLM proxy run for the hackathon that forwards to model vendors. Its retention and training terms are UNKNOWN to us and must be confirmed with the organisers; no claim is made about them. The same applies to the vendors behind it. The privacy page says this. Its credit ends 7 Nov 2026; after that calls fail and other providers answer.

## Gaps developers should fix

1. ~~Retention leaves order name/phone/address forever~~ Fixed: finished orders past the retention period are anonymised (retention.ts). In-progress orders keep their details.
2. Receipt files on orders still in progress are never purged by retention; chat is purged though.
3. Retention now also deletes `message.received` and `order.attempt_failed` events past the period. Other `events` rows and `audit` records are still not purged; check what personal data they hold.
4. Retention UI allows 30+ days; code accepts >= 7. Harmless, but inconsistent.
5. Receipt images and messages are not encrypted at the application level (only channel tokens are).
6. ~~No contact address~~ Set `PRIVACY_CONTACT` and /privacy shows it.
7. In-app Settings text ("stored for your business only") is consistent but omits "AI provider terms apply"; consider a link to this page.
8. Customer-erase does not remove copies held by AI providers, Meta or Telegram, nor backups.
9. Customers have no direct way to request access/deletion; they must ask the shop.
10. `setup_sources` (owner-uploaded files) is not covered by retention or export.
