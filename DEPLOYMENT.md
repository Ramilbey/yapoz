# Jawab (Yapoz) — Complete Deployment & Operations Manual
> **Notice for Future AI Agents & Developers:**  
> Read this document completely before modifying the codebase, pushing commits, or altering cloud infrastructure. This manual details the live infrastructure, deployment pipeline, secret management, database pooler architecture, and known failure modes with their exact solutions.

---

## 1. Quick Reference & Live Endpoints

| Resource | Value / URL |
| :--- | :--- |
| **Production App** | [https://yapoz.vercel.app](https://yapoz.vercel.app) |
| **Live Health Check** | [https://yapoz.vercel.app/api/health](https://yapoz.vercel.app/api/health) |
| **Login Portal** | [https://yapoz.vercel.app/login](https://yapoz.vercel.app/login) |
| **Vercel Project Dashboard** | [https://vercel.com/ramilbeys-projects/yapoz](https://vercel.com/ramilbeys-projects/yapoz) |
| **Supabase Dashboard** | [https://supabase.com/dashboard/project/dkufrhbizioijmxrzcom](https://supabase.com/dashboard/project/dkufrhbizioijmxrzcom) |
| **Primary GitHub Remote (`ramilbey`)** | `git@github.com:Ramilbey/yapoz.git` *(Tracks Vercel production)* |
| **Secondary GitHub Remote (`origin`)** | `git@github.com:gameelacademy/yapoz.git` *(Collaborator repo)* |
| **Vercel Deploy Hook** | Kept out of the repo: Vercel → Settings → Git → Deploy Hooks. Export it as `VERCEL_DEPLOY_HOOK` locally. |

---

## 2. Demo Credentials

The database is seeded with a fully functional sample restaurant workspace (`FORNO7` — Forno Sette Pizzeria):

| Role | Email | Password | Workspace ID | Default Dashboard Route |
| :--- | :--- | :--- | :--- | :--- |
| **Owner (Full Access)** | `owner@demo` | `forno7demo` | `FORNO7` | `/app/today` or `/app/inbox` |
| **Service Desk (Customer Chat)** | `service@demo` | `forno7demo` | `FORNO7` | `/app/inbox` |

> *Tip: The live login page at `/login` provides one-click desktop demo buttons that prefill credentials automatically.*

---

## 3. Git & Deployment Pipeline (CRITICAL RULES)

### Rule 1: The Vercel Hobby Author Restriction (DO NOT SKIP)
The Vercel project is hosted on a free **Hobby plan** owned by **`ramilbey`** (`ramilbey505711503@gmail.com`).  
**Vercel's Hobby terms block any deployment whose Git commit author does not match the Vercel team account.**

Before making ANY commit, verify your git config matches:
```bash
git config user.name "ramilbey"
git config user.email "ramilbey505711503@gmail.com"
```
> [!CAUTION]
> If a commit is authored by another identity (e.g. `gameelacademy@gmail.com`), Vercel will immediately fail the deployment with:
> `⚠️ Blocked: Vercel user not found. Upgrade to Pro.`
> If this happens, amend the commit author with:
> `git commit --amend --author="ramilbey <ramilbey505711503@gmail.com>" --no-edit`

### Rule 2: Dual Remote Synchronization
Always push changes to both remotes:
```bash
git push ramilbey main
git push origin main
```

### Rule 3: Triggering Deployments via Deploy Hook
Because the GitHub repository is linked across accounts, automatic push webhooks may occasionally be delayed or skipped. Always trigger the deployment hook after pushing to guarantee Vercel pulls and builds the latest commit:
```bash
curl -X POST "$VERCEL_DEPLOY_HOOK"
```

---

## 4. Database Architecture & Supabase Configuration

### Connection Pooler vs Direct Connection (IPv4 vs IPv6)
- **Supabase Project Ref:** `dkufrhbizioijmxrzcom`
- **Region:** `aws-0-ap-northeast-2` (Seoul)
- **Direct Domain:** `db.dkufrhbizioijmxrzcom.supabase.co` **(IPv6 ONLY on Free Tier)**
- **Pooler Domain:** `aws-0-ap-northeast-2.pooler.supabase.com` **(IPv4-enabled)**

> [!WARNING]
> Vercel AWS serverless functions operate in IPv4 environments. Connecting directly to `db.dkufrhbizioijmxrzcom.supabase.co` results in:
> `getaddrinfo ENOTFOUND db.dkufrhbizioijmxrzcom.supabase.co`
> **Always connect via the transaction pooler (port 6543) with the `postgres.<project_ref>` username.**

### Connection Strings:
- **Production `DATABASE_URL` (Port 6543 / Transaction Pooler):**
  ```text
  postgresql://postgres.dkufrhbizioijmxrzcom:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Direct / Migration `DIRECT_URL` (Port 5432 / Session Pooler):**
  ```text
  postgresql://postgres.dkufrhbizioijmxrzcom:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
  ```

### PgBouncer Prepared Statements Fix
In `src/db/index.ts`, prepared statements are automatically disabled for transaction poolers:
```typescript
const u = url();
const isPooler = /:6543\//.test(u) || /supabase\.(com|co)/.test(u) || process.env.VERCEL === "1";

export const sql = g.__sql ?? postgres(u, {
  max: Number(process.env.DB_POOL_MAX ?? 10),
  prepare: !isPooler, // CRITICAL: Must be false for PgBouncer / port 6543
  idle_timeout: 20,
  onnotice: () => {},
});
```
Do not enable `prepare: true` when running against Supabase port 6543, as PgBouncer in transaction mode does not preserve prepared statements across client connections.

### Schema & Database Seeding Files:
1. `drizzle/supabase_setup.sql`: Complete SQL script creating all 30 application tables, custom enums, and real-time triggers (`jawab_notify`).
2. `drizzle/seed_data.sql`: Complete SQL seed dump containing workspace `FORNO7`, 2 staff users, pizza menu items & variants, 40 FAQ answers.
3. `drizzle/0002_orders.sql`: the orders tables, live-update trigger and row-level security. **An existing database needs this run once** (Supabase → SQL Editor → paste → Run) before the Orders page works. It is safe to run twice. A fresh setup gets it from `supabase_setup.sql`.
4. `drizzle/0004_cleanup_and_orders.sql`: removes the old booking, hiring and Instagram tables and data and adds order notifications and session revocation; run once on an existing database before 0005; it deletes data, so back up first; safe to run twice.
5. `drizzle/0005_stock.sql`: the stock tables, columns and `expired` order status. **An existing database needs this run once** (same as 0002). It is safe to run twice, and it is also appended to `supabase_setup.sql`.
6. `drizzle/0006_appointments.sql`: the `staff` and `appointments` tables, `kb_items.in_person` and `orders.kind`, with live-update triggers and row-level security. **An existing database needs this run once** (same as 0002), after 0005. It is safe to run twice, and it is also appended to `supabase_setup.sql`.
7. `drizzle/0007_email_verification.sql`: email verification. **An existing database needs this run once, before the new code is deployed**, or every login fails on the missing column. It marks all existing users as verified and is safe to run twice. It is also appended to `supabase_setup.sql`.
8. Seeding via terminal:
   ```bash
   DATABASE_URL="<Supabase-Pooler-URL>" npm run db:seed
   ```

---

### Stock and expiry

- Migration `0005_stock.sql` converts items whose options already had a stock count to "Count stock". Existing orders get no expiry timer.
- Payment holds last 20 minutes (Settings → Stock). Expired orders are processed when the Orders page loads, when a customer message arrives, by `GET /api/jobs/sweep` (see below), and by `npm run worker` when self-hosting.
- An expired order returns its stock and the customer gets a fixed message.
- Availability is computed live, so a late sweep never oversells. Expiry messages and booking reminders, though, only go out when something runs the sweep: call `GET /api/jobs/sweep` with `Authorization: Bearer $CRON_SECRET` about every 5 minutes (cron-job.org or Supabase pg_cron; the Vercel cron in `vercel.json` only runs once a day on the Hobby plan).

### Setting up the 5-minute sweep

Keep the daily cron in `vercel.json` as a backstop. Don't make it more frequent while on the Hobby plan.

1. In Vercel → Settings → Environment Variables, check that `CRON_SECRET` is set for Production. If it isn't, add a long random value and redeploy.
2. On cron-job.org, create a job for `https://yapoz.vercel.app/api/jobs/sweep` that runs every 5 minutes.
3. Add the request header `Authorization` with the value `Bearer <CRON_SECRET>`.
4. Run the job once. It should return HTTP 200 with JSON. A 401 means the header is wrong or Vercel hasn't redeployed since the secret was set.

Overlapping calls are safe: each reminder and expiry is claimed once. `docs/ops-setup-appointments.md` has more detail, plus a Supabase pg_cron alternative.

### Appointments

- Customers book services in chat (tools `find_times`, `book_appointment`, `change_appointment`). A booking is an order with kind `appointment` and ref code `APT-xxxx`, so approval, payment receipts, the 20-minute payment timer, Keep reserved and expiry work exactly as for orders.
- Staff are the business's logins. On the Calendar page (Team availability), each person is switched on to take appointments and gets their own hours (always within opening hours), days off and, when Settings → Appointments says "each person does only the services I pick", their services.
- Settings → Appointments: time grid, booking window, minimum notice, change cutoff, buffer, reminder time, meeting server (default `https://meet.jit.si`) and an optional WhatsApp reminder template.
- Online services get a Jitsi link in the confirmation; services ticked "In person" in Knowledge get the business address.
- Reminders go once per confirmed booking, `reminderMinutes` (default 60) before the start, from the sweep, Orders/Calendar page loads, incoming messages, or `npm run worker`.
- WhatsApp: more than 24 hours after the customer's last message, only Meta-approved templates can be sent. Set the template name and language in Settings → Appointments (a Utility template with 3 variables: service, time, link or place). Without it, such a reminder fails and shows as "not told" on the order.

## 5. Multi-Provider Cascading AI Engine

Located at [`src/agent/ai-router.ts`](file:///home/mrsand/Desktop/sdc%20hackathon/jawab/src/agent/ai-router.ts).  
The app features an automated cascading fallback router that translates Claude/Anthropic prompts and tool schemas to standard OpenAI-compatible formats:

```mermaid
flowchart TD
    Req[Incoming Customer Message] --> Groq{1. Groq Free Tier\nGROQ_API_KEY}
    Groq -- Success --> Res[Customer Auto-Reply]
    Groq -- 429 Rate Limit / Error --> Gemini{2. Google Gemini Free\nGEMINI_API_KEY}
    Gemini -- Success --> Res
    Gemini -- 429 Rate Limit / Error --> OpenRouter{3. OpenRouter Free\nOPENROUTER_API_KEY}
    OpenRouter -- Success --> Res
    OpenRouter -- 429 Rate Limit / Error --> Ollama{4. Ollama Local\nOLLAMA_BASE_URL}
    Ollama -- Success --> Res
    Ollama -- Error --> OpenAI{5. OpenAI Paid Fallback\nOPENAI_API_KEY}
    OpenAI -- Success --> Res
    OpenAI -- Error --> Anthropic{6. Anthropic Claude\nANTHROPIC_API_KEY}
    Anthropic -- Success --> Res
```

### Adding New AI Providers:
To add or change API keys in Vercel:
1. Go to **Vercel Settings ➔ Environment Variables**.
2. Add `GROQ_API_KEY` or `GEMINI_API_KEY`.
3. The AI router automatically discovers available keys upon request without requiring code changes.

---

## 6. Environment Variables Configured in Vercel

The following variables are active in Vercel Production:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Supabase IPv4 Transaction Pooler connection string (`:6543`) |
| `AUTH_SECRET` | 32+ character key for JWT cookie sessions (`jose`) |
| `APP_ENCRYPTION_KEY` | Hex encryption key for customer credentials |
| `DEMO_MODE` | Set to `"true"` to enable demo desk logins |
| `DEMO_WORKSPACE_ID` | Set to `"FORNO7"` |
| `GROQ_API_KEY` | Primary ultra-fast free tier model provider |
| `GEMINI_API_KEY` | Secondary free tier provider (15 RPM, 1M TPM) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile human check on sign-up. **Required:** production refuses sign-ups without them |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sends sign-up verification codes. **Required:** production refuses sign-ups without the key. `EMAIL_FROM` must use a domain verified in Resend |

---

## 7. Standard Workflow for Making Changes & Upgrades

Follow these exact steps when updating the application:

### Step 1: Write and Verify Code Locally
```bash
cd "/home/mrsand/Desktop/sdc hackathon/jawab"
# Make your edits...
npm run build
```
Ensure `npm run build` exits with code `0`.

### Step 2: Ensure Git Author Identity
```bash
git config user.name "ramilbey"
git config user.email "ramilbey505711503@gmail.com"
```

### Step 3: Commit and Push to Both Remotes
```bash
git add .
git commit -m "feat: <clear summary of your change>"
git push ramilbey main
git push origin main
```

### Step 4: Trigger the Deploy Webhook
```bash
curl -X POST "$VERCEL_DEPLOY_HOOK"
```

### Step 5: Verify Live Status
```bash
curl -s https://yapoz.vercel.app/api/health
```
Expected output:
```json
{"status":"ok","database":{"connected":true,"workspaces":8,"users":10,"seeded":true},"ai":{"configured":true,"providers":["Groq","Google Gemini"]}}
```

---

## 8. Diagnostic Runbook / Troubleshooting

| Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **`404 Nobody rang this bell` on new routes** | Vercel has not yet finished deploying the latest commit. | Trigger the deploy hook and wait 60 seconds. Verify build status at `https://vercel.com/ramilbeys-projects/yapoz/deployments`. |
| **`Blocked: Vercel user not found`** | A git commit was authored by an email other than `ramilbey505711503@gmail.com`. | Run `git commit --amend --author="ramilbey <ramilbey505711503@gmail.com>" --no-edit`, force-push to `ramilbey main`, and re-trigger the deploy hook. |
| **`getaddrinfo ENOTFOUND db.<ref>.supabase.co`** | Database URL in Vercel is pointing to direct IPv6 host instead of pooler. | Update `DATABASE_URL` in Vercel Settings to `aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`. |
| **`prepared statement "..." already exists`** | Postgres client attempting to use prepared queries on port 6543 PgBouncer. | Check `src/db/index.ts` and verify `prepare: !isPooler` is set. |
| **`That email and password don't match` on `/login`** | Supabase database tables are empty / unseeded. | Paste `drizzle/seed_data.sql` into the Supabase SQL Editor and click **Run**. |
| **AI requests fail with rate limits** | Single provider quota exhausted. | Ensure both `GROQ_API_KEY` and `GEMINI_API_KEY` are provided in Vercel environment variables so `ai-router.ts` can cascade. |
| **AI replies are always "I've passed this to our team"** | Every provider rejected its model (models get retired), so each message escalates. | Signed in as an owner, open `/api/health?test=ai`: it shows the model each provider uses and whether a tool call works. `ai-router.ts` lists each provider's models and swaps a retired one for a served one; `GROQ_*_MODEL` / `GEMINI_*_MODEL` env vars override it. |
| **`AUTH_SECRET must be set` / everyone logged out** | `AUTH_SECRET` (32+ chars) or `APP_ENCRYPTION_KEY` is missing in Vercel. Production refuses the public fallback values. | Set them in Vercel → Settings → Environment Variables and redeploy. Keep `APP_ENCRYPTION_KEY` unchanged once channels are connected, or their saved tokens can't be decrypted. |
| **WhatsApp: nothing arrives in Inbox** | Settings → Channels → WhatsApp says which link is broken. Usually the Meta app is unpublished (Meta then delivers only its dashboard Test sample), or `messages` isn't subscribed under Webhook fields. | Subscribe `messages`, press Test (Settings should then say the test arrived), and publish the app with `https://yapoz.vercel.app/privacy` as its privacy policy URL. |
| **WhatsApp: "signature doesn't match"** | The App secret saved in Jawab isn't the secret of the Meta app that sends the webhooks. | Copy App settings → Basic → App secret from that app, then Disconnect and connect WhatsApp again (the verify token changes, so re-save the webhook in Meta). |
| **WhatsApp: "Last reply failed … (#131030)"** | Meta's test number only sends to numbers on its list. | WhatsApp → API Setup → To → Manage phone number list: add and verify the phone you test from. |
| **`relation "orders" does not exist`, or the Orders page shows an error** | The code is deployed but `drizzle/0002_orders.sql` hasn't been run on the Supabase database yet. | Paste that file into the Supabase SQL Editor and run it. Orders already placed in chat before then were not saved: the agent tells staff the AI hit an error. |
| **`column "..." does not exist` or an unknown `expired` status on Orders or Settings → Stock** | The code is deployed but `drizzle/0005_stock.sql` hasn't been run on the Supabase database yet. | Paste that file into the Supabase SQL Editor and run it. |
| **`relation "appointments" does not exist` or `column "kind" does not exist` on Orders or Calendar** | The code is deployed but `drizzle/0006_appointments.sql` hasn't been run on the Supabase database yet. | Paste that file into the Supabase SQL Editor and run it. |
| **Customer ordered in chat but nothing appears under Orders** | The order was refused (sold out, unclear size, missing address) or the AI failed. | Open the conversation in Inbox: the tool line under each reply shows `order ✗ …` with the reason. Needs you shows AI failures with their cause. |
