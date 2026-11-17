---
feature: competitions
ssot: specs/features/competitions.md
database: specs/database-contracts/competition.md, specs/database-contracts/bjjeire-competition.md, specs/database-contracts/bjjeire-competition-registration.md, specs/database-contracts/competitor.md
api_package: com.bjjeire.api.competition, com.bjjeire.api.bjjeirecompetition, com.bjjeire.api.competitor, com.bjjeire.api.registration
spa: src/bjjeire-app/src/features/competitions, src/bjjeire-app/src/features/bjjeire-competitions, src/bjjeire-app/src/features/bjjeire-competition-admin, src/bjjeire-app/src/features/competitor, src/bjjeire-app/src/features/registrations
acceptance: bjjeire-tests/tests/features/competitions/
status: living (directory); draft (BJJ Éire competitions, slice 5 not built)
---

# STC: Competitions

**Requirements**: `bjjeire/requirements` · epic `&3` (`#3001`–`#3017`) · epic `&11` (`#5001`–`#5042`)

## User intent

A visitor opens Competitions and sees published, unfinished competitions
they can scan and search. Search is client-side. There is no county on this
aggregate. The Competitions feature flag fails closed.

The living feature spec still says “authenticated writes”. The **controller
is GET-only** today. This overlay describes the served surface.

Narrative SSOT: [specs/features/competitions.md](../../features/competitions.md).

## Acceptance criteria

### `#3001` — List published competitions (P1)

Given published competitions exist,
When a client calls `GET /api/v1/competition`,
Then the response is `PagedResponse<CompetitionDto>` ordered by start date
then name,
And expired and inactive competitions are excluded.

**Owns**: T2 `CompetitionMongoRepositoryIT`.

### `#3002` — Include inactive (admin-style query)

Given expired or inactive competitions exist,
When `includeInactive=true`,
Then they are included in the listing.
When `includeInactive` is not a boolean,
Then the API returns 400.

**Owns**: T2 IT for the query; T1 `CompetitionControllerTest` for the 400.

### `#3003` — Client-side name search (P1)

Given a loaded competitions page,
When the visitor types a name,
Then only matching cards remain.

**Owns**: T4 `competitions-page.integration.test.tsx`.

### `#3004` — Empty, error, pagination (P2)

Given no competitions / 500,
When the visitor is on Competitions,
Then the matching empty or error state is shown.

**Owns**: T4 page integration.

### `#3005` — Unique slug and expiry (P1)

`slug` is unique (critical index). `expiresAt` is `endDate + 2y`.

**Owns**: T2 `DeactivationInfrastructureIT` (unique index); T1 `CompetitionExpiryTest`.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).

## Acceptance criteria: the merge (`specs/002-merge-tournaments-competitions/`, ADR-0015)

### `#3006` — Upcoming BJJ Éire competitions are featured (P1)

Given one or more published BJJ Éire competitions whose day has not passed in Ireland,
When a visitor opens Competitions,
Then a featured "BJJ Éire competitions" section above the directory search shows each one, earliest day first, with day, venue, fee, division count and registration state. Each card is headed by the BJJ Éire logo, a decorative image hidden from assistive technology.

**Owns**: T1 `BjjEireCompetitionRulesTest` (`shouldCountAPublishedCompetitionAsUpcomingUntilTheEndOfItsDayInIreland`), `BjjEireCompetitionServiceTest` (`shouldStopServingYesterdaysCachedUpcomingListAtMidnightInIreland`); T2 `BjjEireCompetitionMongoRepositoryIT` (`shouldListOnlyUpcomingPublishedBjjEireCompetitionsEarliestDayThenName`); T0 Pact `bjjeire-competition.pact.test.ts` (upcoming list); T4 `competitions-page-featured.integration.test.tsx` (card fields; logo header); T6 `bjjeire-tests`.

### `#3007` — No featured section when none is upcoming (P1)

Given no BJJ Éire competition is upcoming,
When a visitor opens Competitions,
Then there is no featured section and no placeholder, and the listing behaves as before.

**Owns**: T1 `BjjEireCompetitionRulesTest` (`shouldNeverCountAnUnpublishedFinishedOrCancelledCompetitionAsUpcoming`); T2 `BjjEireCompetitionMongoRepositoryIT`; T4 `competitions-page-featured.integration.test.tsx` (empty, flag off, loading, failing); T6.

### `#3008` — Search and paging touch only the listing (P1)

**Owns**: T4 `competitions-page-featured.integration.test.tsx` (search with no listing match; featured request is one page of 100 whatever the listing page); T6.

### `#3009` — A featured card opens `/competitions/{slug}` (P1)

**Owns**: T2 `BjjEireCompetitionMongoRepositoryIT` (`shouldNotServeADraftBySlug`, `shouldStillServeAFinishedCancelledOrPassedCompetitionBySlug`); T4 `competitions-page-featured.integration.test.tsx` (card navigates), `bjjeire-competition-page.integration.test.tsx` ("Competition not found", back link, three themes); T6.

### `#3010` — Sign-up and payment at the new addresses (P1)

**Owns**: T2 `RegistrationIT` (`shouldSendStripeTheBjjEireCompetitionsFeeNeverAClientValue`: success and cancel URLs, metadata `competitionId`); T4 `sign-up-page`, `sign-up-complete-page`, `my-sign-ups-page` integration tests; T6.

### `#3011` — Nothing visible uses the retired name (P1)

**Owns**: T2 `RegistrationIT` (Checkout line item, problem bodies), `StripeWebhookIT`, `CancellationIT`, `BjjEireCompetitionCancellationIT`, `RefundWebhookIT` (mail subjects and bodies), `AdminRegistrationIT` (CSV file name); T3 `config/__tests__/ui-content-retired-name.unit.test.ts`; T4 `profile-page.integration.test.tsx` ("Competitions entered"), `admin-bjjeire-competition-sign-ups.integration.test.tsx` (CSV file name); T6.

### `#3012` — `urn:bjjeire:competition-full` (P1)

**Owns**: T2 `RegistrationIT` (`shouldTellTheCompetitorTheBjjEireCompetitionIsFullAndNotCharge`); T3 `registration-problem.unit.test.ts`; T0 OpenAPI and Pact checks.

### `#3013` — Organiser screens at `/admin/competitions` (P2)

**Owns**: T2 `BjjEireCompetitionAdminIT`, `BjjEireCompetitionRouteAuthorizationIT`, `AdminRegistrationIT`; T4 `admin-bjjeire-competitions-page`, `admin-bjjeire-competition-page`, `admin-bjjeire-competition-sign-ups` integration tests; T6.

### `#3014` — `BjjEireCompetitions` off hides everything BJJ Éire (P1)

**Owns**: T1 `BjjEireCompetitionFeatureGateFilterTest`; T2 `BjjEireCompetitionFeatureOffIT`; T3 `navigation.unit.test.tsx`; T4 `app-routes.integration.test.tsx`, `competitions-page-featured.integration.test.tsx` (flag off: no request); T6.

### `#3015` — The two switches are independent (P1)

**Owns**: T3 `use-nav-items.unit.test.tsx` (every combination, no retired label), `client.unit.test.ts` (catalogue); T4 `app-routes.integration.test.tsx`.

### `#3016` — Retired addresses are unknown addresses (P2)

The API answers as at any unknown address: 401 to an anonymous caller (the security catch-all asks for sign-in first), 404 to a signed-in organiser. The SPA lands on its default page. Nothing redirects. (The Spec Kit text said "404" for every caller; amended during the build to match FR-010.)

**Owns**: T2 `BjjEireCompetitionMongoRepositoryIT` (`shouldAnswerAtTheOldRoutesAsAtAnAddressThatNeverExisted`); T3 `route-prefetch.unit.test.ts`; T4 `app-routes.integration.test.tsx`; T6.

### `#3017` — Retired collections dropped; test seed under the new name (P2)

**Owns**: T2 `LegacyCollectionDropIT`, `SeederIT` (`shouldSeedBjjEireCompetitionsOnlyFromTheTestDataset`, `shouldLeaveBjjEireCompetitionsAloneWhenPruningOutsideTheTestDataset`).


## BJJ Éire competitions: user intent

The admin runs an in-house competition; members of the public sign in through a
separate competitor tenant, sign up for a division and pay; results feed a
public leaderboard. The `BjjEireCompetitions` flag fails closed and gates the whole
feature. The directory stays public to read and admin-only to write.

Narrative SSOT for what is live: [specs/features/competitions.md](../../features/competitions.md).
Until the feature is complete, criteria that are not built are defined in
[specs/001-tournament-registration/spec.md](../../001-tournament-registration/spec.md).

## BJJ Éire competitions: acceptance criteria

### `#5036` — Directory stays readable without an account (P1)

Given a visitor who is not signed in,
When they read gyms, events, competitions and stores, with the competition flag on or off,
Then every list is served and nothing asks for a token.

**Owns**: T2 `WriteAuthorizationIT` (flag on), `BjjEireCompetitionFeatureOffIT` (flag off); T1 `BjjEireCompetitionFeatureGateFilterTest`; T6 existing directory suites.

### `#5037` — A competitor cannot change the directory (P1)

Given a signed-in competitor, including one whose token names the writer scope,
When they POST, PUT or DELETE a gym, event, competition or store,
Then the API answers 403.

**Owns**: T2 `WriteAuthorizationIT`; T1 `IssuerAwareAuthoritiesConverterTest`.

### `#5038` — The feature switches off as a whole (P1)

Given the `BjjEireCompetitions` flag is off,
When any competition, competitor or registration route is called,
Then the API answers 404 before authentication,
And the SPA shows no competition or account entry point,
And directory routes are unaffected.

**Owns**: T2 `BjjEireCompetitionFeatureOffIT`; T1 `BjjEireCompetitionFeatureGateFilterTest`, `FeatureFlagDefaultsTest`; T3 `use-nav-items.unit.test.tsx`; T4 `feature-flag-resolve.integration.test.ts`.

### `#5001` — A new competition is a draft the public cannot see (P1)

Given the organiser is signed in,
When they save a competition with name, date, venue, fee, registration window and at least one division,
Then it is stored with status `DRAFT`,
And it is absent from the public list and its slug answers 404 to everyone but the admin routes.

**Owns**: T2 `BjjEireCompetitionAdminIT`, `BjjEireCompetitionMongoRepositoryIT`; T1 `BjjEireCompetitionControllerTest`; T4 `admin-bjjeire-competitions-page.integration.test.tsx`.

### `#5002` — A published competition is open to everyone (P1)

Given a draft competition,
When the organiser publishes it,
Then a visitor who is not signed in can open `/competitions/{slug}` and see its details, fee, registration window (Irish time) and divisions,
And it appears in the public list ordered by competition day.

**Owns**: T2 `BjjEireCompetitionAdminIT`, `BjjEireCompetitionMongoRepositoryIT`, `OpenApiContractIT`; T0 `bjjeire-competition.pact.test.ts`; T4 `competitions-page`, `competition-page`, `admin-bjjeire-competition-page` integration tests; T6 planned.

### `#5003` — The page states the registration window and offers no sign-up outside it (P1)

Given a published competition whose registration has not opened or has closed,
When a visitor opens its page,
Then the page says when registration opens, or that it is closed,
And no sign-up control is shown.

`registrationState` is computed by the API on every read (`NOT_OPEN`, `OPEN`, `CLOSED`, `FULL`; closed wins over full). This slice offers no sign-up control in any state: sign-up is built in slice 3.

**Owns**: T1 `BjjEireCompetitionRulesTest`; T2 `BjjEireCompetitionAdminIT`; T3 `bjjeire-competition-format.unit.test.ts`; T4 `bjjeire-competition-page.integration.test.tsx`; T6 planned.

### `#5004` — Only the organiser can create, edit or publish (P1)

Given a person who is not the organiser (anonymous, a competitor, or a workforce account without the writer scope),
When they create, edit, publish, or open a draft through the admin routes,
Then the API answers 401 or 403 and nothing changes.

**Owns**: T2 `BjjEireCompetitionAdminIT`, `BjjEireCompetitionRouteAuthorizationIT`; T4 `admin-bjjeire-competitions-page.integration.test.tsx` (screens ask for the organiser sign-in).

### `#5005` — A division with sign-ups cannot be removed (P1)

Given a division that has an active sign-up,
When the organiser saves the competition without it,
Then the API answers 409 `urn:bjjeire:division-has-signups` telling them to move or cancel those sign-ups first,
And the division stays.

**Owns**: T2 `BjjEireCompetitionAdminIT`; T4 `admin-bjjeire-competition-page.integration.test.tsx`.

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

**Owns**: T2 `CompetitorPrivacyIT`, `BjjEireCompetitionRouteAuthorizationIT`.

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
Given an active sign-up (awaiting payment or confirmed) in a competition that has not finished or been cancelled, the delete is refused with 409 `urn:bjjeire:has-active-registration`.
Given a medallist whose competition has finished, the delete succeeds and the medal and its points stay under "Former competitor" (spec edge case; FR-013).

**Owns**: T1 `RevocationCheckingJwtDecoderTest`, `GraphIdentityDirectoryTest`; T2 `CompetitorDeletionIT`; T4 `profile-page.integration.test.tsx`.

### `#5039` — A competitor sees their medal totals and competitions (P1)

Given a competitor who has entered competitions and won medals,
When they open their own profile,
Then they see their gold, silver and bronze totals and each competition entered with its medals.

Entered means a confirmed sign-up; cancelled, expired and unpaid ones are left out. Medals come from recorded results, including divisions that award no team points. Competitions are listed latest day first.

**Owns**: T2 `CompetitorHistoryIT`, `CompetitorDeletionIT` (`shouldShowEmptyMedalHistoryUntilResultsAreRecorded`); T4 `profile-page.integration.test.tsx`; T6 planned.

### `#5013` — A visitor is asked to sign in and returns to the sign-up (P1)

Given a visitor who is not signed in,
When they choose Sign up on a competition whose registration is open,
Then `/competitions/:slug/signup` asks them to sign in or register over the same page, and shows the sign-up once they have,
And a competitor whose profile is incomplete is sent to complete it first.

**Owns**: T4 `sign-up-page.integration.test.tsx`, `bjjeire-competition-page.integration.test.tsx`; T6 planned.

### `#5014` — Only eligible divisions are offered (P1)

Given a competitor with a complete profile,
When they start a sign-up,
Then only divisions with their gender and belt, whose age category minimum (Adult 18, Master 1 30, Master 2 36, Master 3 41, Master 4 46, Master 5 51) they reach on the competition day in Ireland, are offered,
And a sign-up for any other division is 409 `urn:bjjeire:not-eligible`.

**Owns**: T1 `EligibilityTest`; T2 `RegistrationIT`; T0 `registration.pact.test.ts`; T4 `sign-up-page.integration.test.tsx`; T6 planned.

### `#5015` — A paid sign-up is confirmed, mailed and listed (P1)

Given a competitor has chosen a division and accepted both the public listing and the terms of entry,
When Stripe reports their Checkout session paid through the signed webhook,
Then the sign-up moves to `CONFIRMED` with payment `PAID`, one confirmation mail is sent, and they appear in that division's public list with name, academy and affiliation only,
And the amount charged is the competition's fee when the sign-up started, never a value from the browser,
And the same event delivered again changes nothing, and a bad or missing signature is 400 and changes nothing.

**Owns**: T1 `RegistrationMailSenderTest`; T2 `RegistrationIT`, `StripeWebhookIT`, `PublicCompetitorListIT`; T0 `registration.pact.test.ts`; T4 `sign-up-page`, `sign-up-complete-page`, `competition-page` integration tests; T6 planned (Stripe test mode).

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

Given a competition offers gi and no-gi divisions,
When a competitor signs up for one of each,
Then each is its own sign-up, with its own Checkout and fee.

**Owns**: T2 `RegistrationIT`.

### `#5019` — Nobody under 18 on the competition day (P1)

Given a competitor who will be under 18 on the competition day,
When they ask for divisions or try to sign up,
Then they are refused with 409 `urn:bjjeire:under-18` and an explanation, including on the day before their 18th birthday.

**Owns**: T1 `EligibilityTest`; T2 `RegistrationIT`; T4 `sign-up-page.integration.test.tsx`; T6 planned.

### `#5020` — A full competition takes no more sign-ups (P1)

Given a competition whose places are all held or confirmed,
When another competitor tries to sign up,
Then they are refused with 409 `urn:bjjeire:competition-full` and not charged,
And of several competitors racing for the last place exactly one gets it,
And a payment that arrives after its hold lapsed with no place left is refunded in full and the sign-up ends `CANCELLED`.

**Owns**: T2 `RegistrationIT`, `RegistrationConcurrencyIT`, `StripeWebhookIT`; T4 `sign-up-page.integration.test.tsx`.

### `#5021` — A competitor sees their own sign-ups (P1)

Given a signed-in competitor,
When they open My sign-ups,
Then each of their sign-ups shows its competition, division, amount and status, newest first,
And they see no one else's, and another competitor's sign-up id is 403 on every route that takes one.

**Owns**: T2 `RegistrationOwnershipIT`; T0 `registration.pact.test.ts`; T4 `my-sign-ups-page.integration.test.tsx`; T6 planned.

### `#5042` — At most two unpaid sign-ups per competition (P1)

Given a competitor already has two sign-ups awaiting payment in a competition,
When they start a third,
Then they are refused with 409 `urn:bjjeire:too-many-unpaid` and not charged,
And once one is paid, expired or cancelled they may start another.

**Owns**: T2 `RegistrationIT`; T4 `sign-up-page.integration.test.tsx`.

### `#5022` — Cancelling before registration closes refunds in full (P2)

Given a confirmed sign-up and open registration,
When the competitor cancels it,
Then it becomes `CANCELLED`, its place is released and it leaves the public competitor list,
And Stripe is asked once for a full refund of the amount paid with the key `refund-<registrationId>`,
And the answer says it was refunded and for how much, and My sign-ups shows it cancelled with the refund pending or refunded,
And Stripe's refund event later completes it (`REFUNDED`, one refund mail) or records it `FAILED` (shown as "refund pending", organiser alerted),
And cancelling again returns the same answer and refunds nothing more; another competitor's sign-up is 403; an unpaid one is 409.

**Owns**: T2 `CancellationIT`, `RefundWebhookIT`; T0 `registration.pact.test.ts`; T4 `my-sign-ups-page.integration.test.tsx`; T6 planned (Stripe test mode).

### `#5023` — Cancelling after registration closes is not refunded, and the competitor is told first (P2)

Given a confirmed sign-up and closed registration,
When the competitor chooses to cancel,
Then they are warned that no refund is due before confirming,
And on confirming the sign-up is cancelled and leaves the list, with no refund asked of Stripe.

**Owns**: T2 `CancellationIT` (`refundableUntil` is the closing instant); T4 `my-sign-ups-page.integration.test.tsx`; T6 planned.

### `#5024` — Changing to another eligible division while open costs nothing (P2)

Given a confirmed sign-up and open registration,
When the competitor moves it to another division they are eligible for,
Then it moves to that division's competitor list, with no payment and no change to the places taken or the price paid,
And a division they are not eligible for is 409 `not-eligible`, one they already hold is 409 `already-registered`.

**Owns**: T2 `ChangeDivisionIT`; T0 `registration.pact.test.ts`; T4 `my-sign-ups-page.integration.test.tsx`; T6 planned.

### `#5025` — No division change by the competitor after registration closes (P2)

Given registration has closed,
When a competitor tries to change division,
Then they are refused with 409 `urn:bjjeire:registration-closed` and told to contact the organiser,
And My sign-ups shows no change control, only that message.

**Owns**: T2 `ChangeDivisionIT`; T4 `my-sign-ups-page.integration.test.tsx`.

### `#5026` — Cancelling a competition refunds every confirmed sign-up and tells each competitor (P2)

Given a published competition with confirmed sign-ups,
When the organiser cancels it,
Then it becomes `CANCELLED`, every confirmed sign-up is cancelled and refunded in full, and each competitor gets one "Competition cancelled" mail with the amount,
And unpaid holds are ended, so a payment that still arrives is refunded, never confirmed,
And running it again retries only refunds that failed or never reached Stripe, never refunding twice,
And competitors and visitors are refused, and a finished competition is 409.

**Owns**: T2 `BjjEireCompetitionCancellationIT`; T4 `admin-bjjeire-competition-sign-ups.integration.test.tsx`.

### `#5027` — Each cancellation mails the refund outcome (P2)

Given a competitor cancels,
When the cancellation completes,
Then one mail states whether a refund was issued and for how much.

**Owns**: T2 `CancellationIT`, `RefundWebhookIT`.

### `#5028` — The organiser records a division's podium from its confirmed competitors (P2)

Given a published or finished competition and a division with confirmed competitors,
When the organiser records a gold, an optional silver and up to two bronzes on the results tab,
Then the division's podium appears on the public leaderboard with each medallist's name, academy and affiliation,
And a medallist who is not a confirmed competitor in that division is 409 `urn:bjjeire:not-in-division`, the same competitor twice is 409 `urn:bjjeire:duplicate-medallist`, no gold or three bronzes is 400, and a draft or cancelled competition is 409,
And the results tab offers only that division's confirmed competitors and blocks a duplicate before saving,
And a sign-up a result names can no longer be cancelled or moved, by its competitor or the organiser (409 `urn:bjjeire:result-recorded`, FR-026), until the result is corrected; cancelling the whole competition still refunds it,
And when a cancellation or move and a result are saved at the same moment, whichever write lands second is undone and refused.

**Owns**: T1 `ResultServiceImplTest`, `RegistrationSupportTest`; T2 `DivisionResultIT`, `LeaderboardIT`, `ResultRecordedIT`; T0 `bjjeire-competition.pact.test.ts`; T4 `admin-bjjeire-competition-results.integration.test.tsx`, `bjjeire-competition-leaderboard.integration.test.tsx`; T6 planned.

### `#5029` — Academies are ranked by points: 9 per gold, 3 per silver, 1 per bronze (P2)

Given recorded podiums,
When a visitor opens the competition page,
Then an academy ranking lists each academy with its points, golds, silvers and bronzes, highest first,
And academies are grouped by their key (a directory gym, or the name trimmed and case-folded), so the organiser's team merge joins their points.

**Owns**: T1 `LeaderboardsTest`; T2 `LeaderboardIT`; T4 `bjjeire-competition-leaderboard.integration.test.tsx`; T6 planned.

### `#5030` — Ties break on golds, then silvers, then bronzes (P2)

Given two academies or two affiliations with equal points,
When a ranking is shown,
Then the one with more golds ranks higher, then more silvers, then more bronzes,
And entries level on all four share a rank.

**Owns**: T1 `LeaderboardsTest`.

### `#5031` — A medallist with no academy or affiliation adds nothing to that ranking (P2)

Given a medallist with no academy or no affiliation,
When the rankings are worked out,
Then the medal shows on the podium but adds nothing to the ranking they have no entry for.

**Owns**: T1 `LeaderboardsTest`; T4 `bjjeire-competition-leaderboard.integration.test.tsx` ("No academy" on the podium).

### `#5032` — A division with one confirmed competitor awards no team points (P2)

Given a division with fewer than two confirmed competitors when the organiser records its result,
When its podium is shown,
Then it says no team points were awarded and adds nothing to either ranking,
And the count is the one taken when the result was recorded or last corrected: a later cancellation or move changes nothing, so a finished competition's points and winners stay as they were on the day.

**Owns**: T1 `LeaderboardsTest`; T2 `LeaderboardIT`; T4 `bjjeire-competition-leaderboard.integration.test.tsx`.

### `#5033` — Correcting a podium updates the leaderboard (P2)

Given a recorded podium that is wrong,
When the organiser records it again or clears it,
Then the stored result is replaced or removed, and the next leaderboard read reflects it in the podium and both rankings,
And saving the competition's details keeps every recorded result.

**Owns**: T2 `DivisionResultIT`, `LeaderboardIT`, `ResultRecordedIT`; T4 `admin-bjjeire-competition-results.integration.test.tsx`.

### `#5034` — Before any result the leaderboard says results will follow (P2)

Given a competition with no results yet,
When a visitor opens it,
Then the results section says results will appear as divisions finish, with no podium, ranking or winners,
And a cancelled competition has no leaderboard (404; the page shows no results section).

**Owns**: T1 `LeaderboardsTest`; T2 `LeaderboardIT`; T4 `bjjeire-competition-leaderboard.integration.test.tsx`; T6 planned.

### `#5035` — Only the organiser records or changes results (P2)

Given a person who is not the organiser,
When they record, clear or list results, or finish a competition,
Then a competitor or a workforce token without the writer scope is 403, no token is 401, and nothing changes.

**Owns**: T2 `DivisionResultIT`.

### `#5040` — Affiliations get their own ranking (P2)

Given recorded podiums whose medallists belong to academies under the same affiliation,
When a visitor opens the leaderboard,
Then a separate affiliation ranking adds those medallists' points together under that affiliation.

**Owns**: T1 `LeaderboardsTest`; T2 `LeaderboardIT`; T4 `bjjeire-competition-leaderboard.integration.test.tsx`; T6 planned.

### `#5041` — Finishing the competition names the winners (P2)

Given a published competition,
When the organiser marks it finished after a warning,
Then it becomes `FINISHED` and the leaderboard names the top academy and the top affiliation, with every entry level on all tie-breaks named as joint winners,
And before that no winners are shown; results can still be corrected after finishing and the winners follow; finishing again changes nothing; a draft or cancelled competition is 409.

**Owns**: T1 `LeaderboardsTest`; T2 `DivisionResultIT`, `LeaderboardIT`; T0 `bjjeire-competition.pact.test.ts`; T4 `admin-bjjeire-competition-results.integration.test.tsx`, `bjjeire-competition-leaderboard.integration.test.tsx`; T6 planned.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
