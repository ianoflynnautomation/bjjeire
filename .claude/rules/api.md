---
description: Spring Boot API conventions, endpoints, and error handling
paths:
  - src/bjjeire-api/
---

# API Conventions

## Package Layout (package-by-feature)

`com.bjjeire.api` contains one flat package per feature plus shared packages:

- `event/`, `gym/`, `competition/`, `store/` — each holds its controller, service, DTOs, validators, mappers, domain model, enums, repository, and feature-specific deactivator
- `common/` — pagination (`PaginationRequest`, `PagedResponse`, `PagedResponses`), `ApiCache`, `UriService`, shared value types (`Location`, `GeoCoordinates`, `SocialMedia`, `County`)
- `audit/` — audit log entry/action, `AuditRecorder`, `AuditLogRepository`, security-context audit info
- `deactivation/` — generic sweep infrastructure (`Deactivator`, `PeriodicDeactivationScheduler`, Mongo leader election)
- `web/` — cross-feature endpoints (`DonateController`, `FeatureFlagController`, `OperationalEndpointController`) and `ApiExceptionHandler`
- `config/` — Spring configuration, security filters, `@ConfigurationProperties` records, Mongo config/index initializer
- `seeder/` — one-shot CLI data seeder (profile `seeder`)

New feature code goes in its feature package. Only put code in `common/` when two or more features need it.

## Controller Pattern
- Thin controllers: inject the feature service interface only, no repositories
- The use-case contract is an interface in the feature package (`GymService`). The Spring bean is `GymServiceImpl` in that same package. Do not add a `service/` package or a ports layer. `UriService` and `SeederService` follow the same split
- Routes are the singular lowercase constants in `common.ApiRoutes` (`/api/v1/gym`, `/api/v1/bjjevent`, `/api/v1/competition`, `/api/v1/store`, `/api/v1/featureflag`). Do not add a second PascalCase alias
- One public version, `/api/v1`. Extend a resource with optional fields. Do not publish a second copy of it
- Queries return DTOs (never domain entities directly); writes accept command records that wrap the read DTO
- Enum wire values are PascalCase (`Upcoming`, `OpenMat`, `PendingApproval`). Do not switch them to `UPPER_SNAKE`
- `[FromQuery]`-style pagination/filter params bind via `PaginationRequest`

## Pagination
- All list endpoints accept `page` (1-based) and `pageSize` (1–100, default 20)
- Response envelope: `PagedResponse<T>` built via `PagedResponses`
- `pagination` fields: `totalItems`, `currentPage`, `pageSize`, `totalPages`, `hasNextPage`, `hasPreviousPage`, `nextPageUrl`, `previousPageUrl`

## Writes
- Gym and event updates are `PUT` of the full resource plus `version`. A missing or stale version is 409. Do not replace that with `PATCH`
- There is no `Idempotency-Key`. Create without an id inserts again. The same id again is 409 and does not replay 201. A second delete is 404. Say so on the operation description
- `GeoCoordinates.latitude` and `longitude` are derived and omitted when the pair is absent. SPA handwritten types must not require a field the served schema omits. `src/types/generated` is the CI check; feature clients keep their handwritten types

## Auth
- Public read endpoints require no auth; write operations require `Authorization: Bearer {token}` (see `SecurityConfig`)

## Errors
- `web.ApiExceptionHandler` returns `ProblemDetail` with an `errors[]` array for validation failures, a `traceId` extension, and an `errorId` on unexpected 500s. Do not add per-controller exception handling
- Every error `type` is a `urn:bjjeire:*` URI from `web.ProblemTypes`. Do not emit an RFC document URL
- `errors[].field` stays PascalCase (`Location.Address`). That casing is part of the contract
- Authentication and authorization failures are problem documents, not an empty body. `SecurityProblemHandlers` writes them. The resource-server defaults set a status and `WWW-Authenticate` and write no body. A 401 includes `WWW-Authenticate: Bearer`

## OpenAPI Contract
- The served `/v3/api-docs` spec is exported in CI for a breaking-change gate and frontend type generation
- DTO/command/response/domain class names are OpenAPI schema names — renaming them is a breaking API change

## Configuration
- `application.yml` defaults; environment variables override
- Typed config via `@ConfigurationProperties` records in `config/` (`BjjEireProperties`, etc.), registered by `@ConfigurationPropertiesScan`
