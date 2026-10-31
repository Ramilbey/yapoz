# Phase 2 results: what we measured, and what we did not

**Run on:** 31 Oct 2026, code at `e27e739`, a throwaway local database. **All numbers below come from synthetic orders in a made-up business. They are not customer data and not evidence of real-world savings.**

## How to repeat it

```bash
npm run db:reset                      # disposable local database only; it drops and recreates the schemas
npm run measure -- --synthetic        # 20 test orders, then the report below
```

The script (`scripts/synthetic-orders.ts`) places 20 orders through the real order, receipt and approval code, in a new business labelled as demo data, and deletes the business afterwards. `src/lib/benefit.ts` computes every figure from what the system recorded: orders, stock holds, receipts and their checks, and staff actions in the activity log. A measure with nothing to measure shows as "no data", never as 0 or 100%.

## What the 20 orders were

Sixteen clean orders, two with a short payment (staff ask for another receipt, then confirm), one paid to the wrong account (rejected) and one reused receipt (rejected). **We chose that mix.** It shows the checks work. It says nothing about how often real customers make these mistakes.

## Result against the Phase 1 proposal

| Phase 1 measure | Baseline | Target | Result | Verdict |
|---|---|---|---|---|
| Manual steps per order (read message, look up price, check stock, send payment details, check receipt) | 5 | 1 | **1.10** on average; 18 of 20 orders took one step, the two short payments took two | **Not met**, 78% fewer than baseline against the 80% we aimed for |
| Orders arriving priced and stock-checked | none (done by hand) | at least 90% | **20 of 20 (100%)** | Met on this set |
| Receipts checked for amount, payee, date and reuse | none (done by hand) | 100% | **22 of 22 (100%)** | Met on this set |

Why steps are above 1: a short payment needs the owner to ask for another receipt before confirming. That is the designed behaviour, so we report it rather than hide it.

## Other things the run recorded (facts, not targets)

- Orders needing a correction or rejected: 2 of 20 (both rejected; both scripted).
- Time from order to decision and time to first reply: under a minute. In a script with no waiting people this tells you nothing about real handling time.
- "Orders with no person replying within 10 minutes: 20": an artefact of the script, which has no staff sending chat messages. Ignore it here.
- Cost: AI cost shows as $0.00 because the script leaves the AI out (see below). The cost report in `src/lib/cost.ts` prices real runs from a table of assumed rates; it is an estimate, not an invoice.

## What this does not show

1. **No time-saved figure.** The Phase 1 headline target was a 30% cut in staff handling time per order. We never timed a manual baseline, so we have no honest percentage. The step count is the only before/after comparison we can defend.
2. **The AI was not in the loop.** The script stands in for the assistant's order tool call and for the receipt reader, so it measures what the system records and enforces (prices from the catalogue, stock holds, receipt checks, the approval gate), not how well a language model understands a customer.
3. **No real users.** No shop owner or customer took part. The 30% target and the "first-time user finishes without help" test remain unmeasured.
4. **One business, one mix.** Results on real orders will differ.

## What a real pilot would add

Time five owners handling 20 orders by hand and then in Yapoz, record real receipt problems, and rerun `npm run measure -- --workspace <id>` on their records (read-only for a real business).
