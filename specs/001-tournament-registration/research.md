# Research: In-House Tournament Registration

**Date**: 2026-11-13 · **Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

Each entry resolves one unknown from the plan's Technical Context. Items marked
**Verify** rest on vendor behaviour that must be confirmed against the vendor's
current documentation in the first task that touches it.

## R1. Competitor identity

- **Decision**: Microsoft Entra External ID, in a separate external tenant (owner's choice, 2026-11-13). Microsoft hosts sign-up, email confirmation, sign-in and password reset. The API stores no credentials. It accepts access tokens from two issuers: the existing workforce tenant (admin) and the external tenant (competitors).
- **Rationale**: The API is already an OAuth2 resource server and the SPA already ships MSAL. A second issuer is configuration plus one resolver, not a credential store. Requirements `#5006`, `#5010` and `#5011` (register, no duplicate account, reset) are met by the hosted flow.
- **Alternatives considered**: Accounts built into the API (hashed passwords, sessions, reset tokens): most security-sensitive code in the feature, rejected by the owner. Emailed sign-in links: every sign-in depends on mail delivery.
- **Consequences**:
  - The external tenant, its SPA app registration, its API app registration (scope `access_as_competitor`) and the sign-up user flow are provisioned in the sibling terraform repo, not here.
  - Constitution principle V changes. See R9.
  - **Verify**: the external tenant's issuer and authority host format (`<tenant>.ciamlogin.com`) and the claim that carries the verified email.

## R2. Telling admin and competitor tokens apart

- **Decision**: Replace the single-issuer JWT configuration with an issuer-based authentication manager resolver that trusts exactly two issuers. The workforce issuer keeps today's authority mapping (`SCOPE_access_as_writer`). A token from the external issuer is granted `ROLE_COMPETITOR` only when it carries the competitor scope. The competitor's identity is the pair (issuer, `sub`).
- **Rationale**: The existing rule "POST/PUT/PATCH/DELETE on anything requires the writer authority" stays as the catch-all, so a competitor token can never write to gyms, events, competitions or stores (FR-014, `#5037`). New matchers for competitor routes are added above it.
- **Alternatives considered**: One tenant with app roles for both audiences: mixes members of the public into the workforce tenant. A separate API deployment for tournaments: a second service for one feature.

## R3. Payments

- **Decision**: Stripe (owner's choice) with hosted Checkout in payment mode, one Checkout Session per sign-up, currency EUR, amounts held as integer cents. The API creates the session and returns its URL; the SPA redirects. A sign-up is confirmed only by the signed `checkout.session.completed` webhook, never by the browser returning. Refunds are created through the Refunds API against the session's payment.
- **Rationale**: Hosted Checkout keeps card data off BjjEire (FR-023). Webhook-driven confirmation covers the "closed the tab after paying" edge case. The official Java SDK (`com.stripe:stripe-java`) handles signature verification.
- **Idempotency**: session creation uses idempotency key `checkout-<registrationId>-<attempt>`; refund creation uses `refund-<registrationId>`. Processed webhook event ids are stored in a `StripeEvent` collection with a unique index, so a redelivered event is a no-op (SC-004).
- **Alternatives considered**: Embedded card form (Payment Element): more SPA code and a wider PCI scope. Payment Links: no per-sign-up reference or expiry control.
- **Secrets**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` come from a cluster secret managed in `bjjeire-gitops`. They are not `VITE_APP_*` values and are never baked into an image.

## R4. Holding a place while the competitor pays

- **Decision**: A sign-up starts as `AWAITING_PAYMENT` with `holdExpiresAt` = now + 30 minutes, and the Checkout Session is created with the same expiry. The place is released by the `checkout.session.expired` webhook, with a scheduled sweep as a fallback for a missed webhook.
- **Rationale**: Stripe does not allow a Checkout Session to expire sooner than 30 minutes after creation. Matching the hold to the session means a competitor can never pay for a place that was already given away.
- **Spec impact**: FR-019's default hold changes from 15 to 30 minutes. The spec has been updated.
- **Alternatives considered**: Keep 15 minutes and call the "expire session" API from a timer: one more moving part, and a race between the timer and a payment in flight.
- **Hold limit**: a competitor may have at most two unpaid sign-ups in one tournament (FR-041, owner's decision 2026-11-13), so one account cannot hold a tournament's places without paying. Checked with a count before the place is taken; the small race this leaves can let through a third hold at most, which the expiry clears.
- **Verified 2026-11-13** against Stripe's API reference for creating a Checkout Session: `expires_at` "can be anywhere from 30 minutes to 24 hours after Checkout Session creation" and defaults to 24 hours; the expiry event is `checkout.session.expired`.

## R5. Capacity and duplicate sign-ups under concurrency

- **Decision**: No multi-document transactions. Two atomic guards:
  1. **Capacity**: the tournament document carries `placesTaken`. A place is taken with a conditional `findAndModify` (`placesTaken < competitorLimit`, `$inc`) and given back with a guarded `$inc -1`.
  2. **Duplicates**: the registration document carries `active: true` while `AWAITING_PAYMENT` or `CONFIRMED` and the field is removed otherwise. A partial unique index on `(competitorId, tournamentId, divisionId)` where `active` is true makes a second active sign-up fail at the database (FR-020).
- **Rationale**: Both are single-document operations, which MongoDB guarantees atomic. They follow the repository's `findAndModify` rule and need no replica-set transaction support in local compose.
- **Late payment**: if `checkout.session.completed` arrives for a sign-up whose hold was already released and no place can be re-taken, the payment is refunded in full automatically and the sign-up ends as `CANCELLED` with refund `REFUNDED`.

## R6. Transactional email

- **Decision**: `spring-boot-starter-mail` over SMTP, with the provider supplied by environment. Local compose adds Mailpit. Production points at an SMTP relay configured in gitops; Azure Communication Services Email is the suggested one since the platform is on Azure. Mail is sent after the state change is saved, asynchronously, with three attempts and a failure metric. Sign-up, cancellation, refund and tournament-cancellation mails are the four templates (FR-024).
- **Rationale**: SMTP keeps the code provider-neutral and testable against a local catcher. Account emails (confirmation, reset) are sent by Entra, not by this code.
- **Alternatives considered**: A provider SDK: ties the code to one vendor. Stripe receipts only: does not cover non-refunded cancellations or tournament cancellation. A persistent outbox: more reliable, deferred until a missed mail is observed.

## R7. Where results and rankings live

- **Decision**: Divisions are embedded in the tournament document and each division embeds its own result (gold, silver, up to two bronze, each a registration id). Rankings are not stored. The leaderboard is computed on read from the results plus the medallists' registrations, and cached under a tournament cache tag that every result write, merge, move and cancellation evicts.
- **Rationale**: A tournament has tens of divisions, well inside one document. Deriving rankings means a corrected result can never leave a stale total (FR-033, SC-007). Eviction on write meets "within 1 minute" (SC-006).
- **Points calculation**: a pure function over (podiums, registrations) in the `tournament` package, unit-tested for 9/3/1, the single-competitor rule, missing academy or affiliation, tie-break order and joint winners.

## R8. Academy and affiliation identity

- **Decision**: Each registration carries a snapshot of the competitor's display name, academy (`gymId` when chosen from the directory, plus name) and affiliation name. Rankings group by a key: the `gymId` if present, otherwise the name trimmed, case-folded and with whitespace collapsed. The admin's merge tool rewrites the snapshot on every registration of that tournament matching the source keys.
- **Rationale**: The public competitor list, podium and rankings read one collection and never touch private profiles. Deleting an account anonymises the snapshot without disturbing points.
- **Propagation**: a competitor's edit to their name, academy or affiliation is copied to their active registrations in tournaments that are not finished or cancelled.

## R9. Constitution and ADRs

- **Decision**: Two ADRs and one constitution amendment are the first tasks, before any code:
  - **ADR-0012 — Competitor identity is a second token issuer.** Principle V becomes: public reads; directory writes require the admin token; competitor routes require a competitor token and may only touch the caller's own profile and sign-ups.
  - **ADR-0013 — Stripe hosted checkout and signed webhooks.** Records the one unauthenticated write (the webhook, authenticated by signature), the secrets' home, and that tournament routes are governed by the `Tournaments` flag rather than by read-only mode.
  - Constitution 1.0.0 → 1.1.0 with the reworded principle V, the three new feature packages in principle II, and the new collections.
- **Rationale**: Governance requires an ADR and a version bump for an amendment. Doing it first means `spec-review` checks the new code against the amended rule.

## R10. Read-only mode and the feature flag

- **Decision**: `ReadOnlyModeFilter` (on by default) keeps blocking directory writes. Requests under the tournament, competitor and registration routes skip it. Those routes are instead gated by a new `Tournaments` flag, default off, enforced in the API (404 when off) and in the SPA (existing fail-closed gate).
- **Rationale**: "Keep the existing features read only" (FR-037) and "switch the new feature off as a whole" (FR-038) are two separate switches. Turning tournaments on must not open directory writes.

## R11. Account deletion

- **Decision**: `DELETE /api/v1/competitor/me` removes the profile document, anonymises the competitor's registration snapshots (name replaced by a fixed placeholder, competitor link removed), and deletes the user from the external tenant through Microsoft Graph using an application credential. Payment and refund records stay on the registration for six years after the deletion (owner's decision 2026-11-13) and are then removed by a scheduled sweep; the registration itself, its anonymised snapshot and any medal remain (FR-013).
- **Rationale**: `#5012` requires that the person can no longer sign in, which only removing the identity achieves.
- **Risk**: this is the only place the API needs a credential with write access to the identity tenant. The permission is scoped to that external tenant. If it cannot be granted, the fallback is to record the subject as deleted and refuse it at the API, and to remove the identity by hand; the spec would then need `#5012` reworded.
- **Verify**: the least-privileged Graph permission that allows deleting a user in an external tenant.

## R12. Admin screens

- **Decision**: The SPA gains an admin area for tournaments, signed in through the existing workforce MSAL configuration: create and edit, a division generator (pick gi/no-gi, genders, age categories, belts and weight classes; the cross-product is created and can be pruned), publish, sign-up list with CSV export, move, cancel, merge names, enter results, finish.
- **Rationale**: The directory has no admin UI today, but "publish a 50-division tournament in under 30 minutes" (SC-008) is not reachable by hand-written API calls.
- **Alternatives considered**: Admin through the API only for the first release: cheaper, fails SC-008, and makes results entry on the day impractical.

## R13. Eligibility rules

- **Decision**: A division is offered when the competitor's gender and belt equal the division's and their age on the tournament date (in `Europe/Dublin`) is at least the division's minimum age. Age categories are a fixed list with minimum ages (Adult 18, Master 1 30, Master 2 36, Master 3 41, Master 4 46, Master 5 51). A competitor may enter any category whose minimum they meet. Anyone under 18 on the day is refused regardless of division (FR-017).
- **Rationale**: Matches common BJJ practice, where older competitors may drop to a younger category, and keeps the rule a pure function for unit tests.

## R14. Acceptance testing with real identity and payments

- **Decision**: API integration tests use `spring-security-test` JWTs with the right issuer and a stubbed Stripe gateway and mail sender behind interfaces in the `registration` package. `bjjeire-tests` uses dedicated test users in a non-production external tenant, Stripe test mode with test cards, and reads mail from the catcher. Seeded test tournaments live in `seeder/data-test/tournaments/`.
- **Rationale**: Keeps the "never mock Mongo" rule, keeps vendors out of CI's critical path, and still proves the real redirect-pay-return journey at T6.

## R15. Cluster wiring (terraform and gitops)

- **Decision**: Values reach the API the way the admin tenant's do today: terraform writes Key Vault secrets, an `ExternalSecret` in `bjjeire-gitops` turns them into a Kubernetes secret, and the Helm release maps that into the API's environment.
  - Key Vault names (added to `bjjeire-terraform-azurerm-aks`, `main.key-vault.tf`, with placeholder values from `variables.tournament.tf`): `bjj-api-competitor-tenant-id`, `bjj-api-competitor-audience`, `bjj-api-stripe-secret-key`, `bjj-api-stripe-webhook-secret`.
  - The competitor app registrations themselves go in `main.app-registrations.tf` once the external tenant exists; they need a second `azuread` provider configured for that tenant, which cannot be planned against a placeholder.
- **Ordering constraint**: the `bjj-eire` Flux kustomization runs with `wait: true`. An `ExternalSecret` that names a Key Vault secret which does not exist yet never becomes ready and holds the whole kustomization unhealthy. So terraform must be applied in an environment before the gitops change reaches that environment.
- **Egress**: the mesh is `REGISTRY_ONLY` (gitops ADR-0004). The API needs a `ServiceEntry` for each new outbound host: Stripe's API, the external tenant's sign-in host (token key discovery), Microsoft Graph (account deletion) and the SMTP relay. Without them every call fails with no route.
- **Stripe key in the pod**: the existing Helm wiring passes values as plain environment entries. That is acceptable for an issuer URI, not for a payment key. The chart in `bjjeire-deploy` should read the Stripe values from the Kubernetes secret by reference.
