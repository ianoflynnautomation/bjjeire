# Quickstart: validating In-House Tournament Registration

**Date**: 2026-11-13 · Routes: [contracts/contract.yaml](contracts/contract.yaml) · Stripe: [contracts/stripe-webhook.md](contracts/stripe-webhook.md) · Data: [data-model.md](data-model.md)

How to prove the feature works end to end once it is built. This is a run
guide, not implementation. Everything runs in the dev container.

## Prerequisites

| Need | Where it comes from |
|---|---|
| `.env` and `secrets/mongodb_password.txt` | as today |
| Admin sign-in | existing workforce tenant |
| Competitor sign-in | a non-production external Entra tenant with two test users (owner provides ids) |
| Stripe test keys | owner's Stripe account, test mode: secret key in `.env` as `STRIPE_SECRET_KEY` |
| Stripe CLI | to forward webhooks locally; it prints the value for `STRIPE_WEBHOOK_SECRET` |
| Flags | `FEATURE_TOURNAMENTS=true`; leave `READ_ONLY_MODE_ENABLED=true` |

Never commit the Stripe keys. They are not `VITE_APP_*` values.

## Start

```bash
docker compose up -d                 # API on :5003, SPA on :3000, MongoDB, mail catcher
stripe listen --forward-to localhost:5003/api/v1/registration/stripe-webhook
```

## Automated checks

```bash
# API: unit, then integration against real MongoDB (Stripe and mail faked)
mvn -pl src/bjjeire-api test -Dtest='*Tournament*,*Competitor*,*Registration*,*Leaderboard*'
mvn -pl src/bjjeire-api verify -Dit.test='*Tournament*IT,*Competitor*IT,*Registration*IT,SecurityConfig*IT,OpenApiContractIT'

# SPA
cd src/bjjeire-app && npm run lint && npm run typecheck && npm test && npm run test:integration && npm run test:pact
```

Expected: all green; `OpenApiContractIT` shows only additions, so `check_openapi_breaking` passes.

## Manual scenarios

Each maps to a user story in [spec.md](spec.md). Run in order; later ones reuse earlier data.

### 1. Existing site is untouched (US6)

1. With `FEATURE_TOURNAMENTS=false`, browse gyms, events, competitions and stores signed out. **Expect**: no tournament or account links; nothing asks you to sign in.
2. Set the flag to `true` and repeat. **Expect**: same, plus a Tournaments entry.
3. With a competitor token, `POST /api/v1/gym`. **Expect**: 403. With read-only mode on and an admin token, the same call. **Expect**: 405, as today.

### 2. Admin publishes a tournament (US1)

1. Sign in as admin, open `/admin/tournaments`, create "BjjEire" with a date at least a week ahead, a venue, a fee of €20, registration open now and closing in three days, and a limit of 3.
2. Generate divisions (gi; male and female; adult; white and blue; three weight classes).
3. Open `/tournaments` signed out. **Expect**: the draft is not listed.
4. Publish. **Expect**: listed; the details page shows the fee, the window and the divisions with "registration open".

### 3. Competitor account and profile (US2)

1. Signed out, choose "Sign up" on the tournament. **Expect**: sent to the hosted register page, then returned to the sign-up.
2. Complete the profile; pick an academy from the gym directory and type an affiliation. **Expect**: saved and shown back; medals 0 / 0 / 0; no past tournaments.
3. As the second test user, request the first user's profile through the API. **Expect**: no route returns it.

### 4. Sign up and pay (US3)

1. As the first competitor, start a sign-up. **Expect**: only divisions matching gender and belt are offered.
2. Choose one, accept the public-listing and terms boxes, continue to checkout, pay with test card `4242 4242 4242 4242`.
3. **Expect**: returned to the site showing "confirmed"; a confirmation mail in the catcher; the competitor's name and academy in that division's public list; `/account/signups` shows €20.00 paid.
4. Try the same division again. **Expect**: refused, no checkout.
5. As the second competitor, reach checkout and close the tab. **Expect**: no public listing; "awaiting payment" in my sign-ups; released after the hold ends.
6. Fill the limit of 3, then try a fourth sign-up. **Expect**: "tournament full", no checkout.
7. Set a test profile's date of birth to under 18 on the day. **Expect**: refused with an explanation.

### 5. Cancel and change (US4)

1. As a confirmed competitor, change to another weight class. **Expect**: moved in the public list, no charge.
2. Cancel. **Expect**: removed from the list; "cancelled, refunded €20.00"; a refund in the Stripe test dashboard; a mail stating the refund.
3. As admin, move the closing time into the past. As another confirmed competitor, cancel. **Expect**: a warning that no refund is due; after confirming, cancelled with no refund; a mail saying so.
4. Try to change division now. **Expect**: refused, told to contact the organiser.

### 6. Results and leaderboard (US5)

1. Open the leaderboard signed out. **Expect**: "results will appear as divisions finish".
2. As admin, record gold and silver in a division with two confirmed competitors from different academies sharing one affiliation.
3. **Expect** within a minute: the podium; academy ranking 9 and 3; affiliation ranking 12.
4. Record the winner of a one-competitor division. **Expect**: podium shown, rankings unchanged.
5. Swap gold and silver. **Expect**: the rankings follow.
6. Finish the tournament. **Expect**: the top academy and top affiliation are shown as winners; each medallist's own profile shows the medal and the tournament.

### 7. Tournament cancellation

On a second published tournament with two confirmed sign-ups, cancel it as admin. **Expect**: both refunded in full and both mailed.

## Acceptance (other repo)

`bjjeire-tests/specs/features/tournaments.md` lists the T6 requirement issues from the spec's Acceptance Coverage section. Its tests run in that repository's dev container against a preview with the flag on, Stripe test mode and the test competitor accounts.
