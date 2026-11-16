---
feature: tournaments
ssot: specs/features/tournaments.md
database: specs/database-contracts/tournament.md, specs/database-contracts/competitor.md (later collections: specs/001-tournament-registration/data-model.md)
api_package: com.bjjeire.api.tournament, com.bjjeire.api.competitor, com.bjjeire.api.registration
spa: src/bjjeire-app/src/features/tournaments, src/bjjeire-app/src/features/tournament-admin, src/bjjeire-app/src/features/competitor
acceptance: bjjeire-tests/tests/features/tournaments/
status: draft
---

# STC: Tournaments

**Requirements**: `bjjeire/requirements` · epic `&11`

## User intent

The admin runs an in-house tournament; members of the public sign in through a
separate competitor tenant, sign up for a division and pay; results feed a
public leaderboard. The `Tournaments` flag fails closed and gates the whole
feature. The directory stays public to read and admin-only to write.

Narrative SSOT for what is live: [specs/features/tournaments.md](../../features/tournaments.md).
Until the feature is complete, criteria that are not built are defined in
[specs/001-tournament-registration/spec.md](../../001-tournament-registration/spec.md).

## Acceptance criteria

### `#5036` — Directory stays readable without an account (P1)

Given a visitor who is not signed in,
When they read gyms, events, competitions and stores, with the tournament flag on or off,
Then every list is served and nothing asks for a token.

**Owns**: T2 `WriteAuthorizationIT` (flag on), `TournamentFeatureOffIT` (flag off); T1 `TournamentFeatureGateFilterTest`; T6 existing directory suites.

### `#5037` — A competitor cannot change the directory (P1)

Given a signed-in competitor, including one whose token names the writer scope,
When they POST, PUT or DELETE a gym, event, competition or store,
Then the API answers 403.

**Owns**: T2 `WriteAuthorizationIT`; T1 `IssuerAwareAuthoritiesConverterTest`.

### `#5038` — The feature switches off as a whole (P1)

Given the `Tournaments` flag is off,
When any tournament, competitor or registration route is called,
Then the API answers 404 before authentication,
And the SPA shows no tournament or account entry point,
And directory routes are unaffected.

**Owns**: T2 `TournamentFeatureOffIT`; T1 `TournamentFeatureGateFilterTest`, `FeatureFlagDefaultsTest`; T3 `use-nav-items.unit.test.tsx`; T4 `feature-flag-resolve.integration.test.ts`.

### `#5001` — A new tournament is a draft the public cannot see (P1)

Given the organiser is signed in,
When they save a tournament with name, date, venue, fee, registration window and at least one division,
Then it is stored with status `DRAFT`,
And it is absent from the public list and its slug answers 404 to everyone but the admin routes.

**Owns**: T2 `TournamentAdminIT`, `TournamentMongoRepositoryIT`; T1 `TournamentControllerTest`; T4 `admin-tournaments-page.integration.test.tsx`.

### `#5002` — A published tournament is open to everyone (P1)

Given a draft tournament,
When the organiser publishes it,
Then a visitor who is not signed in can open `/tournaments/{slug}` and see its details, fee, registration window (Irish time) and divisions,
And it appears in the public list ordered by tournament day.

**Owns**: T2 `TournamentAdminIT`, `TournamentMongoRepositoryIT`, `OpenApiContractIT`; T0 `tournament.pact.test.ts`; T4 `tournaments-page`, `tournament-page`, `admin-tournament-page` integration tests; T6 planned.

### `#5003` — The page states the registration window and offers no sign-up outside it (P1)

Given a published tournament whose registration has not opened or has closed,
When a visitor opens its page,
Then the page says when registration opens, or that it is closed,
And no sign-up control is shown.

`registrationState` is computed by the API on every read (`NOT_OPEN`, `OPEN`, `CLOSED`, `FULL`; closed wins over full). This slice offers no sign-up control in any state: sign-up is built in slice 3.

**Owns**: T1 `TournamentRulesTest`; T2 `TournamentAdminIT`; T3 `tournament-format.unit.test.ts`; T4 `tournament-page.integration.test.tsx`; T6 planned.

### `#5004` — Only the organiser can create, edit or publish (P1)

Given a person who is not the organiser (anonymous, a competitor, or a workforce account without the writer scope),
When they create, edit, publish, or open a draft through the admin routes,
Then the API answers 401 or 403 and nothing changes.

**Owns**: T2 `TournamentAdminIT`, `TournamentRouteAuthorizationIT`; T4 `admin-tournaments-page.integration.test.tsx` (screens ask for the organiser sign-in).

### `#5005` — A division with sign-ups cannot be removed (P1)

Given a division that has an active sign-up,
When the organiser saves the tournament without it,
Then the API answers 409 `urn:bjjeire:division-has-signups` telling them to move or cancel those sign-ups first,
And the division stays.

**Owns**: T2 `TournamentAdminIT`; T4 `admin-tournament-page.integration.test.tsx`.

### `#5006` — A visitor can register and then sign in (P1)

Given a visitor with no account,
When they choose to sign in or register on a competitor page,
Then the competitor tenant's hosted pages register them and confirm their email,
And they return signed in to the page they were on.

Registration and email confirmation are the identity provider's hosted pages (research R1), observable only end to end against the non-production competitor tenant. This repository proves the SPA side: the competitor tenant's popup is used, never the organiser's, and the page loads the profile after it.

**Owns**: T4 `profile-page.integration.test.tsx`, `api-client-competitor.integration.test.ts`; T6 planned (needs T001).

### `#5007` — A competitor's saved profile is shown back to them (P1)

Given a signed-in competitor,
When they save first and last name, nationality, date of birth, gender, belt and academy,
Then `GET /api/v1/competitor/me` returns it with `profileComplete: true`, `saved: true` and the email from their token,
And before the first save it answers 200 with `saved: false`, the email from the token and every other field null (owner's decision 2026-11-15: no 404 on a first visit).

**Owns**: T1 `SaveCompetitorCommandTest`; T2 `CompetitorIT`; T0 `competitor.pact.test.ts`; T3 `profile-form.unit.test.ts`; T4 `profile-page.integration.test.tsx`; T6 planned.

### `#5008` — Academy from the directory, typed, or none; affiliation separate (P1)

Given a competitor choosing an academy,
When they search the gym directory and pick a gym, or type a name, or choose "no academy",
Then a picked gym is stored by id with the directory's name, a typed name is stored trimmed, and no academy is stored as none,
And an unknown gym id is 400 `UNKNOWN_GYM`,
And an affiliation can be named or left empty.

**Owns**: T1 `SaveCompetitorCommandTest`; T2 `CompetitorIT`; T3 `profile-form.unit.test.ts`; T4 `profile-page.integration.test.tsx`; T6 planned.

### `#5009` — A profile is private to its owner (P1)

Given a competitor's profile,
When another competitor, a visitor or the organiser tries to read, change or delete it,
Then another competitor only ever reaches their own profile, a visitor gets 401 and the organiser 403,
And no route takes a competitor id.

**Owns**: T2 `CompetitorPrivacyIT`, `TournamentRouteAuthorizationIT`.

### `#5010` — One account per email; one profile per identity (P1)

Given a registered email,
When someone registers again with it,
Then the competitor tenant creates no second account (hosted pages, observable end to end only),
And the API keeps one profile per (`issuer`, `subject`) however many saves race (`ix_competitor_issuer_subject_unique`).

**Owns**: T2 `CompetitorIT` (concurrent saves); T6 planned (needs T001).

### `#5011` — A forgotten password can be reset (P1)

Given a competitor who forgot their password,
When they ask to reset it on the competitor tenant's sign-in page,
Then they regain access through their email.

Entirely the identity provider's hosted pages; nothing in this repository. Observable end to end only.

**Owns**: T6 planned (needs T001).

### `#5012` — A competitor can delete their account (P1)

Given a signed-in competitor with no active sign-up,
When they confirm deleting their account,
Then their profile is removed, their identity is deleted from the competitor tenant by its `oid`,
And every token of that identity issued before the deletion is refused with 401, even if the tenant could not be reached,
And signing up or in again afterwards with the same email starts a new, empty account (owner's defect report 2026-11-15).
Given an active sign-up (awaiting payment or confirmed), the delete is refused with 409 `urn:bjjeire:has-active-registration`.

**Owns**: T1 `RevocationCheckingJwtDecoderTest`, `GraphIdentityDirectoryTest`; T2 `CompetitorDeletionIT`; T4 `profile-page.integration.test.tsx`.

### `#5039` — A competitor sees their medal totals and tournaments (P1)

Given a competitor who has entered tournaments and won medals,
When they open their own profile,
Then they see their gold, silver and bronze totals and each tournament entered with its medals.

This slice serves `GET /api/v1/competitor/me/history` with zero totals and no tournaments, because results are recorded from slice 5; the SPA already renders totals, rows and the empty state.

**Owns**: T2 `CompetitorDeletionIT` (`shouldShowEmptyMedalHistoryUntilResultsAreRecorded`); T4 `profile-page.integration.test.tsx`; T2 `CompetitorHistoryIT` with slice 5.

### `#5013` — A visitor is asked to sign in and returns to the sign-up (P1)

Given a visitor who is not signed in,
When they choose Sign up on a tournament whose registration is open,
Then `/tournaments/:slug/signup` asks them to sign in or register over the same page, and shows the sign-up once they have,
And a competitor whose profile is incomplete is sent to complete it first.

**Owns**: T4 `sign-up-page.integration.test.tsx`, `tournament-page.integration.test.tsx`; T6 planned.

### `#5014` — Only eligible divisions are offered (P1)

Given a competitor with a complete profile,
When they start a sign-up,
Then only divisions with their gender and belt, whose age category minimum (Adult 18, Master 1 30, Master 2 36, Master 3 41, Master 4 46, Master 5 51) they reach on the tournament day in Ireland, are offered,
And a sign-up for any other division is 409 `urn:bjjeire:not-eligible`.

**Owns**: T1 `EligibilityTest`; T2 `RegistrationIT`; T0 `registration.pact.test.ts`; T4 `sign-up-page.integration.test.tsx`; T6 planned.

### `#5015` — A paid sign-up is confirmed, mailed and listed (P1)

Given a competitor has chosen a division and accepted both the public listing and the terms of entry,
When Stripe reports their Checkout session paid through the signed webhook,
Then the sign-up moves to `CONFIRMED` with payment `PAID`, one confirmation mail is sent, and they appear in that division's public list with name, academy and affiliation only,
And the amount charged is the tournament's fee when the sign-up started, never a value from the browser,
And the same event delivered again changes nothing, and a bad or missing signature is 400 and changes nothing.

**Owns**: T1 `RegistrationMailSenderTest`; T2 `RegistrationIT`, `StripeWebhookIT`, `PublicCompetitorListIT`; T0 `registration.pact.test.ts`; T4 `sign-up-page`, `sign-up-complete-page`, `tournament-page` integration tests; T6 planned (Stripe test mode).

### `#5016` — A failed or abandoned payment confirms nothing and can be retried (P1)

Given a competitor has chosen a division,
When they leave Checkout without paying, or the session expires,
Then the sign-up is not confirmed and nothing is charged,
And while the 30-minute hold lasts they can reopen the same Checkout page (never a second one),
And when the session expires, or the sweep finds the hold lapsed, the sign-up becomes `EXPIRED` and its place is given back exactly once,
And they can start a new sign-up for the division.

**Owns**: T2 `StripeWebhookIT`, `RegistrationOwnershipIT`, `HoldSweepIT`, `RegistrationIT`; T4 `sign-up-page`, `sign-up-complete-page`, `my-sign-ups-page` integration tests; T6 planned.

### `#5017` — No second active sign-up in the same division (P1)

Given a competitor already holds a sign-up awaiting payment or confirmed in a division,
When they sign up for the same division again, however many times at once,
Then they are refused with 409 `urn:bjjeire:already-registered`, no Checkout is created and no place is kept.

**Owns**: T2 `RegistrationIT`, `RegistrationConcurrencyIT` (`ux_registration_active_competitor_division`).

### `#5018` — Gi and no-gi are separate sign-ups (P1)

Given a tournament offers gi and no-gi divisions,
When a competitor signs up for one of each,
Then each is its own sign-up, with its own Checkout and fee.

**Owns**: T2 `RegistrationIT`.

### `#5019` — Nobody under 18 on the tournament day (P1)

Given a competitor who will be under 18 on the tournament day,
When they ask for divisions or try to sign up,
Then they are refused with 409 `urn:bjjeire:under-18` and an explanation, including on the day before their 18th birthday.

**Owns**: T1 `EligibilityTest`; T2 `RegistrationIT`; T4 `sign-up-page.integration.test.tsx`; T6 planned.

### `#5020` — A full tournament takes no more sign-ups (P1)

Given a tournament whose places are all held or confirmed,
When another competitor tries to sign up,
Then they are refused with 409 `urn:bjjeire:tournament-full` and not charged,
And of several competitors racing for the last place exactly one gets it,
And a payment that arrives after its hold lapsed with no place left is refunded in full and the sign-up ends `CANCELLED`.

**Owns**: T2 `RegistrationIT`, `RegistrationConcurrencyIT`, `StripeWebhookIT`; T4 `sign-up-page.integration.test.tsx`.

### `#5021` — A competitor sees their own sign-ups (P1)

Given a signed-in competitor,
When they open My sign-ups,
Then each of their sign-ups shows its tournament, division, amount and status, newest first,
And they see no one else's, and another competitor's sign-up id is 403 on every route that takes one.

**Owns**: T2 `RegistrationOwnershipIT`; T0 `registration.pact.test.ts`; T4 `my-sign-ups-page.integration.test.tsx`; T6 planned.

### `#5042` — At most two unpaid sign-ups per tournament (P1)

Given a competitor already has two sign-ups awaiting payment in a tournament,
When they start a third,
Then they are refused with 409 `urn:bjjeire:too-many-unpaid` and not charged,
And once one is paid, expired or cancelled they may start another.

**Owns**: T2 `RegistrationIT`; T4 `sign-up-page.integration.test.tsx`.

### `#5022`–`#5035`, `#5040`–`#5041` — not built

Defined in the Spec Kit spec. Each moves here with the slice that builds it.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
