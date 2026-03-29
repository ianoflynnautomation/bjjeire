---
description: GitHub Actions CI/CD conventions for BjjEire workflows
paths:
  - .github/
---

# GitHub Actions CI/CD

## Workflow Files
| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | push/PR to `main` | Lint, build, test all layers |
| `build-push-ghcr.yml` | push/PR to `main`, tags | Build & push Docker images to GHCR |
| `release.yml` | tags `v*.*.*` | Release pipeline |
| `cleanup-artifacts.yml` | scheduled | Clean old artifacts |
| `weekly-fetch.yml` | scheduled | Periodic data fetch job |

## Path Filters (dorny/paths-filter)
Changes are detected before running jobs — only affected layers run:
```yaml
api:
  - 'src/BjjEire*/**'
  - 'tests/**'
  - '*.sln'
  - 'Directory.*.props'
frontend:
  - 'src/bjjeire-app/**'
```
Always add new source paths to the relevant filter when adding new projects.

## CI Job Order (`ci.yml`)
```
detect-changes
  ├── lint_api          → build_dotnet_solution → run_dotnet_tests (matrix)
  └── lint_frontend     → build_frontend
                        → test_frontend_unit
                        → test_frontend_integration
                        → test_frontend_browser (Playwright container)
run_dotnet_tests → publish_reports
```

## Reusable Actions (`.github/actions/`)
All job steps are extracted into composite actions — never inline multi-step logic into `ci.yml` directly:
- `lint-dotnet` — dotnet format check
- `lint-frontend` — ESLint + typecheck
- `dotnet-build` — restore + build
- `dotnet-run-tests` — run a single test project with JUnit XML output
- `react-build-test` — npm ci + vite build
- `react-test-unit` — vitest unit config
- `react-test-integration` — vitest integration config
- `react-test-browser` — vitest browser config (runs inside Playwright container)
- `publish_reports` — uploads test result XML as GitHub check annotations

When adding a new test project or test suite, add a new composite action rather than expanding existing ones.

## Runtime Versions
Defined as top-level env vars in `ci.yml` — change in one place:
```yaml
env:
  DOTNET_VERSION: "10.x"
  NODE_VERSION: "24.x"
```

## Browser Tests
- Run in `mcr.microsoft.com/playwright:v1.58.2-noble` container (has Chromium pre-installed)
- Update the Playwright container version when upgrading `@playwright/test` or `@vitest/browser-playwright`
- Test files: `**/*.browser.test.{ts,tsx}`
- Screenshots on failure saved to `__screenshots__/` (uploaded as CI artifact)

## Docker Image Publishing (`build-push-ghcr.yml`)
- Registry: `ghcr.io`
- Images: `ghcr.io/{owner}/bjjeire-api`, `ghcr.io/{owner}/bjjeire-frontend`
- Tags: `sha-{short}`, semver on tags, `latest` on `main` push only
- Platforms: `linux/amd64,linux/arm64` (multi-arch)
- Build cache: `type=gha` (GitHub Actions cache)
- SBOM + provenance attestation enabled

## Secrets & Permissions
- `GITHUB_TOKEN` used for GHCR login — no PAT needed
- `permissions.packages: write` required on build-push jobs
- `permissions.id-token: write` for OIDC / attestation (currently commented out pending setup)
- Never hardcode secrets — use `${{ secrets.SECRET_NAME }}`

## Concurrency
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```
PRs cancel previous runs; `main` branch never cancels in-progress runs.

## Adding a New Workflow
1. Put it in `.github/workflows/{name}.yml`
2. Extract any multi-step logic into `.github/actions/{name}/action.yml`
3. Use `dorny/paths-filter` if the workflow should only run on specific path changes
4. Set `timeout-minutes` on every job
5. Set `concurrency` with `cancel-in-progress: true` for PR-triggered workflows
6. Pin action versions with full SHA or `@v{major}` tags — never `@main`
