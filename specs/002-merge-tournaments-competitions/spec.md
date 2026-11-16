# Feature Specification: Merge tournaments into competitions

**Feature Branch**: `feat/merge-tournaments-into-competitions`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "merge tournaments into competitions — in-house "tournaments" become BjjEire competitions inside the Competitions feature. Internal name BjjEireCompetition everywhere (package bjjeirecompetition, route /api/v1/bjjeire-competition, collections BjjEireCompetition and BjjEireCompetitionRegistration). No data migration: the app is not live in prod, so the old Tournament/TournamentRegistration dev data is deleted and reseeded. /api/v1/competitor, /api/v1/registration and the Stripe webhook path keep their names. Flag Tournaments → BjjEireCompetitions (FEATURE_BJJEIRE_COMPETITIONS), separate from Competitions, fail-closed. SPA: /competitions shows a featured section of upcoming (published, not finished) BjjEire competitions above the listing; search filters only the listing; finished/cancelled ones are reachable only by detail page, My sign-ups and medal history. Detail at /competitions/:slug (+ /signup, /signup/complete), admin at /admin/competitions[/:id]; no /tournaments redirects. The header "Tournaments" nav entry disappears. The competition theme applies to BjjEire competition pages. Rename all user-visible "tournament" text, error URNs (e.g. urn:bjjeire:tournament-full), mail and Stripe Checkout text. Re-point the slice 5 tasks in specs/001-tournament-registration/ to the new names. Needs an ADR for the naming and a constitution amendment (principles II and V). New criteria go under epic &3 as #3006+; #5001–#5042 keep their numbers and move into the Competitions spec. bjjeire-tests specs/features/tournaments.md folds into competitions.md."

## Context

BJJ Éire has two features that both describe competitions: **Competitions**,
a read-only directory of other organisers' Irish events, and **Tournaments**,
the competitions BJJ Éire runs itself, with competitor accounts, sign-up,
payment and (from slice 5) results. The two names confuse the owner, and
"competition" is the word the BJJ community uses. After this change there is
one feature, **Competitions**, that holds both kinds. The ones BJJ Éire runs
are called **BJJ Éire competitions**. The word "tournament" disappears from
everything visitors, competitors and the organiser see, and from the
codebase's names for this capability.

This is a rename and a re-homing. What a BJJ Éire competition does stays the
same: organiser set-up and publishing, competitor accounts, eligibility,
sign-up, payment, cancellation and refunds. Requirements `#5001`–`#5042`
(epic `&11`) keep their numbers and their behaviour. Only the names, the
addresses and where the competitions appear change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor finds BJJ Éire competitions on the Competitions page (Priority: P1)

A visitor opens Competitions. While BJJ Éire has a competition coming up, a
featured section at the top shows it, ahead of the directory of other
organisers' competitions. From there they open its page and sign up as they
do today.

**Why this priority**: This is the point of the merge: visitors have one
place for every competition in Ireland, and BJJ Éire's own are the most
prominent.

**Independent Test**: Seed one upcoming BJJ Éire competition and a few
directory competitions. Open `/competitions`, see the featured card above the
listing, search for a directory competition, and open the featured card's
page.

**Acceptance Scenarios** (one GitLab issue each, matching `specs/stc/competitions/spec.md`. The epic stays on that file's **Requirements** line. `bjjeire-tests` records the same issue on `Covers:`):

1. **`#3006`**: **Given** one or more published BJJ Éire competitions whose day has not passed, **When** a visitor opens Competitions, **Then** a featured "BJJ Éire competitions" section above the directory listing shows each one, earliest day first. Each card shows the day, venue, entry fee in euro, number of divisions and registration state, as the tournament cards do today.
2. **`#3007`**: **Given** no BJJ Éire competition is upcoming (none published, or every one finished, cancelled, still a draft, or its day has passed), **When** a visitor opens Competitions, **Then** there is no featured section and no empty placeholder for it, and the directory listing looks and behaves as it does today.
3. **`#3008`**: **Given** the featured section is shown, **When** a visitor types in the Competitions search box or moves between listing pages, **Then** only the directory listing is filtered or paged, the featured section stays as it was, and the listing's empty state ("no competitions match") refers only to the listing.
4. **`#3009`**: **Given** a featured card, **When** the visitor opens it, **Then** they reach `/competitions/{slug}` showing the competition's details, registration window in Irish time, divisions and confirmed competitors, as the tournament page does today. **And** a draft or unknown slug shows "Competition not found" with a link back to Competitions.

---

### User Story 2 - Competitor signs up and manages entries under the new names (Priority: P1)

A competitor goes through the same sign-up, payment, cancellation and
division-change journey. Every page, email and payment screen calls it a
competition, and every address is under `/competitions`.

**Why this priority**: The sign-up and payment journey is the revenue path.
It must work end to end at its new addresses, including the return from
Stripe.

**Independent Test**: On the acceptance seed, sign up for the open BJJ Éire
competition, pay in Stripe test mode, land on the completion page, read the
confirmation mail, then cancel from My sign-ups. "Tournament" must not appear
anywhere along the way.

**Acceptance Scenarios**:

1. **`#3010`**: **Given** a published BJJ Éire competition with registration open, **When** a competitor chooses Sign up, **Then** the journey runs at `/competitions/{slug}/signup`, Stripe returns them to `/competitions/{slug}/signup` (abandoned) or `/competitions/{slug}/signup/complete` (paid), and confirmation, cancellation, refund and competition-cancelled mails arrive as today.
2. **`#3011`**: **Given** any page, mail, payment page description, error message or export a visitor, competitor or organiser can see, **When** it refers to a BJJ Éire competition, **Then** it says "competition", never "tournament". This covers the header, page titles, My sign-ups, the profile's medal history ("competitions entered"), the four mail kinds, the Stripe Checkout line item, the CSV export file name and API problem titles.
3. **`#3012`**: **Given** a BJJ Éire competition whose places are all taken, **When** a competitor tries to sign up, **Then** the API refuses with `urn:bjjeire:competition-full` (formerly `urn:bjjeire:tournament-full`), and every other problem type keeps its URN.

---

### User Story 3 - Organiser runs BJJ Éire competitions from the new admin screens (Priority: P2)

The organiser creates, edits, publishes and cancels BJJ Éire competitions,
and manages their sign-ups, at `/admin/competitions`. The screens behave
exactly as the tournament admin screens do today.

**Why this priority**: The organiser's tools must keep working, but only the
owner uses them, so a break is less exposed than the public journey.

**Independent Test**: In the local stack, sign in as the organiser, create a
draft at `/admin/competitions`, publish it, and see it in the featured section.

**Acceptance Scenarios**:

1. **`#3013`**: **Given** the organiser is signed in, **When** they open `/admin/competitions` and `/admin/competitions/{id}`, **Then** they list, create, edit, publish and cancel BJJ Éire competitions and manage sign-ups (move, cancel, merge team names, CSV export) as before. The screens are still not in the site navigation, and anyone else is refused as before.

---

### User Story 4 - The BJJ Éire competitions switch still turns the feature off as a whole (Priority: P1)

The owner keeps a separate kill switch for BJJ Éire competitions and
competitor accounts. It is now named `BjjEireCompetitions`, and the
directory listing has its own switch.

**Why this priority**: The switch is the only way to take payments and
accounts offline without taking the directory down. It must stay fail-closed.

**Independent Test**: With `BjjEireCompetitions` off, open Competitions
(listing only, no featured section, no account icon), call a BJJ Éire
competition, competitor and registration route (404), and open
`/competitions/{slug}` (not found).

**Acceptance Scenarios**:

1. **`#3014`**: **Given** the `BjjEireCompetitions` switch is off or cannot be read, **When** a visitor uses the site, **Then** there is no featured section, no account entry point and no BJJ Éire competition page, sign-up or admin screen. **And** every BJJ Éire competition, competitor and registration API route answers 404 before authentication. **And** the Competitions directory listing works as before.
2. **`#3015`**: **Given** the two switches, **When** `Competitions` is off and `BjjEireCompetitions` is on, **Then** the Competitions page is unavailable as today (so no featured section), but a BJJ Éire competition's own pages, sign-up, My sign-ups and the organiser screens still work. **And** no header entry is labelled "Tournaments" in any combination.

---

### User Story 5 - Old names and addresses are gone (Priority: P2)

Nothing answers at the old names: no `/tournaments` pages, no
`/api/v1/tournament` routes, no `Tournaments` switch, no tournament
collections. There are no redirects, because the feature was never switched
on in any cluster.

**Why this priority**: A half-renamed system is the confusion this change
exists to remove. Leftover routes would also double the surface to secure.

**Independent Test**: Request the old SPA and API addresses and check the
database after a reseed.

**Acceptance Scenarios**:

1. **`#3016`**: **Given** the change is deployed, **When** a client requests `/tournaments`, `/tournaments/{slug}`, `/admin/tournaments` or any `/api/v1/tournament` route, **Then** the SPA handles them as any unknown address (it lands on its default page) and the API answers as at an address that never existed: 401 without a token (the security catch-all asks for sign-in first) and 404 with an organiser's token. Nothing redirects. *(Amended 2026-11-16 during the build to match FR-010; the API has no unauthenticated 404 for unknown paths.)*
2. **`#3017`**: **Given** a dev or test database that holds old tournament data, **When** the change is deployed and the seeder runs, **Then** the old tournament and tournament-registration collections are gone. **And** the acceptance BJJ Éire competitions (open, opens later, closed) exist under the new names. **And** production seeding still neither writes nor prunes BJJ Éire competitions.

---

### Edge Cases

- **Day passed but not finished.** A published BJJ Éire competition whose day has passed in Ireland, but which the organiser has not marked finished, leaves the featured section at the start of the next Irish day. Its page and its entries in My sign-ups stay reachable.
- **Cancelled while featured.** A competition the organiser cancels leaves the featured section on the next read. Its page shows it as cancelled, and its competitors are mailed as today.
- **Several upcoming.** Every upcoming one is featured, earliest day first. No count limit in this change.
- **Slug overlap with the directory.** A BJJ Éire competition and a directory competition may share a slug. Only BJJ Éire competitions have a page at `/competitions/{slug}`, so there is no clash. `admin` stays a reserved slug.
- **Featured and search.** A search that matches nothing in the listing shows the listing's empty state while the featured section stays visible.
- **In-flight Stripe sessions.** There is no live payment data, so no Checkout session started under the old return addresses has to be honoured.
- **Theme.** BJJ Éire competition pages and the featured section read correctly in light, dark and competition themes. Opening them never changes the visitor's theme.
- **Featured data fails to load.** If the BJJ Éire competitions request fails while the listing loads, the listing still shows and the featured section is left out. One feature failing must not hide the other.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Competitions page MUST show a featured section of upcoming BJJ Éire competitions above the directory listing whenever at least one is upcoming. "Upcoming" means published, not finished or cancelled, and with a day that has not passed in Ireland.
- **FR-002**: The featured section MUST NOT appear when no BJJ Éire competition is upcoming. Finished and cancelled BJJ Éire competitions MUST NOT be listed on the Competitions page.
- **FR-003**: The Competitions search and paging MUST apply only to the directory listing.
- **FR-004**: A BJJ Éire competition's page, sign-up, sign-up completion and organiser screens MUST be served at `/competitions/{slug}`, `/competitions/{slug}/signup`, `/competitions/{slug}/signup/complete`, `/admin/competitions` and `/admin/competitions/{id}`. Payment returns MUST land on the new sign-up addresses.
- **FR-005**: The site header MUST NOT contain a "Tournaments" entry. BJJ Éire competitions are reached through Competitions. The competitor account entry point stays, governed by `BjjEireCompetitions`.
- **FR-006**: No text a visitor, competitor or organiser can see may call a BJJ Éire competition a "tournament". This covers pages, mails, Stripe Checkout descriptions, exported files, API problem titles and details, and the profile's medal history.
- **FR-007**: The problem type for a full competition MUST be `urn:bjjeire:competition-full`. No other problem type's URN changes.
- **FR-008**: The BJJ Éire competition API MUST be served under `/api/v1/bjjeire-competition`. `/api/v1/competitor`, `/api/v1/registration` and the Stripe webhook keep their addresses. Nothing MUST answer at `/api/v1/tournament`.
- **FR-009**: The `Tournaments` feature switch MUST be replaced by `BjjEireCompetitions` (default off, fail-closed). It governs everything `Tournaments` governed: BJJ Éire competition, competitor and registration routes, the account entry point, and now also the featured section. The `Competitions` switch keeps governing the directory listing alone.
- **FR-010**: Old addresses (`/tournaments/*`, `/admin/tournaments/*`, `/api/v1/tournament/*`) MUST NOT redirect. They answer as any unknown address does.
- **FR-011**: The stored BJJ Éire competitions and their sign-ups MUST live under new names (`BjjEireCompetition`, `BjjEireCompetitionRegistration`). Existing tournament data in dev and test databases is discarded, not migrated, and the test dataset is reseeded under the new names.
- **FR-012**: Every behaviour specified by `#5001`–`#5042` MUST hold unchanged apart from names and addresses: set-up, publishing, eligibility, holds, payment, confirmation, cancellation, refunds, division changes, account deletion and organiser tools. Those requirements keep their numbers under epic `&11` and are recorded in the Competitions living spec.
- **FR-013**: The naming decision MUST be recorded in an ADR. The constitution MUST be amended so principle II names the `bjjeirecompetition` package (instead of `tournament`) and principle V names the `BjjEireCompetitions` switch, with a version bump and a migration note.
- **FR-014**: The not-yet-built slice 5 work (results, leaderboard, rankings, finishing, `#5028`–`#5035`, `#5040`–`#5041`) in `specs/001-tournament-registration/` MUST be re-pointed to the new names and addresses, so it does not reintroduce "tournament".
- **FR-015**: Living documentation MUST describe one Competitions feature. The tournaments feature spec, STC overlay and database contracts fold into their Competitions counterparts or are renamed to BJJ Éire competition. `bjjeire-tests`' tournaments acceptance spec folds into its competitions spec.

### Key Entities

- **Competition (directory listing)**: another organiser's Irish competition. Unchanged. See [competition.md](../database-contracts/competition.md).
- **BJJ Éire competition** (formerly Tournament): a competition BJJ Éire runs, with divisions, registration window, fee, competitor limit and status. Same fields and rules as today. Its contract moves from `tournament.md` to a BJJ Éire competition contract.
- **BJJ Éire competition registration** (formerly tournament registration): a competitor's sign-up for one division. Same fields and rules as today, stored under the new name.
- **Competitor**: unchanged; its medal history refers to competitions entered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can go from the Competitions page to a confirmed, paid sign-up for a BJJ Éire competition without seeing the word "tournament" once. That covers every page, the payment page and the mail.
- **SC-002**: With one upcoming BJJ Éire competition seeded, it is visible on the Competitions page without scrolling past the directory listing on a 375 px-wide phone screen.
- **SC-003**: Every acceptance scenario of `#5001`–`#5042` that passes before the change passes after it, with only names and addresses changed.
- **SC-004**: A search of the code, configuration, specs and acceptance tests for "tournament" finds it only in historical records: ADRs, the decision record in `specs/001-tournament-registration/` other than its re-pointed slice 5 work, changelogs and git history. *(Amended 2026-11-16 during the build: directory content that describes other organisers' events, and the site-wide SEO description, are also excluded. FR-006 covers only text about BJJ Éire competitions, and changing them would break unrelated acceptance tests.)*
- **SC-005**: With `BjjEireCompetitions` off, 100% of BJJ Éire competition, competitor and registration routes answer 404, and the directory listing's behaviour is unchanged.

## Acceptance Coverage *(mandatory)*

Visitor-observable scenarios are proven at T6 by Playwright in `bjjeire-tests`.
Its `playwright-test-planner` reads this section and turns the listed requirement issues into
scenarios. Those issues are GitLab issues in `bjjeire/requirements`. CI stays on GitHub.

- **Acceptance spec**: `bjjeire-tests/specs/features/competitions.md` (the tournaments acceptance spec folds into it)
- **T6 (bjjeire-tests)**: `#3006`, `#3007`, `#3008`, `#3009`, `#3010`, `#3011` (pages and mail as visible in the journey), `#3013`, `#3014`, `#3016`. The existing tournament scenarios move here at their new addresses.
- **Lower tiers only**:
  - `#3012`: T2. The problem URN is an API contract, proven with the Pact and OpenAPI contract checks.
  - `#3015`: T2 and T4. Flag combinations are filter and route-gating rules, and the switches cannot be flipped in a shared T6 environment.
  - `#3017`: T2. Seeder and collection names are a database contract.

## Assumptions

- The app is not live in production. No cluster sets the `Tournaments` switch, and no gitops or `bjjeire-deploy` value refers to it (owner confirmed 2026-11-16), so nothing outside this repository and `bjjeire-tests` needs renaming.
- The Stripe webhook endpoint keeps its address, so no Stripe dashboard change is needed. The Checkout line item text changes for new sessions only.
- "Upcoming" uses the competition day in Ireland (`Europe/Dublin`), consistent with how the registration window is shown. A published competition whose day has passed stops being featured even before the organiser marks it finished.
- The featured cards reuse what today's tournament list card shows. No new fields are added to a BJJ Éire competition.
- Changing the API surface breaks `check_openapi_breaking` and `check_frontend_api_compat` by design (ADR-0002). The SPA, Pact and `bjjeire-tests` Zod schemas change in the same change set.
- The visitor's chosen theme applies to BJJ Éire competition pages like any other page. The competition theme is never applied automatically (ADR-0011).
- Deploy remains Flux / AKS / MongoDB unless an ADR says otherwise.
