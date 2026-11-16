# ADR-0014: Local development signs the organiser in without Entra

- **Status:** Accepted
- **Note (2026-11-16):** renamed by [ADR-0015](0015-bjjeire-competitions-inside-competitions.md). The decision stands; the feature, package, routes, flag and collections it names now use the BJJ Éire competition names.
- **Date:** 2026-11-14
- **Amended:** 2026-11-15 — local competitor sign-in (slice 2, owner's decision)
- **Applies to:** `config/LocalSignInTokens.java`, `config/RoutingJwtDecoder.java`, `config/SecurityConfig.java`, `web/LocalSignInController.java`, `bjjeire.local-sign-in.*`, `config/IssuerAwareAuthoritiesConverter.java`, `src/bjjeire-app/src/lib/admin-auth.ts`, `src/bjjeire-app/src/lib/competitor-auth.ts`, `VITE_APP_LOCAL_SIGN_IN`, `docker-compose.override.java-local.yml`, `src/bjjeire-app/Dockerfile`

## Context

The tournament admin screens (`/admin/tournaments`) need the organiser's token
(ADR-0012). Locally there is no working Entra app registration, so the
screens could not be used or checked at all: the owner could not try slice 1
in Docker. Integration tests replace the decoder with a stub, which proves
the rules but not the running stack.

## Decision

A third token issuer, `https://local-sign-in.bjjeire.invalid`, exists only in
local development.

- **API.** With `bjjeire.local-sign-in.enabled=true`, `POST /api/v1/local-sign-in`
  issues an 8-hour HS256 token (subject `local-organiser`, the writer scope),
  and `RoutingJwtDecoder` sends that issuer to a decoder that checks the
  signature against `bjjeire.local-sign-in.secret`, the issuer and the expiry.
  The token then goes through the normal workforce mapping and every rule in
  `SecurityConfig`: it is an organiser, never a competitor.
- **Guard.** `SecurityConfig` calls `LocalSignInTokens.requireSafe`: the API
  refuses to start with local sign-in on unless `local` is the only active
  Spring profile and the secret is at least 32 bytes. The controller also needs that
  profile and is `@Hidden` from the published OpenAPI document.
- **SPA.** `lib/admin-auth.ts` is the only place that obtains the organiser
  token. With `VITE_APP_LOCAL_SIGN_IN=true`, baked in at build time
  (ADR-0006), it calls the endpoint and keeps the token in `sessionStorage`;
  otherwise it uses MSAL as before. The API client and the admin sign-in gate
  both go through it.
- **Where it is on.** Only `docker-compose.override.java-local.yml` sets
  `LOCAL_SIGN_IN_ENABLED`, `LOCAL_SIGN_IN_SECRET` and the
  `VITE_APP_LOCAL_SIGN_IN` build argument. `application.yml` and the
  Dockerfile default to off; CI, the image builds and gitops set none of them.

## Consequences

- Anyone who can reach a local API with it on can act as the organiser. That
  is the point locally and would be a full compromise anywhere else, which is
  why the guard fails startup instead of logging a warning. The guard needs
  `local` to be the only active profile, and the local override publishes the
  API port on `127.0.0.1` only, so other machines on the developer's network
  cannot reach it.
- An SPA built with the flag by mistake gets nothing from a real API: the
  endpoint does not exist there, so sign-in fails and the screens stay locked.
- The local organiser token cannot reach competitor routes (`LocalSignInIT`),
  so it does not stand in for competitor accounts. Slice 2 added a separate
  local competitor issuer for that (see the amendment below).
- Removing the guard, or setting `SPRING_PROFILES_ACTIVE=local` in a cluster,
  makes the API issue organiser tokens to anyone who asks.

## Amendment 2026-11-15: local competitor sign-in

Slice 2 (competitor profile) has the same problem as slice 1: the external
competitor tenant does not exist yet (tasks.md T001), so no competitor screen
could be used locally. The owner chose to extend this record rather than add a
local identity provider.

- **Second local issuer.** `https://local-competitor-sign-in.bjjeire.invalid`
  (`LocalSignInTokens.COMPETITOR_ISSUER`). Under the same guard and switches,
  `POST /api/v1/local-sign-in/competitor` with `{ "email": "…" }` issues an
  8-hour HS256 token: subject `local-competitor:` plus the SHA-256 of the
  lower-cased email (the same email is always the same competitor, and no
  email lands in `DeletedCompetitor` or the audit log; after deleting the
  account, signing in again with the email starts a new, empty account), claims `email`, `oid`
  (the subject) and the competitor scope. The local decoder accepts both local
  issuers; `RoutingJwtDecoder` sends both to it.
- **Mapping.** Where local sign-in is on, `SecurityConfig.competitorIssuers`
  adds this issuer to the competitor tenant's. `IssuerAwareAuthoritiesConverter`
  then grants it `ROLE_COMPETITOR` and nothing else, and `SecurityConfig`
  treats its principals as competitors, never as workforce accounts. The
  organiser issuer still gets only the workforce mapping. Where local sign-in
  is off, the competitor issuer is unknown and goes to the workforce decoder,
  which rejects it.
- **SPA.** `lib/competitor-auth.ts` is the only place that obtains the
  competitor token. With `VITE_APP_LOCAL_SIGN_IN=true` the sign-in gate asks
  for an email and calls the endpoint, keeping the token in `sessionStorage`
  under its own key; otherwise it uses the competitor tenant's MSAL instance.
- **Consequence.** Anyone who can reach a local API with it on can act as any
  competitor, by typing their email. Same reasoning and guard as for the
  organiser token. `LocalSignInIT` proves a local competitor cannot reach
  organiser routes or directory writes.

## Alternatives considered

- **A fixed bearer string accepted in local mode.** Simpler, but it skips
  signature and expiry checks, so the local stack would not exercise the real
  decoder path at all.
- **A local OIDC provider container (Keycloak, a mock OAuth server).** Closest
  to production, but another service and configuration in every local stack.
  Worth revisiting if competitor sign-in needs the same treatment.
- **Point local at a real dev Entra tenant.** Needs app registrations and
  secrets on every machine; the owner asked for local access without a real
  token.
