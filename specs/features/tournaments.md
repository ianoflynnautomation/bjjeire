# Feature: Tournaments

**Status**: In progress — slice 0 of 6 shipped (plumbing; nothing visible to visitors yet)
**Design record**: [../001-tournament-registration/](../001-tournament-registration/spec.md) (spec, plan, tasks, data model, contracts)
**Database**: `tournament.md`, `competitor.md`, `tournament-registration.md` (added with the slices that create the collections)
**API**: `/api/v1/tournament`, `/api/v1/competitor`, `/api/v1/registration`
**SPA route**: `/tournaments` (not built yet)
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

### User Story 6 — Existing directory stays open and read-only (P1)

1. Given a visitor who is not signed in, when they browse gyms, events, competitions and stores, then everything works as before and they are never required to sign in (`#5036`)
2. Given a signed-in competitor, when they attempt to add, edit or remove a gym, event, competition or store, then they are refused (`#5037`)
3. Given the tournament feature is switched off, when a visitor uses the site, then no tournament or account entry points are shown and the existing sections are unaffected (`#5038`)

### Access rules (in force; no controllers behind them yet)

| Routes | Who |
|---|---|
| `GET /api/v1/tournament`, `/{slug}`, `/{id}/competitor`, `/{id}/leaderboard` | anyone |
| `GET /api/v1/tournament/admin`, `/{id}/registration`; every tournament write | admin (workforce token, `access_as_writer`) |
| `/api/v1/competitor/**`, `/api/v1/registration/**`, `GET /api/v1/tournament/{id}/eligible-division` | signed-in competitor (competitor-tenant token, `access_as_competitor`) |
| `POST /api/v1/registration/stripe-webhook` | no bearer token; Stripe signature (to be verified in the controller) |

The admin is not a competitor: the writer scope opens no competitor route.

## Requirements

- **FR-014**: Competitor accounts grant no ability to change gyms, events, competitions or stores. A competitor-tenant token is granted only the competitor role; its scopes and roles never become authorities.
- **FR-037**: Gyms, events, competitions and stores remain browsable without an account, with unchanged behaviour.
- **FR-038**: The tournament and account features switch off as a whole. With the flag off every tournament, competitor and registration route answers 404 before authentication, and the SPA shows no entry point.
- Read-only mode keeps blocking directory writes. Tournament routes are exempt from it and obey the flag.

## Not built yet

User stories 1–5 (`#5001`–`#5035`, `#5039`–`#5042`): tournament set-up and
public pages, competitor accounts and profiles, sign-up and payment,
cancellation and refunds, results and leaderboard. See
[tasks.md](../001-tournament-registration/tasks.md).
