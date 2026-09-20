# Documentation

| Doc | Contents |
|---|---|
| [architecture.md](architecture.md) | Runtime topology, package-by-feature API, frontend structure, contracts, repository boundaries |
| [ci-cd.md](ci-cd.md) | **CI PR** and **CI main** pipelines in detail — job DAGs, path filters, gating, promotion, secrets |
| [testing-strategy.md](testing-strategy.md) | Spec-To-Check overlay, test-layer matrix, agent TDD rules, contract/flake/property-based upgrades |
| [Playwright agents](../specs/playwright/README.md) | Planner/generator/healer plans in this repo; executable tests in `bjjeire-tests` |
| [adr/](adr/) | Architecture decision records — *why* it is built this way |
| [diagrams/](diagrams/) | `architecture.drawio.svg` — renders on GitHub, editable in draw.io |
| [contract-testing.md](contract-testing.md) | Pact and OpenAPI contract workflow |
| [acceptance-ci-debug.md](acceptance-ci-debug.md) | Debugging a red acceptance job |
| [cutover-checklist.md](cutover-checklist.md) | Release cutover steps |
| [release-test-report.md](release-test-report.md) | Audit-ready release PDF |

## Reading order

**New here:** [architecture.md](architecture.md) → [ci-cd.md](ci-cd.md). Writing tests: [testing-strategy.md](testing-strategy.md).

**A CI job went red:** [ci-cd.md § common failures](ci-cd.md#common-failures).
For acceptance specifically, [acceptance-ci-debug.md](acceptance-ci-debug.md).

**Changing the platform:** the decision table in
[AGENTS.md](../AGENTS.md#read-this-before-you-change-anything) routes you to the
ADR that governs what you are about to touch.

## Keeping these accurate

These pages describe the code and workflows in this repository, not the running
system. When a change alters the API surface, the CI job graph, or the delivery
chain, update the matching page in the same pull request — and add an ADR if you
are making a decision rather than following one.

Both pipelines set `paths-ignore` for `docs/**`, so a docs-only change does not
trigger CI.
