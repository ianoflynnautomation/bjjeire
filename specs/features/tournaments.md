# Feature: Tournaments

**Status**: In progress — slices 0 and 1 of 6 shipped (plumbing; tournament set-up and public pages)
**Design record**: [../001-tournament-registration/](../001-tournament-registration/spec.md) (spec, plan, tasks, data model, contracts)
**Database**: [tournament.md](../database-contracts/tournament.md); `competitor.md` and `tournament-registration.md` are added with the slices that create those collections
**API**: `/api/v1/tournament`, `/api/v1/competitor`, `/api/v1/registration`
**SPA routes**: `/tournaments`, `/tournaments/:slug`, `/admin/tournaments`, `/admin/tournaments/:id`
**Feature flag**: `Tournaments`, default off
**Acceptance**: `bjjeire-tests/specs/features/tournaments.md`
**Requirements**: `bjjeire/requirements` · epic `&11` (`#5001`–`#5042`, provisional)
**Decisions**: [ADR-0012](../../docs/adr/0012-competitor-identity-second-issuer.md), [ADR-0013](../../docs/adr/0013-stripe-hosted-checkout-and-webhooks.md)

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

- **Public pages.** `/tournaments` lists published, finished and cancelled tournaments, earliest day first, with name search. Each card shows the day, venue, fee in euro, number of divisions and a badge: the registration state (Not open yet, Open, Closed, Full), or Cancelled / Finished. `/tournaments/:slug` shows the details, the registration window in Irish time whatever the visitor's time zone, places taken when there is a limit, one sentence on registration, the description, and the divisions grouped by discipline and gender. A draft or unknown slug shows "Tournament Not Found" with a link back to the list. No page offers a sign-up yet; that is slice 3.
- **Registration state** is worked out by the API at each request from the window and places: before it opens `NOT_OPEN`, from opening until just before closing `OPEN` (or `FULL` when every place is taken), from the closing instant `CLOSED`. A draft, cancelled or finished tournament is always `CLOSED`.
- **Organiser screens.** `/admin/tournaments` and `/admin/tournaments/:id` sit behind the same flag and ask for the existing organiser (workforce) sign-in before loading anything; they are not in the site navigation. The list shows every tournament with its status. The form takes name, web address name (slug), day, venue, fee in euro, registration open and close times on an Irish clock, an optional competitor limit and a description, and checks them before sending. Divisions are added with a generator: tick disciplines, genders, age categories and belts, type weight classes, and one division is added per combination, skipping any the tournament already has; rows can be removed. Save sends the full division list. Publish is available on a saved draft with at least one division and is held back while there are unsaved changes. A finished or cancelled tournament is shown read-only. In the local Docker stack the organiser signs in without a Microsoft account ([ADR-0014](../../docs/adr/0014-local-organiser-sign-in.md)).
- **Rules the API enforces.** Slug: lowercase letters, digits and single hyphens, unique, and not `admin`. Venue name required (≤ 100), address ≤ 200, map coordinates optional but a valid `[longitude, latitude]` point when sent. Name ≤ 120, description ≤ 4000, fee ≥ 0 cents, limit ≥ 1 or none. Each division is a different combination of discipline, gender, age category, belt and weight class (weight class compared without case or outer spaces); saved divisions keep their ids. Publishing needs a division and a window that closes after it opens and by the end of the tournament day in Ireland; a published tournament must stay that way when edited. Only a draft can be published, and the publish write itself requires a division, so an edit that empties the tournament at the same moment cannot slip through. Removing a division that still has a sign-up awaiting payment or confirmed is refused with `urn:bjjeire:division-has-signups`. An edit never touches places already taken. Every organiser write is audited and clears the tournament cache, so visitors see it on the next read. An update sends the `version` it was edited from; a save from a stale copy is refused with 409 and the organiser is told to reload, and publish is refused the same way if anything changed after it checked the tournament.
- **Test data.** The test dataset seeds three published tournaments (`acceptance-open`, `acceptance-opens-later`, `acceptance-closed`). Production has no tournament seed, and a production seeder run never writes or prunes the collection.

### User Story 6 — Existing directory stays open and read-only (P1)

1. Given a visitor who is not signed in, when they browse gyms, events, competitions and stores, then everything works as before and they are never required to sign in (`#5036`)
2. Given a signed-in competitor, when they attempt to add, edit or remove a gym, event, competition or store, then they are refused (`#5037`)
3. Given the tournament feature is switched off, when a visitor uses the site, then no tournament or account entry points are shown and the existing sections are unaffected (`#5038`)

### Access rules

| Routes | Who |
|---|---|
| `GET /api/v1/tournament`, `/{slug}` (live); `/{id}/competitor`, `/{id}/leaderboard` (later slices) | anyone |
| `GET /api/v1/tournament/admin`, `/admin/{id}`, `POST /api/v1/tournament`, `PUT /{id}`, `POST /{id}/publish` (live); `/{id}/registration` and other tournament writes (later slices) | admin (workforce token, `access_as_writer`) |
| `/api/v1/competitor/**`, `/api/v1/registration/**`, `GET /api/v1/tournament/{id}/eligible-division` | signed-in competitor (competitor-tenant token, `access_as_competitor`) |
| `POST /api/v1/registration/stripe-webhook` | no bearer token; Stripe signature (to be verified in the controller) |

The admin is not a competitor: the writer scope opens no competitor route.

## Changes outside the tournament feature

- Every route, directory included, now answers a body that is not JSON, or holds a value its field cannot take, with 400 `urn:bjjeire:bad-request`, and a method the route does not have with 405 `urn:bjjeire:method-not-allowed`. Both used to fall through to a 500 with an `errorId`. A valid request behaves as before, and in production read-only mode still answers directory writes with 405 first.

## Requirements

- **FR-001**: The organiser creates a tournament with name, date, venue, description, entry fee in euro, registration open and close times, and an optional limit on total competitors.
- **FR-002**: The organiser defines the divisions, each a combination of gi or no-gi, gender, age category, belt and weight class.
- **FR-003**: A tournament is a draft, hidden from the public, until the organiser publishes it.
- **FR-004** (in part): Published tournaments and their divisions are viewable by anyone without an account. Competitor lists and leaderboards come with later slices.
- **FR-005** (in part): Only the organiser can create, edit and publish tournaments. Cancelling a tournament and recording results come with later slices.

- **FR-014**: Competitor accounts grant no ability to change gyms, events, competitions or stores. A competitor-tenant token is granted only the competitor role; its scopes and roles never become authorities.
- **FR-037**: Gyms, events, competitions and stores remain browsable without an account, with unchanged behaviour.
- **FR-038**: The tournament and account features switch off as a whole. With the flag off every tournament, competitor and registration route answers 404 before authentication, and the SPA shows no entry point.
- Read-only mode keeps blocking directory writes. Tournament routes are exempt from it and obey the flag.

## Not built yet

User stories 2–5 (`#5006`–`#5035`, `#5039`–`#5042`): competitor accounts
and profiles, sign-up and payment, cancellation and refunds, results and
leaderboard. Cancelling and finishing a tournament also come with those slices. See
[tasks.md](../001-tournament-registration/tasks.md).
