---
description: GitHub Actions CI/CD conventions for BjjEire workflows
paths:
  - .github/
---

# GitHub Actions CI/CD

## Workflow Files
| File | Trigger | Purpose |
|------|---------|---------|
| `ci-pr.yml` | pull_request to `main` | PR gate: workflow lint, dependency review, secret scan (Gitleaks), SAST (Semgrep), Java build+test, OpenAPI contract + breaking-change gate, frontend API compat, frontend build/lint/tests |
| `ci-main.yml` | push to `main` | Delivery: acceptance tests (Playwright via `bjjeire-tests` repo), Java build+test, generate + publish OpenAPI/Pact contracts to GHCR, image builds |
| `build-push-ghcr.yml` | `workflow_call`, `workflow_dispatch` | Reusable: build + push Docker images to GHCR, provenance attestation, Trivy scan |
| `release.yml` | push to `main` (release-please drives tagging) | Release pipeline: versioned images, purge CDN |
| `validate-data.yml` | PR touching seeder data/entities | Strict deserialization + Ireland bbox check on gym coordinates |
| `pr-env-validation.yml` | PR label | Ephemeral PR environment build + validation |
| `issue-to-pr.yml` | `issues` labeled `approved:gym` / `approved:event` | Auto-open draft PR from community-submission issue body |
| `cleanup-artifacts.yml` | scheduled | Clean old artifacts (pure `gh` CLI, no runtime) |
| `labels.yml` | push to label config | Sync repo labels |

Shared jobs (Maven build/test, workflow lint, OpenAPI breaking gate, cached Node setup) come from the
`ianoflynnautomation/bjjeire-ci-templates` repository; E2E comes from `ianoflynnautomation/bjjeire-tests`.

## Path Filters (`.github/actions/detect-changes`)
Single source of truth for change detection (dorny/paths-filter):
```yaml
frontend:
  - 'src/bjjeire-app/**'
java_api:
  - 'src/bjjeire-api/**'
java_api_image:
  - 'src/bjjeire-api/src/main/**'
  - 'src/bjjeire-api/pom.xml'
  - 'src/bjjeire-api/Dockerfile'
```
Always add new source paths to the relevant filter when adding new modules.

## CI Job Order — PR vs main split
PRs run fast feedback only; `main` runs E2E + contract publishing + delivery. This trusts the PR gate
(branch protection / merge queue) so cheap checks don't re-run on push.

### Pull request (`ci-pr.yml`)
```
lint_workflows, dependency_review, secret_scan, sast   (always)
detect-changes
  ├── java_build_test (maven-build-test.yml template, goals: verify)
  ├── openapi_contract → openapi_breaking_gate
  │                    → check_frontend_api_compat (regen types + tsc)
  └── build_frontend, frontend_checks (lint + unit + pact), browser tests
check-required-jobs  (single required status for branch protection)
```

### Push to main (`ci-main.yml`)
```
detect-changes
  ├── smoke/acceptance tests (bjjeire-tests playwright-docker.yml, docker compose stack)
  ├── java_build_test
  ├── generate_openapi_contract ┐
  └── generate_pact_contract    ┴→ publish_contracts (GHCR OCI artifacts)
  └── build_push (calls build-push-ghcr.yml reusable) → Trivy scan
```

## Quality Gate in CI
`mvn verify` (run by the `maven-build-test.yml` template) enforces the full Java quality gate:
Maven Enforcer, Spotless (palantir-java-format), Checkstyle, and Error Prone run as part of the build —
a formatting or lint violation fails the PR. Frontend jobs run `npm run lint` (`--max-warnings 0`),
`npm run typecheck`, and Prettier via lint-staged locally.

## Reusable Actions (`.github/actions/`)
Extract a composite action **only when there's real reuse** (2+ callers) or non-trivial logic worth hiding.
Current composites: `detect-changes`, `generate-openapi-contract`, `check-required-jobs`, `react-test-browser`.
Cross-repo reusables live in `bjjeire-ci-templates`.

## Container Jobs
Node jobs run in `node:26-bookworm-slim` containers; Java jobs use `actions/setup-java` (Temurin 21) with
Maven caching via the template. Docker build/push jobs stay on `ubuntu-latest` (need the host daemon).

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
- Run in `mcr.microsoft.com/playwright:v1.59.1-noble` container (Chromium pre-installed)
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
Use `actions/github-script` + a marker-based sticky-comment pattern (see `pr-env-validation.yml` `pr-comment`
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
All third-party actions pinned to full commit SHA with a `# v{major}` trailing comment. Dependabot's
`github-actions` ecosystem auto-bumps SHAs weekly. Never use `@main` or unpinned tags for third-party actions.

## Adding a New Workflow
1. Put it in `.github/workflows/{name}.yml`
2. Inline multi-step logic directly — only extract to `.github/actions/{name}/action.yml` with 2+ callers or genuinely complex logic
3. Use the `detect-changes` composite if the workflow should only run on specific path changes
4. Set `timeout-minutes` on every job
5. Set `concurrency` with `cancel-in-progress: true` for PR-triggered workflows
6. Pin action versions to full commit SHA with `# v{major}` trailing comment
