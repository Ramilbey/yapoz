# Yapoz

> Customer chats into reviewable orders.

We built Yapoz to help Malaysian micro and small businesses turn customer conversations into structured orders that staff can review, approve and track. Our focus is the repeated manual work between receiving a message and confirming an accurate order.

**SDC Hackathon 2026 · Domain 2 · Orbyte Smart SME Challenge: Less Busywork, Better Business**

## Team Information

| Field | Details |
| --- | --- |
| Team name | Yaponomics |
| Project | Yapoz |
| Domain | Domain 2 — Alpha Red Solutions Sdn Bhd |
| SDG track | SDG 8 — Decent Work and Economic Growth; targets 8.2 and 8.3 |
| Team leader | Abdulrahman Imaad Mohamed |
| University | Xiamen University Malaysia |
| Team size | 5 members |

## Links

| Resource | Link |
| --- | --- |
| GitHub repository | [Ramilbey/yapoz](https://github.com/Ramilbey/yapoz) |
| Live application | [yapoz.vercel.app](https://yapoz.vercel.app) |
| Staff login | [Demo accounts](https://yapoz.vercel.app/login) |
| Customer simulator | [Ring the bell](https://yapoz.vercel.app/#ring) |
| Full pitch and demonstration | [Watch on YouTube](https://youtu.be/9oFCyjG2bRc) |
| Slide deck | [Yapoz-Pitch Slide Deck.pdf](submission/Yapoz-Pitch%20Slide%20Deck.pdf) |
| Preliminary submission | [Project proposal](submission/SDC2026_Yaponomics_Preliminary_Submission.pdf) |
| Technical & Tools Declaration | [Tools declaration](submission/SDC2026_Yaponomics_Technical%20Tools%20Declaration.pdf) |

## Overview

### Problem

A customer asks, “Can I order two of these for tomorrow?” Before confirming, the owner must identify the product, check availability, calculate the price, collect missing details and record the order. A receipt may arrive later in another message. For a small team already serving customers and running the shop, these repeated steps compete for attention and leave information scattered across chats, spreadsheets and notes.

DOSM reports that MSMEs contributed **39.7% of Malaysia's GDP and 48.7% of employment in 2025**. Those figures include medium enterprises; our initial users are micro and small businesses. Khazanah Research Institute's May 2026 paper identifies digital adoption concentrated in sales, marketing and payments, with weaker back-end integration. We address the gap between customer conversations and internal order handling.

### Solution

We bring the order journey into one workspace:

**Customer request → relevant business data → AI and rules → authorised approval → visible, recorded outcome.**

AI interprets the request and calls defined business tools. Backend rules validate catalogue items, calculate item prices and check availability. The order stays pending until an authorised person confirms it. Receipt analysis helps staff review submitted information, and order changes leave an activity record.

### Key Features

- **Structured orders:** convert conversations into items, quantities and fulfilment details, with clarification when information is missing.
- **Business-grounded responses:** use each business's catalogue, opening hours and policies.
- **Human approval:** Owner and Service users review pending orders before confirmation; the backend rechecks stock.
- **Receipt review:** compare extracted receipt information with the order and configured account details, highlighting inconsistencies and possible duplicates.
- **Traceable outcomes:** display order status, handling information and timestamps, with backend events recording actions.
- **Reusable workspaces:** configure different catalogues, product options and policies without rebuilding the workflow.
- **Website simulator:** test customer text requests through the same conversation pipeline without a messaging account.

Receipt analysis is advisory. It does not authenticate a receipt, access a bank account or prove payment. **Mark paid** records a staff decision; Yapoz does not process real payments. Staff agree delivery fees separately from catalogue item prices.

The repository also includes booking and hiring functionality. Our Domain 2 submission focuses on customer-order automation; those additional modules are not the core innovation or demonstration.

### Orbyte Fit and Reuse

We designed Yapoz as a potential customer-order module for Orbyte. Our proposed integration would use business workspace and role information, then share approved order events with relevant connected inventory or accounting services.

**This integration is proposed, not live.** These interfaces are our design assumptions, not verified Orbyte API endpoints. Our prototype demonstrates its own workflow using synthetic data.

A bakery, gift shop or retailer could use the same request, validation, approval and logging process with a different catalogue. We include two fictional sample businesses: **Forno Sette** (`FORNO7`) and **Kasih Hair Studio** (`KASIH1`). Use Forno Sette for the order demonstration.

### Expected Impact and SDG

Our primary **Phase 2 target** is a **30% reduction in staff handling time per completed order**. We plan to compare manual handling and Yapoz across the same 20 synthetic order scenarios, measuring handling time, order-field errors and whether first-time users complete the workflow without assistance.

Our proposal also sets a separate target of reducing five routine manual steps to one approval step—an **80% reduction in step count** for straightforward orders. This is distinct from time saved; exceptions still require staff attention. Both percentages are targets, not measured results. We will establish the manual timing baseline during evaluation.

- **SDG 8.2:** improve productivity through technological upgrading and innovation.
- **SDG 8.3:** support entrepreneurship and the growth of micro and small enterprises.

Our proposed commercial model is a free entry tier with usage-based charges for completed workflows. Pricing and business impact remain to be validated.

### Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS and Radix UI |
| Backend | Next.js route handlers, business tools and validation rules |
| Database | PostgreSQL hosted on Supabase, with Drizzle ORM |
| AI for the demo | Groq and Google Gemini, using free-tier access |
| Messaging | WhatsApp Cloud API, Telegram and Instagram connectors; website simulator |
| Authentication | Password-based sign-in, signed sessions and workspace/role checks |
| Development | Replit Agent for the initial code; Claude/Claude Code and Codex for development assistance |
| Hosting | Vercel |

The provider router also contains optional adapters for other AI services. Their presence in the code does not mean they are used in this demo. Free-tier quotas can affect response times and availability.

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/app/` | Public pages, staff dashboards and API routes |
| `src/components/site/simulator.tsx` | Homepage customer simulator |
| `src/agent/` | AI routing, shared conversation pipeline and tools |
| `src/channels/` | Messaging adapters and connection handling |
| `src/lib/orders.ts` | Order transitions, stock handling and events |
| `src/lib/receipts.ts` | Receipt extraction and consistency checks |
| `src/db/` and `drizzle/` | Database schema, access and migrations |
| `src/seed/` | Fictional businesses and synthetic sample records |
| `scripts/` | Database, worker and channel utilities |
| `tests/` | Automated tests |
| `docs/` | Integration documentation |
| `public/` and `film/` | Public assets and landing-page film sources |
| `submission/` | Proposal, tools declaration, slides and Replit proof |
| `.env.example` | Environment-variable reference |
| `package.json` | Dependencies and runnable scripts |
| `LICENSE` | Apache License 2.0 |

### Architecture

1. A channel webhook or `/api/simulator/message` receives the customer request.
2. Our shared pipeline stores the conversation and retrieves the relevant workspace context.
3. The AI calls business tools; backend rules validate catalogue items, quantities and prices.
4. PostgreSQL stores the pending order.
5. An authorised staff action rechecks stock, confirms the order and records events.
6. The dashboard displays the outcome, and the originating channel is used for customer notifications where configured.

Receipt attachments from supported messaging channels follow an extraction and checking path associated with the order. The homepage simulator accepts text only.

## How to Run

### Option 1 — Hosted Demo for Judges

The website simulator and demo dashboard can be inspected without WhatsApp test-number approval.

#### 1. Open the staff dashboard

Visit [the login page](https://yapoz.vercel.app/login) and choose the **Owner** or **Service** demo option. Use workspace `FORNO7` if prompted. The HR desk is not part of the order demonstration.

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

The widget's WhatsApp, Telegram and Instagram appearances are visual styles for the website simulator. They are not messages sent through those external platforms.

#### 3. Review receipt advice and approve a sample order

The homepage simulator has no receipt-upload control. If a receipt is required by the workspace, a newly created simulator order cannot be confirmed until a receipt is attached through a supported route.

For independent receipt-review testing, open **Orders** and inspect the separate seeded examples:

- **`ORD-DEMO`:** a pending order with a matching synthetic receipt.
- **`ORD-DEMA`:** a pending order with a receipt amount short by RM10.

Review the findings, then use **Confirm order** on an appropriate pending sample order. Inspect its changed status, handling information and timestamps. A receipt mismatch can trigger an additional warning, but the checks remain advisory. **Mark paid** is a separate staff action.

These are pre-seeded synthetic examples, not the order just created in the simulator or a newly executed receipt-extraction test. The demo workspace is shared, so another reviewer may have already changed an example's status. Existing timelines remain available for inspection.

#### Judge access and WhatsApp restrictions

**Our WhatsApp test number is restricted to team-authorised accounts and is not available for independent judging. Judges do not need WhatsApp access.**

1. Open [the login page](https://yapoz.vercel.app/login) and choose the **Owner** or **Service** demo account shown there. Use the Forno Sette workspace (`FORNO7`) if prompted.
2. Open **Inbox** and **Orders** to inspect synthetic conversations, order details, receipt advice, staff approval actions and activity records.
3. To submit a new customer text request, open [“Ring the bell” on the homepage](https://yapoz.vercel.app/#ring) in a second tab and select **Forno Sette**, then return to the dashboard to review the result.
4. For receipt review and approval, follow the seeded sample-order instructions above. The homepage simulator accepts text only; it does not upload receipts.

Our personal WhatsApp test conversations and numbers are kept separate from the judges' demo workspace. The demonstration records available to judges are synthetic. The [pitch video](https://youtu.be/2q-eszpy0OI) demonstrates our connected WhatsApp workflow.

Please use only made-up information when testing. No real payment is required or processed.

#### Troubleshooting

| Symptom | What to check |
| --- | --- |
| New order is not visible | Ensure both tabs use Forno Sette / `FORNO7`; check Inbox for missing information, unavailable stock or tool errors. |
| Confirm order is disabled | Check receipt requirements, current status, stock and account permissions. |
| Repeated handoff or delayed AI response | Free-tier providers may be unavailable or rate-limited. Review **Needs you** and retry later. |
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

We ran **110 automated tests, and all passed**. Our tests cover areas including business tools, order transitions, receipt checks, AI routing and failure handling, onboarding and channel integration logic. Mocked API tests do not replace live channel testing.

Use a dedicated test database with the required schema and sample data:

```bash
npm run typecheck
npm test
npm run build
```

Some tests write to the database. Do not run them against the shared judging deployment. `npm run db:reset` drops and recreates database schemas before seeding; use it only on a disposable local/test database.

## How We Use Replit

We used **Replit Agent to create the initial application structure and base code**. After our available credits were exhausted, we continued development using Claude/Claude Code and Codex, with the code maintained in GitHub and deployed on Vercel.

Our [proof of use](submission/Replit%20Usage%20Proof.pdf) shows the Gameelacademy account, the **WhatsApp SME Order Desk** project and the exhausted-credit notice. Replit was our initial development platform; Vercel hosts the submitted application.

## How We Use RunPod

**Not applicable to our implementation.** We did not train or fine-tune models, self-host inference, or perform other team-operated GPU work. We accessed hosted models through Groq and Google Gemini APIs, so we did not use a RunPod endpoint.

## Challenges & Learnings

- **Interpreting incomplete requests:** we combined AI interpretation with catalogue validation and clarification, rather than allowing the model to determine prices.
- **Keeping people in control:** we kept orders pending until authorised staff confirmation and recorded consequential changes.
- **Reviewing receipts responsibly:** we separated consistency checks from actual payment verification.
- **Handling provider limits:** we used provider routing and human takeover to handle AI failures; free-tier availability remains a limitation.
- **Making judging accessible:** we provided the homepage text simulator and seeded receipt examples alongside our restricted WhatsApp test connection.
- **Supporting different SMEs:** we separated business configuration from the common order workflow.

### Data and Responsible Use

Our demonstration uses team-created synthetic customer, business and receipt data. Seeded conversations and dashboard activity are demonstration records, not evidence of real customers, sales or measured impact.

We use workspace/role checks, signed sessions and encrypted stored channel credentials. Messages and attachments processed by AI may be sent to configured third-party providers.

Before real deployment, we would review data-purpose notices, consent where required, data minimisation, access permissions, retention/deletion rules and provider data-handling arrangements. We do not claim completed PDPA certification or legal compliance. Real payments, statutory submissions and legal/financial advice are outside this demonstration.

### AI-Assisted Development and Attribution

We used Replit Agent, Claude/Claude Code and Codex to assist development, and ChatGPT and Claude to assist presentation and documentation work. We reviewed the outputs and take responsibility for the submitted project. Our Technical & Tools Declaration provides the detailed record of tools and third-party resources.

Dependencies appear in `package.json` and `package-lock.json`. Third-party libraries, models, services and assets retain their respective licences and terms.

## Future Improvements

- Validate the workflow with SME owners and first-time users.
- Measure handling time and error rates across the same 20 synthetic scenarios.
- Add a clearly labelled synthetic receipt-upload path to the website simulator.
- Implement and test the proposed Orbyte integration once its interfaces are confirmed.
- Improve response latency, provider resilience and error explanations.
- Complete relevant platform approvals and broaden independent channel testing.
- Validate usage-based pricing and production data-handling controls.

## Team

| Member | Contribution |
| --- | --- |
| Abdulrahman Imaad Mohamed — Team leader | Application development and integrations, including WhatsApp |
| Gameel Abduljalil Yousef Al-Bazeli | Application development and integrations, including WhatsApp |
| Ramil Kutlimuratov | Application development and integrations, including WhatsApp |
| Omer Muawia Mohamed Salih | Presentation, pitch, demonstration and slide deck |
| Asanali Ashimov | Presentation, pitch, demonstration and slide deck |

## Submission Documents

Our submission comprises the source repository, live prototype, slide deck, preliminary proposal, Technical & Tools Declaration and complete YouTube pitch with demonstration. The document links appear at the top of this README.

| File in `submission/` | Purpose |
| --- | --- |
| `SDC2026_Yaponomics_Preliminary_Submission.pdf` | Official preliminary proposal |
| `SDC2026_Yaponomics_Technical Tools Declaration.pdf` | Technical stack, APIs, tools and resource declarations |
| `Yapoz-Pitch Slide Deck.pdf` | Presentation slides |
| `Replit Usage Proof.pdf` | Replit proof of use |

## References

- [DOSM: Micro, Small & Medium Enterprises Performance 2025](https://www.dosm.gov.my/portal-main/release-content/micro-small--medium-enterprises-msmes-performance-2025)
- [Khazanah Research Institute: From Survival to Scale, May 2026](https://www.krinstitute.org/publications/from-survival-to-scale-digital-empowerment-for-malaysias-micro-and-small-enterprises)
- [Official SDC resources and Domain 2 brief](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef)

## License

This project is licensed under the [Apache License 2.0](LICENSE). Third-party dependencies and assets retain their own licences.
