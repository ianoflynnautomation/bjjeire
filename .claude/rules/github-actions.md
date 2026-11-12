---
description: GitHub Actions CI/CD conventions for BjjEire workflows
paths:
  - .github/
---

# GitHub Actions CI/CD

What each workflow and job does, the job graphs, image publishing, and the secrets list are in
[docs/ci-cd.md](../../docs/ci-cd.md). Read the workflow file itself for current detail. This file holds the
conventions a change must follow.

## Gating
- `pr_complete` (in `ci-pr.yml`) and `main_complete` (in `ci-main.yml`) are the only required statuses. A new job gates nothing until it is in that job's `needs`. Skipped jobs count as a pass
- `atest_analyze` stays out of both (ADR-0005). `pr-env-validation.yml` is not part of `pr_complete`
- `.github/path-filters.yml` decides which jobs run. A new module or source path needs an entry there, or its changes go untested
- `java_api_image` is deliberately narrower than `java_api`: a test-only change runs tests without rebuilding an image
- Compose `@smoke` runs when the `compose` filter matches or the pull request has the `run-smoke` label
- Never publish `latest` from `ci-main`. `release.yml` retags the promoted `:main` digest (ADR-0004)

## Agentic workflows (gh-aw)
- `spec-review.md` and `schema-drift.md` are the sources. `*.lock.yml` is compiled from them with `gh aw compile`. Never edit a lock file; the edit hook rejects it
- Each source has a twin in `.github/workflows-aw/`. Edit one, copy it to the other, then compile (see that folder's `README.md`)
- Commit the `.md` and its `.lock.yml` together. `.github/aw/actions-lock.json` records the pinned actions and container digests
- Repository instructions for these workflows are in `.github/aw/instructions.md`. Use the `agentic-workflows` skill to create, debug, or upgrade one

## Reuse
- Shared jobs and composites come from `ianoflynnautomation/bjjeire-ci-templates` (`detect-changes`, `maven-build-test`, `node-build-test`, `docker-build-push`, `check-required-jobs`, `maven-openapi-export`, …). Do not recreate them under `.github/actions/`
- Extract a local composite only with two or more callers or logic worth hiding
- E2E comes from `ianoflynnautomation/bjjeire-tests`

## Pinning
- Pin every third-party action and every `bjjeire-ci-templates` reference to a full commit SHA with a trailing version comment. Never `@main` or a bare tag
- Dependabot bumps the SHAs weekly. Bump a template pin deliberately; the pins currently in use are listed in `AGENTS.md`

## Job naming
- Job IDs are `snake_case`, `{area}_{action}`: `java_build_test`, `frontend_build_test`, `detect_changes`. Never kebab-case
- `name:` and a reusable workflow's `job-name:` match, in Title Case, and describe the gate (`Frontend Build & Test`), not an optimization (`fast`, `lite`, `quick`)
- Artifact names are the job ID with hyphens (`frontend-build-test`)
- No generic IDs (`tests`, `guard`, `sync`, `cleanup`)

## Runners and containers
- Node jobs run in `node:26-bookworm-slim`. Java jobs use `actions/setup-java` (Temurin 25). Docker build and push jobs stay on `ubuntu-latest` because they need the host daemon. AKS and Flux jobs run on `gha-runner-scale-set`
- Browser tests run in `mcr.microsoft.com/playwright:v1.63.0-noble`. Change that tag whenever `@playwright/test` or `@vitest/browser-playwright` changes version
- In a container job, `${{ github.workspace }}` expands to the host path, which is not mounted. Use a relative path or `$GITHUB_WORKSPACE`:
  ```yaml
  # BAD: works on a host runner, breaks silently in a container
  run: mvn verify -Dreports="${{ github.workspace }}/TestResults"
  # GOOD
  run: mvn verify -Dreports="TestResults"
  ```

## Secrets and permissions
- Never put `${{ secrets.X }}` in a script body or a `--set key=` argument. It lands in the script on disk and in any trace. Pass it through `env:`:
  ```yaml
  - env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    run: printf '%s' "$GH_TOKEN" | helm registry login "$REGISTRY" --password-stdin
  ```
- No `set -x` in a step that handles a secret
- GHCR login uses `GITHUB_TOKEN`. No PAT
- Grant permissions per job: `packages: write` to push images, `id-token: write` for OIDC and attestation, `attestations: write` for provenance, `security-events: write` for SARIF upload
- Azure auth is OIDC. `VITE_APP_*` values are public build arguments, not secrets

## Logging
- `::notice title=…::` for milestones, `::warning title=…::` for soft failures, `::error title=…::` directly before `exit 1`. Always give a `title=`, and `file=` plus `line=` when the finding maps to source
- Wrap a multi-line `run:` block in `::group::Title` / `::endgroup::`, one group per phase
- `::set-output` and `::set-env` are banned. Write to `$GITHUB_OUTPUT` / `$GITHUB_ENV`
- Step summaries beyond a two-row table use `actions/github-script` with `core.summary`
- Pull request comments use `actions/github-script` with the sticky-comment marker pattern in the `comment_preview` job of `pr-env-validation.yml`. Do not call `gh pr comment` or curl the API
- `lint_workflows` in `ci-pr.yml` runs `actionlint` and `zizmor` and enforces the banned commands

## Every new workflow
1. `.github/workflows/{name}.yml`
2. `timeout-minutes` on every job
3. Concurrency, cancelling superseded pull request runs but never `main`:
   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
   ```
4. The `detect-changes` composite when it should run only for some paths
5. SHA-pinned actions
6. An entry in the aggregator's `needs` if it must gate a merge
