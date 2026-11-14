# Contract: Stripe integration

**Date**: 2026-11-13 · Decisions: [research.md](../research.md) R3–R5 · States: [data-model.md](../data-model.md)

The only inbound call BjjEire accepts from Stripe, and the outbound calls it
makes. Event names and field names must be checked against the pinned Stripe
API version in the first task that implements them.

## Outbound: create Checkout Session

Made when a competitor starts or retries a sign-up.

| Setting | Value |
|---|---|
| Mode | one-off payment, hosted page |
| Line item | one, "«tournament name» — «division label»", `entryFeeCents`, `eur`, quantity 1 |
| `client_reference_id` | registration id |
| `metadata` | `registrationId`, `tournamentId`, `divisionId` |
| `customer_email` | competitor's email |
| Expiry | `holdExpiresAt` (30 minutes) |
| Success URL | `/tournaments/:slug/signup/complete?registration=<id>` |
| Cancel URL | `/tournaments/:slug/signup?registration=<id>` |
| Idempotency key | `checkout-<registrationId>-<attempt>` |

The API never sends the amount it was given by the browser; it reads the fee from the tournament.

## Outbound: create refund

| Setting | Value |
|---|---|
| Target | the registration's payment |
| Amount | full `payment.amountCents` |
| `metadata` | `registrationId` |
| Idempotency key | `refund-<registrationId>` |

The registration's refund is `PENDING` until Stripe reports the outcome.

## Inbound: `POST /api/v1/registration/stripe-webhook`

- **Authentication**: `Stripe-Signature` header verified against `STRIPE_WEBHOOK_SECRET` over the raw request body, with the SDK's default timestamp tolerance. No bearer token. A bad or missing signature returns 400 and changes nothing.
- **Idempotency**: the event id is inserted into `StripeEvent` first. A duplicate insert means the event was already handled; return 200.
- **Response**: 200 once the state change is saved. Any failure returns 5xx so Stripe retries. Unknown event types return 200 and are ignored.
- **Filters**: exempt from read-only mode; counted by the rate limiter per source like any other route; gated by the `Tournaments` flag.

| Event | Effect on the registration |
|---|---|
| Checkout session completed (paid) | `AWAITING_PAYMENT` → `CONFIRMED`, payment `PAID`, confirmation email. If the hold had lapsed: re-take a place if one is free, otherwise refund in full and end `CANCELLED` |
| Checkout session expired | `AWAITING_PAYMENT` → `EXPIRED`, place released |
| Refund succeeded | refund `PENDING` → `REFUNDED`, refund email |
| Refund failed | refund → `FAILED`, admin alert; competitor sees "refund pending" |

Events are matched to a registration by `client_reference_id` / `metadata.registrationId`, never by email.

## Local and test

- Local: the Stripe CLI forwards test-mode events to the local API and prints the webhook secret to use.
- API integration tests: the Stripe gateway is an interface in the `registration` package with a recording fake; webhook tests post signed payloads built with a test secret.
- `bjjeire-tests`: Stripe test mode and test cards against a deployed preview.
