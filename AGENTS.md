# BjjEire — Agent Instructions

This is the single source of agent instructions for this repository.
`CLAUDE.md` points here — keep changes in this file.

## Read this before you change anything

Several things here look like inconsistencies and are deliberate. The reasoning
lives in [docs/adr/](docs/adr/); read the relevant record before reversing one.

| If you are touching… | Read first |
|---|---|
| Where a new backend class goes | [ADR-0001](docs/adr/0001-package-by-feature-api.md) |
| The API's HTTP surface | [ADR-0002](docs/adr/0002-contracts-as-oci-artifacts.md) — a breaking change blocks the merge |
| A CI workflow or a path filter | [ADR-0003](docs/adr/0003-path-filtered-ci-with-aggregator-gate.md) — a job not in the aggregator gates nothing |
| Image tagging or promotion | [ADR-0004](docs/adr/0004-promote-images-by-digest.md) |
| `atest_analyze` / flaky tests | [ADR-0005](docs/adr/0005-flake-analysis-is-advisory.md) — never add it to an aggregator |
| Any `VITE_APP_*` value | [ADR-0006](docs/adr/0006-vite-config-is-baked-at-image-build.md) — baked at build time, not runtime |
| Colours, themes, `PageLayout` | [ADR-0011](docs/adr/0011-light-dark-competition-themes.md) — light, dark, and competition; `PageLayout` stays transparent |
| User-visible copy or test IDs | [ADR-0008](docs/adr/0008-ui-strings-and-test-ids-are-centralised.md) |
| Test reporting jobs | [ADR-0009](docs/adr/0009-audit-report-on-every-pipeline.md) |
| Specs, `.specify/`, agentic workflows | [ADR-0010](docs/adr/0010-spec-driven-development-and-agentic-workflows.md) |
| Tests, TDD, coverage layers | [Testing Strategy](docs/testing-strategy.md) — STC overlay in `specs/stc/` |
| Acceptance tests and Playwright agents | `bjjeire-tests` owns the plans, specs and agents: see its `AGENTS.md` and `docs/agents.md` |

Architecture: [docs/architecture.md](docs/architecture.md).
Living specs: [specs/](specs/).
Constitution: [.specify/memory/constitution.md](.specify/memory/constitution.md).

## Agent layout

One instruction file, one skill tree. Harness folders are links, not copies.

- **Instructions.** This file is the single source of agent instructions. `CLAUDE.md` is an `@AGENTS.md` import so Claude Code loads this file. Edit this file only.
- **Skills.** Each skill is `.agents/skills/<name>/SKILL.md`. That directory is the copy you edit. `.claude/skills` and `.grok/skills` are symlinks to it. Codex, Cursor, and Copilot read `.agents/skills`. Claude Code reads `.claude/skills`. Grok reads both and keeps one skill per name. Do not add a root `skills/` directory, and do not replace the symlinks with copies or with a Markdown pointer.
- **Copilot / gh-aw.** `.github/skills/agentic-workflows` is a symlink to `../../.agents/skills/agentic-workflows`.
- **Rules.** Narrow rules stay in `.claude/rules/`. They are not a second copy of this file.
- **Commands.** Slash commands live once in `.claude/commands/`. Claude Code and Grok both read that directory.
- **Subagents.** Claude subagents stay in `.claude/agents/`. A Grok agent definition, if added, goes in `.grok/agents/` because the file format differs.
- **Hooks.** `.claude/settings.json` denies reads of `.env` and `secrets/` and blocks pushes to `main` and destructive git commands. `.claude/hooks/guard-edit.mjs` (PreToolUse) denies edits to generated API types, `*.lock.yml`, `.env` and `secrets/`, and denies adding `"isAvailable": null` to seeder JSON. `.claude/hooks/verify-changed.mjs` (Stop) runs targeted checks on changed sources. Hooks bind Claude Code only, including subagents. Bash writes and humans are not blocked by the edit guard.
- **Feature flow.** `/spec <feature>`, then `/clear`, then `/build-feature <spec path>`. The session building the feature does not judge it: `spec-verifier` is read-only and starts with fresh context. Agent teams stay off in settings, because enabling them makes named subagents launch as teammates.
- **Symlinks.** Relative links. macOS and Linux checkouts follow them. A Windows checkout needs `core.symlinks=true`.

## Working Style

- Inspect nearby code before changing anything. Follow existing patterns instead of inventing new structure.
- Prefer `rg` and `rg --files` for search.
- Use `apply_patch` for manual edits. Do not use destructive git commands to clean the tree.
- Never revert unrelated user changes. This repo may be dirty.
- Prefer non-interactive commands. Run the smallest useful verification for the code you changed.
- Make reasonable assumptions, but pause if a choice would change architecture, data shape, or public API.

## Project Overview

Full-stack BJJ directory for Ireland:

- Java 25 Spring Boot API in `src/bjjeire-api`
- React 19 + TypeScript SPA in `src/bjjeire-app`
- MongoDB persistence

## Verification Commands

### Java
```bash
mvn clean verify
mvn -pl src/bjjeire-api test
mvn -pl src/bjjeire-api spring-boot:run
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
- Backend: prefer targeted Maven tests first, then `mvn clean verify` when needed

## Architecture Guardrails

- The Java API is package-by-feature: one flat package per feature (`event`, `gym`, `competition`, `store`) with its controller, service, DTOs, domain model, and repository together. Shared code lives in `common`, `audit`, `deactivation`, `web`, and `config`.
- Controllers stay thin and delegate use cases to services.
- Put new backend code in its feature package, not in a shared/layered package.
- GeoJSON coordinates are `[longitude, latitude]`.

## Frontend Guardrails

- Cross-folder imports use `@/`; same-folder imports stay relative.
- Components are named functions: `export const ComponentName = function ComponentName()`. Do not wrap them in `memo`. The React Compiler (`reactCompilerPreset()` in `src/bjjeire-app/vite.base.config.ts`) memoizes components and render values. Existing `memo`, `useMemo`, and `useCallback` calls can stay; do not add new ones unless the compiler bails out of that function.
- All user-visible strings live in `src/bjjeire-app/src/config/ui-content.ts`.
- Data test IDs come from `src/bjjeire-app/src/constants/*DataTestIds.ts`.
- CVA variants live in `src/bjjeire-app/src/lib/`.
- Themes are light (bright), dark, and competition, applied by `useTheme`. Do not remove one. `PageLayout` stays transparent.
- Paginated list endpoints use `usePaginatedQuery`.

## Testing Guardrails

- TDD first: write the failing test before implementation.
- `useSearchParams` tests must use `MemoryRouter` from `react-router`.
- Nullable array defaults are `data ?? []`. The React Compiler keeps that reference stable, so do not wrap it in `useMemo`.
- `useEffect` cleanup functions need an explicit return type when returning cleanup.
- Seeder JSON must use `"isAvailable": false`, never `null`.

## Config Notes

- Development runs in the dev container. Do not install tools or start the app directly on the Mac. From the host, run checks with `devcontainer exec --workspace-folder . <command>`. A missing JDK or a Vitest startup error on the host is expected.
- `.env` is required.
- `secrets/` should contain `mongodb_password.txt`.
- `VITE_APP_*` variables are baked in at Docker build time, not runtime.

## CI Guardrails

Full detail in [docs/ci-cd.md](docs/ci-cd.md). The parts that bite:

- **Path filters gate almost every job.** If a job you expected did not run,
  check [`.github/path-filters.yml`](.github/path-filters.yml) before assuming
  the pipeline is broken. A filter that is too narrow lets a breaking change
  through untested.
- **`java_api_image` is deliberately narrower than `java_api`** — a test-only
  change runs tests without rebuilding an image.
- **Adding a job does not gate merges** until it is also in `pr_complete.needs`
  (or `main_complete.needs`). The one job that must stay out is
  `atest_analyze`.
- **Reusable workflows are SHA-pinned.** Most callers stay on
  `bjjeire-ci-templates` v1.6.2. `node-build-test.yml` is pinned to `f69cd6a`
  for the npm download cache. Bump a pin deliberately; do not float on a tag
  or `@main`.
- **Changing the API surface breaks two checks by design**:
  `check_openapi_breaking` and `check_frontend_api_compat`. Fix the SPA in the
  same pull request.
- Force the Compose smoke suite on any PR with the **`run-smoke`** label.
- AKS preview is opt-in. A person adds **`deploy-preview`**. Do not apply it
  from the type label or from CI. The dev cluster keeps three previews.
  `pr-env-validation.yml` is not part of `pr_complete`.
- Never commit secrets. Azure auth is OIDC (`id-token: write`), and
  `VITE_APP_*` values are public build arguments, not secrets.

## Release Conventions

- API version tags use `api-v*`.
- Frontend version tags use `frontend-v*`.
- Conventional Commits: `feat:`, `fix:`, `feat!:`.
- This repository publishes **images and contracts**; it does not deploy them.
  Flux does, from `bjjeire-gitops`, using the chart from `bjjeire-deploy`.
