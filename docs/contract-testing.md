# Contract Testing Strategy

BJJ Eire uses layered contract testing. Each layer catches a different type of API drift, so no single test suite has to do everything.

## Goals

- Keep the BjjEire API compatible with the frontend and future external consumers.
- Catch breaking API changes before production.
- Validate both the published OpenAPI document and real container/staging API responses.
- Keep Pact consumer tests close to the consumer code that owns the expectations.

## Layers

| Layer | Location | Runs | Fails When |
|---|---|---|---|
| OpenAPI provider contract | `tests/BjjEire.Api.IntegrationTests/OpenApiContractTests` | API CI | API stops publishing expected paths, schemas, fields, response envelopes, or ProblemDetails contracts |
| OpenAPI breaking-change check | `.github/workflows/ci-pr.yml` | PR CI | PR OpenAPI spec introduces a breaking change versus base branch |
| Frontend generated API types | `src/bjjeire-app/src/types/generated` | PR CI | Generated OpenAPI types no longer satisfy frontend DTO/type expectations |
| Frontend Pact consumer tests | `src/bjjeire-app/src/contracts/pact` | Frontend PR CI | Frontend changes its expected HTTP contract or cannot generate valid pacts |
| Docker OpenAPI acceptance contracts | `bjjeire-tests/tests/contract` | Merge to `main` via Docker Compose smoke gate | Running container API responses do not match the downloaded OpenAPI document |
| Future external Pact provider verification | `bjjeire-tests/src/contracts/pact/verify-provider-pacts.cjs` | Disabled until another consumer exists | Running BjjEire API does not satisfy another app's published pacts |

## Current Workflow

1. API PRs run .NET OpenAPI contract tests.
2. API PRs publish `openapi-v1.json` as an artifact.
3. API PRs compare base versus current OpenAPI specs with `oasdiff`.
4. Frontend PRs regenerate OpenAPI TypeScript types and run `tsc`.
5. Frontend PRs run Pact consumer tests with `npm run test:pact`.
6. Merge to `main` runs `bjjeire-tests` against Docker Compose with `@smoke|@contract`.
7. The Docker test workflow downloads `/openapi/v1.json`, lints it with Spectral, mounts it into the test container, and validates live API responses.
8. After the Docker contract gate passes, CI publishes durable contract artifacts to GHCR:
   - `ghcr.io/<owner>/bjjeire-openapi-contract:{sha|main|latest}`
   - `ghcr.io/<owner>/bjjeire-web-pacts:{sha|main|latest}`

## Pact Ownership

Pact consumer tests belong with the consumer:

- BjjEire Web pacts live in `src/bjjeire-app/src/contracts/pact`.
- A future external app should keep its own Pact tests in that app's repo.
- `bjjeire-tests` only owns provider verification against a running BjjEire API.

This keeps consumer expectations near the code that uses the API and keeps `bjjeire-tests` focused on real deployment/container acceptance.

## Future External Consumers

When another app consumes the BjjEire API:

1. Add Pact consumer tests in that app.
2. Publish pact JSON as a pipeline artifact, release asset, GHCR/OCI artifact, direct URL, or Pact Broker contract.
3. Enable provider verification in the BjjEire Docker acceptance workflow.

The reusable `bjjeire-tests` workflow already supports both direct pact URLs and Pact Broker configuration.

Direct pact URL example:

```yaml
with:
  verify_provider_pacts: true
  pact_urls: |
    https://example.com/pacts/OtherApp-BjjEireApi.json
```

Pact Broker example:

```yaml
with:
  verify_provider_pacts: true
  pact_broker_url: ${{ vars.PACT_BROKER_URL }}
secrets:
  PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
```

Only enable those inputs after the updated `bjjeire-tests` reusable workflow is merged to `main`, because GitHub validates reusable workflow inputs against the referenced branch.

## Pact Broker vs Artifacts

Start with artifacts or direct pact URLs if there are only one or two consumers.

Use a Pact Broker when you need:

- multiple independent consumers,
- `can-i-deploy` decisions,
- pending/WIP pact support,
- provider verification history,
- clear deployment compatibility tracking.

The current setup supports direct pact URLs now and can move to a Pact Broker later without changing the test ownership model.

## Pulling Contracts from GHCR

The main delivery workflow publishes contracts as OCI artifacts in GHCR after the Docker smoke/contract gate passes.

Pull the current OpenAPI contract:

```bash
oras pull ghcr.io/ianoflynnautomation/bjjeire-openapi-contract:main -o contracts/openapi
```

Pull the current BjjEire Web Pact contract:

```bash
oras pull ghcr.io/ianoflynnautomation/bjjeire-web-pacts:main -o contracts/pacts
```

A future app can use the OpenAPI artifact to generate/check its API client types, and can publish its own Pact contract for BjjEire provider verification.

## Route Constants

API route strings are centralized:

- Frontend: `src/bjjeire-app/src/config/api-routes.ts`
- Acceptance tests: `bjjeire-tests/src/api/support/api/routes.ts`

Update those files first when a route changes, then regenerate OpenAPI types and run the contract suites.
