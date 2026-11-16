# Database contract: Tournament registration

**Collections**: `TournamentRegistration`, `StripeEvent`
**Java**: `com.bjjeire.api.registration.TournamentRegistration` (embedded `Payment`, `Refund`, and `competitor.Academy`), `com.bjjeire.api.registration.StripeEvent`
**Seeder**: none yet. Sign-ups are created only through `POST /api/v1/registration`; a test seed for results waits for slice 5.
**API contract**: [../stc/tournaments/contract.yaml](../stc/tournaments/contract.yaml), [../001-tournament-registration/contracts/stripe-webhook.md](../001-tournament-registration/contracts/stripe-webhook.md)
**Design record**: [../001-tournament-registration/data-model.md](../001-tournament-registration/data-model.md) § TournamentRegistration, research R4, R5, R8

One competitor's entry in one division. Public competitor lists, podiums and
rankings are built from the snapshot fields here, never from `Competitor`
(FR-011). No card data is stored (FR-023).

## TournamentRegistration

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | also the Stripe `client_reference_id` and `metadata.registrationId` |
| `tournamentId` | `tournamentId` | ObjectId string, stored as a string | |
| `divisionId` | `divisionId` | ObjectId string, stored as a string | a `Tournament.divisions[].id` |
| `competitorId` | `competitorId` | ObjectId string, stored as a string \| null | `Competitor._id`; unset when the account is deleted |
| `status` | `status` | enum | `AWAITING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `EXPIRED` |
| `active` | `active` | `true` \| absent | `true` exactly while `AWAITING_PAYMENT` or `CONFIRMED`; unset otherwise, so the partial unique index ignores ended sign-ups |
| `holdExpiresAt` | `holdExpiresAt` | Instant \| absent | now + 30 minutes on creation (`bjjeire.registration.hold`); unset when the sign-up leaves `AWAITING_PAYMENT`. The Checkout Session expires 2 minutes later |
| `unpaidSlot` | `unpaidSlot` | 0 \| 1 \| absent | while `AWAITING_PAYMENT`; unset when it leaves that status. Unique per competitor and tournament, so at most two unpaid sign-ups exist at once (FR-041) |
| `displayName` | `displayName` | string | first and last name, copied from the profile; `Former competitor` after account deletion |
| `academy` | `academy` | `Academy` \| null | `gymId` and `name`, copied from the profile |
| `affiliation` | `affiliation` | string \| null | copied from the profile |
| `academyKey` | `academyKey` | string \| null | `gym:<gymId>`, or `name:<name trimmed, lower-cased, spaces collapsed>` (research R8) |
| `affiliationKey` | `affiliationKey` | string \| null | the affiliation trimmed, lower-cased, spaces collapsed |
| `profileMismatch` | `profileMismatch` | boolean | true when the profile's belt or gender no longer matches the division |
| `acceptedPublicListingAt` | `acceptedPublicListingAt` | Instant | FR-012 |
| `acceptedTermsAt` | `acceptedTermsAt` | Instant | FR-012, terms of entry and waiver |
| `payment` | `payment` | `Payment` | see below |
| `refund` | `refund` | `Refund` \| absent | see below |
| `cancelledAt` / `cancelledBy` | same | Instant / string | `COMPETITOR` (own cancellation), `ADMIN` (organiser cancelled this sign-up), `TOURNAMENT` (organiser cancelled the tournament), `SYSTEM` (a late payment refunded for want of a place) |
| `financialRecordsExpireAt` | same | Instant \| absent | account deletion + 6 years (FR-013); after it the retention sweep unsets `payment` and `refund` |
| audit | `createdAt`, `createdBy`, `updatedAt`, `updatedBy` | | |

`Payment`: `checkoutSessionId`, `checkoutUrl` (the open hosted page, returned
again while the hold lasts), `paymentIntentId`, `amountCents` (the
tournament's fee when the sign-up started; a later fee change never touches
it), `currency` (`EUR`), `status` (`PENDING`, `PAID`, `FAILED`), `paidAt`,
`unconfirmedAlertedAt` (set once by the hold sweep when Stripe reports the
session paid but no webhook confirmed it; the hold is kept).

`Refund`: `refundId`, `amountCents`, `status` (`PENDING`, `REFUNDED`,
`FAILED`), `requestedAt`, `completedAt`, `failureReason`, `attempts` (how
many times Stripe was asked; the first uses the key `refund-<id>`, a retry of
a failed refund `refund-<id>-<attempts>`).

### Writes

- Created by `POST /api/v1/registration` after `Tournament.placesTaken` is
  incremented with a guarded `$inc`, in `unpaidSlot` 0, else 1. If the insert
  hits the division index or both slots are taken, or Stripe cannot be
  reached, the document is removed (or never written) and the place given back.
- `AWAITING_PAYMENT → CONFIRMED` only from the verified webhook (guarded
  `findAndModify` on `status`).
- `AWAITING_PAYMENT → EXPIRED` from the `checkout.session.expired` webhook or
  the hold sweep (guarded on `status` and `holdExpiresAt`); the place is given
  back only when that update matched, so exactly once. The sweep waits until
  the hold and the 2-minute Checkout margin have passed and Stripe reports the
  session open or expired; a paid one is kept and alerted instead.
- `EXPIRED → CONFIRMED` when a payment arrives after the hold lapsed and a
  place can be taken again; otherwise `EXPIRED → CANCELLED` with a full refund.
- `CONFIRMED → CANCELLED` by `POST /api/v1/registration/{id}/cancel` (the
  owner; refund only before `registrationClosesAt`), the organiser's
  `POST /api/v1/tournament/{id}/registration/{registrationId}/cancel` (refund
  as chosen), or `POST /api/v1/tournament/{id}/cancel` (always refunded).
  Guarded on `status`; unsets `active`, sets `cancelledAt` and `cancelledBy`
  and, when refunded, `refund` with status `PENDING`; the place is given back.
  Stripe is then asked for the refund with the key `refund-<id>`, and
  `refund.refundId` and `refund.status` (`REFUNDED` at once, or `PENDING`) are
  recorded, or `FAILED` with `failureReason` when Stripe refuses.
- `refund.status` `PENDING`/`FAILED → REFUNDED` from the `refund.updated`
  webhook (status `succeeded`), and `PENDING → FAILED` from `refund.failed`
  (or a `failed`/`canceled` status). Matched by `metadata.registrationId` and
  `refund.refundId`; never set back from `REFUNDED`.
- `divisionId` changes on a `CONFIRMED` sign-up by the owner while
  registration is open, or by the organiser at any time (which also sets
  `profileMismatch`). Guarded on `status` and the old `divisionId`; the
  division index refuses a division the competitor already holds.
  `placesTaken` and `payment` are unchanged.
- The organiser's team merge rewrites `academy` and `academyKey`, or
  `affiliation` and `affiliationKey`, on every sign-up of one tournament
  whose key is in the merged list.
- Account deletion first unsets `competitorId`, sets `displayName` to
  `Former competitor` and `financialRecordsExpireAt` to now + 6 years on all
  the competitor's sign-ups. A daily sweep unsets `payment` and `refund` on
  sign-ups past `financialRecordsExpireAt`.
- Cancelling a tournament first ends its `AWAITING_PAYMENT` sign-ups
  (`EXPIRED`, place given back); a payment that arrives later is refunded.
- A profile save copies `displayName`, `academy`, `affiliation` and both keys
  to the competitor's active sign-ups in tournaments that are not finished or
  cancelled, and sets `profileMismatch`.
- Every write evicts `ApiCache.TOURNAMENTS_TAG`.

### Indexes (`config/MongoIndexInitializer`)

| Name | Keys | Options |
|---|---|---|
| `ux_registration_active_competitor_division` | `competitorId`, `tournamentId`, `divisionId` | unique, partial on `active: true` (FR-020) |
| `ux_registration_unpaid_slot` | `competitorId`, `tournamentId`, `unpaidSlot` | unique, partial on `unpaidSlot` existing (FR-041) |
| `ix_registration_tournament_division_status` | `tournamentId`, `divisionId`, `status` | competitor lists, division removal check |
| `ix_registration_competitor` | `competitorId`, `createdAt` | my sign-ups, unpaid count |
| `ix_registration_status_holdExpiresAt` | `status`, `holdExpiresAt` | hold sweep |
| `ix_registration_financialRecordsExpireAt` | `financialRecordsExpireAt` | sparse, retention sweep |
| `ix_registration_checkoutSessionId` | `payment.checkoutSessionId` | webhook lookup |

## StripeEvent

Webhook idempotency ledger.

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | string | the Stripe event id; a redelivery fails the insert and is acknowledged without being applied |
| `type` | `type` | string | |
| `receivedAt` | `receivedAt` | Instant | |
| `expiresAt` | `expiresAt` | Instant | `receivedAt` + 30 days |
| `handled` | `handled` | boolean | true once the event's change is saved |

Index `ttl_stripeEvent_expiresAt` on `expiresAt`, `expireAfterSeconds: 0`.
Only the four handled Checkout event types are recorded. A redelivery of a
handled event is acknowledged without being applied; an entry left unhandled
(the apply failed, or the pod died) is applied again on Stripe's retry.
