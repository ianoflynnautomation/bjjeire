# Feature Specification: In-House Tournament Registration

**Feature Branch**: `001-tournament-registration`

**Created**: 2026-11-13

**Status**: In progress — slices 0 and 1 implemented (`#5001`–`#5005`, `#5036`–`#5038`); living spec: specs/features/tournaments.md. Set to "Implemented" when the last slice ships.

**Input**: User description: "i want to add a new feature to my bjj app. i want to organise a tournament to allow users to sign up and compete in the tournament. similar to how smoothcomp setup events but i want to do it in house. currently i do not have a login and my app is readonly. i want to keep the existing features read only but also add a new feature for my new competition. this will allow users to sign up for the event. they should have a user profile. for the competition they will need to be able to select their bracket and weight class. this would also allow users to cancel event signup and they will need to pay a small fee to sign up so need to integrate payment feature. the competition should also display leaderboard and the team/affiliate points"

## Terms

- **Tournament**: a competition run by BjjEire itself, with sign-up, payment and results inside the app. The tournament this feature is built for is named "BjjEire". It is distinct from the existing **Competitions** listing, which is a read-only directory of other organisers' events and does not change.
- **Division** (the "bracket" a competitor picks): one combination of gi or no-gi, gender, age category, belt and weight class.
- **Academy**: the gym a competitor trains at and represents.
- **Affiliation**: the wider team an academy belongs to, shared by several academies. Optional.
- **Team**: either of the above when talking about points. Points are ranked separately per academy and per affiliation.
- **Organiser**: the BjjEire admin, who is the site owner. The only person who can create and run a tournament.
- **Competitor**: a member of the public with an account who signs up to compete.
- **Sign-up**: one competitor's entry in one division. The plan, the data model and the routes call it a **registration**; they also call the organiser the **admin**. These are the same things.

## Clarifications

### Session 2026-11-13

- Q: How much of the competition day does the app run? → A: Placings only. The organiser enters the podium of each division. The app does not generate draws or record individual matches.
- Q: Who may sign up as a competitor? → A: Adults only, 18 or over on the tournament day.
- Q: What happens to the fee on cancellation? → A: Full automatic refund if cancelled before registration closes. Cancelling later is allowed but is not refunded.
- Q: What is the tournament called? → A: "BjjEire" (owner's statement).
- Q: How are team points worked out? → A: 9 per gold, 3 per silver, 1 per bronze, added up per team. The team with the most points at the end wins (owner's statement, confirming the default).
- Q: Where do win statistics on a competitor profile come from? → A: Nowhere in this release. Profiles show medal counts and past tournaments only; win counts wait for match recording.
- Q: Are tournament points added up for the academy or the affiliation? → A: Both. The leaderboard shows an academy ranking and a separate affiliation ranking.
- Q: Who can see a competitor's profile page? → A: Only the competitor (and organisers). There is no public profile page; visitors see just name, academy and division in competitor lists and podiums.
- Q: Which payment provider takes the entry fees? → A: Stripe (owner's statement).
- Q: How many unpaid sign-ups may one competitor hold at once in a tournament? → A: Two. A third is refused until one is paid, cancelled or expires.
- Q: How long are payment and refund records kept after a competitor deletes their account? → A: Six years, then removed automatically.
- Q: Who can create a tournament? → A: Only the admin, who is the site owner. Users (competitors) can never create one; they can only sign up to compete (owner's statement).

## User Scenarios & Testing *(mandatory)*

User stories are prioritized journeys. Each story is independently testable.

### User Story 1 - Organiser publishes a tournament (Priority: P1)

The organiser creates a tournament with its name, date, venue, description, entry fee, registration opening and closing times, and the list of divisions on offer. They can keep it as a draft while they work and publish it when ready. Once published, anyone can see the tournament page without logging in.

**Why this priority**: Nothing else can happen until a tournament exists and is visible. It is the smallest slice that puts something new in front of visitors.

**Independent Test**: An organiser creates and publishes a tournament; a visitor who is not logged in opens its page and sees the details, fee, dates and divisions.

**Acceptance Scenarios** (one GitLab issue each, provisional ids from `#5001`, matching `specs/stc/tournaments/spec.md`. The epic stays on that file's **Requirements** line. `bjjeire-tests` records the same issue on `Covers:`):

1. **`#5001`**: **Given** an organiser is signed in, **When** they save a tournament with name, date, venue, fee, registration window and at least one division, **Then** it is stored as a draft that visitors cannot see
2. **`#5002`**: **Given** a draft tournament, **When** the organiser publishes it, **Then** a visitor who is not logged in can open its page and see its details, fee, registration window and divisions
3. **`#5003`**: **Given** a published tournament whose registration has not opened or has closed, **When** a visitor opens its page, **Then** the page states when registration opens or that it is closed, and offers no sign-up
4. **`#5004`**: **Given** a person who is not an organiser, **When** they attempt to create, edit or publish a tournament, **Then** they are refused
5. **`#5005`**: **Given** a division that already has paid sign-ups, **When** the organiser tries to remove it, **Then** they are stopped and told to move or cancel those sign-ups first

---

### User Story 2 - Competitor creates an account and profile (Priority: P1)

A person who wants to compete registers for an account, confirms their email address, and fills in a competitor profile: first name, middle name (optional), last name, nationality, date of birth, gender, belt, academy and affiliation, plus optional phone number and address. They can sign in later, edit the profile and sign out. Their profile page is private to them and also shows their medal counts and the tournaments they have entered.

**Why this priority**: Sign-up, payment and results all hang off a known person. The app has no public accounts today, so this is a prerequisite.

**Independent Test**: A new person registers, confirms their email, completes the profile, signs out, signs back in and sees their saved profile.

**Acceptance Scenarios**:

1. **`#5006`**: **Given** a visitor with no account, **When** they register with a valid email and confirm it, **Then** they can sign in
2. **`#5007`**: **Given** a signed-in competitor, **When** they save a profile with first and last name, nationality, date of birth, gender, belt and academy, **Then** the profile is shown back to them as saved
3. **`#5008`**: **Given** a competitor choosing an academy, **When** they search, **Then** they can pick a gym from the BjjEire directory, or enter an academy name if theirs is not listed, or choose "no academy"; and they can separately name an affiliation or leave it empty
4. **`#5009`**: **Given** a competitor's profile, **When** any other competitor or visitor tries to view or edit it, **Then** they are refused; there is no public profile page
5. **`#5010`**: **Given** a registered email, **When** someone registers again with it, **Then** no second account is created
6. **`#5011`**: **Given** a competitor who forgot their password, **When** they request a reset, **Then** they can regain access through their email
7. **`#5012`**: **Given** a signed-in competitor, **When** they ask to delete their account, **Then** their personal details are removed and they can no longer sign in
8. **`#5039`**: **Given** a competitor who has entered tournaments and won medals, **When** they open their own profile, **Then** they see their totals of gold, silver and bronze and a list of the tournaments they entered with the medals won at each

---

### User Story 3 - Competitor signs up, picks a division and pays (Priority: P1)

A signed-in competitor opens a tournament with open registration, chooses their division (gi or no-gi, age category, belt and weight class), reviews the fee, and pays online. When the payment succeeds their place is confirmed, they receive a confirmation by email, and they appear on the public competitor list for that division.

**Why this priority**: This is the reason for the feature. With stories 1 to 3 the organiser can take paid entries for a real tournament.

**Independent Test**: With a published tournament in its registration window, a competitor with a complete profile signs up for a division, pays, and then appears in that division's competitor list.

**Acceptance Scenarios**:

1. **`#5013`**: **Given** a visitor who is not signed in, **When** they choose to sign up for a tournament, **Then** they are asked to sign in or register and are returned to the sign-up afterwards
2. **`#5014`**: **Given** a competitor with a complete profile, **When** they start a sign-up, **Then** they are offered only the divisions for their gender and belt whose minimum age they meet on the tournament day
3. **`#5015`**: **Given** a competitor has chosen a division, **When** their payment succeeds, **Then** the sign-up is confirmed, a confirmation email is sent, and they appear in that division's public competitor list with their name and academy
4. **`#5016`**: **Given** a competitor has chosen a division, **When** the payment fails or is abandoned, **Then** no sign-up is confirmed, no money is taken, and they can try again
5. **`#5017`**: **Given** a competitor already holds a confirmed sign-up in a division, **When** they try to sign up for the same division again, **Then** they are refused and not charged
6. **`#5018`**: **Given** a tournament offers gi and no-gi, **When** a competitor signs up for one division in each, **Then** each is a separate sign-up with its own fee
7. **`#5019`**: **Given** a competitor who will be under 18 on the tournament day, **When** they try to sign up, **Then** they are refused with an explanation
8. **`#5020`**: **Given** a tournament that has reached its competitor limit, **When** another competitor tries to sign up, **Then** they are told it is full and are not charged
9. **`#5021`**: **Given** a signed-in competitor, **When** they open "my sign-ups", **Then** they see each sign-up with its tournament, division, amount paid and status
10. **`#5042`**: **Given** a competitor already has two unpaid sign-ups in a tournament, **When** they start a third, **Then** they are refused and told to finish or cancel one first

---

### User Story 4 - Competitor cancels or changes a sign-up (Priority: P2)

A competitor who can no longer attend cancels their sign-up from their account. If registration is still open they are refunded in full automatically. They can also move to a different division, for example a different weight class, without paying again, as long as registration is open.

**Why this priority**: Requested explicitly and needed for fairness, but a first tournament could be run with cancellations handled by hand.

**Independent Test**: A competitor with a confirmed sign-up cancels before registration closes, disappears from the competitor list and sees the sign-up marked as refunded.

**Acceptance Scenarios**:

1. **`#5022`**: **Given** a confirmed sign-up and open registration, **When** the competitor cancels, **Then** the full fee is refunded to the original payment method, the sign-up shows as cancelled and refunded, and they are removed from the competitor list
2. **`#5023`**: **Given** a confirmed sign-up and closed registration, **When** the competitor cancels, **Then** they are warned that no refund is due, and on confirming they are removed from the competitor list with no refund
3. **`#5024`**: **Given** a confirmed sign-up and open registration, **When** the competitor switches to another division they are eligible for, **Then** they move to the new division's competitor list at no extra charge
4. **`#5025`**: **Given** registration has closed, **When** a competitor tries to change division, **Then** they are refused and told to contact the organiser
5. **`#5026`**: **Given** the organiser cancels a whole tournament, **When** the cancellation is confirmed, **Then** every confirmed sign-up is refunded in full and each competitor is notified by email
6. **`#5027`**: **Given** a competitor cancels, **When** the cancellation completes, **Then** they receive an email stating whether a refund was issued and for how much

---

### User Story 5 - Results, leaderboard and team points (Priority: P2)

On the day, as each division finishes, the organiser enters who took gold, silver and bronze. The tournament page shows a public leaderboard: the podium of every completed division, an academy ranking and an affiliation ranking, each built from the points every medal earns for the medallist's academy and affiliation. When the tournament is finished, the academy and the affiliation with the most points are shown as the winners.

**Why this priority**: It is what makes the tournament feel complete to competitors and gyms, but it only matters once entries exist, and the event can run without it.

**Independent Test**: With confirmed sign-ups in a division, the organiser records the podium; a visitor who is not logged in sees that podium and the updated academy and affiliation rankings.

**Acceptance Scenarios**:

1. **`#5028`**: **Given** a division with confirmed competitors, **When** the organiser records gold, silver and up to two bronzes from those competitors, **Then** the division's podium is shown on the public leaderboard
2. **`#5029`**: **Given** recorded podiums, **When** a visitor opens the leaderboard, **Then** academies are ranked by total points, with 9 points per gold, 3 per silver and 1 per bronze added up per academy
3. **`#5030`**: **Given** two academies or two affiliations with equal points, **When** a ranking is shown, **Then** the one with more golds ranks higher, then more silvers, then more bronzes
4. **`#5031`**: **Given** a medallist with no academy or no affiliation, **When** the rankings are calculated, **Then** their medal appears on the division podium but adds nothing to the ranking they have no entry for
5. **`#5032`**: **Given** a division with only one confirmed competitor, **When** the organiser records them as the winner, **Then** the podium is shown but no academy or affiliation points are awarded
6. **`#5033`**: **Given** a recorded podium that is wrong, **When** the organiser corrects it, **Then** the leaderboard and both rankings reflect the correction
7. **`#5034`**: **Given** a tournament with no results yet, **When** a visitor opens the leaderboard, **Then** they see a message that results will appear as divisions finish
8. **`#5035`**: **Given** a person who is not an organiser, **When** they attempt to record or change a result, **Then** they are refused
9. **`#5040`**: **Given** recorded podiums whose medallists belong to academies under the same affiliation, **When** a visitor opens the leaderboard, **Then** a separate affiliation ranking shows those medallists' points added together under that affiliation
10. **`#5041`**: **Given** an organiser marks the tournament as finished, **When** a visitor opens the leaderboard, **Then** the academy and the affiliation with the most points are each shown as the winner

---

### User Story 6 - Existing directory stays open and read-only (Priority: P1)

Visitors who only want to browse gyms, events, competitions and stores continue to do so exactly as today, with no account and no prompt to create one.

**Why this priority**: An explicit constraint from the owner. A regression here harms every current visitor.

**Independent Test**: A visitor with no account browses each existing section and is never asked to sign in; a signed-in competitor has no ability to change directory content.

**Acceptance Scenarios**:

1. **`#5036`**: **Given** a visitor who is not signed in, **When** they browse gyms, events, competitions and stores, **Then** everything works as before and they are never required to sign in
2. **`#5037`**: **Given** a signed-in competitor, **When** they attempt to add, edit or remove a gym, event, competition or store, **Then** they are refused
3. **`#5038`**: **Given** the tournament feature is switched off, **When** a visitor uses the site, **Then** no tournament or account entry points are shown and the existing sections are unaffected

---

### Edge Cases

- A payment succeeds but the competitor closes the page before returning to the site: the sign-up must still end up confirmed, and they must still receive the confirmation email.
- Two competitors try to take the last place at the same moment: only one is confirmed; the other is told the tournament is full and is not charged, or is refunded in full if a charge was already taken.
- A competitor starts paying just before registration closes and completes just after: the sign-up is honoured if the payment was started while registration was open.
- A refund cannot be completed by the payment provider: the sign-up shows "refund pending", and the organiser is alerted so they can resolve it by hand.
- A competitor changes their belt or gender in their profile after signing up: existing sign-ups keep their division; the organiser sees a flag that the profile no longer matches.
- The organiser changes the entry fee after some people have paid: existing sign-ups keep the price they paid; only new sign-ups pay the new fee.
- A competitor who has a confirmed or unpaid sign-up asks to delete their account: they are told to cancel the sign-up first; deletion does not cancel it for them.
- A competitor who has already won a medal deletes their account: the result stands and the academy and affiliation keep their points, but the name is no longer shown.
- Several competitors type the same academy or affiliation name differently ("Team X", "team x BJJ"): the organiser can merge them into one before or after results so points are not split.
- Competitors from the same academy name different affiliations: each medal counts for the affiliation its own medallist named; the organiser can correct them with the merge tool.
- Two academies or affiliations are still level after golds, silvers and bronzes when the tournament finishes: they are shown as joint winners.
- The organiser tries to record the same competitor in two podium positions of one division, or a competitor from another division: refused.
- A competitor cancels after a result naming them was recorded: refused; the organiser must correct the result first.

## Requirements *(mandatory)*

### Functional Requirements

**Tournament set-up**

- **FR-001**: Organisers MUST be able to create a tournament with name, date, venue, description, entry fee in euro, registration open and close times, and an optional limit on total competitors.
- **FR-002**: Organisers MUST be able to define the divisions of a tournament, each a combination of gi or no-gi, gender, age category, belt and weight class.
- **FR-003**: A tournament MUST be a draft, hidden from the public, until an organiser publishes it.
- **FR-004**: Published tournaments, their divisions, competitor lists and leaderboards MUST be viewable by anyone without an account.
- **FR-005**: Only the organiser (the admin) MUST be able to create, edit, publish or cancel tournaments, and to record results. Competitor accounts MUST have no way to create a tournament or to become an organiser through the app.
- **FR-006**: Organisers MUST be able to see every sign-up for a tournament and export that list. Each row shows the competitor's name, email, phone, date of birth, gender, belt, academy and affiliation, the division, the sign-up's status, the amount paid, the payment and refund status, and whether the profile no longer matches the division.
- **FR-007**: Organisers MUST be able to move a competitor to another division, cancel a sign-up with or without a refund, and merge duplicate academy or affiliation names.

**Accounts and profiles**

- **FR-008**: Members of the public MUST be able to register for an account, confirm their email address, sign in, sign out and reset a forgotten password.
- **FR-009**: Each account MUST have one competitor profile holding first name, optional middle name, last name, nationality, date of birth, gender, belt, academy and optional affiliation. Phone number and postal address (street, postcode, city, county or state, country of residence) are optional.
- **FR-010**: A competitor's academy MUST be chosen from the BjjEire gym directory, entered as a name when not listed, or left as "no academy". An affiliation MAY be named separately.
- **FR-011**: A competitor's profile MUST be visible only to the account holder and organisers. There is no public profile page. Only name, academy, affiliation and division are shown publicly, in competitor lists, podiums and rankings.
- **FR-012**: Competitors MUST be told at sign-up that their name, academy, affiliation and division will be listed publicly, and MUST agree before paying. They MUST also accept the terms of entry, including the liability waiver, before paying; the time of each acceptance is recorded.
- **FR-013**: Competitors MUST be able to delete their account; their personal details are then removed, while the payment and refund records of their sign-ups are kept for six years after the deletion and then removed automatically.
- **FR-039**: A competitor's own profile MUST show their total gold, silver and bronze medals and the tournaments they have entered with the medals won at each. Win counts, win methods and match videos are not shown.
- **FR-014**: Competitor accounts MUST NOT grant any ability to change gyms, events, competitions or stores.

**Sign-up and payment**

- **FR-015**: A signed-in competitor with a complete profile MUST be able to sign up for a division of a published tournament while its registration is open.
- **FR-016**: The system MUST offer a competitor only the divisions for their gender and belt whose minimum age they meet on the tournament day. An older competitor may enter a younger age category; a younger one may not enter an older category. Weight class is the competitor's own choice.
- **FR-017**: The system MUST refuse sign-up to anyone who will be under 18 on the tournament day.
- **FR-018**: A sign-up MUST be confirmed only after the entry fee has been paid successfully online. The competitor is shown the full amount before paying.
- **FR-019**: A place MUST be held for a competitor for a limited time while they pay (30 minutes, the shortest the payment provider's checkout allows) and released if payment is not completed.
- **FR-020**: The system MUST prevent more than one active sign-up by the same competitor in the same division, and MUST never charge twice for one sign-up.
- **FR-021**: A competitor MUST be able to hold sign-ups in more than one division of a tournament, each paid for separately.
- **FR-022**: The system MUST NOT confirm sign-ups beyond the tournament's competitor limit.
- **FR-041**: A competitor MUST NOT hold more than two unpaid sign-ups in the same tournament at once. A further sign-up is refused, with no charge, until one is paid, cancelled or expires.
- **FR-023**: The system MUST NOT store payment card details.
- **FR-024**: The system MUST email the competitor on confirmation, cancellation, refund and tournament cancellation.
- **FR-025**: Competitors MUST be able to see all their sign-ups with tournament, division, amount paid and status.

**Cancellation and change**

- **FR-026**: A competitor MUST be able to cancel their own sign-up at any time before a result naming them is recorded.
- **FR-027**: A cancellation made before registration closes MUST be refunded in full, automatically, to the original payment method. A cancellation made after registration closes is not refunded, and the competitor MUST be told this before confirming.
- **FR-028**: A competitor MUST be able to change to another eligible division at no charge while registration is open.
- **FR-029**: When an organiser cancels a tournament, every confirmed sign-up MUST be refunded in full.
- **FR-030**: The system MUST keep a record of each payment and refund with amount, time and outcome, visible to the organiser.

**Results and leaderboard**

- **FR-031**: Organisers MUST be able to record, for each division, one gold, one silver and up to two bronzes, chosen from that division's confirmed competitors, and to correct them later.
- **FR-032**: The system MUST show a public leaderboard for each tournament with the podium of every division that has results.
- **FR-033**: The system MUST show two public rankings for each tournament, one per academy and one per affiliation, awarding 9 points per gold, 3 per silver and 1 per bronze to the medallist's academy and to their affiliation, added up across all divisions.
- **FR-034**: Ties in either ranking MUST be broken by number of golds, then silvers, then bronzes.
- **FR-035**: Medals won in a division with a single competitor MUST NOT add points to either ranking. A medallist with no academy adds no academy points; one with no affiliation adds no affiliation points.
- **FR-040**: When an organiser marks a tournament as finished, the academy and the affiliation with the most points MUST each be shown as the winner; any still level after the tie-break are joint winners.
- **FR-036**: The app does not generate draws or record individual matches; these happen outside the app.

**Existing features**

- **FR-037**: Gyms, events, competitions and stores MUST remain browsable without an account, with unchanged behaviour.
- **FR-038**: The tournament and account features MUST be switchable off as a whole, leaving the existing site unaffected.

### Key Entities

- **Tournament**: an in-house competition with its details, fee, registration window, competitor limit and state (draft, published, cancelled, finished). Contract to be added at `specs/database-contracts/tournament.md`.
- **Division**: one category within a tournament that competitors enter and that produces one podium. Part of the tournament contract.
- **Competitor account / profile**: a member of the public's login identity and their competing details (names, nationality, date of birth, gender, belt, academy, affiliation, optional contact details). Private to the holder and organisers. Contract to be added at `specs/database-contracts/competitor.md`.
- **Academy**: the gym that academy points accrue to. Either a gym from the directory (`specs/database-contracts/gym.md`) or a name entered by a competitor.
- **Affiliation**: the wider team that affiliation points accrue to. A name shared by the competitors who entered it.
- **Sign-up (registration)**: one competitor's entry in one division, with its state (awaiting payment, confirmed, cancelled) and price paid. Contract to be added at `specs/database-contracts/tournament-registration.md`.
- **Payment / refund record**: what was charged or returned for a sign-up, when, and whether it succeeded. Holds no card details.
- **Division result**: the gold, silver and bronze competitors of a division. Academy and affiliation points and rankings are derived from these, not stored independently.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new competitor can go from the tournament page to a confirmed, paid sign-up (including creating an account and profile) in under 5 minutes.
- **SC-002**: A returning competitor with a profile can complete a paid sign-up in under 2 minutes.
- **SC-003**: At least 90% of competitors who start a sign-up with open registration complete it without contacting the organiser.
- **SC-004**: 100% of confirmed sign-ups correspond to exactly one successful payment, and no competitor is charged twice for the same sign-up.
- **SC-005**: 100% of cancellations made before registration closes result in a full refund being issued without organiser action, with the competitor notified within 5 minutes.
- **SC-006**: A recorded or corrected division result appears on the public leaderboard and both rankings within 1 minute.
- **SC-007**: Academy and affiliation point totals on the leaderboard match a hand calculation from the recorded podiums in 100% of divisions.
- **SC-008**: The organiser can set up and publish a tournament with 50 divisions in under 30 minutes.
- **SC-009**: A tournament with 500 competitors and 200 people viewing the leaderboard at once stays responsive, with pages appearing in under 2 seconds.
- **SC-010**: Existing gym, event, competition and store browsing shows no change in behaviour and requires no sign-in, verified by the existing acceptance suite passing unchanged.

## Acceptance Coverage *(mandatory)*

Visitor-observable scenarios are proven at T6 by Playwright in `bjjeire-tests`.
Its `playwright-test-planner` reads this section and turns the listed requirement issues into
scenarios. Those issues are GitLab issues in `bjjeire/requirements`. CI stays on GitHub.

- **Acceptance spec**: `bjjeire-tests/specs/features/tournaments.md`
- **T6 (bjjeire-tests)**: `#5002`, `#5003`, `#5006`, `#5007`, `#5008`, `#5010`, `#5011`, `#5013`, `#5014`, `#5015`, `#5016`, `#5019`, `#5021`, `#5022`, `#5023`, `#5024`, `#5028`, `#5029`, `#5034`, `#5036`, `#5038`, `#5039`, `#5040`, `#5041`. Payment scenarios run against Stripe's test mode. `#5006`, `#5010` and `#5011` (register, no duplicate account, password reset) are carried out by the identity provider's hosted pages, so they can only be observed end to end, against the non-production competitor tenant.
- **Lower tiers only**:
  - `#5001`, `#5004`, `#5005`, `#5035`, `#5037`: organiser-only and refusal rules, owned by API integration tests.
  - `#5009`, `#5012`: profile privacy and account deletion rules, owned by API integration tests.
  - `#5017`, `#5018`, `#5020`, `#5025`, `#5042`: duplicate, multi-division, capacity, closed-window and unpaid-hold rules, owned by service and integration tests.
  - `#5026`, `#5027`: bulk refund and notification emails, owned by integration tests with the payment provider and mail stubbed.
  - `#5030`, `#5031`, `#5032`, `#5033`: ranking, tie-break and points rules, owned by unit tests of the points calculation.

## Assumptions

- Requirement issue ids `#5001` to `#5042` are provisional. They follow the existing per-feature ranges (1xxx gyms, 2xxx events, 3xxx competitions, 4xxx stores) and must be created in `bjjeire/requirements` under a new epic before `/build-feature`.
- Tournaments are a new capability beside the existing Competitions listing, which keeps listing other organisers' events and is not changed by this feature.
- There is one organiser: the admin, who is the site owner. Users and third parties cannot create tournaments. The admin keeps the existing administrator sign-in; competitor accounts are a new, separate kind of user with no administrative rights. Where the spec says "organisers", it means that admin role.
- Introducing public accounts extends constitution principle V ("public reads, authenticated writes"), which today knows only administrator writes. The plan must record this in an ADR and amend the constitution.
- All fees are in euro and each sign-up has the same flat fee per division. Discounts, early-bird pricing, coupons and bundled gi plus no-gi prices are out of scope.
- Payment and refunds go through Stripe, chosen by the owner, using its hosted checkout so that card details never reach BjjEire. The owner holds the Stripe account that receives the fees. The requirements stay worded as "payment provider" so they describe behaviour, not the vendor.
- Refunds return the full amount the competitor paid; any Stripe fee on refunded payments is absorbed by the organiser.
- Points are 9 / 3 / 1 as stated by the owner and are fixed, not configurable per tournament.
- An affiliation belongs to the competitor's profile, not to the gym directory: the existing gym records are not changed to carry one.
- The site stays English only, so the profile has no language setting. A separate "English last name" is not collected.
- Phone number and address are optional and are used only by the organiser to contact a competitor.
- Competitors choose their own weight class. Weigh-ins, and moving or disqualifying competitors who miss weight, are handled by the organiser on the day using the organiser tools in FR-007.
- Belt and age are self-declared; the organiser verifies on the day.
- Out of scope for this release: public competitor profile pages, win counts and win methods, match videos, draw generation, match-by-match scoring, mat scheduling, absolute/open-weight auto-qualification, under-18 competitors and guardian accounts, waiting lists, coach or team-manager accounts, bulk team registration, and spectator tickets.
- Competitor data is personal data under GDPR. A privacy notice and terms of entry (including a liability waiver accepted at sign-up) are provided by the owner; their wording is not part of this spec.
- The feature sits behind a feature flag that fails closed, like the existing feature routes.
- Deploy remains Flux / AKS / MongoDB unless an ADR says otherwise.
