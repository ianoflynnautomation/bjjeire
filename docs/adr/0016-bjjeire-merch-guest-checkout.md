# ADR-0016: BJJ Éire merch sells to guests, with its own signed webhook

- **Status:** Accepted
- **Date:** 2026-11-18
- **Applies to:** `common/ApiRoutes.java` (`PRODUCT`, `ORDER`, `isMerchFeaturePath`), `common/StripeMetadata.java`, `common/StripeSignature.java`, `config/SecurityConfig.java` (`merchRules`), `config/ReadOnlyModeFilter.java`, `web/MerchFeatureGateFilter.java`, `web/FeatureFlag.MERCH`, `bjjeire.stripe.shop-webhook-secret`, `bjjeire.order.*`, and the `product` and `order` packages as they land
- **Amends:** constitution principles II and V (1.2.0 → 1.3.0)
- **Design record:** [specs/003-bjjeire-merch-shop/](../../specs/003-bjjeire-merch-shop/spec.md), research R1, R2, R4, R6 and R7

## Context

The owner wants to sell BJJ Éire rashguards, shorts and t-shirts on the Shop
page, and to take payment through the same Stripe account and hosted
Checkout as BJJ Éire competitions ([ADR-0013](0013-stripe-hosted-checkout-and-webhooks.md)).
The owner chose guest checkout: a shopper gives a name and an email address
and never signs in (spec clarification, 2026-11-17).

Four existing rules get in the way:

- every write needs a bearer token, and a guest has none;
- the one write without a token is registration's webhook;
- production runs with read-only mode on;
- the competitions flag governs competition routes only.

There is a fifth constraint. Stripe sends each event to every endpoint
subscribed to its type, under one `evt_` id. Two webhooks on one account
therefore both receive every checkout and refund event.

## Decision

**Two feature packages.** `product` owns the catalogue, stock and photos.
`order` owns guest orders, the shop's webhook, refunds and the dashboard.
They have different owners and access rules, as `bjjeirecompetition` and
`registration` do (ADR-0001).

**Guest writes with no token.** `POST /api/v1/order` starts a checkout and
`POST /api/v1/order/{id}/checkout` resumes one. `GET /api/v1/order/{id}` reads
an order with the header `X-Order-Key`. The key is 32 random bytes; its
SHA-256 is stored (and, until the order is confirmed, the key itself:
[ADR-0018](0018-order-access-key-kept-until-confirmed.md)), and a wrong or missing key answers 404. These, the public
catalogue reads and the delivery fee are `permitAll` in
`SecurityConfig.merchRules`. A competitor token gives no extra shop rights.

**Organiser routes.** `/api/v1/product/admin/**` and `/api/v1/order/admin/**`
need the writer scope. In `merchRules` they come **before** the public
patterns, because `/product/*` and `/order/*` also match `/admin`.

**A second signed webhook.** `POST /api/v1/order/stripe-webhook` is
authenticated by `Stripe-Signature` against its own secret,
`STRIPE_SHOP_WEBHOOK_SECRET` (Key Vault `bjj-api-stripe-shop-webhook-secret`).
Both webhooks use `common.StripeSignature`. Each Checkout Session and Refund
carries `metadata.bjjeireKind` (`common.StripeMetadata`): `registration` or
`order`. Each webhook handles only its own kind and acknowledges the rest
with 200, without recording them. An object with no kind predates the shop
and is registration's. Each webhook keeps its own ledger of processed event
ids (`StripeEvent`, `OrderStripeEvent`), because the event id is shared.

**Read-only mode and the `Merch` flag.** Requests under `/api/v1/product` and
`/api/v1/order` skip `ReadOnlyModeFilter` (`ApiRoutes.isMerchFeaturePath`,
which percent-decodes like `isBjjEireCompetitionFeaturePath`). They are
governed by the `Merch` flag instead (`FEATURE_MERCH`, default off). When it
is off, `MerchFeatureGateFilter` answers 404 ahead of authentication. The
store directory stays under the `Stores` flag and read-only mode.

**Photos in MongoDB GridFS.** Product photos are uploaded by the organiser
and stored in the `productPhotos` bucket, under the SHA-256 of their content.
No new cloud resource is added.

**Enum wire values.** The `product` and `order` contracts use `UPPER_SNAKE`
values (`RASHGUARD`, `AWAITING_PAYMENT`), extending the BJJ Éire competition
exception in `.claude/rules/api.md`.

## Consequences

- A guest can buy without an account, and the confirmation mail's link is
  the only way to read the order. Anyone holding the link can read it.
- Removing `PRODUCT` or `ORDER` from `isMerchFeaturePath` makes every guest
  checkout answer 405 in production.
- Putting the public `/order/*` rule ahead of the admin rules makes
  `GET /api/v1/order/admin` (every shopper's name and address) public.
  `MerchRouteAuthorizationIT` fails if that happens.
- A Checkout Session or Refund created without `bjjeireKind = order` is
  handled by registration's webhook, not the shop's. Every shop call to
  Stripe must set it.
- Merging the two ledgers makes whichever webhook answers second skip the
  event.
- The shop needs a second webhook endpoint registered in Stripe (test and
  live) and the secret in Key Vault before `Merch` is turned on.
- The cluster mesh allows registered egress only (`bjjeire-gitops` ADR-0004),
  and there is no `ServiceEntry` for `api.stripe.com` yet. One must be added
  in `bjjeire-gitops` before `Merch` (or `BjjEireCompetitions`) is turned on
  in a cluster, or every checkout and refund fails.
- Unauthenticated holds can tie up stock. They are capped per line, per
  order, per email and per client address (`bjjeire.order.*`), held for 30
  minutes, and released by a sweep. Cloudflare Turnstile is the next step if
  that is not enough.

## Alternatives considered

- **Require the competitor account to buy.** Offered and declined by the
  owner: it adds a sign-up step to every first purchase.
- **One webhook in `common` that dispatches by kind.** `common` would depend
  on both features and become a third feature.
- **One ledger keyed by endpoint and event.** Still a shared dispatcher, for
  no gain over two ledgers.
- **Turn read-only mode off in production.** Directory writes would then rely
  on authentication alone, as ADR-0013 already rejected.
- **Azure Blob Storage for photos.** Terraform, Key Vault, egress rules and
  CORS for a few megabytes. Viable if the catalogue grows past what the
  database should hold.
