---
description: GitHub Actions CI/CD conventions for BjjEire workflows
paths:
  - .github/
---

# GitHub Actions CI/CD

## Workflow Files
| File | Trigger | Purpose |
|------|---------|---------|
| `ci-pr.yml` | pull_request to `main` | Fast PR gate: workflow lint, security scans, Java verify, OpenAPI (parallel with Java), frontend lint/test/build, optional Compose `@smoke` |
| `ci-main.yml` | push to `main` | Delivery: Java verify, contract publish, image build (parallel with contracts), AKS acceptance (gated), digest promote to `:main` |
| `build-push-ghcr.yml` | `workflow_call`, `workflow_dispatch` | Reusable: build + push Docker images to GHCR, provenance attestation, Trivy scan |
| `release.yml` | push to `main` (release-please drives tagging) | GitHub Release assets; retag `:main` images to semver + `latest` |
| `validate-data.yml` | PR touching seeder data/entities | Strict deserialization + Ireland bbox check on gym coordinates |
| `pr-env-validation.yml` | pull_request (gated on `PR_ENV_ENABLED`) | Flux preview env + Playwright `@smoke\|@acceptance` |
| `acceptance-staging.yml` | schedule + dispatch | Playwright `@acceptance` against long-lived staging |
| `issue-to-pr.yml` | `issues` labeled `approved:gym` / `approved:event` | Auto-open draft PR from community-submission issue body |
| `cleanup-artifacts.yml` | scheduled | Clean old artifacts (pure `gh` CLI, no runtime) |
| `labels.yml` | push to label config | Sync repo labels |

Shared jobs (Maven build/test, workflow lint, OpenAPI breaking gate, cached Node setup, docker-build-push) come from the
`ianoflynnautomation/bjjeire-ci-templates` repository; E2E comes from `ianoflynnautomation/bjjeire-tests`.

## Path Filters (`.github/path-filters.yml`)
Single source of truth for change detection (dorny/paths-filter via the `detect-changes` composite in `bjjeire-ci-templates`):
```yaml
frontend:       src/bjjeire-app/**, Caddyfile, tools/images/**
java_api:       src/bjjeire-api/**
java_api_image: src/bjjeire-api/src/main/**, pom.xml, Dockerfile
seeder:         seeder.Dockerfile, seeder package, seeder/data/**
compose:        docker-compose*, smoke-pre-up.sh, Dockerfiles, Caddyfile
```
Always add new source paths to `.github/path-filters.yml` when adding new modules.

Compose `@smoke` runs only when the `compose` filter matches, or when the PR has the `run-smoke` label.

## CI Job Order — PR vs main split
PRs run fast feedback only; `main` runs contract publishing, image delivery, and (when enabled) AKS acceptance. This trusts the PR gate
(branch protection / merge queue) so cheap checks don't re-run on push.

### Pull request (`ci-pr.yml`)
```
lint_workflows, security_scan   (always)
detect_changes
  ├── java_build_test (maven-build-test.yml, goals: verify)
  ├── generate_openapi_contract (parallel with Java; single IT) → breaking gate
  │                                                            → frontend API compat
  ├── frontend_build_test (tsc + eslint + prettier + unit/integration coverage + pact + vite)
  ├── test_frontend_browser (parallel with frontend_build_test)
  └── compose_smoke (path/label only; @smoke)
pr_complete  (single required status for branch protection; skipped jobs count as pass)
```

### Push to main (`ci-main.yml`)
```
detect_changes
  ├── java_build_test
  ├── generate_openapi_contract ┐
  └── generate_pact_contract    ┴→ publish_contracts_ghcr
  └── build_push (parallel with contracts; skipped Java is OK) → Trivy
        └── acceptance_ephemeral (gated on ACCEPTANCE_AKS_ENABLED)
              └── promote_images (SHA digest → :main)
main_complete
```

## Quality Gate in CI
`mvn verify` (run by the `maven-build-test.yml` template) enforces the full Java quality gate:
Maven Enforcer, Spotless (palantir-java-format), Checkstyle, and Error Prone run as part of the build —
a formatting or lint violation fails the PR. `frontend_build_test` runs `tsc --noEmit`, `eslint --max-warnings 0`,
Prettier check, unit+integration coverage, Pact, and `vite build` in one `npm ci`. Lint-staged runs Prettier locally.

## Job naming
- Job IDs: `snake_case` only (`{area}_{action}`). Never kebab-case. Examples: `java_build_test`, `frontend_build_test`, `detect_changes`, `test_acceptance`.
- `name:` (Checks UI) and reusable `job-name:` must match, Title Case, describing the gate (`Frontend Build & Test`), not an optimization (`fast`, `lite`, `quick`).
- Artifact names follow the job ID with hyphens (`frontend-build-test`).
- Do not reuse a generic ID (`tests`, `guard`, `sync`, `cleanup`). Spell the gate.

## Reusable Actions
Extract a composite action **only when there's real reuse** (2+ callers) or non-trivial logic worth hiding.
Composites and reusable workflows live in `ianoflynnautomation/bjjeire-ci-templates` (`detect-changes`, `maven-build-test`, `node-build-test`, `docker-build-push`, `check-required-jobs`, `maven-openapi-export`, …). Do not recreate them under `.github/actions/`.

## Container Jobs
Node jobs run in `node:26-bookworm-slim` containers; Java jobs use `actions/setup-java` (Temurin 25) with
Maven caching via the template. Docker build/push jobs stay on `ubuntu-latest` (need the host daemon).
AKS / Flux jobs run on `gha-runner-scale-set`.

### Container gotcha: never use `${{ github.workspace }}` for paths
Inside a container job, `${{ github.workspace }}` expands to the **host** path, which is not mounted in the
container (it sees `/__w/<repo>/<repo>`). Always use relative paths (or the `$GITHUB_WORKSPACE` env var) for
anything that crosses steps:
```yaml
# BAD — works on host runner, silently breaks in container
run: mvn verify -Dreports="${{ github.workspace }}/TestResults"
# GOOD — works everywhere
run: mvn verify -Dreports="TestResults"
```

## Browser Tests
- Run in `mcr.microsoft.com/playwright:v1.61.0-noble` container (Chromium pre-installed)
- Update the Playwright container version when upgrading `@playwright/test` or `@vitest/browser-playwright`
- Test files: `**/*.browser.test.{ts,tsx}`
- Screenshots on failure saved to `__screenshots__/` (uploaded as CI artifact)

## Docker Image Publishing (`build-push-ghcr.yml`)
- Registry: `ghcr.io`
- Images: `ghcr.io/{owner}/bjjeire-api`, `ghcr.io/{owner}/bjjeire-frontend`, `ghcr.io/{owner}/bjjeire-seeder`
- Candidate tags on `main`: `sha-{short}` and full `${{ github.sha }}`. After acceptance (or skip), `promote_images` tags the digest as `:main`.
- Semver + `latest` are applied by `release.yml` retagging `:main` — never publish `latest` from `ci-main`.
- Platforms: `linux/amd64,linux/arm64` on main/release; `linux/amd64` only for PR preview images
- Build cache: `type=gha` with shared scopes (`bjjeire-api`, `bjjeire-frontend`, `bjjeire-seeder`) so PR and main reuse layers
- SBOM + provenance attestation enabled (published to registry via `actions/attest-build-provenance@v2`)
- Trivy vulnerability scan runs after push, SARIF uploaded to GitHub code scanning

## Secrets & Permissions
- `GITHUB_TOKEN` used for GHCR login — no PAT needed
- `permissions.packages: write` required on build-push jobs
- `permissions.id-token: write` for OIDC / attestation; `permissions.attestations: write` for provenance
- `permissions.security-events: write` for Trivy SARIF upload
- Never hardcode secrets — use `${{ secrets.SECRET_NAME }}`

### Secrets in shell steps — env-only rule
**Never** interpolate `${{ secrets.X }}` directly into a shell command body. The template expands into the
script text on disk and into any `set -x` trace. Funnel through `env:` instead:

```yaml
# BAD — secret appears in the script body
- run: |
    echo "${{ secrets.GITHUB_TOKEN }}" | helm registry login ghcr.io ...

# GOOD — secret lives in env, script reads via $VAR
- env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    printf '%s' "$GH_TOKEN" | helm registry login "$REGISTRY" --password-stdin
```

The same rule applies to `--set key=${{ secrets.X }}` patterns — pass the secret via `env:` and reference `$VAR`.

## Logging conventions

Workflow output is read in two places: live logs and the PR Files annotations panel. Use the official commands so both work.

### Levels
| Command | Use for |
|---------|---------|
| `::debug::` | Diagnostic detail (only printed when `ACTIONS_STEP_DEBUG=true`) |
| `::notice title=…::` | Milestone events (artifact published, image pushed, scan clean) |
| `::warning title=…[,file=…,line=…]::` | Soft failures, drift, deprecation hints |
| `::error title=…[,file=…,line=…]::` | Hard failures — always immediately precede `exit 1` |

Always include a `title=`. For warning/error, include `file=` + `line=` whenever the finding maps to a source location.

### Grouping
Wrap any multi-line `run:` block in `::group::Title` / `::endgroup::`. One group per logical phase. Never leave a group unclosed.

### Step summaries
Hand-rolled `echo ... >> $GITHUB_STEP_SUMMARY` is acceptable for trivial cases. For anything richer than a
2-row table, use `actions/github-script` + `core.summary`.

### PR comments
Use `actions/github-script` + a marker-based sticky-comment pattern (see `pr-env-validation.yml` `comment_preview`
job for the canonical implementation). Never call `gh pr comment` or curl the GitHub API from a workflow.

### Banned patterns
- `::set-output` / `::set-env` — deprecated since 2022. Use `$GITHUB_OUTPUT` / `$GITHUB_ENV` heredocs.
- `set -x` in any step that handles secrets.
- Raw `${{ secrets.* }}` in script bodies — see "Secrets in shell steps" above.

The `lint_workflows` job in `ci-pr.yml` enforces the deprecated-command rule and runs `actionlint` / `zizmor`.

## Concurrency
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```
PRs cancel previous runs; `main` never cancels in-progress runs.

## Action Version Pinning
All third-party actions **and** `bjjeire-ci-templates` reusable workflows/actions pinned to full commit SHA with a `# v{major}` trailing comment. Dependabot's
`github-actions` ecosystem auto-bumps SHAs weekly. Never use `@main` or unpinned tags (`@v1.3.0`) for templates or third-party actions.

## Adding a New Workflow
1. Put it in `.github/workflows/{name}.yml`
2. Inline multi-step logic directly — only extract to `.github/actions/{name}/action.yml` with 2+ callers or genuinely complex logic
3. Use the `detect-changes` composite if the workflow should only run on specific path changes
4. Set `timeout-minutes` on every job
5. Set `concurrency` with `cancel-in-progress: true` for PR-triggered workflows
6. Pin action versions to full commit SHA with `# v{major}` trailing comment
