# Quickstart: validating the merge

Run everything inside the dev container. From the host, prefix commands with
`devcontainer exec --workspace-folder .`.

## Prerequisites

- `.env` with `FEATURE_BJJEIRE_COMPETITIONS=true` (and no `FEATURE_TOURNAMENTS` left over).
- Seeder dataset `test`, so the three acceptance BJJ Éire competitions exist.
- Stripe test keys and `stripe listen` as in `docs/stripe-local.md` for the payment step. Without them, sign-up stops at 502 by design.

## 1. Automated checks

```bash
mvn -pl src/bjjeire-api test          # unit + Testcontainers ITs
cd src/bjjeire-app && npm run lint && npm run typecheck && npm test && npm run test:integration
```

Expected: green. `check_openapi_breaking` and `check_frontend_api_compat` fail
on the PR by design (ADR-0002). Every other job is green.

## 2. Old names are gone (SC-004)

```bash
rg -i tournament --glob '!docs/adr/**' --glob '!specs/001-tournament-registration/**' --glob '!CHANGELOG*' .
```

Expected: no hits, except slice 5 re-pointing notes that say "formerly tournament".

## 3. Local stack walk-through

Bring the stack up with the test dataset, then:

1. API log on startup: one line each for dropping `Tournament` and `TournamentRegistration` (or "not present"). `BjjEireCompetition` holds three seeded documents (`#3017`).
2. `GET /api/v1/bjjeire-competition` returns only `acceptance-open` and `acceptance-opens-later` (upcoming), earliest first. `acceptance-closed` is absent if its day has passed, else present (`#3006`).
3. `GET /api/v1/tournament` → 404 (`#3016`).
4. Open `/competitions`. "BJJ Éire competitions" sits above the search box. Type a directory competition's name: the featured cards stay and the listing filters (`#3006`, `#3008`).
5. Open a featured card → `/competitions/acceptance-open`. Open `/competitions/no-such-slug` → "Competition not found". Open `/tournaments` → the site's not-found page (`#3009`, `#3016`).
6. Sign in as a competitor, sign up, pay with a Stripe test card. You return to `/competitions/acceptance-open/signup/complete`, the confirmation mail in Mailpit says "competition", and the Checkout line item says so too (`#3010`, `#3011`).
7. Header: no "Tournaments" item. The account icon is present (`#3011`).
8. `/admin/competitions` with local organiser sign-in: create, publish, see it featured (`#3013`).
9. Restart with `FEATURE_BJJEIRE_COMPETITIONS=false`: no featured section, no account icon, `/competitions/acceptance-open` shows not-found, `GET /api/v1/competitor/me` → 404 without a token. The listing is unchanged (`#3014`).
10. Restart with `FEATURE_COMPETITIONS=false` and `FEATURE_BJJEIRE_COMPETITIONS=true`: `/competitions` is unavailable, but `/competitions/acceptance-open` and `/account/signups` work (`#3015`).

## 4. Acceptance (bjjeire-tests)

In the `bjjeire-tests` dev container, run the competitions suite. The folded
tournaments scenarios and the new `#3006`–`#3016` T6 scenarios pass.
