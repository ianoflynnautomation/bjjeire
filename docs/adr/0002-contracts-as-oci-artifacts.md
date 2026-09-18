# ADR-0002: Publish OpenAPI and Pact contracts to GHCR as OCI artifacts

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `ci-pr.yml`, `ci-main.yml` (`publish_contracts_ghcr`), `src/bjjeire-app/src/contracts/`

## Context

The SPA and the API are built, tested, and released independently but must stay
compatible. Two things can drift: the API's HTTP surface, and the SPA's
assumptions about it.

Detecting that drift needs a stored, versioned baseline to compare against.
The usual answer is a Pact Broker — another service to run, secure, back up,
and pay for.

GHCR already holds this project's images, already authenticates with
`GITHUB_TOKEN`, and supports arbitrary OCI artifacts.

## Decision

Both contracts are generated in CI and published to GHCR as OCI artifacts:

| Contract | Produced by | Image | Artifact type |
|---|---|---|---|
| OpenAPI spec | `OpenApiContractIT` (springdoc) | `ghcr.io/<owner>/bjjeire-openapi-contract` | `application/vnd.bjjeire.openapi.v1` |
| Pact consumer contract | `npm run test:pact` | `ghcr.io/<owner>/bjjeire-web-pacts` | `application/vnd.pact.consumer-contract` |

Each is tagged `<sha>`, `main`, and `latest`.

The OpenAPI spec is produced by an **integration test against the running
app**, not by static analysis of annotations, so the published spec is the one
the application actually serves.

Three checks consume it:

1. **`check_openapi_breaking`** (PR) — compares the branch's spec against the
   last published contract. Blocks the merge.
2. **`check_frontend_api_compat`** (PR) — downloads the spec into the SPA,
   regenerates TypeScript types with `gen:api-types:ci`, and runs
   `tsc --noEmit`. Catches an API change that would break the SPA before either
   side merges.
3. **The gate again in `publish_contracts_ghcr`** (main) — refuses to publish a
   breaking spec as the new baseline.

## Consequences

- No broker to operate. Contract storage inherits GHCR's authentication,
  retention, and availability.
- The baseline is immutable and addressable by commit SHA, so any historical
  comparison is reproducible.
- **The gate runs twice on purpose.** The PR check is fast feedback; the main
  check is what actually prevents a breaking spec from becoming the baseline
  every future PR is measured against. Removing the main-side gate would let
  one merge quietly redefine "not breaking".
- A deliberate breaking change requires a deliberate action — accepting the
  gate failure — rather than passing silently.
- **The first publish has no baseline**, so the gate is vacuous until one
  exists. A fresh fork or a renamed package starts with no protection.
- OCI artifacts are less discoverable than a broker UI. There is no web view of
  contract history; inspection means `oras pull` or the GHCR package page.
- Pact verification here is consumer-side only. The API does not currently
  verify the published pact in its own build.

## Alternatives considered

- **PactFlow or a self-hosted Pact Broker.** Purpose-built, with a UI,
  can-i-deploy, and webhooks. Rejected on operational cost for a
  single-maintainer project — it is a service to run and secure for a benefit
  GHCR already provides.
- **Commit the spec to the repository and diff it in review.** Free, but a
  reviewer has to notice the break, and generated specs produce noisy diffs.
- **Generate the spec from annotations statically.** Faster than booting the
  app, but the artefact is then what the annotations claim rather than what the
  app serves.
