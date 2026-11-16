# ADR-0015: In-house competitions are BJJ Éire competitions inside Competitions

- **Status:** Accepted
- **Date:** 2026-11-16
- **Supersedes in part:** the "tournament" names in ADR-0012, ADR-0013 and ADR-0014 (their decisions stand)
- **Applies to:** `com.bjjeire.api.bjjeirecompetition`, `registration`, `competitor`, `web.FeatureFlag`, `web.BjjEireCompetitionFeatureGateFilter`, `config.MongoIndexInitializer`, `src/bjjeire-app/src/features/bjjeire-competitions`, `src/bjjeire-app/src/features/bjjeire-competition-admin`, `specs/features/competitions.md`, `specs/002-merge-tournaments-competitions/`

## Context

The site had two features describing competitions: **Competitions**, a
read-only directory of other organisers' Irish events, and **Tournaments**,
the competitions BJJ Éire runs itself, with competitor accounts, sign-up,
payment and refunds (ADR-0012, ADR-0013). The two names confused the owner,
and "competition" is the word the BJJ community uses. The tournament feature
was never switched on in any cluster, so no live data or published address
depended on the old names.

## Decision

There is one feature, **Competitions**. The ones BJJ Éire runs are **BJJ Éire
competitions**. The word "tournament" leaves every visitor-, competitor- and
organiser-facing text and every name in the code for this capability.

- **Internal name.** `BjjEireCompetition` in code and storage, "BJJ Éire
  competition" in prose: package `bjjeirecompetition`, route
  `/api/v1/bjjeire-competition`, collections `BjjEireCompetition` and
  `BjjEireCompetitionRegistration`, flag `BjjEireCompetitions`
  (`FEATURE_BJJEIRE_COMPETITIONS`, default off, fail-closed). The prefix keeps
  it apart from the directory's `Competition` in one search. Generic names
  (`Division`, `Belt`, `RegistrationState`, the `competitor` and
  `registration` packages, `/api/v1/competitor`, `/api/v1/registration`, the
  Stripe webhook address) keep their names.
- **Wire field rule.** Type, schema and collection names carry the full
  prefix, because there the two kinds meet. Fields that point from a sign-up
  or the medal history to a BJJ Éire competition are `competition…` without
  the prefix (`competitionId`, `competitionSlug`, `competitionName`,
  `competitionDate`, history `competitions[]`, `cancelledBy: COMPETITION`,
  Checkout metadata `competitionId`): inside a sign-up, "competition" can only
  mean a BJJ Éire competition, because the directory has no sign-ups.
- **Problem type.** `urn:bjjeire:tournament-full` becomes
  `urn:bjjeire:competition-full`. No other URN changes.
- **SPA.** BJJ Éire competition pages live under `/competitions/:slug`
  (`/signup`, `/signup/complete`) and `/admin/competitions[/:id]`, guarded by
  `BjjEireCompetitions` alone. The Competitions page shows upcoming BJJ Éire
  competitions in a featured section above the directory search. There is no
  separate list page and no header entry.
- **Public list.** `GET /api/v1/bjjeire-competition` returns upcoming ones
  only: published, with a day on or after today in `Europe/Dublin`. The cache
  key includes that date.
- **No redirects.** `/tournaments*`, `/admin/tournaments*` and
  `/api/v1/tournament*` answer as any unknown address does.
- **Old data is dropped, not migrated.** The API drops the legacy collections
  at startup and logs their document counts. The drop is removed one release
  later. The test dataset is reseeded under the new names.

## Alternatives considered

- **`HostedCompetition`.** Rejected by the owner: it describes hosting, not who
  runs it, and reads oddly in copy.
- **Rename the directory entity to `CompetitionListing`.** Rejected: it breaks
  a live feature and its contracts for no visitor benefit.
- **`Championship`.** Rejected: a different, narrower meaning in BJJ.
- **`bjjEireCompetitionId` on every wire field.** Unambiguous but noisy in the
  SPA and in Zod schemas; the shorter rule above is enough.
- **Redirect the old addresses.** Nothing was ever published at them.
- **Migrate the old collections.** Only dev and test data existed; the owner
  chose delete and reseed.

## Consequences

- One breaking API change (ADR-0002): `check_openapi_breaking` and
  `check_frontend_api_compat` fire, and the SPA, Pact and `bjjeire-tests` Zod
  schemas change in the same change set.
- Constitution 1.2.0 renames the package in principle II and the flag in
  principle V.
- `specs/001-tournament-registration/` stays as the historical design record.
  Its unbuilt slice 5 work is re-pointed to the new names.
- Anyone with `FEATURE_TOURNAMENTS` in a local `.env` must rename it to
  `FEATURE_BJJEIRE_COMPETITIONS`; the old variable is ignored.
