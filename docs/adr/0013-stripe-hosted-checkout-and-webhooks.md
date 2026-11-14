# ADR-0013: Entry fees use Stripe hosted checkout, confirmed by signed webhook

- **Status:** Accepted
- **Date:** 2026-11-13
- **Applies to:** the `registration` package, `config/SecurityConfig.java`, `config/ReadOnlyModeFilter.java`, `web/TournamentFeatureGateFilter.java`, `bjjeire.stripe.*` configuration
- **Amends:** constitution principle V (1.0.0 → 1.1.0)

## Context

Tournament sign-ups carry a small entry fee
([specs/001-tournament-registration](../../specs/001-tournament-registration/spec.md)).
The owner chose Stripe. Three existing rules get in the way of taking a
payment:

- every write requires a bearer token, and Stripe cannot present one;
- production runs with read-only mode on, which answers every write with 405;
- the API has never held a third-party secret.

## Decision

**Hosted checkout.** The API creates a Stripe Checkout Session for one
sign-up and returns its URL. Card details never reach BjjEire. The amount is
read from the tournament, never from the request.

**The webhook is the only confirmer.** A sign-up becomes confirmed only when
`POST /api/v1/registration/stripe-webhook` receives a "session completed"
event whose `Stripe-Signature` verifies against the webhook secret. The
browser returning from checkout confirms nothing. This is the single write
route with no bearer token: it is `permitAll` in `SecurityConfig` and
authenticated by signature inside the controller. Processed event ids are
stored so a redelivery is a no-op.

**Read-only mode and the feature flag are separate switches.**
`ReadOnlyModeFilter` keeps blocking directory writes. Requests under
`/api/v1/tournament`, `/api/v1/competitor` and `/api/v1/registration` skip it
(`ApiRoutes.isTournamentFeaturePath`). Those routes are governed by the
`Tournaments` flag instead: when it is off, `TournamentFeatureGateFilter`
answers 404 before authentication. The flag defaults to off. The path is
percent-decoded before it is compared, because the security rules and the
router match the decoded path.

**Secrets.** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` come from Key
Vault through External Secrets. They are not `VITE_APP_*` values and are
never baked into an image. The defaults in `application.yml` are
non-functional placeholders.

## Consequences

- A payment made in a tab that is then closed still confirms the sign-up.
- A forged return URL cannot confirm an unpaid place.
- Turning tournaments on does not open directory writes, and turning
  read-only mode off is not needed to take sign-ups.
- Removing a route prefix from `ApiRoutes.isTournamentFeaturePath` makes every
  write under it answer 405 in production. Adding an unrelated prefix exempts
  it from read-only mode.
- The cluster mesh denies egress by default. The API needs a `ServiceEntry`
  for Stripe in `bjjeire-gitops` or every outbound call fails.
- A Stripe Checkout Session cannot expire sooner than 30 minutes, so a place
  is held for 30 minutes while a competitor pays.

## Alternatives considered

- **Confirm on the browser's return.** Loses sign-ups when the tab closes and
  trusts a URL the payer controls.
- **Embedded card form.** More SPA code and a wider PCI scope.
- **Turn read-only mode off in production.** Would rely on authentication
  alone for directory writes, a change the owner did not ask for.
- **A separate payments service.** A second deployable for one feature.
