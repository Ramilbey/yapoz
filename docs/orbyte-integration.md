# Orbyte integration: assumed interfaces

> **These are our assumptions, not real Orbyte APIs.** We have no Orbyte API documentation or access. Every field, name and flow below is a proposal for how Yapoz could fit inside Orbyte, written so the fit can be discussed and replaced once the real interfaces are known. Yapoz doesn't call Orbyte today.

## Where Yapoz fits in Orbyte

Based on the public homepage at [orbyte.my](https://www.orbyte.my/), read on 31 October 2026. Orbyte hasn't confirmed anything here, and Yapoz isn't an Orbyte partner or integration.

Orbyte describes an AI business operating system for SMEs: one workspace and login, with People, Work, eSign, Hiring and Connect modules, and a single credit wallet where businesses pay when work happens. Its homepage shows WhatsApp among the tools it aims to bring together, and an open ecosystem and marketplace as a direction that hasn't shipped.

| Orbyte today | Yapoz would add or reuse |
|---|---|
| People, Work, eSign and Hiring cover the inside of a business | A distinct capability: customer chats become orders that staff approve |
| WhatsApp is shown as a tool to bring together | Handles WhatsApp orders, with Telegram alongside |
| Connect brings services under one sign-in, with roles, access control and approvals | Would reuse that sign-in and those roles: `owner` and `service` map to Orbyte roles, and the approval stays with a person |
| Credit wallet: pay when work happens | Usage charge per completed order instead of per seat (our proposal; Orbyte's rates aren't public) |
| Open ecosystem and marketplace planned | Could be an early add-on, if Orbyte opens that route |

Yapoz doesn't copy Orbyte's HR or admin functions. It is order automation with human approval, not a chatbot: rules price the order and check stock, and a person decides.

## Status

| Direction | What it carries | State in the code |
|---|---|---|
| Into Yapoz | Workspaces and their people | Assumed only. Nothing receives this yet. |
| Out of Yapoz | Approved orders | Payload built by `src/lib/orbyte.ts`. Nothing sends it. |

## Coming in: workspace and role data

We assume Orbyte is the source of truth for businesses and their staff, and sends them to Yapoz when a business turns Yapoz on or its team changes.

```json
{
  "event": "orbyte.workspace.synced.v1",
  "workspace": {
    "externalId": "orbyte-biz-1001",
    "name": "Sample Bakery",
    "timezone": "Asia/Kuala_Lumpur",
    "currency": "MYR"
  },
  "members": [
    { "externalId": "orbyte-user-1", "name": "Sample Owner", "email": "owner@example.com", "role": "admin" },
    { "externalId": "orbyte-user-2", "name": "Sample Staff", "email": "staff@example.com", "role": "cashier" }
  ]
}
```

Yapoz has two roles, and both can approve or reject orders on the backend. Only the owner can change business settings. We assume this mapping:

| Assumed Orbyte role | Yapoz role |
|---|---|
| `admin` | `owner` |
| `cashier`, or any other staff role | `service` |

A role Yapoz doesn't recognise should get no access until someone maps it, not the highest role.

## Going out: approved order events

When a person with the right role confirms an order, Orbyte would receive one event. Rejected, expired and still-pending orders never produce one. `approvedOrderEvent()` throws for them, and a later cancellation of a confirmed order would need its own event, which we haven't defined.

The example below is checked by `tests/orbyte.test.ts`, so it can't drift from the code.

```json orbyte-approved-order
{
  "event": "yapoz.order.approved.v1",
  "eventId": "11111111-1111-4111-8111-111111111111:approved",
  "occurredAt": "2026-11-02T04:15:00.000Z",
  "workspaceId": "SAMPLE1",
  "approvedBy": { "userId": "22222222-2222-4222-8222-222222222222" },
  "testData": true,
  "order": {
    "id": "11111111-1111-4111-8111-111111111111",
    "refCode": "ORD-AB12",
    "type": "order",
    "status": "confirmed",
    "channel": "whatsapp",
    "fulfilment": "pickup",
    "wantedDate": null,
    "currency": "MYR",
    "totalMinor": 2850,
    "paid": true,
    "customer": { "name": "Sample Customer", "phone": null, "address": null },
    "lines": [
      { "variantId": "33333333-3333-4333-8333-333333333333", "name": "Large Sample Loaf", "quantity": 2, "unitPriceMinor": 1200, "lineTotalMinor": 2400, "note": null },
      { "variantId": "44444444-4444-4444-8444-444444444444", "name": "Sample Bun", "quantity": 1, "unitPriceMinor": 450, "lineTotalMinor": 450, "note": "no sugar" }
    ]
  }
}
```

- Amounts are integers in the currency's smallest unit (sen for MYR), so `2850` is RM 28.50.
- `eventId` stays the same for an order, so a receiver can ignore a repeat delivery.
- `testData` is `true` for demo records, which a receiver should keep out of real figures.
- `customer` is personal data. A real integration needs an agreed purpose and retention period for it.
- A booking has the same shape with `"type": "booking"`, but bookings aren't part of the main demo flow.

## The approval gate doesn't change

The event is built after approval and has no way to approve anything. An order is confirmed only through `transitionOrder()` in `src/lib/orders.ts`, behind `apiSession(["owner", "service"])`, and a rejection stops the order and is logged. Sending the event, if it's ever added, must happen after that commit and must never undo or block it if Orbyte is unavailable.

## To confirm with Orbyte

1. How workspaces and people reach an outside app, and the real role names.
2. Whether approved orders go out by webhook or queue, and how they're signed.
3. Which customer fields Orbyte may receive.
4. How cancellations and refunds after approval should be reported.
5. Whether a module like this would sign in through Connect, and how its usage would be charged to the credit wallet.
