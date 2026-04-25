# BjjEire — Codex Instructions

Keep this file short, repo-specific, and optimized for Codex. It should stand on its own for Codex use and should not depend on Claude-specific slash commands or path-scoped Claude rules being available.

## Working Style

- Inspect nearby code before changing anything. Follow existing patterns instead of inventing new structure.
- Prefer `rg` and `rg --files` for search.
- Use `apply_patch` for manual edits. Do not use destructive git commands to clean the tree.
- Never revert unrelated user changes. This repo may be dirty.
- Prefer non-interactive commands. Run the smallest useful verification for the code you changed.
- Make reasonable assumptions, but pause if a choice would change architecture, data shape, or public API.

## Project Overview

Full-stack BJJ directory for Ireland:

- .NET 9 API with Clean Architecture
- React 19 + TypeScript SPA in `src/bjjeire-app`
- MongoDB persistence

## Verification Commands

### .NET
```bash
# Full pipeline (format -> restore -> build -> unit tests)
bash build-dotnet.sh

# Targeted commands
dotnet build
dotnet test --filter "Category=Unit"
dotnet test --filter "Category!=Ignore"
dotnet run --project src/BjjEire.Api
dotnet run --project src/BjjEire.Seeder
dotnet run --project src/BjjEire.Seeder -- --dry-run
```

### React
```bash
cd src/bjjeire-app
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

### Verification Order

- Frontend: `lint -> typecheck -> test`
- Backend: prefer targeted tests first, then broader `dotnet test` coverage when needed

## Architecture Guardrails

- Clean Architecture only: `Domain -> Application -> Infrastructure -> Api`
- Infrastructure feature code belongs in `src/BjjEire.Infrastructure/Features/<Domain>/`
- Application use cases use MediatR `IRequest<T>` handlers; controllers call `_mediator.Send(...)`
- HybridCache invalidation uses tag-based `RemoveByTagAsync`; use `CacheKey` constants
- GeoJSON coordinates are `[longitude, latitude]`

## Frontend Guardrails

- Cross-folder imports use `@/`; same-folder imports stay relative
- Components use `memo(function ComponentName())`
- All user-visible strings live in `src/bjjeire-app/src/config/ui-content.ts`
- Data test IDs come from `src/bjjeire-app/src/constants/*DataTestIds.ts`
- CVA variants live in `src/bjjeire-app/src/lib/`
- Dark theme only; do not introduce light `PageLayout` backgrounds
- Paginated list endpoints use `usePaginatedQuery`

## Testing Guardrails

- TDD first: write the failing test before implementation
- `useSearchParams` tests must use `MemoryRouter` from `react-router`
- Wrap nullable array defaults in `useMemo(() => data ?? [], [data])`
- `useEffect` cleanup functions need an explicit return type when returning cleanup
- Seeder JSON must use `"isAvailable": false`, never `null`

## Config Notes

- `.env` is required
- `secrets/` should contain `cert_password.txt` and `mongodb_password.txt`
- `VITE_APP_*` variables are baked in at Docker build time, not runtime

## Release Conventions

- API version tags use `api-v*`
- Frontend version tags use `frontend-v*`
- Conventional Commits: `feat:`, `fix:`, `feat!:`

## Claude Coordination

- `CLAUDE.md` is the top-level Claude guide
- `.claude/rules/` contains detailed Claude-scoped guidance
- `.claude/commands/` contains Claude slash-command workflows
- When shared repo conventions change, update both `AGENTS.md` and `CLAUDE.md`
