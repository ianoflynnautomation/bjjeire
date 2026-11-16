# Feature: Tournaments

**Status**: In progress — slices 0 to 4 of 6 shipped (plumbing; tournament set-up and public pages; competitor accounts and profile; sign-up and payment; cancellation, refunds and organiser sign-up tools)
**Design record**: [../001-tournament-registration/](../001-tournament-registration/spec.md) (spec, plan, tasks, data model, contracts)
**Database**: [tournament.md](../database-contracts/tournament.md), [competitor.md](../database-contracts/competitor.md), [tournament-registration.md](../database-contracts/tournament-registration.md)
**API**: `/api/v1/tournament`, `/api/v1/competitor`, `/api/v1/registration`
**SPA routes**: `/tournaments`, `/tournaments/:slug`, `/tournaments/:slug/signup`, `/tournaments/:slug/signup/complete`, `/account/profile`, `/account/signups`, `/admin/tournaments`, `/admin/tournaments/:id`
**Feature flag**: `Tournaments`, default off
**Acceptance**: `bjjeire-tests/specs/features/tournaments.md`
**Requirements**: `bjjeire/requirements` · epic `&11` (`#5001`–`#5042`, provisional)
**Decisions**: [ADR-0012](../../docs/adr/0012-competitor-identity-second-issuer.md), [ADR-0013](../../docs/adr/0013-stripe-hosted-checkout-and-webhooks.md), [ADR-0014](../../docs/adr/0014-local-organiser-sign-in.md)

A tournament is a competition BjjEire runs itself: the admin sets it up,
competitors create an account, sign up for a division and pay, and results
feed a public leaderboard. It is separate from the Competitions listing, which
stays a read-only directory of other organisers' events.

Until every slice has shipped, the numbered Spec Kit directory is the source
for behaviour that is not built yet. This file records what is live.

## What is live

### User Story 1 — Organiser publishes a tournament (P1)

1. Given an organiser is signed in, when they save a tournament with name, date, venue, fee, registration window and at least one division, then it is stored as a draft that visitors cannot see (`#5001`)
2. Given a draft tournament, when the organiser publishes it, then a visitor who is not logged in can open its page and see its details, fee, registration window and divisions (`#5002`)
3. Given a published tournament whose registration has not opened or has closed, when a visitor opens its page, then the page states when registration opens or that it is closed, and offers no sign-up (`#5003`)
4. Given a person who is not an organiser, when they attempt to create, edit or publish a tournament, then they are refused (`#5004`)
5. Given a division that already has sign-ups, when the organiser tries to remove it, then they are stopped and told to move or cancel those sign-ups first (`#5005`)

How it behaves:

- **Public pages.** `/tournaments` lists published, finished and cancelled tournaments, earliest day first, with name search. Each card shows the day, venue, fee in euro, number of divisions and a badge: the registration state (Not open yet, Open, Closed, Full), or Cancelled / Finished. `/tournaments/:slug` shows the details, the registration window in Irish time whatever the visitor's time zone, places taken when there is a limit, one sentence on registration, the description, and the divisions grouped by discipline and gender. A draft or unknown slug shows "Tournament Not Found" with a link back to the list. While registration is open the page offers **Sign up** and a link to My sign-ups, and below the divisions it lists the confirmed competitors (User Story 3).
- **Registration state** is worked out by the API at each request from the window and places: before it opens `NOT_OPEN`, from opening until just before closing `OPEN` (or `FULL` when every place is taken), from the closing instant `CLOSED`. A draft, cancelled or finished tournament is always `CLOSED`.
- **Organiser screens.** `/admin/tournaments` and `/admin/tournaments/:id` sit behind the same flag and ask for the existing organiser (workforce) sign-in before loading anything; they are not in the site navigation. The list shows every tournament with its status. The form takes name, web address name (slug), day, venue, fee in euro, registration open and close times on an Irish clock, an optional competitor limit and a description, and checks them before sending. Divisions are added with a generator: tick disciplines, genders, age categories and belts, type weight classes, and one division is added per combination, skipping any the tournament already has; rows can be removed. Save sends the full division list. Publish is available on a saved draft with at least one division and is held back while there are unsaved changes. A finished or cancelled tournament is shown read-only. In the local Docker stack the organiser signs in without a Microsoft account ([ADR-0014](../../docs/adr/0014-local-organiser-sign-in.md)).
- **Rules the API enforces.** Slug: lowercase letters, digits and single hyphens, unique, and not `admin`. Venue name required (≤ 100), address ≤ 200, map coordinates optional but a valid `[longitude, latitude]` point when sent. Name ≤ 120, description ≤ 4000, fee ≥ 0 cents, limit ≥ 1 or none. Each division is a different combination of discipline, gender, age category, belt and weight class (weight class compared without case or outer spaces); saved divisions keep their ids. Publishing needs a division and a window that closes after it opens and by the end of the tournament day in Ireland; a published tournament must stay that way when edited. Only a draft can be published, and the publish write itself requires a division, so an edit that empties the tournament at the same moment cannot slip through. Removing a division that still has a sign-up awaiting payment or confirmed is refused with `urn:bjjeire:division-has-signups`. An edit never touches places already taken. Every organiser write is audited and clears the tournament cache, so visitors see it on the next read. An update sends the `version` it was edited from; a save from a stale copy is refused with 409 and the organiser is told to reload, and publish is refused the same way if anything changed after it checked the tournament.
- **Test data.** The test dataset seeds three published tournaments (`acceptance-open`, `acceptance-opens-later`, `acceptance-closed`). Production has no tournament seed, and a production seeder run never writes or prunes the collection.

### User Story 2 — Competitor creates an account and profile (P1)

1. Given a visitor with no account, when they register with a valid email and confirm it, then they can sign in (`#5006`)
2. Given a signed-in competitor, when they save a profile with first and last name, nationality, date of birth, gender, belt and academy, then the profile is shown back to them as saved (`#5007`)
3. Given a competitor choosing an academy, when they search, then they can pick a gym from the BJJ Éire directory, or enter an academy name if theirs is not listed, or choose "no academy"; and they can separately name an affiliation or leave it empty (`#5008`)
4. Given a competitor's profile, when any other competitor or visitor tries to view or edit it, then they are refused; there is no public profile page (`#5009`)
5. Given a registered email, when someone registers again with it, then no second account is created (`#5010`)
6. Given a competitor who forgot their password, when they request a reset, then they can regain access through their email (`#5011`)
7. Given a signed-in competitor, when they ask to delete their account, then their personal details are removed and they can no longer sign in (`#5012`)
8. Given a competitor who has entered tournaments and won medals, when they open their own profile, then they see their totals of gold, silver and bronze and a list of the tournaments they entered with the medals won at each (`#5039`; the list stays empty until results are recorded in slice 5)

How it behaves:

- **Signing in.** With the flag on, the header shows an account icon linking to `/account/profile`. Signed out, that page offers "Sign in or create an account", which opens the competitor tenant's hosted pages (Entra External ID) in a popup: register, confirm the email, sign in, or reset a password there (`#5006`, `#5010`, `#5011`). The visitor stays on the page and it loads once they are signed in. The competitor's session is separate from the organiser's; the competitor token is sent only on `/competitor`, `/registration` and `eligible-division` calls, and the organiser token never on them. Sign out signs them out of the tenant too. In the local Docker stack a competitor signs in by typing any email, with no Microsoft account ([ADR-0014](../../docs/adr/0014-local-organiser-sign-in.md), amendment).
- **Profile.** First, middle (optional) and last name, nationality, date of birth, gender, belt; academy; optional affiliation; optional phone and postal address (street, postcode, city, county or state, country of residence). The form checks every field before sending. Before the first save the API returns an empty profile marked unsaved (no error), and the page shows "Create your competitor profile" with the sign-in email. The first save creates the profile, later saves replace it; the email shown is the one from the sign-in and cannot be edited here. If nationality, gender or belt are missing (possible through the API), the page says the profile is not complete enough to sign up.
- **Academy.** "My academy is in the BJJ Éire gym directory" searches every directory gym by name (case and accents ignored) and stores the chosen gym's id and name; "My academy is not listed" stores a typed name; "No academy" stores none. Affiliation is a separate free-text field.
- **Privacy.** `/api/v1/competitor/me` always acts on the caller's own token identity (issuer and subject); no route takes a competitor id, the response carries no id, and the organiser's token is refused (403). One profile per identity, however many saves race.
- **Medals.** The page shows gold, silver and bronze totals and a table of tournaments entered with the medals won at each, or "You have not entered a tournament yet". Until results are recorded (slice 5) the API returns zero and no tournaments.
- **Deleting the account.** "Delete my account" asks for confirmation, then removes the profile and the sign-in identity from the competitor tenant, and signs the person out. Sessions from before the deletion are refused (401) even if the tenant could not be reached; such a failure is logged for the organiser to remove the identity by hand. Signing up or in again later with the same email starts a new, empty account. While a sign-up is awaiting payment or confirmed, deletion is refused and the competitor is told to cancel it first.

### User Story 3 — Competitor signs up, picks a division and pays (P1)

1. Given a visitor who is not signed in, when they choose to sign up for a tournament, then they are asked to sign in or register and are returned to the sign-up afterwards (`#5013`)
2. Given a competitor with a complete profile, when they start a sign-up, then they are offered only the divisions for their gender and belt whose minimum age they meet on the tournament day (`#5014`)
3. Given a competitor has chosen a division, when their payment succeeds, then the sign-up is confirmed, a confirmation email is sent, and they appear in that division's public competitor list with their name and academy (`#5015`)
4. Given a competitor has chosen a division, when the payment fails or is abandoned, then no sign-up is confirmed, no money is taken, and they can try again (`#5016`)
5. Given a competitor already holds a confirmed sign-up in a division, when they try to sign up for the same division again, then they are refused and not charged (`#5017`)
6. Given a tournament offers gi and no-gi, when a competitor signs up for one division in each, then each is a separate sign-up with its own fee (`#5018`)
7. Given a competitor who will be under 18 on the tournament day, when they try to sign up, then they are refused with an explanation (`#5019`)
8. Given a tournament that has reached its competitor limit, when another competitor tries to sign up, then they are told it is full and are not charged (`#5020`)
9. Given a signed-in competitor, when they open "my sign-ups", then they see each sign-up with its tournament, division, amount paid and status (`#5021`)
10. Given a competitor already has two unpaid sign-ups in a tournament, when they start a third, then they are refused and told to finish or cancel one first (`#5042`)

How it behaves:

- **Starting.** `/tournaments/:slug/signup` asks a signed-out visitor to sign in over the same page (`#5013`). It then asks the API which divisions the competitor may enter: same gender and belt, and an age on the tournament day (Irish date) of at least the category's minimum (Adult 18, Master 1 30, Master 2 36, Master 3 41, Master 4 46, Master 5 51); an older competitor may enter a younger category. Outside the registration window the API offers no division (409 `registration-not-open`). An incomplete profile gets a link to complete it, someone under 18 on the day is told they cannot enter, and a closed tournament offers nothing; a full one says it is full. The competitor picks one division, sees the fee, and must tick both "my name, academy, affiliation and division are listed publicly" and "I accept the terms of entry, including the liability waiver" (FR-012); the API accepts only the JSON value `true` for each (not `"true"` or `1`) and records when each was given.
- **Holding and paying.** Continuing takes a place for 30 minutes (Stripe's shortest Checkout expiry) and sends the competitor to Stripe's hosted Checkout page for the tournament's fee; the API never takes an amount from the browser, and keeps the fee charged even if the organiser changes it later. A competitor may hold at most two unpaid sign-ups in one tournament, even when several sign-ups start at once (`#5042`), one active sign-up per division (`#5017`, enforced by a unique index), and a separate paid sign-up for each division they enter (`#5018`). A full tournament (`#5020`), a refused division, or Stripe being unreachable (502 `payment-unavailable`) charge nothing and give the place back. Two competitors racing for the last place: exactly one gets it.
- **Confirmation.** Only Stripe's signed webhook confirms a sign-up (ADR-0013): returning to the site does not. `/tournaments/:slug/signup/complete` checks the sign-up every 2 seconds for about a minute and shows "You are signed up", "Waiting for your payment" (with a way back to the same payment page), or "Payment not completed" with "Try again". On confirmation the competitor gets an email and appears in the division's public list (`#5015`). A competitor who leaves Checkout without paying lands back on the sign-up page, is told nothing was charged, and can reopen the same payment page while the place is held: one sign-up never has two payable Checkout pages (`#5016`). The hold ends when Stripe reports the session expired, or at the latest when the minute-by-minute sweep finds it lapsed and Stripe confirms the session was not paid; the place is then given back. If Stripe says the session was paid but no webhook has confirmed it, the place stays held and the organiser is alerted (`registration.payment.unconfirmed`); "Pay now" then tells the competitor their payment was received instead of reopening Stripe's finished page. A payment that arrives after its hold lapsed is confirmed if a place is still free, otherwise refunded in full automatically with an email, and the sign-up ends cancelled. A payment started while registration was open is honoured even if it completes after the window closes. Stripe's page itself stays open 2 minutes past the hold, because Stripe counts its 30-minute minimum from when it opens the page; a payment in those minutes is a late payment. If the late refund fails it is recorded as refund pending and raised for the organiser. The return page tells a competitor whose late payment was refunded that it was refunded in full. Without real Stripe keys (the public `REPLACE_ME` placeholders) no sign-up can start (502) and the webhook refuses every call (503).
- **Competitor list.** The tournament page lists confirmed competitors by division with name, academy (or "No academy") and affiliation only (FR-011). Nobody awaiting payment is listed.
- **My sign-ups.** `/account/signups` lists every sign-up, newest first, with tournament, day, division, amount, and status (Awaiting payment, Confirmed, Cancelled, Expired, not paid), any refund, and "Pay now" for an unpaid one whose hold lasts (`#5021`).
- **Profile changes.** Saving a new name, academy or affiliation updates the competitor's active sign-ups in tournaments still running. Changing belt or gender keeps the division and flags the sign-up for the organiser.
- **Mail.** Sign-up mail is sent after the change is saved, on its own thread, with three attempts; a failure is counted (`registration.mail.failures`) and never undoes the sign-up. Locally it goes to Mailpit ([docs/stripe-local.md](../../docs/stripe-local.md)).

### User Story 4 — Competitor cancels or changes a sign-up (P2)

1. Given a confirmed sign-up and open registration, when the competitor cancels, then the full fee is refunded to the original payment method, the sign-up shows as cancelled and refunded, and they are removed from the competitor list (`#5022`)
2. Given a confirmed sign-up and closed registration, when the competitor cancels, then they are warned that no refund is due, and on confirming they are removed from the competitor list with no refund (`#5023`)
3. Given a confirmed sign-up and open registration, when the competitor switches to another division they are eligible for, then they move to the new division's competitor list at no extra charge (`#5024`)
4. Given registration has closed, when a competitor tries to change division, then they are refused and told to contact the organiser (`#5025`)
5. Given the organiser cancels a whole tournament, when the cancellation is confirmed, then every confirmed sign-up is refunded in full and each competitor is notified by email (`#5026`)
6. Given a competitor cancels, when the cancellation completes, then they receive an email stating whether a refund was issued and for how much (`#5027`)

How it behaves:

- **Cancelling.** On `/account/signups` a confirmed sign-up offers "Cancel sign-up". Before confirming, the competitor sees either "You will be refunded €25.00 in full to your original payment method" (before registration closes; `refundableUntil` on each sign-up is the closing instant) or "Registration has closed, so no refund is due". Confirming calls `POST /api/v1/registration/{id}/cancel`: the sign-up becomes `CANCELLED`, its place is released, it leaves the public list, and the answer says whether and how much was refunded. Cancelling again returns the same answer and changes nothing. An unpaid sign-up cannot be cancelled (409 `conflict`); it ends by itself when its hold runs out.
- **Refunds.** The cancellation is saved first with refund `PENDING`, then Stripe is asked for a full refund of the amount paid with the key `refund-<registrationId>`. Retrying a refund that failed uses a new key (`refund-<registrationId>-<attempt>`), since Stripe replays a reused key; Stripe never refunds more than was paid. A confirmed sign-up with no recorded Stripe payment is cancelled with its refund recorded `FAILED` and alerted. Stripe's `refund.created`, `refund.updated` and `refund.failed` events, matched by the refund's `registrationId` metadata and its refund id, complete it (`REFUNDED`, with a "Refund completed" mail) or record it `FAILED`. A refund Stripe refuses, at once or later, keeps the cancellation, shows "Refund pending" to the competitor, increments `registration.refund.failures` and logs an `ALERT` for the organiser.
- **Mail.** Each cancellation sends one mail stating the refund outcome: "a full refund of €25.00" or "No refund is due" (`#5027`).
- **Changing division.** While registration is open a confirmed sign-up offers "Change division", which lists the other divisions the competitor is eligible for (the same rule as signing up) and calls `PUT /api/v1/registration/{id}/division`. The place, price and payment are unchanged and nothing is charged. A division they already hold is 409 `already-registered`, one they may not enter 409 `not-eligible`. After registration closes the control is replaced by "Registration has closed. To change division, contact the organiser.", and the API answers 409 `registration-closed` (`#5025`).
- **Organiser sign-up list.** A published, finished or cancelled tournament's admin page lists every sign-up, oldest first, 100 per page: name, date of birth, email, phone, academy, affiliation, division, status, amount, refund state, "Profile no longer matches this division", and "Paid at Stripe but not confirmed" (the reconciliation check: the hold sweep found the session paid with no webhook). "Export CSV" downloads every row with the same columns as `text/csv`; a value starting with `=`, `+`, `-`, `@`, tab or carriage return is prefixed with `'` so a spreadsheet does not run it.
- **Organiser tools.** Per confirmed sign-up: "Move" to any division of the tournament, also after registration closes and with no eligibility check (the mismatch flag is set when the competitor's belt or gender does not fit), and "Cancel", refunding in full or not as the organiser chooses. "Merge team names" picks academy or affiliation names typed differently and rewrites them, and their ranking keys, to one name on every sign-up of that tournament only.
- **Cancelling a tournament.** "Cancel tournament" warns first, then `POST /api/v1/tournament/{id}/cancel` sets it `CANCELLED`, ends every unpaid hold (a payment that still arrives is refunded because a cancelled tournament gives no place), cancels and refunds every confirmed sign-up in full, and mails each competitor "Tournament cancelled" with the refund amount. A finished tournament cannot be cancelled. Calling it again on a cancelled tournament retries every failed refund of that tournament (whoever cancelled) and any that never reached Stripe; the admin page offers "Retry failed refunds" while any is `FAILED`. The organiser's sign-up list also shows each competitor's gender, belt and payment status.
- **Account deletion.** Deleting an account (still refused while a sign-up is awaiting payment or confirmed) first anonymises the competitor's sign-ups: the name becomes "Former competitor", the link to the profile is removed, and `financialRecordsExpireAt` is set to six years later. A daily sweep then removes `payment` and `refund` from sign-ups past that instant, leaving the division, team names and any medal (FR-013).

### User Story 6 — Existing directory stays open and read-only (P1)

1. Given a visitor who is not signed in, when they browse gyms, events, competitions and stores, then everything works as before and they are never required to sign in (`#5036`)
2. Given a signed-in competitor, when they attempt to add, edit or remove a gym, event, competition or store, then they are refused (`#5037`)
3. Given the tournament feature is switched off, when a visitor uses the site, then no tournament or account entry points are shown and the existing sections are unaffected (`#5038`)

### Access rules

| Routes | Who |
|---|---|
| `GET /api/v1/tournament`, `/{slug}`, `/{id}/competitor` (live); `/{id}/leaderboard` (slice 5) | anyone |
| `GET /api/v1/tournament/admin`, `/admin/{id}`, `POST /api/v1/tournament`, `PUT /{id}`, `POST /{id}/publish`, `POST /{id}/cancel`, `GET /{id}/registration` (also `?format=csv`), `PUT /{id}/registration/{registrationId}/division`, `POST /{id}/registration/{registrationId}/cancel`, `POST /{id}/team-merge` (live); results and finish (slice 5) | admin (workforce token, `access_as_writer`) |
| `GET`, `PUT`, `DELETE /api/v1/competitor/me`, `GET /me/history`, `GET /api/v1/tournament/{id}/eligible-division`, `POST /api/v1/registration`, `POST /api/v1/registration/{id}/checkout`, `GET /api/v1/registration/me`, `POST /api/v1/registration/{id}/cancel`, `PUT /api/v1/registration/{id}/division` (live) | signed-in competitor (competitor-tenant token, `access_as_competitor`), acting on their own profile and sign-ups only (another competitor's sign-up is 403); a deleted account's tokens are refused |
| `POST /api/v1/registration/stripe-webhook` | no bearer token; the `Stripe-Signature` header is verified over the raw body (bad or missing: 400, nothing changes); each event is applied once; hidden from the published OpenAPI; a method other than POST answers 405 |

The admin is not a competitor: the writer scope opens no competitor route.

## Changes outside the tournament feature

- Every route, directory included, now answers a body that is not JSON (malformed, or sent as text, XML or a form), or holds a value its field cannot take, with 400 `urn:bjjeire:bad-request`, and a method the route does not have with 405 `urn:bjjeire:method-not-allowed`. Both used to fall through to a 500 with an `errorId`. A valid request behaves as before, and in production read-only mode still answers directory writes with 405 first.

## Requirements

- **FR-001**: The organiser creates a tournament with name, date, venue, description, entry fee in euro, registration open and close times, and an optional limit on total competitors.
- **FR-002**: The organiser defines the divisions, each a combination of gi or no-gi, gender, age category, belt and weight class.
- **FR-003**: A tournament is a draft, hidden from the public, until the organiser publishes it.
- **FR-004** (in part): Published tournaments, their divisions and competitor lists are viewable by anyone without an account. Leaderboards come with slice 5.
- **FR-005** (in part): Only the organiser can create, edit, publish and cancel tournaments. Recording results comes with slice 5.
- **FR-006**: The organiser sees every sign-up of a tournament and exports the list as CSV, with name, email, phone, date of birth, gender, belt, academy, affiliation, division, status, amount paid, payment and refund status, and the profile-mismatch flag.
- **FR-007**: The organiser moves a competitor to another division, cancels a sign-up with or without a refund, and merges duplicate academy or affiliation names.

- **FR-008**: Members of the public register, confirm their email, sign in, sign out and reset a forgotten password, on the competitor tenant's hosted pages.
- **FR-009**: Each account has one competitor profile: first name, optional middle name, last name, nationality, date of birth, gender, belt, academy and optional affiliation; optional phone and postal address.
- **FR-010**: The academy is a directory gym, a typed name, or "no academy"; an affiliation may be named separately.
- **FR-011**: A profile is visible only to its owner and, through the sign-up list, to the organiser. There is no public profile page.
- **FR-013**: A competitor can delete their account; the profile is removed, the identity can no longer sign in, and their sign-ups are anonymised. Payment and refund records are kept for six years after the deletion, then removed by a daily sweep.
- **FR-039** (in part): The profile shows medal totals and tournaments entered; empty until results exist.
- **FR-012**: Competitors are told their name, academy, affiliation and division will be listed publicly, and accept that and the terms of entry with the liability waiver before paying; the time of each acceptance is recorded.
- **FR-015** to **FR-018**: A signed-in competitor with a complete profile signs up for a division of a published tournament while registration is open; only eligible divisions are offered; anyone under 18 on the day is refused; a sign-up is confirmed only after the fee is paid online, and the full amount is shown first.
- **FR-019**: A place is held for 30 minutes while the competitor pays and released if payment is not completed.
- **FR-020** to **FR-022**, **FR-041**: One active sign-up per competitor per division, never charged twice; separate paid sign-ups per division; never beyond the competitor limit; at most two unpaid sign-ups per competitor per tournament.
- **FR-023**: No card details are stored; payment is on Stripe's hosted page.
- **FR-024**: Mail on confirmation, cancellation (stating the refund outcome), refund completion, tournament cancellation, and the automatic refund of a payment that found no place.
- **FR-025**: Competitors see all their sign-ups with tournament, division, amount and status.
- **FR-026** (in part): A competitor can cancel their own confirmed sign-up. The refusal once a result names them comes with results (slice 5).
- **FR-027**: A cancellation before registration closes is refunded in full automatically to the original payment method; after it closes there is no refund, and the competitor is told before confirming.
- **FR-028**: A competitor can move to another eligible division at no charge while registration is open.
- **FR-029**: Cancelling a tournament refunds every confirmed sign-up in full.
- **FR-030**: Each sign-up keeps its payment and refund record with amount, time and outcome, visible to the organiser in the sign-up list and export.
- **FR-014**: Competitor accounts grant no ability to change gyms, events, competitions or stores. A competitor-tenant token is granted only the competitor role; its scopes and roles never become authorities.
- **FR-037**: Gyms, events, competitions and stores remain browsable without an account, with unchanged behaviour.
- **FR-038**: The tournament and account features switch off as a whole. With the flag off every tournament, competitor and registration route answers 404 before authentication, and the SPA shows no entry point.
- Read-only mode keeps blocking directory writes. Tournament routes are exempt from it and obey the flag.

## Not built yet

User story 5 (`#5028`–`#5035`, `#5040`–`#5041`): results, leaderboard, both
rankings, finishing a tournament and winners. Medal history fills in with
results. FR-026's refusal to cancel a sign-up a result names also comes with
results. See [tasks.md](../001-tournament-registration/tasks.md).
