# Contract Testing Strategy

One document is the contract: the OpenAPI file the running API serves at
`/v3/api-docs`. CI stores that file as
`ghcr.io/<owner>/bjjeire-openapi-contract`. Every other check either compares
a new document with the last published one, generates a consumer from it, or
parses a real response with a schema that came from it.

Pact is not a second copy of that document. It records what the React app
says it needs. Acceptance tests do not restate the schema. They assert a
seeded business outcome, and they parse the body so a shape break fails
before the spec reads a missing field.

Why the artifact is an OCI image: [ADR-0002](adr/0002-contracts-as-oci-artifacts.md).
Which test layer owns which assertion: [testing-strategy.md](testing-strategy.md).

## Classify the change before writing tests

| Change | OpenAPI gate | What else must move |
|---|---|---|
| New optional field | Passes. Additive. | Seeder only if Mongo stores it. SPA types regenerate. Acceptance Zod regenerates when a test reads the field. |
| Rename, remove, or newly require a field | Fails until the break is listed or the diff is gone. | Same pull request: SPA types, Pact if the SPA required the old field, seeder, acceptance Zod. |
| Type change, including a string that becomes `string \| null` | Fails. `oasdiff` treats "became nullable" as breaking. | Same as a rename. Prefer omitting the null when the old schema said optional string. |
| Enum value renamed (`OpenMat` to something else) | Fails. The published names are the wire. | SPA enums, seeder JSON, query callers. Do not keep a private numeric code beside the name. |
| Behaviour change with the same JSON shape | Gate stays green. | `OpenApiContractIT` or an acceptance spec, depending on who can see the outcome. |

A field the Java record always sets is not required in the document until
Bean Validation or `@Schema(requiredMode = REQUIRED)` says so. Gym fields
marked `@NotNull` / `@NotBlank` are required. Competition, event, and store
fields are optional in the document unless annotated. Do not hand-maintain a
stricter schema in the SPA or in Playwright and call that the contract.

## From a field change to a green pull request

Do these in one pull request. The gate compares the branch with the last
published `:latest`, not with the base branch's files.

1. **Change the Java type that springdoc reads.** Records, enums, and
   `@Schema` annotations are what `/v3/api-docs` publishes. `OpenApiContractIT`
   boots the app and writes that response. It also seeds one gym, event,
   competition, and store and checks each public listing against the schema
   the same process just served. A serializer that emits `null` for an
   optional string fails here.
2. **Update the seeder when the Mongo document changed.** Files under
   `seeder/data` and `seeder/data-test` must use the published enum names and
   the current fields. Templates (`seeder/data/**/_template.json`) are
   skipped at runtime because their names start with `_`, but they are the
   examples in `specs/database-contracts/`. Keep them in sync anyway.
3. **Let the breaking-change job judge the document.**
   `check_openapi_breaking` runs `oasdiff` against
   `ghcr.io/<owner>/bjjeire-openapi-contract:latest`. A red log lists each
   break. An additive field does not appear. A break you intend to ship is
   one line in [`contracts/openapi-accepted-breaks.txt`](../contracts/openapi-accepted-breaks.txt),
   copied from that log. The line must contain both the location and the
   description, for example `components removed the schema 'OldDto'` or
   `GET /api/v1/gym removed the success response with the status '200'`.
   Any other break still fails the job.
4. **Update the React types from the same document.**
   `check_frontend_api_compat` runs `npm run gen:api-types:ci` and `tsc`.
   `src/bjjeire-app/src/types/generated/api-compat.ts` fails the build when a
   hand-written DTO field is not on the generated schema. Wire enums in
   `src/types/event.ts` are the published strings (`OpenMat`, `FlatRate`,
   `Upcoming`), not numbers. Factories stay typed to those DTOs.
5. **Change Pact only when the SPA's stated needs change.** Tests under
   `src/bjjeire-app/src/contracts/pact` run against Pact's mock server. They
   stay narrower than OpenAPI. `verify_pact_provider` replays that file
   against the running API in the next stage. It does not use a Pact Broker.

`publish_contracts_ghcr` on `main` runs the same `oasdiff` gate, then tags
the document `:sha`, `:main`, and `:latest`. The accepted-breaks file in the
merge commit is what allows that publish. Delete those lines in a follow-up
once `:latest` contains the new document. A line left behind keeps that
break allowed forever.

Merging a red pull request by bypassing branch protection does not publish
the new baseline. The next pull request is still compared with the old
`:latest`.

## Acceptance after the baseline moves

Acceptance lives in `bjjeire-tests`. It calls the running API and asserts
seeded outcomes: a published competition is listed, a finished one is not,
order is by start date, paging links are a distinct slice.

`get()` parses each success body with Zod generated from the served
document (`npm run gen:api-schemas` in that repo, committed as
`src/api/generated/zod.gen.ts`). Regenerate it from `GET /v3/api-docs` or
from the published artifact after this repo's contract changes, and commit
the generated file there. The tests-repo CI typechecks that file. It does
not pull GHCR on every pull request, because that would compare the suite
with the previous baseline before this pull request has published.

Acceptance does not assert "this property is a string". That is the OpenAPI
gate. It fails when the scenario can no longer see the outcome, or when the
generated parse rejects the live JSON.

## Layers

| Layer | Location | Runs | Fails when |
|---|---|---|---|
| Served document and live listing | `OpenApiContractIT` | API CI, and the export that writes `openapi-v1.json` | A public path or bearer-on-write is missing, or a seeded listing body does not match the schema that process serves |
| Breaking diff | `check_openapi_breaking`, again in `publish_contracts_ghcr` | Pull request and main | The served document breaks `:latest` and the break is not in `contracts/openapi-accepted-breaks.txt` |
| SPA compile | `check_frontend_api_compat`, `api-compat.ts` | Pull request | Regenerated types no longer typecheck, or a hand-written DTO field is not in the generated schema |
| Consumer intent | `src/bjjeire-app/src/contracts/pact` | Frontend CI, and on an API change | The SPA's Pact interaction no longer holds against the mock server |
| Provider verification | `PactProviderVerificationIT` (`-Ppact-provider`) | After the consumer pact artifact | The running API response no longer satisfies that pact |
| Acceptance parse and outcome | `bjjeire-tests` `*.api.acceptance.spec.ts` and `zod.gen.ts` | Acceptance run | Live or mocked JSON fails the generated parse, or a seeded outcome is wrong |

## Pact ownership

Pact consumer tests belong with the consumer:

- BjjEire Web pacts live in `src/bjjeire-app/src/contracts/pact`.
- A future external app keeps its own Pact tests in that app's repo.
- `verify_pact_provider` replays the web pact against the API after
  `frontend_pact` (pull request) or `generate_pact_contract` (main).
  There is no Pact Broker. A second consumer keeps its own pact file.

## Pulling the published contract

```bash
oras pull ghcr.io/ianoflynnautomation/bjjeire-openapi-contract:main -o contracts/openapi
oras pull ghcr.io/ianoflynnautomation/bjjeire-web-pacts:main -o contracts/pacts
```

Use the OpenAPI file as the input to `gen:api-types` in the SPA and to
`gen:api-schemas` in `bjjeire-tests`. Do not commit a second hand-written
copy of the document.

## Route constants

- Frontend: `src/bjjeire-app/src/config/api-routes.ts`
- Acceptance tests: `bjjeire-tests/src/api/support/routes.ts`

Change the route constant in the same pull request as the controller, then
regenerate the OpenAPI types. The breaking-change job sees a removed or
renamed path as a break.
