# Third business: what it needed, and what it could not do

**Business:** Dapur Mak Long Catering (fictional), `src/seed/catering.ts`, workspace `CATER1`. Event catering: per-portion and per-tray prices, minimum quantities, days of lead time, nothing counted in stock.

**Method:** the catalogue, hours, delivery, policies and FAQs are one setup draft (`CATERING_DRAFT`) imported through `src/setup/import.ts`, the same path a new owner uses. `tests/catering.test.ts` builds a workspace with `createWorkspace` plus that import and nothing else, then takes an order through the assistant's `create_order` tool and runs confirm, ready and complete. It passes with **no business-specific code**: the order is priced from the catalogue, the stock check treats "nothing to count" as checked, and setup flags the one thing it should (no address on file).

**Code changes needed to get that far: none.** Four things the business needs cannot be expressed or are handled badly, so they are recorded as gaps rather than worked around.

## Gaps

| # | Gap | Today | Why it matters | Pinned by |
|---|---|---|---|---|
| 1 | **Minimum quantity per item** | The "Minimum quantities" policy is text the assistant can quote. `create_order` accepts 1 portion of a 20-portion set. The only minimum in the code is a delivery zone's `minOrder` in Knowledge, and it isn't checked at order time either. | The AI can promise a price for an order the kitchen won't cook. The owner has to catch it at approval. | `GAP 1` test |
| 2 | **Lead time (minimum days ahead)** | The "Lead time" policy is text. Dates are checked only against the past and `preorderDays` (a maximum). An order for tomorrow is accepted. Appointments have `minNoticeMinutes`; orders have no equivalent. | Same: a short-notice order looks accepted to the customer. | `GAP 2` test |
| 3 | **Partial-word item matching** (`findProduct` in `src/agent/knowledge.ts`) | A requested dish that shares one word with a listed one is matched to it: "Sushi platter" becomes Kuih platter (RM 65 each), "Nasi lemak" becomes Nasi impit set. The score also searches other items' descriptions. This is shared code, so it affects every business, but a menu with many similar words ("platter", "set", "nasi") makes it likely. | The customer is quoted and saved an order for something they didn't ask for. The owner can catch it at approval, and it shows up as a correction or a rejection with reason "wrong item". | `GAP 3` test |
| 4 | **Quantity cap of 50 per line** (`MAX_QTY` in `src/lib/orders.ts`) | A kenduri for 150 can't be saved by the AI: `create_order` refuses and tells it to escalate as `large_group`. Safe, because nothing is saved, but every large catering order needs a person. | The orders that matter most to a caterer never get an AI-drafted order. | `GAP 4` test |

## Smaller observations (not gaps in the code)

- Per-portion pricing works as a single option labelled "Per portion"; quantity is the number of portions. A "tray of 40" is one option. No change needed.
- Setup correctly reports no address for a workspace created without one. The seeded business has one in its settings.
- Delivery fees are not added to the total by design ("the delivery fee is agreed by the team"), which suits catering where setup and distance vary.
- A deposit (50%) is only expressible as policy text; payments in Yapoz are receipt checks against the full total.

## What closing the gaps would take (not done)

Gaps 1 and 2 would each be a small field on a Knowledge item (`minQuantity`, `leadDays`) read in `resolveOrderLines` / `dateProblem` and surfaced in the setup draft. Gap 3 needs a stricter match (every word of the request must match, or ask the customer). Gap 4 needs a per-business cap. All change shared code, so they were left as findings rather than slipped in under the "zero code changes" goal.
