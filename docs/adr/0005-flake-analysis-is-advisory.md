# ADR-0005: Flake analysis is advisory and excluded from the merge gate

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `ci-pr.yml` and `ci-main.yml` (`atest_analyze`)

## Context

Both pipelines set `fail-on-flaky: true`, so a test that fails and then passes
on retry turns the run red. That is the right default — a flaky test is a
defect — but the gate has no memory.

Two runs made the cost concrete: `33253028409` (main) and `33251984798` (PR)
both went red with **zero failed tests**. Six tests passed on retry, the gate
fired, and on main that also skipped `promote_images`. Images were built,
scanned, and never promoted, because of six retries.

A binary gate cannot distinguish one bad night on a loaded runner from a test
that has flipped every week for a month. Those need opposite responses.

## Decision

`atest_analyze` runs after the test job in both pipelines, records every run,
and scores each `(test, project)` pair against a **90-day window** to produce a
verdict a human can act on.

It is **deliberately absent from `pr_complete` and `main_complete`.**

A job that cannot change the merge verdict must not sit in the
branch-protection aggregator: a broken analyzer would otherwise block every
merge in the repository. It still shows red in the checks list when it breaks,
which is the right amount of noise for something that gates nothing.

It runs `if: always() && needs.<test-job>.result != 'skipped'` — the red runs
are the interesting ones, and a skipped upstream means no suite ran.

**The read/write split is the security boundary:**

| Pipeline | Role | Azure RBAC |
|---|---|---|
| `ci-pr.yml` | Reads the baseline, scores this branch, `?readonly=1` | Storage Blob Data **Reader** |
| `ci-main.yml` | Writes the baseline — trunk defines it | Storage Blob Data **Contributor** |

A pull request that introduces an unstable test must not enter the baseline
before anyone has decided to merge it. Both use `history-prefix: bjjeire-java`
so they read and write the same keys.

## Consequences

- `fail-on-flaky` keeps its teeth: a flaky run is still red and still blocks
  promotion. What changed is that there is now evidence for whether to
  quarantine a test or re-run the job.
- **Adding `atest_analyze` to an aggregator would be a regression**, not a
  tightening. It is the one job in these pipelines that must stay out.
- Advisory checks train people to ignore red. This one is the only advisory
  check with its own job name, so the habit is contained; the other advisory
  settings (`zizmor-enforce: false`, `sast-enforce: false`) are inside jobs that
  gate on something else.
- The baseline is only as good as main's history. A long gap in main runs —
  such as the period with `ACCEPTANCE_AKS_ENABLED` off — leaves the window thin
  and the verdicts weak.
- Analysis is pinned to `ianoflynnautomation/aplaytest` at a commit SHA, not
  `@main`. The repository was renamed `atest` → `aplaytest` and Actions `uses:`
  does not follow redirects, so an unpinned reference would break outright.
  `ATEST_VERSION` will pin a released tag once one exists.

## Alternatives considered

- **`fail-on-flaky: false`.** Removes the false reds and removes the pressure
  to fix flaky tests. Rejected.
- **Make `atest_analyze` blocking.** Would give the verdict teeth, but couples
  every merge to an analyzer that is itself young, and turns an outage in the
  history storage account into a repository-wide merge freeze.
- **Automatic quarantine of tests above a flake threshold.** The obvious next
  step once the baseline has a full window of data. Rejected for now — the
  90-day history has to be trustworthy before it is allowed to disable tests.
- **A retry budget instead of a boolean.** Simpler than history, but still
  memoryless across runs.
