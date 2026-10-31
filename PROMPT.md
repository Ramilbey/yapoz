# BUILD PROMPT — JAWAB (working name)
**AI front desk for businesses on Telegram and WhatsApp, with a hiring agent and role-based dashboards.**

> Paste this whole file into Claude Code (or keep it in the repo root as `PROMPT.md`). Fill in the `{{placeholders}}` in section 0 first.

---

## 0. Fill these in
- Hackathon: SDC Hackathon. Demo date `{{DATE}}`, pitch length `{{MINUTES}}` min
- Demo city / district / currency: `{{CITY}}`, `{{DISTRICT}}`, `{{CURRENCY}}`
- Languages the agent must handle: `{{e.g. English, Uzbek (Latin + Cyrillic), Russian, Malay}}`
- Team Telegram / WhatsApp test numbers for the live demo: `{{...}}`

---

## 1. Your role
You are the lead engineer and creative technologist on a hackathon team. Build a **working product, not a mockup**. Every screen in the demo path must be backed by real data and real API calls. Where a third-party approval can't land before demo day, build a graceful fallback (see the Simulator), never a fake.

When something can't be done the way this prompt describes, tell me and propose the closest workable path. Ask before adding any paid service. Never commit secrets.

---

## 2. The product in one paragraph
Jawab answers a business's customer messages on Telegram and WhatsApp using **only that business's own information**: products, sizes, colors, stock, prices, services, hours, booking slots and policies. It books appointments, escalates anything sensitive to a human, and reports what customers ask. A second agent handles **hiring**: HR describes the role in plain language, Jawab ranks candidates from the business's own candidate sources, drafts the outreach and books the interview. **Every outbound hiring step waits for a human "Approve".**

---

## 3. Users, sign-in, roles
- One login page: **Workspace ID + email + password** (magic link optional).
- Roles decide the landing dashboard and navigation:
  - **Owner**: sees everything.
  - **Service**: inbox, escalations ("Needs you"), knowledge, bookings.
  - **HR**: hiring only.
- Seed three demo accounts in workspace `FORNO7`: `owner@demo`, `service@demo`, `hr@demo`.

---

## 4. Demo business (seed it richly, it is the star of the demo)
**Forno Sette**, a wood-fired pizzeria in `{{CITY}}`. Seed:
- **Menu**: 14 pizzas × sizes S/M/L with prices in `{{CURRENCY}}`, toppings, allergens, vegetarian/halal flags, daily stock flags (e.g. "Truffle: sold out today").
- **Merch** (so size/color questions are demoable): aprons and T-shirts in S–XL, 3 colors, stock per variant.
- **Hours** with holiday exceptions; delivery zones and fees; **table booking** (capacity per 30-min slot); catering / private events policy; payment methods; complaint and refund policy.
- **40 FAQs** written the way real customers type (typos, mixed languages, voice-to-text style).
- **Hiring**: open role "Pizza cook" plus **30 synthetic candidates** (varied experience, availability, districts, languages; mix of PDF resumes and plain-text channel posts).

---

## 5. Channels (one adapter interface, one agent pipeline)
Normalize every inbound event into:
`{ workspaceId, channel, externalThreadId, customer, text, attachments, receivedAt }`
and run it through a single pipeline. **Check each platform's current official docs before coding its adapter**; these APIs change often. Record version assumptions in `/docs/integrations.md`.

### 5.1 Telegram (primary live channel, must work flawlessly)
- Library: **grammY**, webhook mode, `secret_token` verification.
- **Mode A, public bot** from @BotFather: customers message the bot directly.
- **Mode B, Telegram Business connection**: enable Business Mode in BotFather; a Premium business account connects the bot under Settings → Business → Chatbots. Handle `business_connection` and `business_message` updates and reply with `business_connection_id`, so answers appear **from the shop's own account**. Respect the bot's granted rights and the 24-hour recent-chat limit. Ignore messages sent by the owner themself.
- Bots can only DM users who have started them, so **HR candidates apply through the bot** (`/apply`) and invites can reach them.

### 5.2 WhatsApp (WhatsApp Business Platform, Cloud API)
- Use Meta's **test phone number** in development; register teammates' numbers as test recipients.
- Webhook with verify token + `X-Hub-Signature-256` validation.
- Free-form replies **only inside the 24-hour customer-service window**. Outside it, only approved **templates** (create `interview_invite` and `booking_reminder`).
- **Policy constraint**: since 15 Jan 2026 Meta prohibits general-purpose AI assistants on the Business API; AI that serves a business's own support, bookings and sales is allowed. The agent must stay **strictly on the business's topics** and decline everything else in one polite line. Surface this in product copy: "Business-scoped by design."

### 5.3 Built-in Simulator (always available)
A web phone component that sends through the exact same pipeline (`channel = "simulator"`), with a selectable channel accent. Used in the landing page's live section and as the on-stage fallback if a Meta webhook fails. **Do not clone any messenger's UI pixel-for-pixel**; build our own chat UI and label which channel it represents.

---

## 6. The Inbox Agent
- **Anthropic SDK.** Models from env:
  - `CLAUDE_FAST_MODEL=claude-haiku-5-5` (classification, routine replies)
  - `CLAUDE_SMART_MODEL=claude-sonnet-5-5` (complex replies, HR ranking)
  - Use **prompt caching** for the business knowledge block.
- **Tools** (function calling):
  - `search_catalog(query)`
  - `check_variant(product, size?, color?)` → price, stock
  - `get_business_info(topic)` → hours, delivery, policies, payment
  - `check_slots(date, partySize | service)`
  - `create_booking(customer, datetime, partySize | service, notes)` → reference code
  - `escalate(reason, category, priority, summary)`
- **Hard rules** in the system prompt:
  1. Facts come only from tools and knowledge. **Never invent** stock, prices, times or policies. If unknown: say you'll check with the team, then escalate.
  2. Reply in the customer's language and script. Messenger tone: short, warm, no corporate filler, at most ~3 sentences unless listing options.
  3. **Business-scope lock**: decline unrelated requests in one line.
  4. **Always escalate**: partnership / franchise / wholesale, complaints, refunds, legal, allergy questions beyond listed allergens, abusive messages, price negotiation, and anything below the confidence threshold. The customer gets a holding reply; the thread lands in "Needs you" with a one-line summary.
  5. Bookings confirm back date, time, party size and a reference code.
- **Modes per channel**: Autopilot (auto-send) or Copilot (AI drafts, staff approves). **Human takeover** pauses the AI for that thread until released.
- **Log per message**: intent, topic, language, sentiment, tool calls, latency, outcome (auto-resolved / booked / escalated), tokens.

---

## 7. The Hiring Agent
- **Candidate sources**, only ones the business controls or candidates opted into:
  1. A Telegram channel/group where our bot is admin: ingest resume posts and PDFs.
  2. Candidates applying via the bot: `/apply` → name, role, experience, availability, CV upload, **consent checkbox**.
  3. CSV / PDF upload in the dashboard.
  - Do **not** scrape groups or channels we don't administer. Note in the docs that WhatsApp groups are not a readable source for this.
- **Parsing**: Claude turns each resume into a structured profile (skills, years per skill, past roles, availability, district, languages, contact channel) and keeps the source text for evidence.
- **Matching**: HR types a request in plain language (e.g. "pizza cook, 3+ years wood-fired, evenings, near `{{DISTRICT}}`"). Convert it to explicit criteria shown as **editable chips**, then rank. At demo scale (<200 candidates) skip vector databases: hard-filter in SQL, then the smart model ranks the shortlist with a **0–100 fit score and 2–3 evidence quotes** from each resume.
- **Fairness by design**: rank only on job-relevant criteria. **Never filter or score by gender, age, religion, ethnicity, marital status or photo.** If a request contains such preferences, ignore them and show a calm notice: "Ranked on skills and availability only." Present this as a product strength.
- **Outreach**: the agent drafts the invite (onsite or video call) in the candidate's language → HR edits / approves → sent via the candidate's source channel (Telegram bot chat; WhatsApp only via the approved template).
- **Scheduling**: read HR's free/busy (Google Calendar API) → offer 3 slots as inline buttons → candidate picks → create the event with a Google Meet link (Zoom Server-to-Server OAuth optional) → both sides get confirmation. Fall back to a built-in calendar if Google credentials are missing.
- **Pipeline**: Sourced → Shortlisted → Invited → Scheduled → Interviewed → Hired / Rejected. Rejection messages are also drafted, approved, then sent politely.

---

## 8. Dashboards
**Owner (Today view)**: messages handled, auto-resolved %, median first-response time, bookings created, open escalations, top 10 questions, language mix, sentiment trend, **Knowledge gaps** ("asked 14× this week: *gluten-free?* → [Add answer]"), hiring snapshot.

**Service**: realtime unified inbox across channels; "Needs you" queue with reason chips; thread view with the AI's tool trail ("checked stock: Large Margherita ✓"); takeover button; **Knowledge editor** (catalog with variants and stock, hours, services, policies, FAQs, live instantly); bookings board.

**HR**: requisitions; ranked candidates with evidence; approval queue; interview calendar; pipeline kanban.

All numbers come from real logged events. Add an owner-only **"Demo traffic"** switch that replays realistic seeded conversations so charts move during the pitch, clearly labeled as demo mode in the UI.

---

## 9. Design: NOT generic, NOT "AI template"

### 9.1 Concept: "The bell on the counter"
Every shop has a service bell on the counter: someone rings it, someone answers. Jawab is the hand that always answers. The hero object is a **3D brass service bell** on a dark stone counter, not an orb, brain or robot. Messages are physical objects: rounded, slightly translucent capsules with real text that fall, collide, get caught and get answered.

### 9.2 Palette (tokens only, nothing outside this)
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0E0D0B` | background (site), dark theme |
| `--paper` | `#F2ECE0` | text on dark, light theme bg |
| `--brass` | `#C8A048` | the bell, highlights, focus rings |
| `--signal` | `#FF4A1C` | escalations, primary CTA |
| `--answered` | `#D4FF3A` | "answered" states only, sparingly |
| `--smoke` | `#8A847A` | secondary text, hairlines |

Site is dark-first. Dashboard ships light (paper) and dark (ink) themes.

### 9.3 Typography
- **Display**: Bricolage Grotesque (variable), weight 700–800, tracking −3%, sizes up to `clamp(56px, 11vw, 200px)`.
- **Accent**: Instrument Serif *Italic*, used for **one** emotional word per headline ("*answered*", "*never*", "*you*").
- **UI / body**: General Sans (Fontshare, self-hosted).
- **Data / timestamps / counters**: JetBrains Mono.
- **Banned as primary**: Inter, Roboto, Poppins, Montserrat, Space Grotesk, Geist, system-ui.

### 9.4 Banned clichés
Purple/blue gradients · glowing AI orbs, brains or robots · sparkle icons for "AI" · emoji icons · centered hero + 2 buttons + 3 feature cards · glassmorphism everywhere · stock photos · fake "trusted by" logo walls · made-up statistics (every number on the site is sourced or labeled as demo data).

### 9.5 Motion stack
- **React Three Fiber + drei**; **@react-three/postprocessing** (subtle bloom on brass, film grain, vignette).
- **GSAP + ScrollTrigger + SplitText** for pinned scroll scenes and kinetic type.
- **Lenis** smooth scroll.
- **Motion** for UI micro-interactions.
- **After Effects** pieces exported via Bodymovin as **dotLottie** into `/public/motion`. If AE files aren't provided yet, build the equivalent in GSAP; never block on them.
- Performance rules: 60fps target on a mid-range laptop; clamp DPR ≤ 1.75; lazy-mount the canvas; simplified 2D path on phones and for `prefers-reduced-motion`; Lighthouse performance ≥ 85 on the landing page.

### 9.6 Scroll story (pinned sections)
- **00 Preloader**: mono counter `000 → 100` labeled "messages answered", ends on a bell *ding* (sound off by default, toggle in the corner).
- **01 Hero**: the brass bell under a single warm light; message capsules drop in and strike it, each strike sends an answer capsule flying off-screen. Headline: "Every question, *answered*." Sub: "Jawab replies to your customers on Telegram and WhatsApp, from your own menu, stock and calendar." CTAs: **Ring the bell** (scrolls to the live simulator) and **Open dashboard**.
- **02 The pile-up**: pinned phone fills with unread badges while a mono counter climbs. "Your customers don't wait. Your staff can't keep up."
- **03 Teach it once**: horizontal scroll; menu cards, size and color swatches, hours and policies fly into the bell and become its memory.
- **04 Answered everywhere**: two lanes (Telegram / WhatsApp); capsules route into lanes; counters tick.
- **05 Ring the bell (LIVE)**: embedded Simulator talking to Forno Sette's real agent, with suggestion chips, visible tool calls and rate limiting.
- **06 It knows when to stop**: a partnership message turns `--signal`, lifts out of the stream and drops into a "Needs you" tray.
- **07 Hiring, handled**: resume paper-cards flutter out of a channel, sort into a ranked stack with fit scores; a calendar block snaps into a week view; the Approve button presses.
- **08 One door, every desk**: the login card morphs into the three dashboards (Owner / Service / HR) as you scroll.
- **09 Close**: giant type "Open the *counter*." plus a QR code to the live Telegram bot.
- **Cursor**: small brass dot that becomes a speech bubble over interactive elements.

### 9.7 Dashboard look
Editorial, dense, calm. Big mono numbers, hairline rules, 12-column grid, generous left rail. Realtime rows slide in with a brief brass flash. Empty states use good copy, not illustrations. Restyle every component to the tokens; nothing should look like a default component library.

---

## 10. Tech stack
- **Next.js** (App Router, latest stable) + TypeScript strict; **Tailwind CSS v4**; shadcn/ui primitives restyled to our tokens.
- **Supabase**: Postgres, Auth, Realtime (live inbox), Storage (resumes). **Drizzle** ORM + migrations. Row-level security by `workspace_id`.
- Webhooks return 200 immediately; processing runs in a job queue (Inngest, or a jobs table + worker).
- Deploy on **Vercel**; webhooks at `/api/webhooks/{telegram,whatsapp}`.
- Security: signature verification on every webhook; channel tokens encrypted at rest; rate-limited public simulator; resumes deletable on request with a retention setting.

---

## 11. Data model (minimum)
`workspaces`, `users` (role), `channels` (type, credentials ref, mode), `customers`, `threads`, `messages`, `agent_runs` (tools, latency, tokens, outcome), `escalations`, `kb_items` (catalog, variants, policies, faqs, hours), `bookings`, `requisitions`, `candidates`, `candidate_documents`, `matches` (score, evidence), `outreach` (draft, status, approver), `interviews`, `events` (analytics).

---

## 12. Build order and acceptance criteria
1. **Core**: schema + seed, auth and roles, agent + tools, Simulator, Telegram (bot + Business Mode), realtime Service inbox.
   ✅ A Telegram message "Do you have the Margherita in large, and can I book a table for 4 at 8pm Friday?" gets a correct answer + booking in under 5 s, and the booking appears in the dashboard live.
2. **Escalation and analytics**: Needs-you queue, takeover, Owner dashboard, knowledge gaps.
   ✅ "I want to discuss a franchise" escalates with a summary and no invented answer.
3. **Hiring**: sources, parsing, ranking with evidence, approval queue, scheduling.
   ✅ HR request → ranked list → Approve → teammate's Telegram receives the invite → picks a slot → event appears on the calendar.
4. **Landing site** with the full scroll story.
   ✅ Smooth on a laptop; graceful on a phone and with reduced motion.
5. **WhatsApp adapter** on test assets.
   ✅ A tester's DM gets the same quality answer as on Telegram.
6. **Demo hardening**: `/api/demo/reset`, seeded state, fallback to Simulator, error toasts, a recorded 3-minute backup of the full flow.

---

## 13. The 3-minute demo the build must support
1. QR on screen → a judge opens the Telegram bot, asks about a size / color / stock and books a table → answer in their language; booking pops into the dashboard.
2. Presenter sends "franchise partnership?" → escalation lands in Needs you.
3. Owner dashboard: auto-resolved %, top questions; fix a knowledge gap live → re-ask → now answered.
4. HR: "Need a pizza cook, 3+ years, evenings" → ranked candidates with evidence → Approve → teammate's phone receives the invite → slot picked → calendar updates.

---

## 14. Working style
- Read official docs for each API before coding it.
- Commit per phase. Keep `README.md` with setup, env vars and this demo script.
- Prefer finished and reliable over broad and flaky: phases 1–3 must be rock solid before phase 5.

### Env vars
```
ANTHROPIC_API_KEY=
CLAUDE_FAST_MODEL=claude-haiku-5-5
CLAUDE_SMART_MODEL=claude-sonnet-5-5
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
META_APP_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ZOOM_ACCOUNT_ID=          # optional
ZOOM_CLIENT_ID=           # optional
ZOOM_CLIENT_SECRET=       # optional
DEMO_MODE=true
```