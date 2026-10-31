# Yapoz: audience, objection answers, Orbyte fit, benefit model

> **Status: draft for fact-check and enhancement.** Written 2026-10-31 from the repo (README, `docs/orbyte-integration.md`, `src/lib/benefit.ts`, `scripts/synthetic-orders.ts`) plus reasoning. Nothing here is a measured result. Every number in sections 6 and 7 is an **assumption or a model output**, labelled as such. The claims register at the end separates what the repo supports from what needs external verification.

---

## 1. Main audience (narrow)

**Home-based and small-shop sellers in Malaysia who take orders over WhatsApp: 1–5 staff, a catalogue of roughly 5–50 items.** Examples: home bakers, kuih and cake makers, catering and bento sellers, frozen-food and snack shops.

Secondary (after the first group is won): appointment-based micro businesses (hair, beauty, tutors), because bookings are already supported.

Why this group fits:
- Orders already arrive as WhatsApp messages, often in Manglish or Malay ("2 box tomorrow ya?").
- The owner is usually the only person who can answer, so replies are slow and orders get missed.
- Daily capacity limits are common (maps to the "Daily quantity" stock mode).
- Payment is a bank-transfer screenshot someone has to check (maps to receipt review).
- They have no developer, so "build your own" is not a realistic option.

**One-sentence pitch:** "Yapoz handles the 'can I order…?' WhatsApp chats for small food sellers, and you approve the order with one tap."

Not the starting audience: restaurants with POS systems, retailers with e-commerce stacks, medium enterprises. Orbyte is the expansion story, not the entry market.

---

## 2. Objection answers

### 2.1 "Why can't someone just build their own website?"

**Short answer:** "A website doesn't answer WhatsApp. Customers message you, and that's where orders get lost. We don't replace your website; we handle the chat that happens before and instead of it."

Supporting points:
1. **Customers don't use forms.** They ask in chat. Negotiation ("Saturday?", "less sweet?", "pay the balance later?") doesn't fit a form.
2. **Building and running a site is real work.** Hosting, payments, stock sync, upkeep. The owner is baking or cutting hair. Yapoz is set up from the menu and policies the owner already has.
3. **A website still leaves the back end manual.** Even with a site, receipts arrive as screenshots and stock is checked by hand. This matches the README's cited gap: digital adoption is strong in sales, marketing and payments but weaker in back-end integration (Khazanah Research Institute, May 2026, as cited in the README; fact-check).
4. **They can still build a site.** Yapoz complements it.

### 2.2 "What should the audience pay?"

**There is no validated price.** The README says pricing "remains to be validated". Do not announce a number as fact. The honest position: "We'll set price from a pilot; you pay only when it works."

Proposed starting hypotheses to test in the pilot:
- **A. Per completed order:** a small fee per approved order, free tier below a threshold (this is the README's proposed model).
- **B. Flat monthly:** roughly RM49–99/month, small enough to be below the value of one or two recovered orders.
- Test A vs B with the same shops; ask each shop their maximum acceptable price.

How to argue it is reasonable (model in section 7):
- Time saved alone is worth roughly RM60–145/month for a 260-order/month shop at RM10/hour of owner time (assumption). That barely covers the price, so **do not lead with time saved.**
- Lead with **recovered orders and avoided mistakes**, which are larger in the model (RM100–400+/month in revenue terms) but depend entirely on assumptions that the pilot must measure.
- Be careful to separate **revenue** from **profit** when citing recovered orders.

### 2.3 "Why is that price reasonable?"

"It costs less than one lost order a month. Here's the scoreboard from your own chats: orders handled, minutes saved, orders that would have waited overnight." Answer with the shop's own pilot numbers, not with market claims. Also know your unit cost (AI + messaging per conversation) so the price is defensible from the cost side. The repo does not currently record unit cost; see the build plan.

### 2.4 "How do we make the audience trust us?"

1. **The AI never acts alone.** Orders stay pending until an authorised person approves; the backend rechecks stock at approval. The AI can only state "in stock", "sold out" or "at most N" with N read from the database (README).
2. **Show the work.** The Activity log records who did what; each order says why it needs attention and whether the customer was notified.
3. **Be honest about limits.** Receipt analysis is advisory and does not prove payment; Yapoz processes no real payments; the Orbyte integration is proposed, not live. Saying so first builds more trust than being caught overclaiming.
4. **Low-risk entry.** Free pilot, one-click handoff to a human, easy export and exit.
5. **Data basics.** Malaysian businesses care about PDPA. Needed: plain-language privacy statement, where data is stored, whether chats train models, retention and deletion. (`src/lib/retention.ts` and `/privacy` exist; confirm their content.)
6. **Local proof.** Three to five named pilot shops with before/after numbers outweigh any claim above.

### 2.5 "How is it different from a chatbot?"

**Short answer:** "A chatbot answers questions. Yapoz completes orders: it reads your real catalogue, checks live stock, builds a priced order, holds the stock, reviews the payment receipt, and gives you a ready-to-approve order with an audit trail."

**The key distinguishing thing:** the AI sits on a **rules and approval layer**. Prices, stock and availability come from the database, not the model; the AI calls defined business tools; nothing is confirmed without a person. A generic chatbot can invent a price or promise stock that does not exist. Yapoz is built so the model cannot commit the business to something wrong.

How to present it:
- Lead with the outcome ("Customer chats → reviewable orders"), not "AI".
- Demo the **dashboard next to the chat**: a structured order, stock hold, receipt check, approve button, activity log. A chatbot demo is only a chat window.
- Say what the AI refuses to do: invent prices, promise unavailable stock, confirm orders, add unsaved policies (commit `ea12beb`: assistant kept to saved policies, escalates missing ones).

Comparison table to include on the site (fact-check each cell):

| Capability | Generic chatbot | WhatsApp Business auto-reply | Website/Shopify | Yapoz |
|---|---|---|---|---|
| Understands free-text requests | yes | no (keywords/away message) | no | yes |
| Prices from the real catalogue | not guaranteed | no | yes | yes (backend rules) |
| Live stock and holds | no | no | varies | yes |
| Receipt review | no | no | no | advisory checks |
| Human approval before commit | no | n/a | n/a | yes, required |
| Audit trail | no | no | partial | yes |
| Works inside WhatsApp | varies | yes | no | yes |

---

## 3. Orbyte fit and reuse

### 3.1 Position: Yapoz as a connected hub module

Orbyte is the hub: the system of record for the business, its staff and (assumed) its inventory and accounting connections. Yapoz is the **customer-conversation front door** that plugs into it. The gap it fills: the hub knows the business, but orders still start as unstructured chats outside it.

Flow: **Customer chat → Yapoz (AI + rules + approval) → approved order event → Orbyte → inventory / accounting.**

### 3.2 What is designed (repo: `docs/orbyte-integration.md`, `src/lib/orbyte.ts`)

| Direction | Carries | State |
|---|---|---|
| Into Yapoz | Workspace + members + roles (`orbyte.workspace.synced.v1`) | **Assumed only; nothing receives it.** |
| Out of Yapoz | Approved order (`yapoz.order.approved.v1`) | **Payload built and tested (`tests/orbyte.test.ts`); nothing sends it.** |
| Route | Read-only Orbyte event preview shown on approved orders | Built (commits `bf0e221` and `a3c2c9f`) |

Design properties worth stating:
- **Approval gate unchanged.** The event is built after `transitionOrder()` commits and cannot approve anything.
- **Orbyte failure must never block or undo approval.**
- **Idempotent:** `eventId` is stable per order, so repeat delivery is ignorable.
- **Integer minor units (sen)** avoid rounding errors.
- **Role mapping fails closed:** unknown roles get no access (`admin`→`owner`, `cashier`/other→`service`).
- `testData` flag keeps demo records out of real figures.

### 3.3 Honest status

**The integration is proposed, not live.** There is no Orbyte API documentation or access; every field is our assumption. Questions still to confirm with Orbyte: how workspaces/people reach an outside app and real role names; webhook vs queue and signing; which customer fields Orbyte may receive; how post-approval cancellations and refunds are reported. Pitch it as "designed to fit, interfaces pending confirmation", never as integrated.

### 3.4 Reuse: a second business can use it

Evidence in the repo: two fictional businesses run on the same code with different catalogues and policies. **Forno Sette** (`FORNO7`, bakery, orders) and **Kasih Hair Studio** (`KASIH1`, appointments). Seed code lives in `src/seed/forno.ts` and `src/seed/kasih.ts`.

What is configuration (no code change):
- Catalogue items, variants, prices, categories
- Stock mode per item (made to order / daily quantity / count stock)
- Opening hours, staff hours, appointment types
- Policies and knowledge entries the AI may quote
- Payment accounts and whether receipts are required
- Channel connection (WhatsApp number, Telegram)

What stays the same across businesses (the reusable core): request → validation → pending order → approval → record → notification, plus receipt checks, stock holds, activity log.

What is **not** automatically reusable (be honest):
- Business-specific policy wording, which must be entered and checked.
- Industries with complex pricing (quotes, custom jobs, deposits) need new tools.
- Language and tone tuning per customer base.

**Unproven:** how long a new business takes to onboard and how many exceptions it generates. Setup is compulsory (business basics + at least one knowledge entry) but has not been timed on real second businesses. Measure it in the pilot (see build plan).

---

## 4. Benefit and SDG

### 4.1 What the repo currently claims (targets, not results)

- Primary Phase 2 target: **30% reduction in staff handling time per completed order**, compared across 20 synthetic scenarios.
- Separate target: **5 manual steps → 1 approval step (80% step reduction)** for straightforward orders. Exceptions still need staff.
- Baseline steps (from the Phase 1 submission): read message, look up price, check stock, send payment details, check receipt.
- What code actually measures (`src/lib/benefit.ts`): manual steps per order (owner actions + staff chat messages up to the decision), share of orders priced and stock-checked (target ≥90%), share of receipts checked for amount/payee/date/reuse (target 100%). **It does not measure minutes.**
- `scripts/synthetic-orders.ts` uses a fixed mix of 16 clean and 4 exception orders. The script itself says this "says nothing about real customers", and the AI is stubbed out.

### 4.2 SDG mapping

| SDG target | How Yapoz contributes | Honest limit |
|---|---|---|
| **8.2** productivity through technological upgrading and innovation | Less owner time per order; more orders handled per person | Contributes to productivity; we do not measure GDP-per-worker (indicator 8.2.1) |
| **8.3** support productive activities, entrepreneurship, growth of micro/small enterprises | Gives micro sellers a structured order process and records they otherwise lack | We do not measure formalisation (indicator 8.3.1); records are a plausible enabler, not proof |

Context stat (from README, cite DOSM; fact-check): MSMEs were 39.7% of Malaysia's GDP and 48.7% of employment in 2025, including medium enterprises. Initial users are micro and small only.

---

## 5. How to read the numbers below

All figures are an **illustrative per-shop model**, not measurements. Replace each assumption with pilot data. Three scenarios (conservative / base / optimistic) show the range. Hourly value and error cost are assumptions and need validation.

---

## 6. Benefit model: time, steps, errors

### 6.1 Assumptions

| # | Assumption | Conservative | Base | Optimistic | Source |
|---|---|---|---|---|---|
| A1 | Orders per month (≈10/day × 26 days) | 260 | 260 | 260 | assumption |
| A2 | Manual minutes per order, five steps | 4.5 | 4.5 | 4.5 | assumption: read/reply 1.5, price 0.5, stock 0.5, payment details 0.5, receipt 1.5 |
| A3 | Share of orders that are "clean" (no staff intervention beyond approval) | 60% | 70% | 80% | assumption; synthetic script uses 80% by construction |
| A4 | Minutes to review and approve a clean order | 1.5 | 1.0 | 0.75 | assumption |
| A5 | Minutes to handle an exception order with Yapoz | 4.5 | 3.5 | 3.0 | assumption |
| A6 | Manual error rate (wrong item, quantity, price, date, oversold) | 3% | 3% | 3% | assumption |
| A7 | Residual error rate with Yapoz | 1.5% | 1% | 0.5% | assumption |
| A8 | Cost per error (remake, refund, goodwill), RM | 30 | 30 | 30 | assumption |
| A9 | Value of owner time, RM/hour | 10 | 10 | 10 | assumption; verify against local wage data |

### 6.2 Time per order

Yapoz minutes per order = clean share × A4 + (1 − clean share) × A5.

| | Conservative | Base | Optimistic |
|---|---|---|---|
| Yapoz minutes/order | 0.6×1.5 + 0.4×4.5 = **2.70** | 0.7×1.0 + 0.3×3.5 = **1.75** | 0.8×0.75 + 0.2×3.0 = **1.20** |
| Manual minutes/order | 4.50 | 4.50 | 4.50 |
| Minutes saved/order | 1.80 | 2.75 | 3.30 |
| **Time reduction** | **40%** | **61%** | **73%** |
| Hours saved/month (×260) | 7.8 | 11.9 | 14.3 |
| Hours saved/year | 94 | 143 | 172 |
| Value of time/month (A9) | RM78 | RM119 | RM143 |

All three scenarios exceed the 30% README target. That target may be set conservatively, or these assumptions may be optimistic. **Pilot timing decides.** The code currently cannot confirm the result because it counts steps, not minutes.

### 6.3 Steps removed

| | Manual | Yapoz clean order | Reduction (clean) |
|---|---|---|---|
| Steps | 5 | 1 (approve) | **80%** (README target) |

Blended with exceptions, assuming an exception takes about 3 steps: base = 0.7×1 + 0.3×3 = **1.6 steps per order → 68% fewer**. The exception step count is an assumption; `benefit.ts` computes the real figure from the activity log.

### 6.4 Errors avoided (per shop per month, 260 orders)

| | Conservative | Base | Optimistic |
|---|---|---|---|
| Manual errors (260 × 3%) | 7.8 | 7.8 | 7.8 |
| Errors with Yapoz | 3.9 (1.5%) | 2.6 (1%) | 1.3 (0.5%) |
| **Errors avoided** | **3.9** | **5.2** | **6.5** |
| Cost avoided (×RM30) | RM117 | RM156 | RM195 |

Mechanism (supported by repo): prices come from the catalogue via backend rules; stock is checked and held in the database; an item not in the catalogue cannot be ordered. Errors that remain are mostly customer-intent errors the AI misreads, which approval is meant to catch. **The repo records priced/stock-checked share, not actual errors.**

### 6.5 Receipt risks (advisory)

Yapoz checks amount, payee, date and reuse of receipts. Assumption: 0.5% of receipts are problematic (short payment, wrong payee, reused). At 260 orders, about 1.3 problem receipts/month; at RM50 average that is about RM65/month exposure. This is small and **advisory only**: it does not prove payment. Do not market it as fraud prevention.

### 6.6 Recovered orders (the largest and least certain)

Assumptions: 5% of inbound order enquiries are lost to slow or missed replies; half are recovered by faster responses; average order RM50; gross margin 30% (all assumptions).

If shop receives 260 completed orders/month, enquiries ≈ 274; lost ≈ 14; recovered ≈ 7 orders.
- Revenue recovered ≈ 7 × RM50 = **RM350/month**
- Profit recovered ≈ RM105/month

Treat this as the hypothesis the pilot most needs to test; it matters more to pricing than time saved.

### 6.7 Per-shop summary (base case)

| Benefit | Per month | Confidence |
|---|---|---|
| Owner hours saved | ~12 h (RM119 at RM10/h) | low–medium; assumption-driven |
| Errors avoided | ~5 (RM156) | low; no error tracking exists |
| Recovered orders | ~7 (RM350 revenue, RM105 profit) | very low; untested |
| Steps per order | 5 → ~1.6 blended | medium; computable from logs |

Aggregating across shops (illustration): per 100 shops in the base case, about 1,190 owner hours/month saved (143 h/yr each ≈ 14,300 h/yr). Do not extrapolate to national figures without adoption data.

---

## 7. Claims register (for the fact-checker)

### Supported by the repo
- Product flow, tools, approval requirement, stock modes and holds, receipt checks being advisory, no real payment processing (README).
- 5-step baseline and targets (30% time, 5→1 steps, ≥90% priced/stock-checked, 100% receipts checked) (`benefit.ts`, README).
- Orbyte payloads and mapping are assumptions and unsent (`docs/orbyte-integration.md`).
- Two sample businesses on one codebase (`src/seed`).
- Demo AI runs on Groq and Gemini free tiers (README).

### Needs external verification
- DOSM figures (39.7% GDP, 48.7% employment, 2025) and the Khazanah paper claim.
- Meaning of SDG 8.2 and 8.3 indicators and wording.
- PDPA obligations for storing customer chat data.
- Typical Malaysian small-food-seller order volume, order value, margin, and owner hourly value (A1, A8, A9, §6.6).
- WhatsApp Business API rules and costs (conversation pricing, template rules) for the unit-cost question.

### Pure assumption (replace with pilot data)
- Every row in §6.1.
- Conversion and loss rates in §6.6.
- The price hypotheses in §2.2.

### Weak points an investor or judge will probe
1. Impact is unmeasured; minutes are not even instrumented.
2. No pilot customers or real WhatsApp deployment evidence.
3. Pricing unvalidated; unit cost unknown.
4. Orbyte integration is assumed, not live.
5. Free-tier AI providers are fragile for production.
6. Language handling (Malay/Manglish) is not demonstrated with evidence.
