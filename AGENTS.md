# BjjEire — Agent Instructions

## Build & Test Commands

### .NET
```bash
# Full pipeline (format → restore → build → unit tests)
bash build-dotnet.sh

# Individual steps
dotnet build
dotnet test --filter "Category=Unit"          # unit tests only
dotnet test --filter "Category!=Ignore"        # all tests
dotnet run --project src/BjjEire.Api           # run API
```

### React
```bash
cd src/bjjeire-app
npm run lint                                   # ESLint --fix --max-warnings 0
npm run typecheck                              # tsc --noEmit
npm test                                      # vitest unit tests
npm run test:integration                       # integration tests
npm run build                                  # tsc + Vite build
```

## Verification Order
`lint → typecheck → test` — always run lint and typecheck before considering frontend work done.

## Architecture

- **Clean Architecture**: Domain → Application → Infrastructure → API (no reverse dependencies)
- **MediatR**: All use cases are `IRequest<T>` handlers. Controllers call `_mediator.Send(...)`
- **HybridCache**: Invalidation uses tag-based `RemoveByTagAsync`. See `CacheKey` constants.
- **Feature folders**: Infrastructure code lives in `Infrastructure/Features/<Domain>/`, not flat `ExternalServices/`
- **GeoJSON**: Coordinates are `[longitude, latitude]` (not lat/lng)

## Frontend Conventions

- Imports use `@/` alias (maps to `src/`). Same-folder imports stay relative.
- Components: `memo(function ComponentName())` pattern — gives automatic displayName.
- All user-visible strings in `src/config/ui-content.ts` — never hardcode UI text.
- Dark theme only: `class="dark"` on root. Never add light backgrounds to `PageLayout`.
- Data test IDs defined in `src/constants/*DataTestIds.ts` — always use the constant, never inline strings.
- CVA variants live in `src/lib/` — not co-located with components.
- Pagination: all list endpoints use `usePaginatedQuery`. Never fetch without pagination params.

## Testing

- **TDD**: Write the test first, then implementation.
- `useSearchParams` requires `MemoryRouter` from `react-router` (not `react-router-dom`).
- Wrap nullable array defaults in `useMemo(() => data ?? [], [data])` to avoid exhaustive-deps errors.
- `useEffect` cleanup functions need explicit return type: `(): (() => void) => { ... }`

## Seeder

- `"isAvailable"` in JSON must be `false` not `null` — `TrialOffer.IsAvailable` is non-nullable bool.
- Run: `dotnet run --project src/BjjEire.Seeder`
- Dry-run: `dotnet run --project src/BjjEire.Seeder -- --dry-run`
- Stable ObjectIds: `python3 -c "from bson import ObjectId; print(ObjectId())"`

## Secrets & Config

- `.env` required — copy from `.env.example`
- `secrets/` directory with `cert_password.txt` and `mongodb_password.txt`
- `VITE_APP_*` vars baked in at Docker build time — not runtime

## Versioning

- API uses MinVer with `api-v` prefix (e.g., `api-v1.2.3`)
- Frontend uses `frontend-v` prefix
- Conventional Commits enforced: `feat:` (minor), `fix:` (patch), `feat!:` (major)

## Key Files

- `CLAUDE.md` — full project conventions (read this first)
- `.claude/commands/` — scaffold commands (add-feature, add-gym, lint, test, review)
- `.claude/rules/` — detailed rules for dotnet, react, mongodb, api, security, etc.
