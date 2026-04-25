# BjjEire — Claude Instructions

Keep this file short and broad. Put only always-on project instructions here, and use `.claude/rules/`, `.claude/commands/`, and future `.claude/skills/` entries for narrower guidance.

## Project Overview

Full-stack BJJ directory for Ireland:

- Clean Architecture .NET 9 API
- React 19 + TypeScript SPA
- MongoDB-backed data and seeding tools

## Repo Layout
```text
BjjEire.sln
src/
  BjjEire.Domain/
  BjjEire.Application/
  BjjEire.Infrastructure/
  BjjEire.Api/
  BjjEire.Seeder/
  bjjeire-app/
tests/
docker-compose.yml
```

## High-Signal Shared Rules

- Clean Architecture only: `Domain -> Application -> Infrastructure -> Api`
- Infrastructure code belongs in feature folders, not flat service folders
- Controllers call `_mediator.Send(...)`; use MediatR handlers for application use cases
- Frontend list endpoints use `usePaginatedQuery`
- All user-visible strings live in `src/bjjeire-app/src/config/ui-content.ts`
- Dark theme only
- TDD first for both frontend and backend
- GeoJSON coordinates are `[longitude, latitude]`

## Standard Commands
```bash
# .NET
bash build-dotnet.sh
dotnet build
dotnet test --filter "Category=Unit"
dotnet test --filter "Category!=Ignore"
dotnet run --project src/BjjEire.Api

# React
cd src/bjjeire-app
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

Frontend verification order: `lint -> typecheck -> test`

## Where Detailed Guidance Lives

- `.claude/rules/dotnet.md`
- `.claude/rules/react.md`
- `.claude/rules/testing.md`
- `.claude/rules/api.md`
- `.claude/rules/mongodb.md`
- `.claude/rules/security-*.md`
- `.claude/commands/*.md` for repeatable workflows like `add-feature`, `lint`, `test`, and `review`
- Prefer `.claude/skills/` for optional domain knowledge or workflows that should not load every session

## Coordination With Codex

`AGENTS.md` is the Codex-facing version of the shared repo rules. Keep shared conventions aligned between the two top-level files, and keep tool-specific detail in the tool-specific locations.
