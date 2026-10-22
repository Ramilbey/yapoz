# Jawab

The AI front desk for any business on WhatsApp, Telegram and Instagram. An owner signs up, explains their business in
their own words (or uploads a menu, price list or photo of the price board), checks the draft Claude makes from it,
connects their own chat accounts and goes live. Jawab then answers customers from that business's prices, stock, hours
and policies, takes bookings (tables, appointments or day bookings), takes orders for the owner to approve, hands anything sensitive to a person, and can run
hiring with a human **Approve** on every outbound step. One sign-in, three desks: Owner, Service, HR.

Two fictional **sample businesses** ship with it, so anyone can try it from the landing page:
**Forno Sette** (`FORNO7`, a wood-fired pizzeria in Bangsar, with hiring switched on) and
**Kasih Hair Studio** (`KASIH1`, a salon in Mont Kiara booked by appointment). Prices in MYR.

## Run it locally

You need Node 20.9+ and Postgres 15+ (a local Postgres or a Supabase project).

```bash
npm install
cp .env.example .env.local        # then fill in at least DATABASE_URL, AUTH_SECRET, APP_ENCRYPTION_KEY, ANTHROPIC_API_KEY
npm run fonts                     # downloads General Sans from Fontshare (optional; falls back to Bricolage)
npm run db:migrate
npm run db:seed                   # both sample businesses + 30 candidates + 7 days of labeled demo history
npm run dev
```

- http://localhost:3000: the site. "Get started" opens sign-up; "Ring the bell" talks to the sample businesses.
- http://localhost:3000/signup: create a business. You land in the setup wizard.
- http://localhost:3000/login: sample accounts `owner@demo`, `service@demo`, `hr@demo` (Forno Sette) and `owner@demo` on
  `KASIH1`, password `DEMO_PASSWORD` (default `forno7demo`). The Workspace ID is only asked for when an email belongs to
  more than one business.

Generate secrets with `openssl rand -base64 48` (AUTH_SECRET) and `openssl rand -base64 32` (APP_ENCRYPTION_KEY).

## How a business gets set up

1. **Sign up** (`/signup`): business name, owner name, email, password. The workspace ID is made from the name
   (e.g. `KASIH42`); currency and time zone are guessed from the browser and confirmed in step 1.
2. **Setup wizard** (`/app/setup`), six steps:
   1. Basics: type of business, address, time zone, currency, languages.
   2. Your business: a free-text brief, uploads (PDF, JPG/PNG/WEBP photos, TXT/CSV, up to 4 MB each, 10 files) and an
      optional website. **Draft my assistant** sends all of it to the smart model (PDFs as document blocks, photos as
      image blocks, the website as text) with a forced `record_business_draft` tool. Anything missing becomes an open
      question instead of a guess. Without `ANTHROPIC_API_KEY` the owner fills the same form by hand.
   3. Review: edit everything (answers to open questions, hours, products and services with priced options, booking
      types, delivery, policies, FAQs). Saved into Knowledge.
   4. Channels (below). 5. Try it in a test chat (simulator channel, same pipeline). 6. Go live.
3. Until the owner presses **Go live**, messages on real channels are stored but not answered; the simulator always answers.
4. **Team:** Settings → Team creates one-time invite links (7 days) for Owner, Service or HR desks. There's no email
   service, so the owner sends the link however they like. **Hiring** is an optional module (Settings → Hiring).

## Channels, per business

Every business connects its own accounts in Settings → Channels (or setup step 4). Secrets are stored AES-256-GCM
encrypted on the business's channel row and never sent back to the browser.

- **Telegram, shared Jawab bot** (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`): each business gets a customer link
  `t.me/<bot>?start=<WORKSPACE>` (and a QR). For **Telegram Business** (replies from the owner's own account) the owner
  taps "Link my Telegram" (a 15-minute one-time `link_<code>`), then adds the bot under Settings → Telegram Business →
  Chatbots. In @BotFather turn on Business Mode for the shared bot.
- **Telegram, the business's own bot:** paste a @BotFather token. Jawab checks it with `getMe` and sets a webhook to
  `/api/webhooks/telegram/<channelId>` with its own secret token (or `npm run telegram:poll` picks it up locally).
- **Meta app, then WhatsApp.** One Meta app serves both WhatsApp and Instagram, so it is saved once, in its own box, apart
  from the number. Five values, each stored in one place:

  | Field | Where it comes from in Meta | Stored as | Server fallback (demo workspace) |
  | --- | --- | --- | --- |
  | Meta App ID | App settings → Basic | `integrations(meta_app).meta.appId` | `META_APP_ID` |
  | App secret | App settings → Basic → Show | `integrations(meta_app).dataEnc`, encrypted | `META_APP_SECRET` |
  | Phone number ID | WhatsApp → API Setup | `channels(whatsapp).config.phoneNumberId` | `WHATSAPP_PHONE_NUMBER_ID` |
  | WhatsApp Business Account ID | WhatsApp → API Setup | `channels(whatsapp).config.wabaId` | `WHATSAPP_BUSINESS_ACCOUNT_ID` |
  | Access token | Business Settings → System users | `channels(whatsapp).credentialsEnc`, encrypted | `WHATSAPP_TOKEN` |

  Saving the Meta app asks Meta whether the App ID and secret belong together. Connecting the number asks Meta whether the
  token is valid, was made by that app and has both WhatsApp permissions, whether the number is on that Business Account, and
  subscribes the app to the account's webhooks; nothing is saved if any answer is no, and the message says which field to fix.
  The token's expiry is shown, with a warning when it's a temporary one. The App secret signs the webhooks (WhatsApp, and
  Instagram for that business's own account). Connections made before the Meta app box existed keep working, and saving the
  Meta app replaces the old secret without reconnecting. Jawab then shows
  the callback URL `/api/webhooks/whatsapp/<channelId>` and a verify token to paste into the app's webhook settings.
  Embedded Signup (one-click) needs Meta Tech Provider approval; it's the next step, not built.
- **Instagram:** "Connect Instagram" runs Instagram Login on Jawab's Meta app (`INSTAGRAM_APP_ID`,
  `INSTAGRAM_APP_SECRET`), exchanges for a long-lived token (refreshed by the daily sweep), and subscribes the account
  to `messages` and `comments`. Until the app passes App Review, only accounts added as Instagram testers can connect.
  Webhooks for every business arrive at `/api/webhooks/instagram` and are routed by `entry.id`; each entry is accepted only if
  its signature matches Jawab's own app (`INSTAGRAM_APP_SECRET` / `META_APP_SECRET`) or the Meta app secret of the business that owns that account.

Local development, no public URL needed: `npm run telegram:poll` (shared bot plus every connected own bot).
Production: set `APP_URL` (https) and `TELEGRAM_WEBHOOK_SECRET`, then `npm run telegram:webhook` for the shared bot.

### Google Calendar (optional)

Create an OAuth web client, add `{APP_URL}/api/integrations/google/callback` as a redirect URI, enable the Calendar API,
set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, then press "Connect Google Calendar" on the Interviews page.
Without it, Jawab uses its built-in calendar and Jitsi links for video interviews.

## Deploy

**Vercel + Supabase Postgres.** `DATABASE_URL` = Supabase transaction pooler (port 6543), `DATABASE_URL_LISTEN` =
session pooler (port 5432; the live inbox uses Postgres LISTEN/NOTIFY). Run `npm run db:migrate && npm run db:seed`
once against it. `vercel.json` schedules `/api/jobs/sweep` daily (set `CRON_SECRET`): it retries failed jobs, applies
CV retention and refreshes Instagram tokens. Webhooks are processed straight after the response with Next.js `after()`.
Vercel caps request bodies at about 4.5 MB, which is why setup uploads go one file at a time, 4 MB max.

**Your own Ubuntu server.** `npm run build && npm start` behind Nginx, plus `npm run worker` (systemd or pm2) for retries
and retention. The live stream sets `X-Accel-Buffering: no`, so Nginx doesn't buffer it.

## The demo

Before you go on stage: Settings → Reset sample data on the Forno Sette owner desk (or `POST /api/demo/reset` with
`Authorization: Bearer $DEMO_RESET_TOKEN`). Keep the site's "Ring the bell" simulator open as the fallback if any
webhook misbehaves: it goes through the exact same pipeline.

1. **The pitch in one minute.** Landing page → "Get started" → sign up a new business → paste a short brief (or upload
   a menu photo) → Draft my assistant → fix one price in Review → Save → Try it: ask a price and book for tomorrow.
2. **Any business.** On the site, switch the simulator between the pizzeria and the salon and ask each the same kind of
   question; the salon books by service length, the pizzeria by headcount.
3. **Escalation.** Ask about a franchise or complain: holding reply, and it lands in Needs you with a one-line summary.
4. **Owner dashboard.** Auto-resolved %, first-reply time, top questions, knowledge gaps → Add answer → ask again.
5. **Hiring** (Forno Sette). "pizza cook, 3+ years wood-fired, evenings, near Bangsar" → ranked list with evidence →
   Draft invite → Approve → the candidate picks a time in Telegram → the Interviews calendar updates live.

Turn on **Demo traffic** (Owner → Today, sample businesses only) if you want the charts to move during the pitch.

## How it's built

- Next.js 16 (App Router, Turbopack), TypeScript strict, Tailwind CSS v4 with the brand tokens in `src/app/globals.css`.
- Postgres via Drizzle (`src/db/schema.ts`, migrations in `drizzle/`), row-level security policies by `workspace_id`.
- One inbound shape for every channel → `src/agent/pipeline.ts`: classify (fast model) in parallel with the tool-using
  agent (fast or smart model), safety-net escalation, Autopilot or Copilot, human takeover, full logging in `agent_runs`.
- Generic knowledge: products and services with priced options (size, colour or any label) and stock, booking types
  (`party` by headcount, `appointment` by service length and staff capacity, `day` for rooms and rentals), hours with
  exceptions, policies, FAQs. The prompt, the knowledge block and the tools are the same for every business.
- Tools: `search_catalog`, `check_variant`, `get_business_info`, `check_slots`, `create_booking`, `create_order`, `escalate` (`src/agent/tools.ts`).
- Orders (`src/lib/orders.ts`, `/app/orders`): `create_order` prices every line from the catalog, checks availability, stock, size
  and delivery address, and saves a **pending** order. Nothing is promised until an owner or service user presses **Confirm**:
  that takes the stock off, tells the customer in their chat, and is logged to `events`. Ready, completed, cancelled (stock goes
  back) and paid follow; the customer hears about confirmed, ready and cancelled. The delivery fee is agreed by the team; Jawab
  takes no payments.
- Setup: `src/setup/*` (website reader with a public-address check, Claude draft, importer).
- Channels: `src/channels/connections.ts` resolves each business's credentials and routes webhooks to the right business.
- Hiring: `src/hiring/*`: Claude parsing, criteria chips, SQL filter + smart-model ranking with evidence quotes that are
  verified against the resume text, names and personal details removed before ranking, approvals, slot offers, calendar.
- Live updates: Postgres triggers → `pg_notify` → `/api/stream` (server-sent events), with polling as a fallback.
- Site: React Three Fiber bell, GSAP ScrollTrigger + SplitText, Lenis. Phones and reduced motion get a 2D path.

### Where this differs from the original brief (`PROMPT.md`)

- **One business → any business.** The brief described a single demo business; Jawab is now multi-business with
  sign-up, a setup wizard and per-business channel connections. Forno Sette stays as a sample.
- **Supabase Auth, Realtime and Storage** are replaced by our own sign-in (email + password, Workspace ID only when
  needed, signed cookie), Postgres LISTEN/NOTIFY for the live inbox, and files stored in Postgres.
- **Inngest** is replaced by a `jobs` table + `after()` + sweep (the brief allowed either).
- **shadcn/ui** isn't used; the few primitives come straight from Radix and are styled to the tokens.
- **After Effects / dotLottie** pieces: none were provided, so every scene is GSAP, as the brief allows.
- **General Sans** can't be committed (Fontshare licence), so `npm run fonts` downloads it.
- **Zoom** is not implemented; video interviews use Google Meet (when connected) or Jitsi.
- **District distances** for hiring only know Klang Valley areas; elsewhere the "near" filter is skipped.

## Tests

```bash
npm run db:reset && npm test
```

65 tests: the agent tools (prices, stock, sold-out flags, hours with exceptions, table, appointment and day bookings,
escalation); sign-up and setup (workspace IDs, a messy Claude-style draft repaired and imported, the tools answering
from it, the not-live gate, which business the public simulator may reach); Telegram end to end against recording Bot
API clients (shared bot, link codes for Business Mode, deep links per business, a business's own bot, `/apply` with
consent and the hiring switch, approve → invite → booked interview, `/delete_my_data`); WhatsApp and Instagram
(signatures, per-business credentials and routing, a business's own webhook URL, 24-hour window, comment private
replies, no secrets in the status API); AI routing (retired models swapped for served ones, 429s rotating to the next model, photos and PDFs reaching vision models, the failure reason shown to staff only); the Meta app and WhatsApp number checks against a fake Meta API (wrong secret, another app's token, expired or under-permissioned token, number on the wrong account, temporary token, which secret signs webhooks, one business's secret never vouching for another's); and orders (priced and stock-checked by the server, approval, stock off and back, customer messages, the activity log, workspace scoping, a chat order through the agent).

`node scripts/walkthrough.mjs <dir>` drives a browser from the landing page through sign-up, setup, go-live, an invite
and a teammate's first sign-in, and saves screenshots (needs a running server).

## Environment

See `.env.example` for every variable with a comment. Never commit `.env.local`.
