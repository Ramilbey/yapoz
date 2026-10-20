# Jawab

An AI front desk for businesses on Telegram, WhatsApp and Instagram. It answers from the business's own menu, stock,
hours and policies, books tables, hands anything sensitive to a person, and runs hiring with a human **Approve** on
every outbound step. One sign-in, three desks: Owner, Service, HR.

The demo business is **Forno Sette**, a fictional wood-fired pizzeria in Bangsar, Kuala Lumpur (prices in MYR).

## Run it locally

You need Node 20.9+ and Postgres 15+ (a local Postgres or a Supabase project).

```bash
npm install
cp .env.example .env.local        # then fill in at least DATABASE_URL, AUTH_SECRET, APP_ENCRYPTION_KEY, ANTHROPIC_API_KEY
npm run fonts                     # downloads General Sans from Fontshare (optional; falls back to Bricolage)
npm run db:migrate
npm run db:seed                   # Forno Sette + 30 candidates + 7 days of labeled demo history
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/login for the dashboards.
Workspace `FORNO7`, accounts `owner@demo`, `service@demo`, `hr@demo`, password `DEMO_PASSWORD` (default `forno7demo`).

Generate secrets with `openssl rand -base64 48` (AUTH_SECRET) and `openssl rand -base64 32` (APP_ENCRYPTION_KEY).

### Telegram

1. Create a bot with @BotFather, put the token in `TELEGRAM_BOT_TOKEN` and the username in `TELEGRAM_BOT_USERNAME`.
2. Local development, no public URL needed: `npm run telegram:poll` (runs the same handler as the webhook).
3. Production: set `APP_URL` (https) and `TELEGRAM_WEBHOOK_SECRET`, then `npm run telegram:webhook`.
4. Business Mode: in @BotFather turn on Business Mode for the bot. On a Telegram Premium account open
   Settings → Business → Chatbots, add the bot and allow it to reply. Customers who message that account now get answers
   from the account itself; anything the owner types is left alone.
5. Hiring source: make the bot an admin of your jobs channel or group. It registers the chat automatically and reads
   resume posts and PDFs from there. Candidates can also apply with `/apply` in the bot.

### WhatsApp and Instagram

See `docs/integrations.md` for the exact setup, API versions, the two WhatsApp templates to create
(`interview_invite`, `booking_reminder`) and the 24-hour/7-day rules. Webhooks:
`/api/webhooks/whatsapp` and `/api/webhooks/instagram` (GET for verification, POST with `X-Hub-Signature-256`).

### Google Calendar (optional)

Create an OAuth web client, add `{APP_URL}/api/integrations/google/callback` as a redirect URI, enable the Calendar API,
set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, then press "Connect Google Calendar" on the Interviews page.
Without it, Jawab uses its built-in calendar and Jitsi links for video interviews.

## Deploy

**Vercel + Supabase Postgres.** `DATABASE_URL` = Supabase transaction pooler (port 6543), `DATABASE_URL_LISTEN` =
session pooler (port 5432; the live inbox uses Postgres LISTEN/NOTIFY). Run `npm run db:migrate && npm run db:seed`
once against it. `vercel.json` schedules `/api/jobs/sweep` daily (set `CRON_SECRET`); webhooks are processed straight
after the response with Next.js `after()`, the sweep only retries failures and applies resume retention.

**Your own Ubuntu server.** `npm run build && npm start` behind Nginx, plus `npm run worker` (systemd or pm2) for retries
and retention. The live stream sets `X-Accel-Buffering: no`, so Nginx doesn't buffer it.

## The 3-minute demo

Before you go on stage: Settings → Reset demo data (or `POST /api/demo/reset` with `Authorization: Bearer $DEMO_RESET_TOKEN`).
Open three tabs: Owner (Today), Service (Inbox), HR (the Pizza cook role). Keep the site's "Ring the bell" Simulator
open as the fallback if any webhook misbehaves: it goes through the exact same pipeline.

1. **QR → Telegram.** The QR at the bottom of the site opens the bot. A judge asks
   "Do you have the Margherita in large, and can I book a table for 4 at 8pm Friday?" The reply shows RM 52 and a
   booking reference; the booking pops into Bookings and the thread into the Inbox with its tool trail.
2. **Escalation.** Send "franchise partnership?" It gets a holding reply and lands in Needs you with a one-line summary.
3. **Owner dashboard.** Show auto-resolved %, first-reply time and top questions. Under Knowledge gaps, press
   Add answer on "gluten-free?", write the answer, then ask the bot "do you have gluten free base?" again: answered.
4. **Hiring.** Type "pizza cook, 3+ years wood-fired, evenings, near Bangsar" → ranked list with evidence quotes.
   A teammate who did `/apply` in the bot is in the list: Draft invite → Approvals → Approve and send. Their phone
   gets the invite with three time buttons; they tap one; the Interviews calendar updates live.

Turn on **Demo traffic** (Owner → Today) if you want the charts to move during the pitch. It replays seeded
conversations and everything it adds is labeled as demo data; the "Include demo data" switch shows live traffic only.

## How it's built

- Next.js 16 (App Router, Turbopack), TypeScript strict, Tailwind CSS v4 with the brand tokens in `src/app/globals.css`.
- Postgres via Drizzle (`src/db/schema.ts`, migrations in `drizzle/`), row-level security policies by `workspace_id`.
- One inbound shape for every channel → `src/agent/pipeline.ts`: classify (fast model) in parallel with the tool-using
  agent (fast or smart model), safety-net escalation, Autopilot or Copilot, human takeover, full logging in `agent_runs`.
- Tools: `search_catalog`, `check_variant`, `get_business_info`, `check_slots`, `create_booking`, `escalate` (`src/agent/tools.ts`).
- Hiring: `src/hiring/*`: Claude parsing, criteria chips, SQL filter + smart-model ranking with evidence quotes that are
  verified against the resume text, names and personal details removed before ranking, approvals, slot offers, calendar.
- Live updates: Postgres triggers → `pg_notify` → `/api/stream` (server-sent events), with polling as a fallback.
- Site: React Three Fiber bell, GSAP ScrollTrigger + SplitText, Lenis. Phones and reduced motion get a 2D path.

### Where this differs from the original brief (`PROMPT.md`)

- **Supabase Auth, Realtime and Storage** are replaced by our own sign-in (Workspace ID + email + password, signed
  cookie), Postgres LISTEN/NOTIFY for the live inbox, and resumes stored in Postgres. Supabase still works as the database.
  This keeps everything testable without a Supabase project and runs the same on Vercel or your own server.
- **Inngest** is replaced by a `jobs` table + `after()` + sweep (the brief allowed either).
- **shadcn/ui** isn't used; the few primitives come straight from Radix and are styled to the tokens.
- **After Effects / dotLottie** pieces: none were provided, so every scene is GSAP, as the brief allows.
- **General Sans** can't be committed (Fontshare licence), so `npm run fonts` downloads it.
- **Zoom** is not implemented; video interviews use Google Meet (when connected) or Jitsi.

## Tests

```bash
npm run db:reset && npm test
```

Covers the agent tools (prices, stock, sold-out flags, hours with exceptions, bookings and capacity, escalation), the
Telegram adapter end to end against a recording Bot API client (business connections, owner-message filtering,
`/apply` with consent, approve → invite with slot buttons → booked interview, `/delete_my_data`) and the WhatsApp and
Instagram adapters (signatures, normalization, 24-hour window, comment private replies).

## Environment

See `.env.example` for every variable with a comment. Never commit `.env.local`.
