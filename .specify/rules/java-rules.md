# Java / Spring Boot rules (agents)

Apply when editing `src/bjjeire-api/`. Full narrative: `.claude/rules/api.md`,
ADR-0001, ADR-0002.

## Placement

- New types go in the feature package: `com.bjjeire.api.{gym,event,competition,store}`.
- `common/` only when two or more features need the type.
- Controllers inject the feature service only — no repositories in controllers.

## HTTP

- Dual-case routes exist historically; new mappings use `ApiRoutes` constants
  (`/api/v1/gym`, `/api/v1/bjjevent`, `/api/v1/competition`, `/api/v1/store`).
- List endpoints take `page` (1-based) and `pageSize` (max 100) and return
  `PagedResponse<T>` via `PagedResponses`.
- Reads return DTOs, never domain entities. Writes accept `*Command` records.
- Public GET; writes require Entra Bearer. Do not add per-controller
  exception handling — `web.ApiExceptionHandler` returns `ProblemDetail`.

## Domain / persistence

- `@Document(Entity.ENTITY_NAME)` — collection names are `Gym`, `BjjEvent`,
  `Competition`, `Store`, `AuditLog`.
- IDs are 24-char hex ObjectIds (`@ValidObjectId` on path variables).
- GeoJSON: `[longitude, latitude]`.
- Partial updates: typed `Update().set(...)`. Invalidate `ApiCache` tags after
  writes (`GYMS_TAG`, `BJJ_EVENTS_TAG`, `COMPETITIONS_TAG`, `STORES_TAG`).
- Indexes are declared in `MongoIndexInitializer`, not ad-hoc in repositories.

## Tests

- `*Test`: Mockito / standalone MockMvc. Method names `should{Behaviour}`.
- `*IT`: extend `testsupport.MongoIntegrationTest` (Testcontainers Mongo).
  Never mock Mongo in ITs.
- OpenAPI class names are the published schema names — renaming is breaking.

## Do not

- Introduce a layered `controller/service/repository` top-level package.
- Call Mongo from a controller.
- Add a CI job without also listing it in the aggregator (`pr_complete` /
  `main_complete`), except `atest_analyze`.
