# Yapoz build improvement plan

> **Status: draft for review and enhancement.** Written 2026-10-31. Companion to `docs/audience-and-objections-answers.md`. Goal: make Yapoz hard to dismiss when someone asks "why not a website / why not a chatbot / what do I pay / why trust you / does it fit Orbyte / what's the benefit?" File paths are from the current repo; verify before starting each item. Effort: S ≈ under a day, M ≈ 1–3 days, L ≈ a week or more.

**Target audience for all work below:** home-based and small-shop food sellers in Malaysia taking orders on WhatsApp.

---

## P0: close the proof gap

Each item removes a weakness a skeptic will find first.

### P0.1 Measure minutes, not just steps (M)
- **Gap:** `src/lib/benefit.ts` counts steps (owner actions + staff messages up to the decision). The headline target is a **30% handling-time reduction**, which the code cannot compute.
- **Do:** add time-to-decision per order (`orders.createdAt` → decision event in `events`), plus owner active-time proxy (time between the owner opening the order and deciding, if the dashboard can record it). Expose in `benefitRows` and the Today panel.
- **Also:** record a manual-baseline timing protocol (stopwatch on 20 real or scripted orders per pilot shop) so the comparison is not just against the assumed 4.5 minutes.
- **Done when:** `npm run measure -- --workspace X` prints median and mean minutes per order and a % reduction against a stored baseline.

### P0.2 Track errors, not only checks (M)
- **Gap:** benefit currently measures "priced and stock-checked" share, which is a proxy. "Errors avoided" has no data source.
- **Do:** log owner corrections (edits to items, quantity, price, date between AI draft and approval) as `order.corrected` events; log rejections with a reason code (wrong item, out of stock, customer cancelled, other). Count corrected-or-rejected share as the observed error rate.
- **Done when:** Today shows "X% of orders needed correction" with a count.

### P0.3 Recovered-orders metric (M)
- **Gap:** the strongest pricing argument (§6.6 of the answers file) has no measurement.
- **Do:** record first-reply latency per thread; flag enquiries that arrived outside opening hours or when staff were unavailable and were answered by the AI; report "orders created from after-hours/unattended chats" on Today.
- **Done when:** Today shows count and value of orders that started when no human replied within N minutes.

### P0.4 Unit cost per conversation (S–M)
- **Gap:** cannot defend a price without knowing cost.
- **Do:** record model provider, tokens and (where available) messaging cost per conversation/order; add to measurement script output.
- **Done when:** report shows average cost per completed order.

### P0.5 Production-grade AI and WhatsApp (L)
- **Gap:** demo runs on free-tier Groq/Gemini (README); WhatsApp is restricted to team accounts.
- **Do:** paid tier with automatic fallback provider (the router in `src/agent/ai-router.ts` already supports adapters); complete Meta business verification; put one pilot shop on a real number.
- **Done when:** a pilot shop receives real customer messages end to end for a full week without provider-limit handoffs.

### P0.6 Pilot protocol (M, mostly non-code)
- Recruit 3–5 home-food sellers. Collect: 2 weeks pre-pilot baseline (manual timing sample, missed-order recall), 4 weeks live use, exit interview.
- Test two prices (per-order vs flat monthly) with the same shops; ask maximum acceptable price.
- Test **second-business reuse**: time how long each shop takes to finish setup (see P2.1).
- Publish results as short case studies with the shop's permission. Label as pilot, small sample.

---

## P1: make the differentiator obvious (why it is not a chatbot)

### P1.1 "Chat beside order" demo path (S–M)
- One scripted flow on the homepage simulator and in the pitch: customer asks, AI quotes from the catalogue, stock hold appears, receipt check result appears, owner approves, activity log updates. Target under 60 seconds.
- Files likely involved: `src/components/site/simulator.tsx`, `src/demo/replay.ts`, `src/demo/library.ts`.
- Note from README: the homepage simulator accepts text only, so receipt review must come from a seeded order or an added simulated upload.

### P1.2 "What the AI did and did not do" view (M)
- Extend the Activity log / order timeline with explicit lines: "AI quoted RM42 from your catalogue", "AI did not confirm", "Waiting for you", "AI declined to answer: no saved policy for X".
- Source: tool calls recorded in `src/agent/tools.ts` and events in `src/lib/activity.ts`.

### P1.3 Visible guardrails page (S)
- Public page listing what the AI cannot do (invent price, promise stock, confirm order, add unsaved policies), each linked to a test (e.g. `tests/guarantees.test.ts`, `tests/ai-router.test.ts`, `tests/tools.test.ts`).

### P1.4 Malay and Manglish evidence (M)
- Build a small evaluation set (30–50 real-style messages in English, Malay and Manglish: quantity, date, variants, substitutions, price questions, rude or off-topic). Run it through the pipeline; record intent accuracy and clarification rate.
- Show a few real examples in the demo. This is evidence the answer file currently lacks.

### P1.5 Website comparison page (S)
- Table from answers file §2.5, honest about where WhatsApp Business auto-replies, websites and generic chatbots win. Fact-check each cell first.

---

## P2: reuse and Orbyte readiness

### P2.1 Prove second-business reuse (M)
- **Today:** two seeded fictional businesses (`src/seed/forno.ts`, `src/seed/kasih.ts`) share one codebase.
- **Do:**
  1. Add a **third** seeded business of a different shape (e.g., catering with minimum quantities and lead time, or a frozen-food shop with delivery) and list any code change it needed. The goal is **zero code changes**; each needed change is a documented gap.
  2. Time a stranger onboarding from signup through compulsory setup (`src/setup/`), using the website import (`src/setup/website.ts`) where possible. Record minutes and number of AI-flagged gaps (`src/lib/gaps.ts`).
  3. Add a test that creates a workspace purely through setup code and completes an order, to guard against business-specific assumptions creeping in.
- **Done when:** a "second business onboarding" number exists with the method written down.

### P2.2 Orbyte integration hardening, without claiming it is live (M)
- Keep `docs/orbyte-integration.md` honest: assumptions, not APIs.
- **Do:**
  - Add a signed webhook sender behind a feature flag, off by default, using the existing `approvedOrderEvent()` and a retry job (`src/lib/jobs.ts`, `src/lib/job-registry.ts`) so Orbyte downtime never blocks approval.
  - Define the missing events: order cancelled after approval, refund/amount change, booking events. Version them (`v1`).
  - Define inbound handler for `orbyte.workspace.synced.v1` with fail-closed role mapping and tests (unknown role → no access).
  - Write the contract as OpenAPI/JSON Schema so the real Orbyte team can accept or replace it quickly.
  - Add a **mock Orbyte receiver** in `scripts/` plus an end-to-end test: approve order → event delivered once → duplicate delivery ignored.
- Prepare the "questions for Orbyte" list as a one-page doc (webhook vs queue, signing, allowed customer fields, cancellation reporting, role names, PDPA purpose and retention).
- **Done when:** a mock Orbyte can receive and de-duplicate events and sync workspaces, with tests, and the doc says clearly "mock, not real".

### P2.3 Inventory/accounting handoff clarity (S)
- Define exactly what Orbyte would do with an approved order event (decrement inventory, post a sale), so the "connected hub" story has a concrete first use case, not just a diagram.

---

## P3: trust, security and honesty

### P3.1 Privacy and data page (S–M)
- Plain-language: what is stored (chats, receipts, customer names/phones), where (Supabase region), who can see it, whether chats are used to train models (check each provider's terms), retention (`src/lib/retention.ts`) and how to delete. Cover PDPA at a level a lawyer can later review.
- Verify `src/app/privacy/page.tsx` against actual behaviour.

### P3.2 Failure behaviour doc and tests (M)
- One page: what happens when the AI is unsure, the provider is down, the customer is rude or tries prompt injection, or a duplicate receipt arrives. Base it on existing tests (`tests/ai-failure.test.ts`, `tests/gaps.test.ts`, `tests/receipts.test.ts`) and add missing cases (prompt injection via chat text and via receipt image text; customer asks for a discount the AI must not grant).

### P3.3 Payments stance (S)
- Decide and state one position: "We never hold your money" (deliberate) vs "real payment verification coming" (e.g., DuitNow QR reconciliation). Receipt checks stay labelled advisory either way.

### P3.4 Human handoff and exit (S)
- Make handoff and AI hand-back rules visible (commit `852a06a`: AI is handed back after resolve and after 2h without a staff message). Add data export so a shop can leave.

---

## P4: later

- Real payment verification (DuitNow/FPX).
- Multi-branch, multi-staff schedules.
- Additional channels.
- Live Orbyte integration once real interfaces are confirmed.

---

## Suggested sequence

| Phase | Work | Output |
|---|---|---|
| Weeks 1–2 | P1.1, P1.3, P3.1, P3.3; P0.4; write pilot protocol (P0.6) | Cleaner demo, trust pages, cost visibility |
| Weeks 2–4 | P0.1, P0.2, P0.3 instrumentation; P0.5 start (Meta verification, paid tier) | Pilot-ready measurement |
| Weeks 4–10 | Pilot (P0.6) with P2.1 reuse timing | First measured numbers |
| Weeks 6–10 | P2.2 mock Orbyte; P1.4 language eval; P3.2 | Orbyte-ready story, evidence |
| After pilot | Set pricing; publish case studies; update benefit numbers in the answers file from assumptions to measurements | Defensible pitch |

---

## Definition of "bulletproof"

Yapoz is hard to dismiss when each skeptic question has a demo or a number behind it:

| Question | Evidence needed | Plan item |
|---|---|---|
| Why not a website? | Demo of chat → order that no form handles; pilot quotes | P1.1, P0.6 |
| Why not a chatbot? | Guardrails page, AI did/didn't view, side-by-side demo | P1.1–P1.3 |
| What do I pay, and why? | Measured time, errors, recovered orders; tested price | P0.1–P0.4, P0.6 |
| Why trust you? | Approval gate, audit trail, privacy page, failure doc, pilot shops | P3.1–P3.4, P0.6 |
| Does it fit Orbyte? | Mock hub running end to end; contract doc; open questions list | P2.2, P2.3 |
| Can a second business use it? | Third seeded business with zero code change; timed onboarding | P2.1 |
| What's the benefit? | Measured minutes, steps, errors with stated assumptions | P0.1–P0.3 |

## Risks and open questions

- Pilot sample will be small; report it as such.
- Measuring "errors" depends on owners correcting orders in the dashboard; if they fix things in chat instead, the metric undercounts.
- Orbyte may not accept the assumed contract; keep Yapoz useful standalone.
- AI provider terms (data use, regional hosting) must be checked before the privacy page is finalised.
- Pricing may need to differ by segment; do not generalise from food sellers to appointment businesses without testing.
