# Yapoz

> Customer chats into reviewable orders.

We built Yapoz to help Malaysian micro and small businesses turn customer conversations into structured orders that staff can review, approve and track. Our focus is the repeated manual work between receiving a message and confirming an accurate order.

**SDC Hackathon 2026 · Domain 2 · Orbyte Smart SME Challenge: Less Busywork, Better Business**

## Team Information

| Field | Details |
| --- | --- |
| **Team Name** | Yaponomics |
| **Project** | Yapoz |
| **Team Domain** | Domain 2 — Alpha Red Solutions Sdn Bhd |
| **SDG Track (1–17)** | SDG 8 — Decent Work and Economic Growth; targets 8.2 and 8.3 |
| **Team Leader** | Abdulrahman Imaad Mohamed |
| **University** | Xiamen University Malaysia |
| **Number of Members** | 5 |

## Links

| Resource | Link |
| --- | --- |
| GitHub repository | [Ramilbey/yapoz](https://github.com/Ramilbey/yapoz) |
| Live application | [yapoz.vercel.app](https://yapoz.vercel.app) |
| Staff login | [Demo accounts](https://yapoz.vercel.app/login) |
| Customer simulator | [Ring the bell](https://yapoz.vercel.app/#ring) |
| Demo video (full pitch and demonstration) | [Watch on YouTube](https://youtu.be/9oFCyjG2bRc) |
| RunPod endpoint | Not used (see [How We Use RunPod](#how-we-use-runpod)) |
| Pitch slides (Final) | [Pitch slides on Google Drive](https://drive.google.com/drive/folders/1JVvEamFFgHteVy2LUkIj9ocRPA2Yt4Kl) |
| Backup demo video | [Backup demo on Google Drive](https://drive.google.com/drive/folders/1JVvEamFFgHteVy2LUkIj9ocRPA2Yt4Kl) |
| Final Project & Prototype Report | [SDC2026_Yaponomics_Final.pdf](submission/SDC2026_Yaponomics_Final.pdf) |
| Technical & Tools Declaration (Final) | [SDC2026_Yaponomics_TechDeclaration.pdf](submission/SDC2026_Yaponomics_TechDeclaration.pdf) |
| Pitch and report numbers (Excel) | [docs/yapoz-numbers.xlsx](docs/yapoz-numbers.xlsx) |
| Preliminary submission | [Project proposal](submission/SDC2026_Yaponomics_Preliminary_Submission.pdf) |
| Preliminary slide deck | [Yapoz-Pitch Slide Deck.pdf](submission/Yapoz-Pitch%20Slide%20Deck.pdf) |
| Technical & Tools Declaration (Preliminary) | [Tools declaration](submission/SDC2026_Yaponomics_Technical%20Tools%20Declaration.pdf) |

## Overview

### Problem

A customer asks, “Can I order two of these for tomorrow?” Before confirming, the owner must identify the product, check availability, work out the price, collect missing details and record the order, and a receipt may arrive later in another message. For a small team that is also serving customers, these repeated steps leave information scattered across chats, spreadsheets and notes. MSMEs make up **39.7% of Malaysia's GDP and 48.7% of employment in 2025** (DOSM, medium firms included), and Khazanah Research Institute (May 2026) finds digital adoption concentrated in sales, marketing and payments with weak back-end integration, which is the gap we address.

### Solution

We bring the order journey into one workspace:

**Customer request → relevant business data → AI and rules → authorised approval → visible, recorded outcome.**

AI interprets the request and calls defined business tools. Backend rules validate catalogue items, calculate item prices and check availability. The order stays pending until an authorised person confirms it. Receipt analysis helps staff review submitted information, and order changes leave an activity record.

### Key Features

- **Structured orders:** convert conversations into items, quantities and fulfilment details, with clarification when information is missing.
- **Business-grounded responses:** use each business's catalogue, opening hours and policies.
- **Human approval:** Owner and Service users review pending orders before confirmation; the backend rechecks stock.
- **Stock modes:** items can be "Made to order", "Daily quantity" (a fresh count each business day, with future days set on Today) or "Count stock" (on-hand count). Defaults live in Settings → Stock; items can override them in Knowledge.
- **Stock holds:** a pending order holds its stock. With payments on, the hold lasts 20 minutes unless a receipt passes checks. Availability tools return stock status and quantity limits from database records; those limits constrain order creation.
- **Receipt review:** compare extracted receipt information with the order and configured account details, highlighting inconsistencies and possible duplicates.
- **Answers from taught FAQs:** the AI searches the owner's FAQs before it escalates. Matching FAQs are handed to it up front, and an escalation the customer may still answer is held instead of sent straight to staff.
- **No false receipts:** a file that was not saved is flagged in the chat, the prompt forbids the AI from saying it received it, and a reply that does is replaced with an honest one.
- **Traceable outcomes:** display order status, handling information and timestamps, with backend events recording actions.
- **Reusable workspaces:** configure different catalogues, product options and policies without rebuilding the workflow.
- **Appointments:** customers book services in chat; availability tools find free times within opening hours and staff hours, excluding other bookings, staff approve bookings like orders, online services get a meeting link, reminders go out before the start, and staff mark attendance on the Calendar.
- **Website simulator:** test customer text requests through the same conversation pipeline without a messaging account.

AI replies may still be inaccurate. Catalogue tools, backend checks, FAQ retrieval and staff escalation reduce this risk; they do not eliminate it.

Receipt analysis is advisory. It does not authenticate a receipt, access a bank account or prove payment. **Mark paid** records a staff decision; Yapoz does not process real payments. Staff agree delivery fees separately from catalogue item prices.

Staff can also ask a customer for another receipt with a reason ("pay the remaining RM 10"); the chat then waits for it and the AI knows what to expect. An **Activity** page logs every action with who did it, and each order explains why it needs attention and whether the customer was actually notified.

### New Accounts and Setup

Sign-up has a Cloudflare Turnstile human check, then a 6-digit emailed code (`/verify`, valid 15 minutes, five tries): nobody can sign in until it's entered, and signing in to an unverified account sends a new code. Invited staff skip this. Without `RESEND_API_KEY`, local dev prints the code in the server console. After that, setup is compulsory for owners: until it's finished, `proxy.ts` only opens setup and the pages it links to, and it can't finish without business basics and at least one knowledge entry.

### Orbyte Fit and Reuse

We designed Yapoz as a potential customer-order module for Orbyte. Orbyte's homepage shows modules for the inside of a business (People, Work, eSign, Hiring and Connect); Yapoz would add the customer side: WhatsApp and Telegram orders that staff approve. It doesn't copy Orbyte's HR or admin functions, and it's order automation with human approval, not a chatbot.

Our proposed integration would use business workspace and role information through Connect, then share approved order events with relevant connected services. A usage charge per completed order would suit Orbyte's pay-when-work-happens credit wallet. This comes from Orbyte's public homepage and hasn't been confirmed by Orbyte. Yapoz isn't an Orbyte partner.

**This integration is proposed, not live.** These interfaces are our design assumptions, not verified Orbyte API endpoints. Our prototype demonstrates its own workflow using synthetic data. The assumed workspace and role data coming in, the order events going out, and the questions we would put to Orbyte are written up in [docs/orbyte-integration.md](docs/orbyte-integration.md).

**Events we would send.** `src/lib/orbyte.ts` builds four events, each checked by a test: order waiting for approval (`yapoz.order.pending_approval.v1`), approved, rejected and order completed (a usage event for the credit wallet). A rejection must carry a reason code, plus a written reason when the code is "Other": the server refuses one without it, and the reason travels in the event. HMAC-SHA256 signing logic is implemented for a proposed per-business secret. Staff can see every event an order has reached under **Details → Orbyte events** on its card, and a read-only route (`/api/orders/[id]/orbyte`) returns the same preview. **Nothing is sent anywhere**: there is no outbox or sender yet, because we have no Orbyte endpoint to send to.

**What we saw in Orbyte.** In the committee's demo workspace we looked through the dashboard without changing anything. Its Pending Actions queue is split into Submit, Review and Approve, users carry Approver and Reviewer flags, the Wallet holds shared credits, and the Integrations tab activates Documenso and lists failed sync jobs. Projects can already come from Azure DevOps through a source column and a Sync all button, so a Yapoz source would follow a pattern Orbyte already has. No screen for registering an outside app, and no webhook or API page, was visible to that account. We therefore map our events to those screens and treat the connection itself as an assumption.

A bakery, gift shop or retailer could use the same request, validation, approval and logging process with a different catalogue. We include three fictional sample businesses: **Forno Sette** (`FORNO7`, a pizzeria), **Kasih Hair Studio** (`KASIH1`, a salon) and **Dapur Mak Long Catering** (`CATER1`, built through the normal setup import with no business-specific code; what it could not do is listed in [docs/third-business-gaps.md](docs/third-business-gaps.md)). Use Forno Sette for the order demonstration.

### Expected Impact and SDG

**What we measured.** `npm run measure -- --synthetic` places 20 synthetic orders through the real order, receipt and approval code and reports the Phase 1 measures from what the system recorded (results, method and limits in [docs/phase2-results.md](docs/phase2-results.md)). The same figures are shown to owners on the Today page, computed from their own records.

| Phase 1 measure | Baseline | Target | Synthetic result |
| --- | --- | --- | --- |
| Manual steps per order | 5 | 1 | **1.10** on average (78% fewer); **target not met**, because a short payment needs one extra step |
| Orders priced and stock-checked | by hand | at least 90% | 20 of 20 |
| Receipts checked for amount, payee, date and reuse | by hand | 100% | 22 of 22 |

**These are not real-world results.** We chose the mix of orders (16 clean, 2 short payments, 1 wrong payee, 1 reused receipt), the AI was left out of the run, and nobody outside the team took part. Our Phase 1 slide-deck target, a **30% cut in staff handling time per order**, is **still unmeasured**: we did not time a manual baseline, so we make no time-saved claim. The 80% step reduction we aimed for was 78% in this run.

The five-step manual baseline is a defined comparison from our preliminary proposal, not a measured owner study. Recorded staff actions in the synthetic run do not capture every cognitive task or time spent reviewing a screen.

- **SDG 8.2:** improve productivity through technological upgrading and innovation.
- **SDG 8.3:** support entrepreneurship and the growth of micro and small enterprises.

Our proposed commercial model is a free entry tier with a usage charge per completed order, not per seat, paid through credits if offered through Orbyte. Pricing and business impact remain to be validated.

### Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS and Radix UI |
| Backend | Next.js route handlers, business tools and validation rules |
| Database | PostgreSQL hosted on Supabase, with Drizzle ORM |
| AI for the demo | KrackedDevs sponsor gateway first (`gpt-5.4-nano` / `gpt-5.4-mini`), with Groq and Google Gemini fallbacks |
| Messaging | WhatsApp Cloud API (Embedded Signup or manual credentials) and Telegram connectors; website simulator |
| Authentication | Password-based sign-in, signed sessions and workspace/role checks |
| Development | Replit Agent for the initial code; Claude/Claude Code and Codex for development assistance |
| Hosting | Vercel |
| Online appointments | Jitsi Meet room links; optional Google Calendar connection |
| Sign-up services | Cloudflare Turnstile and Resend |

The team confirms that the deployed KrackedDevs gateway uses `gpt-5.4-nano` for fast turns and `gpt-5.4-mini` for harder turns. Groq defaults to `openai/gpt-oss-20b` / `openai/gpt-oss-120b`; Gemini selects available Flash/Flash-Lite models unless pinned. Activity records identify the model used for individual replies. Other optional adapters in the router are not evidence of demo use. Sponsor-credit expiry, provider outages and free-tier quotas can affect replies; fallback success is not guaranteed.

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/app/` | Public pages, staff dashboards and API routes |
| `src/components/site/simulator.tsx` | Homepage customer simulator |
| `src/agent/` | AI routing, shared conversation pipeline and tools |
| `src/channels/` | Messaging adapters and connection handling |
| `src/lib/orders.ts` | Order transitions, stock handling and events |
| `src/lib/orbyte.ts` | Builds and signs the four Orbyte event payloads; nothing is sent |
| `src/lib/stock.ts` | Stock modes, holds, availability, expiry and low-stock alerts |
| `src/lib/receipts.ts` | Receipt extraction and consistency checks |
| `src/db/` and `drizzle/` | Database schema, access and migrations |
| `src/seed/` | Fictional businesses and synthetic sample records |
| `scripts/` | Database, worker and channel utilities |
| `tests/` | Automated tests |
| `docs/` | Orbyte assumptions, Phase 2 results, privacy audit, third-business gaps, integration notes |
| `public/` and `film/` | Public assets and landing-page film sources |
| `submission/` | Proposal, tools declaration, slides and Replit proof |
| `.env.example` | Environment-variable reference |
| `package.json` | Dependencies and runnable scripts |
| `LICENSE` | Apache License 2.0 |

### Architecture

1. A channel webhook or `/api/simulator/message` receives the customer request.
2. Our shared pipeline stores the conversation and retrieves the relevant workspace context.
3. The AI calls business tools; backend rules validate catalogue items, quantities and prices.
4. PostgreSQL stores the pending order and holds its stock.
5. An authorised staff action rechecks stock, confirms the order (taking the stock) and records events. Reject or cancel gives the stock back.
6. The dashboard displays the outcome, and the originating channel is used for customer notifications where configured.

Receipt attachments from supported messaging channels follow an extraction and checking path associated with the order. The homepage simulator accepts text only.

## How to Run

### Option 1 — Hosted Demo for Judges

The website simulator and demo dashboard can be inspected without WhatsApp test-number approval.

#### 1. Open the staff dashboard

Visit [the login page](https://yapoz.vercel.app/login) and choose the **Owner** or **Service** demo option. Use workspace `FORNO7` if prompted.

| Role | Email | Default demo password | Workspace |
| --- | --- | --- | --- |
| Owner | `owner@demo` | `forno7demo` | `FORNO7` |
| Service | `service@demo` | `forno7demo` | `FORNO7` |

These are public test accounts for synthetic data. Use the current demo options displayed on the login page if the deployed credentials differ.

#### 2. Send a customer request

1. Keep the dashboard open in one tab.
2. In another tab, open [Ring the bell](https://yapoz.vercel.app/#ring). Scroll to that section if the page does not jump there.
3. Select **Forno Sette**.
4. Ask: **“What pizzas and sizes are available?”**
5. Request an available item and size from the reply, including a quantity and pickup time. Answer any clarification using made-up details.
6. Return to **Inbox** to inspect the Simulator conversation, then **Orders** to inspect the pending order.

The widget's WhatsApp and Telegram appearances are visual styles for the website simulator. They are not messages sent through those external platforms.

#### 3. Review receipt advice and approve a sample order

The homepage simulator has no receipt-upload control. If a receipt is required by the workspace, a newly created simulator order cannot be confirmed until a receipt is attached through a supported route.

For independent receipt-review testing, open **Orders** and inspect the separate seeded examples:

- **`ORD-DEMO`:** a pending order with a matching synthetic receipt.
- **`ORD-DEMA`:** a pending order with a receipt amount short by RM10.

Review the findings, then use **Confirm order** on an appropriate pending sample order. Inspect its changed status, handling information and timestamps. A receipt mismatch can trigger an additional warning, but the checks remain advisory. **Mark paid** is a separate staff action.

These are pre-seeded synthetic examples, not the order just created in the simulator or a newly executed receipt-extraction test. The demo workspace is shared, so another reviewer may have already changed an example's status. Existing timelines remain available for inspection.

#### Team-led live demonstration: one complete order

For the live pitch, use a connected Telegram bot or the team-authorised WhatsApp test account with a synthetic business. Keep the customer chat and matching staff workspace open.

1. Send a new order request and answer any clarification with made-up details.
2. Show the pending order and its catalogue-derived price.
3. Send a clearly labelled synthetic receipt in the same customer conversation for that exact order reference.
4. Show the new receipt findings on that order. Explain that they are consistency checks, not bank verification.
5. Have an authorised staff user approve the order; show the customer notification and updated status.
6. Open Activity and show the entries for the action just performed. Be ready to demonstrate rejection with a separate test order.

This is the live-demo procedure to rehearse. The seeded receipt examples above are independent inspection aids and do not replace uploading a new receipt during this full journey. No real money should move.

#### Judge access and WhatsApp restrictions

**Our WhatsApp test number is restricted to team-authorised accounts and is not available for independent judging. Judges do not need WhatsApp access.**

1. Open [the login page](https://yapoz.vercel.app/login) and choose the **Owner** or **Service** demo account shown there. Use the Forno Sette workspace (`FORNO7`) if prompted.
2. Open **Inbox** and **Orders** to inspect synthetic conversations, order details, receipt advice, staff approval actions and activity records.
3. To submit a new customer text request, open [“Ring the bell” on the homepage](https://yapoz.vercel.app/#ring) in a second tab and select **Forno Sette**, then return to the dashboard to review the result.
4. For receipt review and approval, follow the seeded sample-order instructions above. The homepage simulator accepts text only; it does not upload receipts.

Our personal WhatsApp test conversations and numbers are kept separate from the judges' demo workspace. The demonstration records available to judges are synthetic. The [pitch video](https://youtu.be/9oFCyjG2bRc) demonstrates our connected WhatsApp workflow.

Please use only made-up information when testing. No real payment is required or processed.

#### Troubleshooting

| Symptom | What to check |
| --- | --- |
| New order is not visible | Ensure both tabs use Forno Sette / `FORNO7`; check Inbox for missing information, unavailable stock or tool errors. |
| Confirm order is disabled | Check receipt requirements, current status, stock (including holds from other pending orders) and account permissions. |
| Reply says "sold out" but stock looks free | Other pending orders hold stock. Check Orders for pending holds; payment holds normally expire after 20 minutes unless extended or secured by a passing receipt. |
| Repeated handoff or delayed AI response | Providers may be unavailable or rate-limited. Review **Needs you** and the conversation in Inbox. |
| AI stays silent after a staff reply | Staff takeover pauses AI. When appropriate, use **Hand back to AI** in Inbox; resolving the task alone does not necessarily resume replies. |
| Simulator reports a limit | Pause before retrying; public requests are rate-limited. |
| A seeded order is already confirmed | Inspect its status history or another sample order. Avoid resetting shared data during judging. |

### Option 2 — Run Locally

Prerequisites: Node.js 20.9 or later, npm, PostgreSQL 15 or later, and credentials for a supported AI provider. Receipt extraction requires a configured provider/model that supports the relevant image or document inputs.

```bash
git clone https://github.com/Ramilbey/yapoz.git
cd yapoz
npm ci
cp .env.example .env.local
```

On Windows, copy `.env.example` to `.env.local` through your editor or file manager if needed. Configure:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | `http://localhost:3000` locally; public HTTPS origin in deployment |
| `DATABASE_URL` | Development PostgreSQL connection |
| `DATABASE_URL_LISTEN` | Direct/session-capable connection for migrations and live updates when using a transaction pooler |
| `AUTH_SECRET` | Random session-signing secret of at least 32 characters |
| `APP_ENCRYPTION_KEY` | Encryption key for saved integration credentials |
| `GROQ_API_KEY` | Groq access for the demo's AI routing |
| `GEMINI_API_KEY` | Google Gemini access, including supported vision requests |
| `KRACKEDDEVS_API_KEY` | Opt-in hackathon LiteLLM gateway key; with a fast model set it is tried first, and the providers above stay as fallbacks |
| `KRACKEDDEVS_BASE_URL` | Gateway base URL (default `https://litellm.rapidscreen.io/v1`) |
| `KRACKEDDEVS_FAST_MODEL` | Model for everyday replies (`gpt-5.4-nano`); required to enable the gateway |
| `KRACKEDDEVS_SMART_MODEL` | Model for harder turns (`gpt-5.4-mini`); defaults to the fast model |
| `KRACKEDDEVS_VISION` | `true` lets the gateway read images such as receipts |
| `KRACKEDDEVS_TIMEOUT_MS` | Gateway request timeout (default 12000) |
| `DEMO_MODE` | `true` for the synthetic demonstration |
| `DEMO_WORKSPACE_ID` | `FORNO7` |
| `DEMO_PASSWORD` | Password for locally seeded demo users |

Generate `AUTH_SECRET` with `openssl rand -base64 48` and `APP_ENCRYPTION_KEY` with `openssl rand -base64 32`. Keep environment values on individual lines without trailing inline comments; the command-line script loader does not strip those comments.

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/login. Use a dedicated development database; seeding creates sample businesses and demonstration records. `npm run fonts` optionally downloads additional display fonts.

For a production build:

```bash
npm run build
npm start
```

### Option 3 — Run on Replit

Import this repository into a Node.js-capable Replit project. Install dependencies, configure the environment variables through Replit Secrets, connect a development PostgreSQL database, apply migrations, seed the sample data and configure the run command as `npm run dev`.

The repository does not include a `.replit` run configuration. Our current public deployment is on Vercel.

### Run Tests

The suite has over 250 automated tests in 36 files (`npm test`). Our tests cover areas including business tools, order transitions and the approval gate, receipt checks, FAQ matching, unsaved-file handling, AI routing and failure handling, onboarding, channel logic, tenant isolation, prompt-injection handling, data export and retention, and the Orbyte event payloads. Some tests call the configured AI providers, so a provider's rate limit can fail a run; mocked API tests do not replace live channel testing.

Use a dedicated test database with the required schema and sample data:

```bash
npm run typecheck
npm test
npm run build
```

Some tests write to the database. Do not run them against the shared judging deployment. `npm run db:reset` drops and recreates database schemas before seeding; use it only on a disposable local/test database.

## How We Use Replit

Replit use is optional under the updated organiser instruction communicated to the team. We retain this disclosure because we used it.

We used **Replit Agent to create the initial application structure and base code**. After our available credits were exhausted, we continued development using Claude/Claude Code and Codex, with the code maintained in GitHub and deployed on Vercel.

Our [proof of use](submission/Replit%20Usage%20Proof.pdf) shows the Gameelacademy account, the **WhatsApp SME Order Desk** project and the exhausted-credit notice. Replit was our initial development platform; Vercel hosts the submitted application.

## How We Use RunPod

**Not applicable to our implementation.** We did not train or fine-tune models, self-host inference, or perform other team-operated GPU work. We accessed hosted models through the KrackedDevs gateway, Groq and Google Gemini APIs, so we did not use a RunPod endpoint.

## Challenges & Learnings

- **Interpreting incomplete requests:** we combined AI interpretation with catalogue validation and clarification, rather than allowing the model to determine prices.
- **Keeping people in control:** we kept orders pending until authorised staff confirmation and recorded consequential changes.
- **Reviewing receipts responsibly:** we separated consistency checks from actual payment verification.
- **Handling provider limits:** we used provider routing and human takeover to handle AI failures; free-tier availability remains a limitation.
- **Making judging accessible:** we provided the homepage text simulator and seeded receipt examples alongside our restricted WhatsApp test connection.
- **Supporting different SMEs:** we separated business configuration from the common order workflow.

### Data and Responsible Use

Our seeded judging demonstration uses team-created synthetic customer, business and receipt data. Live team testing can also store testers' display names, account identifiers, phone numbers or email addresses; those identifiers are personal data, even when the business scenario is fictional. Seeded conversations and dashboard activity are demonstration records, not evidence of real customers, sales or measured impact.

We use workspace/role checks, signed sessions and encrypted stored channel credentials. Messages and attachments processed by AI may be sent to configured third-party providers. Owners can configure retention; it is off by default. Eligible conversations are purged and finished orders anonymised. Joining an appointment room connects participants to Jitsi under its service terms. The KrackedDevs gateway's downstream retention and training terms have not been confirmed.

Before real deployment, we would review data-purpose notices, consent where required, data minimisation, access permissions, retention/deletion rules and provider data-handling arrangements. We do not claim completed PDPA certification or legal compliance. Real payments, statutory submissions and legal/financial advice are outside this demonstration.

### AI-Assisted Development and Attribution

We used Replit Agent, Claude/Claude Code and Codex to assist development, and ChatGPT and Claude to assist presentation and documentation work. We reviewed the outputs and take responsibility for the submitted project. Our Technical & Tools Declaration provides the detailed record of tools and third-party resources.

Dependencies appear in `package.json` and `package-lock.json`. Third-party libraries, models, services and assets retain their respective licences and terms.

## Future Improvements

- Validate the workflow with SME owners and first-time users.
- Measure handling time and error rates across the same 20 synthetic scenarios.
- Add a clearly labelled synthetic receipt-upload path to the website simulator.
- Build the outbox and sender for the Orbyte events (retries, and a failed-delivery list), and test them against Orbyte once its interfaces are confirmed.
- Improve response latency, provider resilience and error explanations.
- Complete relevant platform approvals and broaden independent channel testing.
- Validate usage-based pricing and production data-handling controls.

## Team

| Name | Role | GitHub |
| --- | --- | --- |
| Abdulrahman Imaad Mohamed | Team leader; application development and integrations, including WhatsApp | [@ImaddyM2819](https://github.com/ImaddyM2819) |
| Gameel Abduljalil Yousef Al-Bazeli | Application development and integrations, including WhatsApp | [@gameelaj](https://github.com/gameelaj) |
| Ramil Kutlimuratov | Application development and integrations, including WhatsApp | [@Ramilbey](https://github.com/Ramilbey) |
| Omer Muawia Mohamed Salih | Presentation, pitch, demonstration and slide deck | [@silknox](https://github.com/silknox) |
| Asanali Ashimov | Presentation, pitch, demonstration and slide deck | [@gameelacademy](https://github.com/gameelacademy) |

## Submission Documents

The finalist package requires an updated PRD, Technical & Tools Declaration, final report, repository, final slides, YouTube backup pitch and live-demo materials. Links to the available materials appear above. Final slides must be supplied as PPTX and flattened PDF; the HTML presentation is an additional format. The [shared materials folder](https://drive.google.com/drive/folders/1JVvEamFFgHteVy2LUkIj9ocRPA2Yt4Kl) contains the presentation and backup-video materials.

### Updated PRD

The updated PRD is a separate required deliverable. It must describe the revised requirements, scope, changes since the preliminary round and reasons for those changes. It is not yet included in this repository snapshot; the preliminary proposal below is not a replacement.

| File in `submission/` | Purpose |
| --- | --- |
| [`SDC2026_Yaponomics_Final.pdf`](submission/SDC2026_Yaponomics_Final.pdf) | Final Project & Prototype Report |
| [`SDC2026_Yaponomics_TechDeclaration.pdf`](submission/SDC2026_Yaponomics_TechDeclaration.pdf) | Technical & Tools Declaration for the Final |
| `SDC2026_Yaponomics_Preliminary_Submission.pdf` | Official preliminary proposal |
| `SDC2026_Yaponomics_Technical Tools Declaration.pdf` | Preliminary technical stack, APIs, tools and resource declarations |
| `Yapoz-Pitch Slide Deck.pdf` | Presentation slides from the preliminary round |
| `Replit Usage Proof.pdf` | Replit proof of use |

## Submission Checklist

This checklist distinguishes available files from remaining finalisation work. Update it when each action is actually complete.

- [x] Team name, Domain 2 and SDG track filled in
- [x] Repository, live prototype, judging instructions and demo logins documented
- [x] Presentation folder, YouTube pitch and backup-video links added
- [x] Replit usage disclosed; RunPod non-use explained
- [x] Preliminary proposal and historical declarations retained
- [x] Final report and final tools-declaration filenames linked
- [x] Replace the repository PDFs with the corrected, signed final report and tools declaration
- [ ] Add and link the separate updated PRD
- [x] Upload final PPTX and flattened PDF slide exports
- [x] Verify the final video and file links in a signed-out browser
- [x] Verify local installation on a clean machine and retain the final test/build results
- [x] Rehearse the live journey using one new order and its newly uploaded synthetic receipt
- [ ] Confirm committee repository access and all required portal attachments

Only synthetic demo-account credentials are intentionally public. Keep production secrets out of committed files and history.

## References

- [DOSM: Micro, Small & Medium Enterprises Performance 2025](https://www.dosm.gov.my/portal-main/release-content/micro-small--medium-enterprises-msmes-performance-2025)
- [Khazanah Research Institute: From Survival to Scale, May 2026](https://www.krinstitute.org/publications/from-survival-to-scale-digital-empowerment-for-malaysias-micro-and-small-enterprises)
- [Official SDC resources and Domain 2 brief](https://drive.google.com/drive/folders/1-RPEyUik2nHSz6DvFVVe22SBYXEqj965)

## License

This project is licensed under the [Apache License 2.0](LICENSE). Third-party dependencies and assets retain their own licences.
