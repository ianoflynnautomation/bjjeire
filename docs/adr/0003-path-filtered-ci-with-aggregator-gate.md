# ADR-0003: Path-filtered CI with a single aggregator job as the branch-protection gate

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `.github/path-filters.yml`, `ci-pr.yml` (`pr_complete`), `ci-main.yml` (`main_complete`)

## Context

This is a monorepo: a Java API, a React SPA, a seeder, and a Compose stack. A
full pipeline run is expensive — `mvn verify`, Vitest unit and integration,
Playwright browser tests, a Compose smoke suite with seeded MongoDB, and
multi-arch image builds.

Most changes touch one of those. Running everything on every change wastes
minutes and, worse, trains people to ignore a slow pipeline.

But GitHub branch protection requires *named* checks. A required check that
legitimately skips is reported as pending forever, so the naive combination of
path filtering and required checks deadlocks the merge button.

## Decision

**Path filters gate the work.** `detect_changes` evaluates
`.github/path-filters.yml` and emits a JSON list; downstream jobs are
`if:`-gated on `contains(fromJSON(needs.detect_changes.outputs.changes), '…')`.

**A single aggregator job is the required check.** `pr_complete` on PRs and
`main_complete` on main `needs:` every meaningful job, runs with `always()`,
and calls the `check-required-jobs` action, which distinguishes
**intentionally skipped** from **failed**.

Two filters are deliberately narrower than they look:

- `java_api_image` covers only `src/main/**`, `pom.xml`, and the `Dockerfile` —
  so a test-only change runs tests without rebuilding an image.
- `compose` covers the compose files, the pre-up script, all three Dockerfiles
  and the `Caddyfile` — the things that actually change how the stack boots.

The **`run-smoke` label** forces `compose_smoke` on any pull request, as the
escape hatch for changes the filters cannot see.

## Consequences

- A typical single-surface change runs a fraction of the pipeline.
- Branch protection needs exactly one check name per pipeline, and adding a job
  does not require an admin to update the repository settings.
- **A job is not gating until it is in the aggregator's `needs`.** This is the
  most likely way to add a check that silently protects nothing. `atest_analyze`
  is excluded on purpose ([ADR-0005](0005-flake-analysis-is-advisory.md));
  everything else should be listed.
- **Path filters are a correctness surface.** A filter that is too narrow lets
  a breaking change through untested. When something reaches main broken, check
  `path-filters.yml` before blaming a test.
- Both workflows also set `paths-ignore` for `**.md`, `docs/**`, and `logs/**`,
  so a docs-only change may not start the pipeline at all — the aggregator
  never reports, and branch protection treats the check as not required for
  that run.
- Reviewers see skipped jobs routinely. "Skipped" has to be read as "not
  relevant", which reduces the signal a skipped job carries.

## Alternatives considered

- **Run everything on every change.** Simplest and safest. Rejected on run time
  and cost; the Compose smoke suite alone is minutes of MongoDB seeding and
  Playwright sharding.
- **Mark every job required in branch protection.** Deadlocks on any skip.
- **Split into separate workflows per surface, each required.** Removes the
  aggregator, but duplicates the shared jobs (security scan, audit report) and
  loses the cross-surface checks — `check_frontend_api_compat` needs both sides
  in one run.
- **`paths:` on the workflow trigger instead of job-level `if:`.** Coarser: the
  whole workflow runs or does not, so the aggregator would not report at all
  and cross-surface jobs could not run.
