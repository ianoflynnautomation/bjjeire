# ADR-0012: Competitor identity is a second token issuer

- **Status:** Accepted
- **Date:** 2026-11-13
- **Applies to:** `src/bjjeire-api/src/main/java/com/bjjeire/api/config/SecurityConfig.java`, `config/RoutingJwtDecoder.java`, `config/BackoffJwtDecoder.java`, `config/IssuerAwareAuthoritiesConverter.java`, `common/ApiRoutes.java`, the `competitor` and `registration` packages, `src/bjjeire-app/src/lib/msal-config.ts`
- **Amends:** constitution principle V (1.0.0 → 1.1.0)

## Context

Until now the API had one kind of authenticated caller: the admin, signed in
through the workforce Entra tenant, holding the `access_as_writer` scope.
Everything else was a public read. Principle V of the constitution recorded
that as "public reads, authenticated writes".

In-house tournaments ([specs/001-tournament-registration](../../specs/001-tournament-registration/spec.md))
need members of the public to hold accounts, keep a private profile, and
create and cancel their own sign-ups. Those are writes by people who must
never be able to change the directory.

## Decision

Competitor accounts live in a separate Microsoft Entra External ID tenant.
The API stores no credentials. It accepts access tokens from exactly two
issuers:

- the workforce issuer (`spring.security.oauth2.resourceserver.jwt.issuer-uri`),
  mapped to authorities as before;
- the competitor issuer (`bjjeire.competitor-auth.issuer-uri`), which is
  granted `ROLE_COMPETITOR` when the token carries the competitor scope
  (`bjjeire.competitor-auth.scope`) and **nothing else**. Scopes and roles in
  a competitor-tenant token are never turned into `SCOPE_*` or other `ROLE_*`
  authorities.

`RoutingJwtDecoder` reads the unverified `iss` claim only to choose which
decoder validates the token. Each decoder checks signature, issuer and
audience for its own tenant. `IssuerAwareAuthoritiesConverter` maps
authorities from the validated token's issuer.

In `SecurityConfig` the competitor matchers sit above the unchanged catch-all
"POST, PUT, PATCH and DELETE require the writer authority". A competitor
token therefore fails every directory write without any per-route rule.

The fallback rule `anyRequest()` used to be "authenticated", which meant a
workforce account. It is now "a workforce account" explicitly, so a
self-registered competitor does not inherit whatever that rule protects (the
actuator metrics endpoints today).

No token is sent to the competitor tenant while the `Tournaments` flag is
off. Any failure to reach that tenant, at discovery or when fetching keys, is
reported as an invalid token (401), never as a server error, and a failed
discovery is not retried for 30 seconds (`BackoffJwtDecoder`).

Competitor routes require a principal from the competitor issuer that holds
`ROLE_COMPETITOR`. A workforce account carrying an app role named
`COMPETITOR` does not qualify.

A competitor is identified by the pair (`iss`, `sub`). Competitor routes act
only on the caller's own profile and sign-ups.

## Consequences

- The directory stays admin-only by construction. Removing the catch-all, or
  mapping competitor-tenant scopes through the generic scope converter, would
  let a member of the public who can obtain a scope named `access_as_writer`
  in their own tenant write to the directory.
- The external tenant, its app registrations and its sign-up flow are
  provisioned in `bjjeire-terraform-azurerm-aks`, not here. Until they exist
  the configuration holds an all-zero placeholder tenant, and no real
  competitor token can validate.
- Integration tests keep using the stubbed `JwtDecoder` bean; the stub sets
  the `iss` claim to choose which tenant a token appears to come from. No
  audience is checked there; `CompetitorTokenValidatorTest` covers that.
- Deleting an account requires removing the user from the external tenant,
  which needs an application credential for Microsoft Graph in that tenant.
  That is the only place the API holds write access to an identity store.

## Alternatives considered

- **Accounts built into the API** (hashed passwords, sessions, reset tokens).
  The most security-sensitive code in the feature; rejected by the owner.
- **Emailed sign-in links.** No passwords, but every sign-in depends on mail
  delivery.
- **One tenant with app roles for both audiences.** Puts members of the public
  in the workforce tenant.
- **Spring's `JwtIssuerAuthenticationManagerResolver`.** It bypasses the
  `JwtDecoder` bean, which the integration tests replace, and it would not by
  itself stop competitor-tenant scopes becoming authorities.
