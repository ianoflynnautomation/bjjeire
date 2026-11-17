# Database contract: BJJ Éire competition

Named by [ADR-0015](../../docs/adr/0015-bjjeire-competitions-inside-competitions.md).

**Collection**: `BjjEireCompetition`
**Java**: `com.bjjeire.api.bjjeirecompetition.BjjEireCompetition` (embedded `Division`)
**Seeder**: test dataset only, `seeder/data-test/bjjeire-competitions/` (`_template.json` documents the shape). `acceptance-finished` is a `FINISHED` competition with a recorded podium in each division; its sign-ups and medallist profile are seeded too (see the registration and competitor contracts). There is no production seed: the organiser creates competitions through the API, and a production seeder run neither writes nor prunes this collection.
**API contract**: [../stc/competitions/contract.yaml](../stc/competitions/contract.yaml)
**Design record**: [../001-tournament-registration/data-model.md](../001-tournament-registration/data-model.md)

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `version` | `version` | long | 0 on create, +1 on every organiser write (update, publish, cancel, finish, result). Each write filters on the version it was made from; a stale one is refused. Documents without it get 0 at startup (`MongoIndexInitializer.migrate`) |
| `slug` | `slug` | string | **unique**; lowercase letters, digits and single hyphens; `admin` is reserved |
| `name` | `name` | string | required, ≤ 120 |
| `description` | `description` | string | ≤ 4000 |
| `date` | `date` | LocalDate | the competition day, read in `Europe/Dublin` |
| `venue` | `venue` | `Location` | shared type ([shared.md](shared.md)). `venue` (name) required, ≤ 100; `address` optional, ≤ 200; `coordinates` optional, but when sent a `[longitude, latitude]` pair in range (`bjjeirecompetition.VenueValidator`). A range check cannot catch a swapped pair; the SPA never sends coordinates |
| `entryFeeCents` | `entryFeeCents` | int | ≥ 0; fee per division sign-up |
| `currency` | `currency` | string | always `"EUR"` |
| `registrationOpensAt` | `registrationOpensAt` | Instant | inclusive |
| `registrationClosesAt` | `registrationClosesAt` | Instant | exclusive; after `registrationOpensAt` and not after the end of `date` in Irish time (checked on publish and on every edit of a published competition) |
| `competitorLimit` | `competitorLimit` | int \| null | ≥ 1; null = no limit |
| `placesTaken` | `placesTaken` | int | active sign-ups. Changed only by atomic `$inc` (sign-up slice). An organiser edit updates named fields and never writes it |
| `status` | `status` | enum | `DRAFT`, `PUBLISHED`, `CANCELLED`, `FINISHED` |
| `divisions` | `divisions` | `Division[]` | embedded, ≤ 500 |
| audit | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` | | |

### Division (embedded)

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId string | assigned by the API when the organiser adds it; kept on every later edit; sign-ups refer to it |
| `discipline` | enum | `GI`, `NO_GI` |
| `gender` | enum | `MALE`, `FEMALE` |
| `ageCategory` | enum | `ADULT` (18), `MASTER_1` (30), `MASTER_2` (36), `MASTER_3` (41), `MASTER_4` (46), `MASTER_5` (51): minimum age on the competition day |
| `belt` | enum | `WHITE`, `BLUE`, `PURPLE`, `BROWN`, `BLACK` |
| `weightClass` | string | display label, ≤ 40, stored trimmed |
| `result` | `DivisionResult` \| null | the podium; null until recorded. An organiser edit of the competition keeps it on every division it keeps |

### DivisionResult (embedded in Division)

| Field | Type | Notes |
|---|---|---|
| `goldRegistrationId` | ObjectId string | required |
| `silverRegistrationId` | ObjectId string \| null | |
| `bronzeRegistrationIds` | ObjectId string[] | 0–2 |
| `confirmedCompetitors` | int | confirmed sign-ups in the division when the result was recorded or last corrected; under 2 means no team points (FR-035). A later cancellation or move does not change it |
| `recordedAt` / `recordedBy` | Instant / string | |

Rules (FR-031), checked by `ResultServiceImpl` when the result is written: every id is a sign-up `CONFIRMED` in this division, and no id appears twice. A result is written only while the competition is `PUBLISHED` or `FINISHED`, by replacing the `divisions` list under the version guard, so it never overwrites an organiser edit or the reverse. After the write the medallists are checked again; if one was cancelled or moved meanwhile, the earlier result is put back and the write refused (409 `not-in-division`). If another organiser save on the competition makes that undo miss its version guard, the competition is read again and the undo retried (up to three times) while the stored result is still the one just written; a result replaced or cleared since is left alone, and three refusals log an `ALERT`. A sign-up a result names can no longer be cancelled or moved by its competitor or the organiser (FR-026): both check before and again after their own write and undo it, so whichever of the two writes lands second sees the other. Cancelling the whole competition still refunds it.

### Leaderboard (derived, never stored)

`GET /{id}/leaderboard` serves `PUBLISHED` and `FINISHED` competitions (404 otherwise). It reads the results above and, by collection name, the sign-ups they name (`displayName`, `academy.name`, `affiliation`, `academyKey`, `affiliationKey`, whatever their status). 9 / 3 / 1 points per gold / silver / bronze go to the medallist's `academyKey` and `affiliationKey`; a division whose result recorded fewer than two confirmed competitors adds none. Cached under `BJJEIRE_COMPETITIONS_TAG`, which every result, sign-up, merge, move, cancellation and account-deletion write evicts.

## Indexes

Declared in `config/MongoIndexInitializer` (`ensureBjjEireCompetitionIndexes`). Startup fails if one cannot be built.

- `ix_bjjeire_competition_slug_unique` on `slug` (unique)
- `ix_bjjeire_competition_status_date` on `(status, date)` — the upcoming list

## Upcoming

Derived per request, never stored (research R3 of `specs/002-merge-tournaments-competitions/`):
`status = PUBLISHED` and `date` on or after today in `Europe/Dublin`. It is the only set
`GET /api/v1/bjjeire-competition` returns, earliest `date` then `name`. The list cache key holds the
Irish date, so a page cached yesterday is never served after midnight. `GET /{slug}` still serves
published, finished and cancelled competitions.

## Legacy collection

The pre-rename collection is dropped at API startup when present, and its document count is
logged (`MongoIndexInitializer.dropLegacyCollections`). No data is migrated. The drop is removed one
release after the rename (ADR-0015).

## Invariants

- Only `PUBLISHED`, `FINISHED` and `CANCELLED` are served publicly. A draft answers 404 by slug and is absent from the list.
- Status moves `DRAFT → PUBLISHED → FINISHED`, and `DRAFT | PUBLISHED → CANCELLED`; nothing else. Writes guard on the expected status in the update filter.
- Publishing needs at least one division and a valid registration window.
- The tuple (`discipline`, `gender`, `ageCategory`, `belt`, `weightClass`) is unique within a competition; weight class compared without case or outer spaces.
- A division with an active sign-up (`BjjEireCompetitionRegistration` with `active: true`) cannot be removed (`#5005`).
- A finished or cancelled competition cannot be edited.
- Changing `entryFeeCents` never changes existing sign-ups.
- An update or publish made from an older `version` is refused (409) and changes nothing, so two of the organiser's tabs cannot silently undo each other, and publish never publishes a copy it did not check.
- `registrationState` (`NOT_OPEN`, `OPEN`, `CLOSED`, `FULL`) is computed on every read, never stored.
