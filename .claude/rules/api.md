---
description: Spring Boot API conventions, endpoints, and error handling
paths:
  - src/bjjeire-api/
---

# API Conventions

## Package Layout (package-by-feature)

`com.bjjeire.api` contains one flat package per feature plus shared packages:

- `event/`, `gym/`, `competition/`, `store/`, and for BJJ Éire merch `product/`, `order/` (ADR-0016) — each holds its controller, service, DTOs, validators, mappers, domain model, enums, repository, and feature-specific deactivator
- `common/` — pagination (`PaginationRequest`, `PagedResponse`, `PagedResponses`), `ApiCache`, `UriService`, shared value types (`Location`, `GeoCoordinates`, `SocialMedia`, `County`), and what registration and the shop both use: mail (`Mailer`, `MailMessage`, `RetryingMailSender`, `MailConfig`) and Stripe (`StripeSecrets`, `StripeSignature`, `StripeMetadata`)
- `audit/` — audit log entry/action, `AuditRecorder`, `AuditLogRepository`, security-context audit info
- `deactivation/` — generic sweep infrastructure (`Deactivator`, `PeriodicDeactivationScheduler`, Mongo leader election)
- `web/` — cross-feature endpoints (`DonateController`, `FeatureFlagController`, `OperationalEndpointController`) and `ApiExceptionHandler`
- `config/` — Spring configuration, security filters, `@ConfigurationProperties` records, Mongo config/index initializer
- `seeder/` — one-shot CLI data seeder (profile `seeder`)

New feature code goes in its feature package. Only put code in `common/` when two or more features need it.

## Controller Pattern
- Thin controllers: inject the feature service interface only, no repositories
- The use-case contract is an interface in the feature package (`GymService`). The Spring bean is `GymServiceImpl` in that same package. Do not add a `service/` package or a ports layer. `UriService` and `SeederService` follow the same split
- Routes are the singular lowercase constants in `common.ApiRoutes` (`/api/v1/gym`, `/api/v1/bjjevent`, `/api/v1/competition`, `/api/v1/store`, `/api/v1/featureflag`, for BJJ Éire competitions `/api/v1/bjjeire-competition`, `/api/v1/competitor`, `/api/v1/registration`, and for BJJ Éire merch `/api/v1/product`, `/api/v1/order`). Do not add a second PascalCase alias
- One public version, `/api/v1`. Extend a resource with optional fields. Do not publish a second copy of it
- Queries return DTOs (never domain entities directly); writes accept command records that wrap the read DTO
- Enum wire values are PascalCase (`Upcoming`, `OpenMat`, `PendingApproval`). Do not switch them to `UPPER_SNAKE`. Exception: the BJJ Éire competition feature (`bjjeirecompetition`, `competitor`, `registration`) uses the `UPPER_SNAKE` values its contract fixes (`DRAFT`, `NO_GI`, `NOT_OPEN`, `MASTER_1`; `specs/stc/competitions/contract.yaml`). The merch contract (`product`, `order`; `specs/stc/shop/contract.yaml`) uses `UPPER_SNAKE` too (`RASHGUARD`, `AWAITING_PAYMENT`; ADR-0016). They are published; changing either family is a breaking change
- Pagination query params bind to `common.PaginationRequest`. Path ids take `@ValidObjectId`

## Pagination
- All list endpoints accept `page` (1-based) and `pageSize` (1–100, default 20). A `pageSize` outside that range is not an error: it falls back to 20
- Response envelope: `PagedResponse<T>` built via `PagedResponses`
- `pagination` fields: `totalItems`, `currentPage`, `pageSize`, `totalPages`, `hasNextPage`, `hasPreviousPage`, `nextPageUrl`, `previousPageUrl`

## Writes
- Gym, event and BJJ Éire competition updates are `PUT` of the full resource plus `version`. A stale version is 409 (a missing one is 409 for gyms and events, 400 for BJJ Éire competitions). Do not replace that with `PATCH`
- There is no `Idempotency-Key`. Create without an id inserts again. The same id again is 409 and does not replay 201. A second delete is 404. Say so on the operation description
- `GeoCoordinates.latitude` and `longitude` are derived and omitted when the pair is absent. SPA handwritten types must not require a field the served schema omits. `src/types/generated` is the CI check; feature clients keep their handwritten types

## Auth
- Public read endpoints require no auth; write operations require `Authorization: Bearer {token}` (see `SecurityConfig`)
- Two token issuers (ADR-0012). The workforce tenant is the admin (`access_as_writer`). The competitor tenant gets `ROLE_COMPETITOR` and nothing else; never map a competitor-tenant scope or role to an authority. `/api/v1/competitor/**` and `/api/v1/registration/**` need a competitor-tenant principal with that role, BJJ Éire competition admin routes need the writer scope, and the catch-all still sends every other write to the writer scope
- `anyRequest()` means a workforce account, not any valid token. A competitor token does not satisfy it
- `POST /api/v1/registration/stripe-webhook` (ADR-0013) and `POST /api/v1/order/stripe-webhook` (ADR-0016) are the webhooks: writes with no bearer token, each verified with `common.StripeSignature` against its own secret. Every Checkout Session and Refund sets `metadata.bjjeireKind` (`common.StripeMetadata`); each webhook acknowledges and skips the other's kind without recording it
- BJJ Éire merch guests (ADR-0016): `POST /api/v1/order` and `POST /api/v1/order/{id}/checkout` need no token, and `GET /api/v1/order/{id}` checks the `X-Order-Key` header in the controller, answering 404 when it is wrong. The catalogue reads are public. `/api/v1/product/admin/**` and `/api/v1/order/admin/**` need the writer scope; those rules come before the public `/product/*` and `/order/*` patterns in `SecurityConfig.merchRules`, which would otherwise match `/admin`
- Local development only: `POST /api/v1/local-sign-in` issues an organiser token when `bjjeire.local-sign-in.enabled` is true (ADR-0014). The API refuses to start that way unless `local` is the only active profile, and the local stack publishes the API on `127.0.0.1` only. `POST /api/v1/local-sign-in/competitor` issues a competitor token for a typed email under the same guard; its issuer (`LocalSignInTokens.COMPETITOR_ISSUER`) gets `ROLE_COMPETITOR` and nothing else, exactly like the competitor tenant. Never enable either in a cluster, and never map the organiser issuer to anything but the workforce rules

## Cross-cutting filters (`config/`)
- `ReadOnlyModeFilter` answers every method except `GET`, `HEAD`, and `OPTIONS` with 405 while `READ_ONLY_MODE_ENABLED` is true. `application.yml` defaults it to true. `docker-compose.override.java-local.yml` turns it off. A write that returns 405 is this filter, not a missing mapping
- BJJ Éire competition routes (`/api/v1/bjjeire-competition`, `/api/v1/competitor`, `/api/v1/registration`) skip `ReadOnlyModeFilter` and are governed by the `BjjEireCompetitions` flag instead: with it off, `web.BjjEireCompetitionFeatureGateFilter` answers 404 ahead of authentication. Both use `ApiRoutes.isBjjEireCompetitionFeaturePath`, which matches the percent-decoded path
- BJJ Éire merch routes (`/api/v1/product`, `/api/v1/order`) work the same way under the `Merch` flag: `ApiRoutes.isMerchFeaturePath`, `web.MerchFeatureGateFilter` (ADR-0016). Both gates extend `web.FeatureGateFilter`
- `RateLimitFilter` is on by default (600 requests per 60 seconds, 429 on rejection). `/health` is exempt
- `SecurityHeadersFilter` sets the response security headers, including the Content-Security-Policy. Change headers there, not in a controller

## Feature flags
- The catalogue is the `web.FeatureFlag` enum. The wire name (`Gyms`, `EventsMap`) is the JSON key of `GET /api/v1/featureflag`, so renaming one is a breaking change
- Adding or removing a flag is one change in three places: the enum, the `feature-flags` block in `application.yml` (`FEATURE_*` variables), and `src/bjjeire-app/src/features/feature-flags/definitions.ts`

## Errors
- `web.ApiExceptionHandler` returns `ProblemDetail` with an `errors[]` array for validation failures, a `traceId` extension, and an `errorId` on unexpected 500s. A body that is not JSON or holds an unreadable value is 400 `urn:bjjeire:bad-request`, and a method a route lacks is 405 `urn:bjjeire:method-not-allowed`, for every route. A request Tomcat refuses before Spring sees it (an encoded NUL in the path, say) gets the same problem document from `config.ProblemErrorReportValve`, never Tomcat's HTML page. Do not add per-controller exception handling
- Every error `type` is a `urn:bjjeire:*` URI from `web.ProblemTypes`. Do not emit an RFC document URL
- `errors[].field` stays PascalCase (`Location.Address`). That casing is part of the contract
- Authentication and authorization failures are problem documents, not an empty body. `SecurityProblemHandlers` writes them. The resource-server defaults set a status and `WWW-Authenticate` and write no body. A 401 includes `WWW-Authenticate: Bearer`

## OpenAPI Contract
- The served `/v3/api-docs` spec is exported in CI for a breaking-change gate and frontend type generation
- DTO/command/response/domain class names are OpenAPI schema names — renaming them is a breaking API change

## Configuration
- `application.yml` defaults; environment variables override
- Typed config via `@ConfigurationProperties` records in `config/` (`BjjEireProperties`, etc.), registered by `@ConfigurationPropertiesScan`

## Build gate
- `mvn verify` fails on Spotless (palantir-java-format), Checkstyle, Error Prone, and Maven Enforcer. Spotless checks in the `validate` phase, so an unformatted file fails before any test runs. Fix formatting with `mvn -pl src/bjjeire-api spotless:apply`
- Run Maven through the dev container: `devcontainer exec --workspace-folder . mvn -pl src/bjjeire-api test`
