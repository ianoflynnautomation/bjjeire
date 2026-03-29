# BjjEire — Claude Instructions

## Project Overview
Full-stack BJJ directory for Ireland. Clean Architecture .NET 9 API + React 19 SPA.

## Repo Layout
```
BjjEire.sln                  # .NET solution
src/
  BjjEire.Domain/            # Entities, value objects, no dependencies
  BjjEire.Application/       # Use cases, interfaces, MediatR handlers
  BjjEire.Infrastructure/    # MongoDB, external services (Google Places, Azure Blob)
  BjjEire.Api/               # ASP.NET Core controllers, middleware
  BjjEire.Seeder/            # DB seed tool — reads data/*.json
  bjjeire-app/               # React 19 + TypeScript SPA
tests/                       # .NET test projects (unit + integration)
docker-compose.yml           # API + MongoDB + web
```

## Build & Run Commands
```bash
# .NET
dotnet build                          # build solution
dotnet test                           # run all tests
dotnet run --project src/BjjEire.Api  # run API

# React (run from src/bjjeire-app)
npm run dev          # Vite dev server
npm run build        # tsc check + Vite build
npm run lint         # ESLint --fix --max-warnings 0
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit tests
npm run test:integration  # Vitest integration tests
npm run format       # Prettier

# Docker
docker compose --profile app up -d    # API + web
docker compose --profile mongo up -d  # MongoDB only
```

## Key Architectural Rules
- **Clean Architecture**: Domain has no outward dependencies. Application depends only on Domain. Infrastructure implements Application interfaces.
- **Feature folders**: Infrastructure code lives in `Infrastructure/Features/<Domain>/`, not flat `ExternalServices/`.
- **MediatR**: All use cases are `IRequest<T>` + handler. Controllers call `_mediator.Send(...)`.
- **HybridCache**: Cache invalidation uses tag-based removal (`RemoveByTagAsync`). Constants in `CacheKey`.
- **Pagination**: All list endpoints use `usePaginatedQuery` on the frontend. Never fetch without pagination params.

## Frontend Conventions
- All imports use `@/` alias (maps to `src/`). Local same-folder imports stay relative (`./component`).
- Components: `memo(function ComponentName())` pattern — gives automatic displayName.
- Strings: all user-visible strings in `src/config/ui-content.ts`. No hardcoded UI text.
- Dark theme only: `class="dark"` on root. Never add light backgrounds to `PageLayout`.
- Data test IDs: defined in `src/constants/*DataTestIds.ts` — always use the constant, never inline strings.
- CVA variant objects must live in `src/lib/` — not co-located with components (react-refresh rule).

## Non-Obvious Gotchas
- `useSearchParams` requires a Router context — tests must use `MemoryRouter` from `react-router` (not `react-router-dom`).
- `useMemo(() => data ?? [], [data])` — always wrap nullable array defaults in useMemo to avoid `react-hooks/exhaustive-deps` errors.
- `useEffect` callbacks need an explicit return type `(): (() => void) => { ... }` when returning a cleanup function.
- Seeder JSON: `"isAvailable"` must be `false` not `null` — `TrialOffer.IsAvailable` is non-nullable bool.
- GeoJSON coordinate order is `[longitude, latitude]`.
