# Architecture Decision Records

Decisions with lasting consequences for this repository, and the reasoning
behind them. Several look like inconsistencies or gaps from the outside — the
ADR explains why they are deliberate and what breaks if reversed.

Format: [MADR](https://adr.github.io/madr/). One file per decision, numbered
sequentially, never renumbered. Superseding a decision means writing a new ADR
and flipping the old one's status — not editing it.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-package-by-feature-api.md) | The Java API is organised package-by-feature, not by layer | Accepted |
| [0002](0002-contracts-as-oci-artifacts.md) | OpenAPI and Pact contracts are published to GHCR as OCI artifacts | Accepted |
| [0003](0003-path-filtered-ci-with-aggregator-gate.md) | CI is path-filtered, with a single aggregator job as the branch-protection gate | Accepted |
| [0004](0004-promote-images-by-digest.md) | Images are promoted by digest, never rebuilt for a new tag | Accepted |
| [0005](0005-flake-analysis-is-advisory.md) | Flake analysis is advisory and excluded from the merge gate | Accepted |
| [0006](0006-vite-config-is-baked-at-image-build.md) | Frontend configuration is baked in at image build time | Accepted |
| [0007](0007-dark-theme-only.md) | The SPA ships a single dark theme | Accepted |
| [0008](0008-ui-strings-and-test-ids-are-centralised.md) | User-visible strings and test IDs live in central modules | Accepted |
| [0009](0009-audit-report-on-every-pipeline.md) | Every pipeline produces an audit-ready test report | Accepted |

## Adding one

Copy [`0000-template.md`](0000-template.md), take the next number, and link it
from the table above — and from [AGENTS.md](../../AGENTS.md) if an agent could
plausibly try to reverse it.
