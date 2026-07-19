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
- Thin controllers: inject the feature service only, no repositories
- Dual route casing: `@RequestMapping({"/api/v1/Gym", "/api/v1/gym"})`
- Queries return DTOs (never domain entities directly); writes accept command records
- `[FromQuery]`-style pagination/filter params bind via `PaginationRequest`

## Pagination
- All list endpoints accept `page` (1-based) and `pageSize` query params
- Response envelope: `PagedResponse<T>` built via `PagedResponses`

## Auth
- Public read endpoints require no auth; write operations require `Authorization: Bearer {token}` (see `SecurityConfig`)

## Error Handling
- `web.ApiExceptionHandler` (`@RestControllerAdvice`) returns `ProblemDetail` with `urn:bjjeire` types, an `errors[]` array for validation failures, a `traceId` extension, and an `errorId` on unexpected 500s
- Do not add per-controller exception handling

## OpenAPI Contract
- The served `/v3/api-docs` spec is exported in CI for a breaking-change gate and frontend type generation
- DTO/command/response/domain class names are OpenAPI schema names — renaming them is a breaking API change

## Configuration
- `application.yml` defaults; environment variables override
- Typed config via `@ConfigurationProperties` records in `config/` (`BjjEireProperties`, etc.), registered by `@ConfigurationPropertiesScan`
