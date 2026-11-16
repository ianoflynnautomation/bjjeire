# Data model: Merge tournaments into competitions

**Feature**: [spec.md](spec.md) | **Research**: [research.md](research.md)

No field changes meaning, type or validation. This is a rename of collections,
one stored field, one stored enum value and index names. Old data is dropped
(R4), not migrated.

## BjjEireCompetition (formerly `Tournament`)

- **Collection**: `BjjEireCompetition` (was `Tournament`)
- **Fields**: unchanged. The full table in `specs/database-contracts/tournament.md` moves to `specs/database-contracts/bjjeire-competition.md`.
- **Status**: `DRAFT → PUBLISHED → FINISHED`, `DRAFT | PUBLISHED → CANCELLED`. Unchanged.
- **Indexes**:
  - `ix_bjjeire_competition_slug_unique` on `slug` (unique), was `ix_tournament_slug_unique`.
  - `ix_bjjeire_competition_status_date` on `(status, date)`, was `ix_tournament_status_date`. It now also serves the upcoming query.
- **New derived notion: upcoming.** `status = PUBLISHED` and `date ≥ today (Europe/Dublin)`. It is computed per request and never stored. It's the only set the public list returns (R3).

## BjjEireCompetitionRegistration (formerly `TournamentRegistration`)

- **Collection**: `BjjEireCompetitionRegistration` (was `TournamentRegistration`)
- **Field rename**: `tournamentId` → `competitionId` (ObjectId string of a `BjjEireCompetition`).
- **Enum value rename**: `cancelledBy` `TOURNAMENT` → `COMPETITION`. Other values unchanged.
- **Indexes**: every index on `tournamentId` is redeclared on `competitionId`, and a name containing `tournament` gets `competition` instead (e.g. `ix_registration_tournament_division_status` → `ix_registration_competition_division_status`). Keys order and uniqueness are unchanged. `ux_registration_active_competitor_division` keeps its name and keys apart from the field rename.
- **Every other field, rule and transition**: unchanged. The contract moves from `tournament-registration.md` to `bjjeire-competition-registration.md`.

## Competitor

- **Collection and fields**: unchanged.
- **History response** (computed, not stored): `tournaments` → `competitions`, and each item's `tournamentId` → `competitionId`.

## Competition (directory)

Unchanged.

## Legacy collections

`Tournament` and `TournamentRegistration` are dropped at API startup when
present, with a logged count (R4). The drop is removed one release after the change.

## Seed data

`seeder/data-test/tournaments/*.json` (`acceptance-open`, `acceptance-opens-later`,
`acceptance-closed`, `_template`) moves to `seeder/data-test/bjjeire-competitions/`
with the same content. The seeder collection key becomes `bjjeire-competitions`.
It stays test-dataset-only: a production run neither writes nor prunes it.
