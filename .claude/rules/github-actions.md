---
description: GitHub Actions CI/CD conventions for BjjEire workflows
paths:
  - .github/
---

# GitHub Actions CI/CD

## Workflow Files
| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | push/PR to `main`, tags `v*.*.*` | PR: lint/build/test. Main/tag: smoke + build_push. Chains `build-push-ghcr.yml` on green push |
| `build-push-ghcr.yml` | `workflow_call` (from `ci.yml`), `workflow_dispatch` | Reusable: build + push Docker images to GHCR, provenance attestation, Trivy scan |
| `release.yml` | push to `main` (release-please drives tagging) | Release pipeline: pack NuGet, archive dist, build+push versioned images, purge CDN |
| `validate-data.yml` | PR touching seeder data/entities | Strict deserialization + Ireland bbox check on gym coordinates |
| `issue-to-pr.yml` | `issues` labeled `approved:gym` / `approved:event` | Auto-open draft PR from community-submission issue body |
| `cleanup-artifacts.yml` | scheduled | Clean old artifacts (pure `gh` CLI, no runtime) |
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

## CI Job Order (`ci.yml`) — PR vs main split
The pipeline is explicitly split by event. PRs run fast feedback only; `main`/tag runs E2E + release. This trusts the PR gate (branch protection / merge queue) so cheap checks don't re-run on push.

### Pull request (`if: github.event_name == 'pull_request'`)
```
detect-changes
  ├── lint_api          → build_dotnet_solution → run_dotnet_tests (matrix) → publish_reports
  └── lint_frontend     → build_frontend
                        → test_frontend_unit
                        → test_frontend_integration
                        → test_frontend_browser (Playwright container)
```

### Push to main / tag (`if: github.event_name == 'push' && (ref == main || tag)`)
```
detect-changes
  └── smoke_tests       → build_push (calls build-push-ghcr.yml reusable) → Trivy scan
# deploy_production (commented — tag-only, environment gate, Azure OIDC — uncomment when prod is ready)
```

### `publish_reports` gating
Only run when `run_dotnet_tests` actually executed — `skipped` means no artifacts uploaded and dorny/test-reporter will error on the missing TRX files:
```yaml
if: |
  always() &&
  (needs.run_dotnet_tests.result == 'success' || needs.run_dotnet_tests.result == 'failure')
```
Do NOT use `result != 'skipped'` — matrix aggregate results don't always literally equal `"skipped"` on gated-skip paths.

### Reusable workflow concurrency trap
`build-push-ghcr.yml` has **no top-level `concurrency:` block**. When called via `workflow_call`, a reusable inherits `github.workflow` from the caller; if both declare `${{ github.workflow }}-${{ github.ref }}`, they resolve to the same group and the reusable queues behind itself → self-deadlock. Put concurrency only on the caller (`ci.yml`).

## Reusable Actions (`.github/actions/`)
Extract a composite action **only when there's real reuse** (2+ callers) or non-trivial logic worth hiding. Thin single-caller wrappers belong inline in the job — they just split the file without adding value.

Current composites:
- `setup-dotnet` — NuGet cache (used by `build_dotnet_solution`, `run_dotnet_tests`, `lint_api`)
- `setup-node` — node_modules cache (used by `lint_frontend`, `build_frontend`, `test_frontend_unit`, `test_frontend_integration`)
- `dotnet-run-tests` — runs a single test project with TRX output + artifact upload (called via 6-project matrix)
- `react-test-browser` — Vitest browser config with failure-path trace/screenshot uploads
- `publish_reports` — downloads test artifacts + publishes dotnet-trx reporter summary

Lint, `dotnet build`, and Vitest unit/integration steps live inline in their jobs — they're single-caller and boil down to 2–4 `npm`/`dotnet` commands. Don't re-extract them unless a second caller appears or the step count grows past ~4.

## Container-First Jobs
**Every** language-runtime job across all workflows declares `container:` rather than using `actions/setup-dotnet` / `actions/setup-node` on the host runner:
```yaml
container:
  image: mcr.microsoft.com/dotnet/sdk:10.0   # .NET jobs (ci, release, validate-data)
  image: node:24-bookworm-slim               # Node jobs (ci, release, validate-data, issue-to-pr)
  image: mcr.microsoft.com/playwright:...    # browser tests
```
The `setup-dotnet` / `setup-node` composites are now cache-only (NuGet / node_modules) — they do not install runtimes. The container image is the single source of truth for the toolchain version.

Exceptions (no runtime needed, stay on `ubuntu-latest`):
- Docker build/push jobs — need host Docker daemon
- `release-please` job — runs an action that does no language work
- `cleanup-artifacts.yml` — pure `gh` CLI + `jq`
- `purge-cloudflare-cache` — one `curl`

### Container gotcha: never use `${{ github.workspace }}` for paths
Inside a container job, `${{ github.workspace }}` expression expands to the **host** path (`/home/runner/work/<repo>/<repo>`). That path is not mounted inside the container — the container sees the workspace at `/__w/<repo>/<repo>`. Tools that write to the expanded host path create a directory in the container's own filesystem, orphaned from the runner's mount. Subsequent actions (upload-artifact, etc.) run against the container-mapped path and find nothing.

**Always use relative paths** (or the `$GITHUB_WORKSPACE` env var, which is correct inside containers) for anything that crosses steps:
```yaml
# BAD — works on host runner, silently breaks in container
run: dotnet test --results-directory "${{ github.workspace }}/TestResults"
uses: actions/upload-artifact@v4
with:
  path: "${{ github.workspace }}/TestResults"

# GOOD — works everywhere
run: dotnet test --results-directory "TestResults"
uses: actions/upload-artifact@v4
with:
  path: TestResults
```

## Runtime Versions
Defined as top-level env vars in `ci.yml` — change in one place:
```yaml
env:
  DOTNET_VERSION: "10.x"
  NODE_VERSION: "24.x"
  DOTNET_CONTAINER: "mcr.microsoft.com/dotnet/sdk:10.0"
  NODE_CONTAINER: "node:24-bookworm-slim"
  PLAYWRIGHT_CONTAINER: "mcr.microsoft.com/playwright:v1.58.2-noble"
```
`DOTNET_VERSION` / `NODE_VERSION` are informational (kept for backwards-compat with composite inputs); the container image is what actually runs.

## Browser Tests
- Run in `mcr.microsoft.com/playwright:v1.58.2-noble` container (Chromium pre-installed)
- Update the Playwright container version when upgrading `@playwright/test` or `@vitest/browser-playwright`
- Test files: `**/*.browser.test.{ts,tsx}`
- Screenshots on failure saved to `__screenshots__/` (uploaded as CI artifact)

## Docker Image Publishing (`build-push-ghcr.yml`)
- Registry: `ghcr.io`
- Images: `ghcr.io/{owner}/bjjeire-api`, `ghcr.io/{owner}/bjjeire-frontend`
- Tags: `sha-{short}`, semver on tags, `latest` on `main` push only
- Platforms: `linux/amd64,linux/arm64` (multi-arch)
- Build cache: `type=gha` (GitHub Actions cache)
- SBOM + provenance attestation enabled (published to registry via `actions/attest-build-provenance@v2`)
- Trivy vulnerability scan runs after push, SARIF uploaded to GitHub code scanning
- Cosign keyless OIDC signing prepared but commented out — enable when Sigstore setup is ready

## Secrets & Permissions
- `GITHUB_TOKEN` used for GHCR login — no PAT needed
- `permissions.packages: write` required on build-push jobs
- `permissions.id-token: write` for OIDC / attestation (enabled)
- `permissions.attestations: write` for `attest-build-provenance`
- `permissions.security-events: write` for Trivy SARIF upload
- Never hardcode secrets — use `${{ secrets.SECRET_NAME }}`

## Concurrency
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```
PRs cancel previous runs; `main` branch never cancels in-progress runs.

## Action Version Pinning
All third-party actions pinned to full commit SHA with a `# v{major}` trailing comment, e.g.:
```yaml
uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5  # v4
```
Dependabot's `github-actions` ecosystem config auto-bumps SHAs weekly. Never use `@main` or unpinned tags.

## Adding a New Workflow
1. Put it in `.github/workflows/{name}.yml`
2. Inline multi-step logic directly — only extract to `.github/actions/{name}/action.yml` if it has 2+ callers or genuinely complex logic
3. Use `dorny/paths-filter` if the workflow should only run on specific path changes
4. Set `timeout-minutes` on every job
5. Set `concurrency` with `cancel-in-progress: true` for PR-triggered workflows
6. Pin action versions to full commit SHA with `# v{major}` trailing comment — never `@main` or unpinned tags
7. Prefer `container:` job-level runtime over host-runner `setup-*` actions
