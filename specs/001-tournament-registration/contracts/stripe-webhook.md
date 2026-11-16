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
| Expiry | `holdExpiresAt` + 2 minutes: Stripe's 30-minute minimum counts from when it creates the session, a moment after the hold starts. A payment completed in the margin is handled as a late payment |
| Success URL | `/tournaments/:slug/signup/complete?registration=<id>` |
| Cancel URL | `/tournaments/:slug/signup?registration=<id>` |
| Idempotency key | `checkout-<registrationId>-<attempt>` |

The API never sends the amount it was given by the browser; it reads the fee from the tournament.

## Outbound: retrieve Checkout Session

Never confirms anything; only the webhook does. Asked in two places:

| Where | Session is paid or processing | Session is open or expired | Stripe cannot be reached |
|---|---|---|---|
| "Return to payment" (`POST /registration/{id}/checkout`) | 409 `payment-received`; no link to the finished page | the open page again (or 409 `hold-expired` once the hold ended) | the open page again |
| Hold sweep, once the hold and the 2-minute margin have passed | the hold is kept, `payment.unconfirmedAlertedAt` set, one `ALERT` and `registration.payment.unconfirmed` | the sign-up expires and its place is given back | the hold is kept and the next sweep asks again; 24 hours after the hold ended it is alerted once (state `UNKNOWN`) and no longer asked about |

A session Stripe does not know (`resource_missing`, for example after a key, sandbox or test-to-live switch) counts as expired: it can never be paid.

## Outbound: create refund

| Setting | Value |
|---|---|
| Target | the registration's payment |
| Amount | full `payment.amountCents` |
| `metadata` | `registrationId` |
| Idempotency key | `refund-<registrationId>`; a retry of a refund that failed uses `refund-<registrationId>-<attempt>`, because Stripe answers a reused key with its first answer and creates nothing. Stripe refuses to refund more than was paid, so a new key cannot pay back twice |

The registration's refund is `PENDING` until Stripe reports the outcome.

## Inbound: `POST /api/v1/registration/stripe-webhook`

- **Authentication**: `Stripe-Signature` header verified against `STRIPE_WEBHOOK_SECRET` over the raw request body, with the SDK's default timestamp tolerance. No bearer token. A bad or missing signature returns 400 and changes nothing. While the secret is blank or the public `REPLACE_ME` placeholder every call returns 503, and checkout refuses to start (502) while `STRIPE_SECRET_KEY` is.
- **Idempotency**: the event id is inserted into `StripeEvent` first and marked `handled` only after its change is saved. A redelivery of a handled event returns 200 and changes nothing; one left unhandled (a failure, or a pod that died part way) is applied again. Every handler is guarded on the sign-up's status, so applying twice changes nothing.
- **Response**: 200 once the state change is saved. Any failure returns 5xx so Stripe retries. Unknown event types return 200 and are ignored.
- **Filters**: exempt from read-only mode; counted by the rate limiter per source like any other route; gated by the `Tournaments` flag.

| Event | Effect on the registration |
|---|---|
| Checkout session completed (paid) | `AWAITING_PAYMENT` → `CONFIRMED`, payment `PAID`, confirmation email. If the hold had lapsed: re-take a place if one is free, otherwise refund in full and end `CANCELLED` |
| Checkout session expired | `AWAITING_PAYMENT` → `EXPIRED`, place released |
| Refund succeeded (`refund.created` / `refund.updated` with status `succeeded`) | refund `PENDING` or `FAILED` → `REFUNDED`, refund email |
| Refund failed (`refund.failed`, or `refund.updated` with status `failed` / `canceled`) | refund `PENDING` → `FAILED`, admin alert (`registration.refund.failures`, `ALERT` log); competitor sees "refund pending" |

Events are matched to a registration by `client_reference_id` / `metadata.registrationId`, never by email. A refund event must also name the refund id the sign-up recorded (when one is recorded); another refund of the same sign-up is ignored. The Stripe webhook endpoint must subscribe to `refund.created`, `refund.updated` and `refund.failed` as well as the Checkout events.

## Local and test

- Local: the Stripe CLI forwards test-mode events to the local API and prints the webhook secret to use.
- API integration tests: the Stripe gateway is an interface in the `registration` package with a recording fake; webhook tests post signed payloads built with a test secret.
- `bjjeire-tests`: Stripe test mode and test cards against a deployed preview.
