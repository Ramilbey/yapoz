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
| **Vercel Deploy Webhook** | `https://api.vercel.com/v1/integrations/deploy/prj_xmhsmYW3T1f9JE0HrVB7ZLRe9hQM/9wK5uwwhmk` |

---

## 2. Demo Credentials

The database is seeded with a fully functional sample restaurant workspace (`FORNO7` — Forno Sette Pizzeria):

| Role | Email | Password | Workspace ID | Default Dashboard Route |
| :--- | :--- | :--- | :--- | :--- |
| **Owner (Full Access)** | `owner@demo` | `forno7demo` | `FORNO7` | `/app/today` or `/app/inbox` |
| **Service Desk (Customer Chat & Bookings)** | `service@demo` | `forno7demo` | `FORNO7` | `/app/inbox` |
| **HR Desk (Applicant Pipeline & Interviews)** | `hr@demo` | `forno7demo` | `FORNO7` | `/app/hiring` |

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
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_xmhsmYW3T1f9JE0HrVB7ZLRe9hQM/9wK5uwwhmk
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
2. `drizzle/seed_data.sql`: Complete SQL seed dump containing workspace `FORNO7`, 3 staff users, pizza menu items & variants, 40 FAQ answers, and candidate profiles.
3. Seeding via terminal:
   ```bash
   DATABASE_URL="<Supabase-Pooler-URL>" npm run db:seed
   ```

---

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
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_xmhsmYW3T1f9JE0HrVB7ZLRe9hQM/9wK5uwwhmk
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
