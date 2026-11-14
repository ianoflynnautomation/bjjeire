# Database contract: Tournament

**Collection**: `Tournament`
**Java**: `com.bjjeire.api.tournament.Tournament` (embedded `Division`)
**Seeder**: test dataset only, `seeder/data-test/tournaments/` (`_template.json` documents the shape). There is no production seed: the organiser creates tournaments through the API, and a production seeder run neither writes nor prunes this collection.
**API contract**: [../stc/tournaments/contract.yaml](../stc/tournaments/contract.yaml)
**Design record**: [../001-tournament-registration/data-model.md](../001-tournament-registration/data-model.md)

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `version` | `version` | long | 0 on create, +1 on every organiser write (update, publish). Each write filters on the version it was made from; a stale one is refused. Documents without it get 0 at startup (`MongoIndexInitializer.migrate`) |
| `slug` | `slug` | string | **unique**; lowercase letters, digits and single hyphens; `admin` is reserved |
| `name` | `name` | string | required, ≤ 120 |
| `description` | `description` | string | ≤ 4000 |
| `date` | `date` | LocalDate | the competition day, read in `Europe/Dublin` |
| `venue` | `venue` | `Location` | shared type ([shared.md](shared.md)). `venue` (name) required, ≤ 100; `address` optional, ≤ 200; `coordinates` optional, but when sent a `[longitude, latitude]` pair in range (`tournament.VenueValidator`). A range check cannot catch a swapped pair; the SPA never sends coordinates |
| `entryFeeCents` | `entryFeeCents` | int | ≥ 0; fee per division sign-up |
| `currency` | `currency` | string | always `"EUR"` |
| `registrationOpensAt` | `registrationOpensAt` | Instant | inclusive |
| `registrationClosesAt` | `registrationClosesAt` | Instant | exclusive; after `registrationOpensAt` and not after the end of `date` in Irish time (checked on publish and on every edit of a published tournament) |
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
| `ageCategory` | enum | `ADULT` (18), `MASTER_1` (30), `MASTER_2` (36), `MASTER_3` (41), `MASTER_4` (46), `MASTER_5` (51): minimum age on the tournament day |
| `belt` | enum | `WHITE`, `BLUE`, `PURPLE`, `BROWN`, `BLACK` |
| `weightClass` | string | display label, ≤ 40, stored trimmed |

`result` (the division's podium) is added by the results slice.

## Indexes

Declared in `config/MongoIndexInitializer` (`ensureTournamentIndexes`). Startup fails if one cannot be built.

- `ix_tournament_slug_unique` on `slug` (unique)
- `ix_tournament_status_date` on `(status, date)` — public listing

## Invariants

- Only `PUBLISHED`, `FINISHED` and `CANCELLED` are served publicly. A draft answers 404 by slug and is absent from the list.
- Status moves `DRAFT → PUBLISHED → FINISHED`, and `DRAFT | PUBLISHED → CANCELLED`; nothing else. Writes guard on the expected status in the update filter.
- Publishing needs at least one division and a valid registration window.
- The tuple (`discipline`, `gender`, `ageCategory`, `belt`, `weightClass`) is unique within a tournament; weight class compared without case or outer spaces.
- A division with an active sign-up (`TournamentRegistration` with `active: true`) cannot be removed (`#5005`).
- A finished or cancelled tournament cannot be edited.
- Changing `entryFeeCents` never changes existing sign-ups.
- An update or publish made from an older `version` is refused (409) and changes nothing, so two of the organiser's tabs cannot silently undo each other, and publish never publishes a copy it did not check.
- `registrationState` (`NOT_OPEN`, `OPEN`, `CLOSED`, `FULL`) is computed on every read, never stored.
