# ADR-0009: Every pipeline produces an audit-ready test report

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `ci-pr.yml` and `ci-main.yml` (`package_*_reports`, `audit_report`), `audit-release.yml`

## Context

Test evidence in GitHub Actions is scattered and short-lived: Surefire and
Failsafe XML in one artifact, Vitest JUnit in another, Playwright JSON in a
third, each in a different schema, each expiring on its own retention clock.

Answering "what was tested for this release, and did it pass?" means opening
several runs and reading three formats. For anything resembling an audit or a
release sign-off, that is not evidence — it is a research project.

## Decision

Both pipelines end with the same normalise-then-render chain:

```
package_java_reports ─┐
package_frontend_reports ─┼─► audit_report ─► PDF + Step Summary
package_{compose,acceptance}_reports ─┘
```

Each `package_*` job maps one source into report bundles with
`category|source|glob` entries:

```
unit|java|**/surefire-reports/*.xml
integration|java|**/failsafe-reports/*.xml
unit|frontend|**/vitest-unit.xml
integration|frontend|**/vitest-integration.xml
system|compose|**/*.json          # PR
system|acceptance|**/*.json       # main
```

`audit_report` requires categories `unit,integration,acceptance,system` and
renders a single PDF plus a step summary.

Two settings carry the intent:

- **`strict-missing: false`** — a category absent because path filters skipped
  its job does not fail the report. Under
  [ADR-0003](0003-path-filtered-ci-with-aggregator-gate.md) most runs are
  partial, and a report that failed on every partial run would be ignored.
- **`fail-on-test-failure: true`** — actual test failures do fail it, and
  `audit_report` is in both aggregators, so a red report blocks the merge.

Every `package_*` job runs on `always()` with an explicit `skip-reason`, so the
report states *why* a category is missing rather than silently omitting it.

Retention encodes the audience: **14 days for PR reports, 90 days for main**.

## Consequences

- One artifact answers the release-evidence question, in one format, without
  opening individual runs.
- Failures are visible in the aggregate rather than only inside a job log.
- **`strict-missing: false` means a green report does not mean full coverage.**
  A report can pass with no acceptance category because the job was skipped —
  which is exactly the situation while `ACCEPTANCE_AKS_ENABLED` is off
  ([ADR-0004](0004-promote-images-by-digest.md)). Read the categories present,
  not just the verdict.
- Six extra jobs across two pipelines exist purely to produce documentation.
  They are cheap and run in parallel, but they are surface area to maintain.
- Adding a test source means adding a `package_*` job and its glob mapping, or
  its results silently never appear in the report.
- The report's schema is defined by `bjjeire-ci-templates`, so changes to it
  land through that repository's SHA pin.

## Alternatives considered

- **Rely on the checks UI and per-job artifacts.** Free, and adequate for
  day-to-day work. Rejected for release evidence: nothing aggregates, and
  artifacts expire independently.
- **A hosted test-reporting service.** Better trend analysis and history than a
  per-run PDF. Rejected on cost and on adding another external dependency;
  trend analysis for flakiness is handled separately by `atest_analyze`
  ([ADR-0005](0005-flake-analysis-is-advisory.md)).
- **Generate the report only on release tags.** Cheaper, and `audit-release.yml`
  does exactly that for the compliance pack. Kept on every run as well, because
  a report that is only exercised at release time is a report that is broken at
  release time.
