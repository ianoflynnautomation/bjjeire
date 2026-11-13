# Data Model: In-House Tournament Registration

**Date**: 2026-11-13 · **Spec**: [spec.md](spec.md) · **Research**: [research.md](research.md)

Four new collections. Existing collections are not changed. Conventions follow
`specs/database-contracts/shared.md`: ids are 24-char hex ObjectIds, every
aggregate carries the audit fields, instants are UTC. Money is integer cents in
EUR. On implementation each section becomes a living contract under
`specs/database-contracts/`.

| Collection | Java type | Living contract to add |
|---|---|---|
| `Tournament` | `tournament.Tournament` | `specs/database-contracts/tournament.md` |
| `Competitor` | `competitor.Competitor` | `specs/database-contracts/competitor.md` |
| `TournamentRegistration` | `registration.TournamentRegistration` | `specs/database-contracts/tournament-registration.md` |
| `StripeEvent` | `registration.StripeEvent` | same file as registration |

## Tournament

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId string | |
| `slug` | string | **unique**; used in the public URL; lowercase letters, digits and hyphens; `admin` is reserved |
| `name` | string | required, ≤ 120. First tournament: "BjjEire" |
| `description` | string | ≤ 4000 |
| `date` | LocalDate | the competition day, interpreted in `Europe/Dublin` |
| `venue` | `Location` | shared type; coordinates `[longitude, latitude]` |
| `entryFeeCents` | int | ≥ 0; fee per division sign-up |
| `currency` | string | always `"EUR"` |
| `registrationOpensAt` | Instant | |
| `registrationClosesAt` | Instant | after `registrationOpensAt`, not after end of `date` |
| `competitorLimit` | int \| null | null = no limit |
| `placesTaken` | int | active sign-ups (`AWAITING_PAYMENT` + `CONFIRMED`); changed only by atomic `$inc` |
| `status` | enum | `DRAFT`, `PUBLISHED`, `CANCELLED`, `FINISHED` |
| `divisions` | `Division[]` | embedded |
| audit | | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` |

### Division (embedded)

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId string | stable; registrations reference it |
| `discipline` | enum | `GI`, `NO_GI` |
| `gender` | enum | `MALE`, `FEMALE` |
| `ageCategory` | enum | `ADULT`, `MASTER_1` … `MASTER_5`; fixed minimum ages (research R13) |
| `belt` | enum | `WHITE`, `BLUE`, `PURPLE`, `BROWN`, `BLACK` |
| `weightClass` | string | display label, e.g. `"-76 kg"` |
| `result` | `DivisionResult` \| null | |

The tuple (`discipline`, `gender`, `ageCategory`, `belt`, `weightClass`) is unique within a tournament.

### DivisionResult (embedded)

| Field | Type | Notes |
|---|---|---|
| `goldRegistrationId` | ObjectId string | required |
| `silverRegistrationId` | ObjectId string \| null | |
| `bronzeRegistrationIds` | ObjectId string[] | 0–2 |
| `recordedAt` / `recordedBy` | Instant / string | |

Rules: every id is a `CONFIRMED` registration in this division; no id appears twice (FR-031).

### State transitions

```
DRAFT ──publish──▶ PUBLISHED ──finish──▶ FINISHED
  │                    │
  └──────cancel────────┴──▶ CANCELLED
```

- `publish` requires at least one division and a valid registration window.
- `cancel` on a published tournament refunds every confirmed sign-up (FR-029).
- `finish` freezes results and fixes the winners (FR-040). Results may still be corrected by the admin; the winners are recomputed.
- Only `PUBLISHED`, `FINISHED` and `CANCELLED` are visible to the public. `DRAFT` is admin-only (FR-003).
- A division with active sign-ups cannot be removed (`#5005`).
- Changing `entryFeeCents` never touches existing registrations (edge case).

### Indexes

- `ix_tournament_slug_unique` on `slug` (unique, critical)
- `ix_tournament_status_date` on `(status, date)` — public listing

## Competitor

One per identity. Private to its owner and the admin (FR-011).

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId string | |
| `issuer` | string | token issuer of the external tenant |
| `subject` | string | token `sub`; (`issuer`, `subject`) is **unique** |
| `email` | string | from the verified token claim; refreshed on each profile save |
| `firstName` | string | required, ≤ 60 |
| `middleName` | string \| null | ≤ 60 |
| `lastName` | string | required, ≤ 60 |
| `nationality` | string | ISO 3166-1 alpha-2 |
| `dateOfBirth` | LocalDate | required; in the past |
| `gender` | enum | `MALE`, `FEMALE` |
| `belt` | enum | as Division |
| `academy` | `Academy` \| null | null = "no academy" |
| `affiliation` | string \| null | ≤ 80 |
| `phone` | string \| null | optional |
| `address` | `PostalAddress` \| null | optional: `street`, `postcode`, `city`, `region`, `country` |
| audit | | |

`Academy`: `gymId` (ObjectId string \| null, must exist in `Gym` when set) and `name` (string, ≤ 80, copied from the gym when `gymId` is set).

A profile is **complete** when first name, last name, nationality, date of birth, gender and belt are present. Only a complete profile may sign up (FR-015).

### Indexes

- `ix_competitor_issuer_subject_unique` on `(issuer, subject)` (unique, critical)

## TournamentRegistration

One competitor's entry in one division.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId string | also the Stripe `client_reference_id` |
| `tournamentId` | ObjectId string | |
| `divisionId` | ObjectId string | |
| `competitorId` | ObjectId string \| null | null after account deletion |
| `status` | enum | `AWAITING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `EXPIRED` |
| `active` | boolean \| absent | `true` only while `AWAITING_PAYMENT` or `CONFIRMED`; removed otherwise |
| `holdExpiresAt` | Instant \| null | set while `AWAITING_PAYMENT` |
| `displayName` | string | snapshot; fixed placeholder after account deletion |
| `academy` | `Academy` \| null | snapshot |
| `affiliation` | string \| null | snapshot |
| `academyKey` / `affiliationKey` | string \| null | grouping keys (research R8) |
| `profileMismatch` | boolean | set when the profile's belt or gender no longer fits the division |
| `acceptedPublicListingAt` | Instant | consent (FR-012) |
| `acceptedTermsAt` | Instant | terms of entry and waiver |
| `payment` | `Payment` \| null | |
| `refund` | `Refund` \| null | |
| `cancelledAt` / `cancelledBy` | Instant / string | `COMPETITOR` or `ADMIN` |
| `financialRecordsExpireAt` | Instant \| null | set to account deletion + 6 years; after it, `payment` and `refund` are removed by a sweep (FR-013) |
| audit | | |

`Payment`: `checkoutSessionId`, `paymentIntentId`, `amountCents`, `currency`, `status` (`PENDING`, `PAID`, `FAILED`), `paidAt`.

`Refund`: `refundId`, `amountCents`, `status` (`PENDING`, `REFUNDED`, `FAILED`), `requestedAt`, `completedAt`, `failureReason`.

No card data is stored (FR-023). `amountCents` is the price at the time of sign-up.

### State transitions

```
AWAITING_PAYMENT ──payment webhook──▶ CONFIRMED ──cancel──▶ CANCELLED
       │                                                      (refund: none | PENDING → REFUNDED | FAILED)
       ├──session expired / sweep──▶ EXPIRED
       └──abandoned and retried: stays AWAITING_PAYMENT until the hold ends
```

- Entering `AWAITING_PAYMENT` takes a place; leaving the active states gives it back.
- A competitor may have at most two `AWAITING_PAYMENT` registrations in one tournament; a third is refused (FR-041).
- `CONFIRMED` is reached only from the verified webhook (FR-018).
- Cancel by the competitor: refund in full if now < `registrationClosesAt`, otherwise none (FR-027). Refused if a result names the registration (FR-026).
- Cancel by the admin: refund is the admin's choice (FR-007). Tournament cancellation always refunds (FR-029).
- Division change: allowed for the competitor while registration is open and the target is eligible; for the admin at any time before a result names the registration. `placesTaken` is unchanged.
- A refund that Stripe reports as failed leaves refund `FAILED`, shown to the competitor as "refund pending", and raises an admin alert (edge case).

### Indexes

- `ux_registration_active_competitor_division` on `(competitorId, tournamentId, divisionId)`, unique, partial where `active == true` (critical; FR-020)
- `ix_registration_tournament_division_status` on `(tournamentId, divisionId, status)` — competitor lists, admin list, division removal check
- `ix_registration_competitor` on `(competitorId, createdAt)` — "my sign-ups" and medal history
- `ix_registration_status_holdExpiresAt` on `(status, holdExpiresAt)` — expiry sweep
- `ix_registration_financialRecordsExpireAt` on `financialRecordsExpireAt`, sparse — retention sweep
- `ix_registration_checkoutSessionId` on `payment.checkoutSessionId` — webhook lookup

## StripeEvent

Webhook idempotency ledger.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stripe event id; `_id`, so a redelivery fails the insert |
| `type` | string | |
| `receivedAt` | Instant | |
| `expiresAt` | Instant | TTL, 30 days |

Index: `ttl_stripeEvent_expiresAt`.

## Derived, not stored

- **Public competitor list**: `CONFIRMED` registrations of a tournament, grouped by division: `displayName`, `academy.name`, `affiliation`.
- **Podium**: a division's result resolved to registration snapshots.
- **Academy ranking / affiliation ranking**: per key, 9 × gold + 3 × silver + 1 × bronze over divisions with two or more confirmed competitors; ordered by points, golds, silvers, bronzes (FR-033 to FR-035).
- **Winners**: top of each ranking once the tournament is `FINISHED`; all entries level on every tie-break are joint winners (FR-040).
- **Competitor medal history**: the caller's registrations joined to division results (FR-039).

## Volume

One or a few tournaments a year, up to 50–100 divisions and about 500 competitors each (SC-009). Every query above is covered by an index; no aggregation pipeline is needed at this size.
