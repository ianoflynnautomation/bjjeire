Scaffold a new feature following the BjjEire package-by-feature pattern.

Feature name: $ARGUMENTS

Create the following files:

**Backend** (`src/bjjeire-api/src/main/java/com/bjjeire/api/{feature}/` — one flat package):
- `{Feature}.java` — domain model (record where possible)
- `{Feature}Dto.java` — API representation
- `{Feature}Mapper.java` — domain <-> DTO mapping
- `{Feature}Service.java` — use cases, pagination via `common.PaginationRequest` / `common.PagedResponse`
- `{Feature}Repository.java` — Spring Data MongoDB repository
- `{Feature}Controller.java` — thin, `@RequestMapping({"/api/v1/{Feature}", "/api/v1/{feature}"})`, delegates to the service

**Backend tests** (`src/bjjeire-api/src/test/java/com/bjjeire/api/{feature}/`):
- `{Feature}ControllerTest.java` — MockMvc standalone with `web.ApiExceptionHandler` as controller advice
- `{Feature}ServiceTest.java`, `{Feature}MapperTest.java` — unit tests
- `{Feature}MongoRepositoryIT.java` — extends `testsupport.MongoIntegrationTest` (Testcontainers)

**Frontend:**
- `src/bjjeire-app/src/features/{feature}/api/get-{feature}s.ts`
- `src/bjjeire-app/src/features/{feature}/hooks/use{Feature}sPage.ts`
- `src/bjjeire-app/src/features/{feature}/components/{feature}-card.tsx`

Follow all existing patterns. Read a similar existing feature (`gym`) for reference before generating. Write the failing tests first (TDD).
