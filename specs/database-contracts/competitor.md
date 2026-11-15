# Database contract: Competitor

**Collections**: `Competitor`, `DeletedCompetitor`
**Java**: `com.bjjeire.api.competitor.Competitor` (embedded `Academy`, `PostalAddress`), `com.bjjeire.api.competitor.DeletedCompetitor`
**Seeder**: none. Profiles are created only by the competitor through `PUT /api/v1/competitor/me`.
**API contract**: [../stc/tournaments/contract.yaml](../stc/tournaments/contract.yaml)
**Design record**: [../001-tournament-registration/data-model.md](../001-tournament-registration/data-model.md) § Competitor, research R11

Personal data under GDPR. No public response is ever built from these
collections (FR-011). Public lists, podiums and rankings read the snapshot on
each sign-up instead (`TournamentRegistration`, slice 3).

## Competitor

One per sign-in identity. Private to its owner and the organiser.

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | never sent to the SPA; no route takes it |
| `issuer` | `issuer` | string | token issuer: the competitor tenant, or the local competitor issuer in local development (ADR-0014). Set on insert only |
| `subject` | `subject` | string | token `sub`. (`issuer`, `subject`) is **unique**. Set on insert only |
| `email` | `email` | string \| null | the token's `email` claim, refreshed on every save; never taken from the body. Null when the tenant sends no such claim |
| `firstName` | `firstName` | string | required, ≤ 60, stored trimmed |
| `middleName` | `middleName` | string \| null | ≤ 60; blank is stored as null |
| `lastName` | `lastName` | string | required, ≤ 60, stored trimmed |
| `nationality` | `nationality` | string \| null | ISO 3166-1 alpha-2 (the JDK's `Locale.getISOCountries`) |
| `dateOfBirth` | `dateOfBirth` | LocalDate | required; in the past |
| `gender` | `gender` | enum \| null | `MALE`, `FEMALE` |
| `belt` | `belt` | enum \| null | `WHITE`, `BLUE`, `PURPLE`, `BROWN`, `BLACK` |
| `academy` | `academy` | `Academy` \| null | null = "no academy" |
| `affiliation` | `affiliation` | string \| null | ≤ 80; blank is stored as null |
| `phone` | `phone` | string \| null | ≤ 30; digits, spaces, brackets, hyphens, optional leading `+` |
| `address` | `address` | `PostalAddress` \| null | all-blank is stored as null |
| audit | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` | | `createdBy` / `updatedBy` are the competitor's `sub` |

The profile is **complete** (`profileComplete` in the API) when first name,
last name, nationality, date of birth, gender and belt are present. Only a
complete profile may sign up (FR-015). The API accepts an incomplete save; the
SPA asks for all six.

### Academy (embedded)

| Field | Type | Notes |
|---|---|---|
| `gymId` | ObjectId string \| null | a `Gym` id when chosen from the directory; must be an `Active` gym when sent (400 `UNKNOWN_GYM`), except that the gym already on the profile is kept even after it leaves the directory |
| `name` | string | ≤ 80. Copied from the gym when `gymId` is set (the typed name is ignored); otherwise the typed name, trimmed |

### PostalAddress (embedded)

| Field | Type | Notes |
|---|---|---|
| `street` | string \| null | ≤ 200 |
| `postcode` | string \| null | ≤ 20 |
| `city` | string \| null | ≤ 100 |
| `region` | string \| null | county or state, ≤ 100 |
| `country` | string \| null | country of residence, ISO 3166-1 alpha-2 |

## DeletedCompetitor

A sign-in identity whose account was deleted (`#5012`, research R11). The API
refuses with 401 every token of that identity **issued before** `deletedAt`
(by its `iat`; a token without `iat` is refused), even while the external
tenant still holds it (Graph unreachable or not configured). A sign-in after
the deletion is the person signing up again: it starts a new, empty account
(owner's defect report, 2026-11-15). Locally that is always the case, because
the email is the identity.

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `issuer` | `issuer` | string | |
| `subject` | `subject` | string | (`issuer`, `subject`) is **unique**. A pseudonymous id: the tenant never reuses it for another person, and a new account for the same email gets a new one |
| `deletedAt` | `deletedAt` | Instant | the latest deletion: set again each time the identity deletes an account |
| `directoryDeleted` | `directoryDeleted` | boolean | reset to false on each deletion; true once Graph confirmed the user was removed. False means the identity must be removed from the tenant by hand (the API also logs it and counts `competitor.identity.deletion.failures`) |

No name, email or other personal detail is kept. Records are not expired.

## Indexes

Declared in `config/MongoIndexInitializer`.

| Name | Collection | Keys | Options | Used by |
|---|---|---|---|---|
| `ix_competitor_issuer_subject_unique` | `Competitor` | `issuer`, `subject` | unique, critical | every `/competitor/me` route; one profile per identity however many saves race (`#5010`) |
| `ix_deletedCompetitor_issuer_subject_unique` | `DeletedCompetitor` | `issuer`, `subject` | unique | the revocation check on every competitor token |

## Account deletion

`DELETE /api/v1/competitor/me`, in order:

1. Refused with 409 `urn:bjjeire:has-active-registration` while the caller has a `TournamentRegistration` with `competitorId` = their profile id (as a string or an ObjectId) and `active: true` (read by its documented fields until the sign-up slice owns the collection).
2. `DeletedCompetitor` is upserted, so the identity's tokens stop working.
3. The `Competitor` document is removed by (`issuer`, `subject`) and the delete audited. Removing by identity after step 2 catches a first save that raced the delete; a save that lands later finds the tombstone, removes its own document and answers 401.
4. Graph deletes the user by the token's `oid` claim (not `sub`: Entra issues a different `sub` per application). A failure is logged and counted; the response is still 204.

Not built yet (slice 4): anonymising the snapshot on the competitor's
earlier sign-ups and stamping `financialRecordsExpireAt` (FR-013).
