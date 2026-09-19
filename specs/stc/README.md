# Spec-To-Check overlay

Machine-readable check catalogs for agentic TDD. Behavioural SSOT remains
[`specs/features/`](../features/). Database SSOT remains
[`specs/database-contracts/`](../database-contracts/).

Generic SDD docs call this tree `docs/specs/stc/`. In this repository it
lives here so it sits next to the living specs ([ADR-0010](../../docs/adr/0010-spec-driven-development-and-agentic-workflows.md))
and is not buried under `docs/` (CI `paths-ignore`).

Strategy: [docs/testing-strategy.md](../../docs/testing-strategy.md).
Template: [.specify/templates/stc-check.template.md](../../.specify/templates/stc-check.template.md).

```
specs/stc/<feature>/
├── spec.md            # AC-IDs, Gherkin, owning test tier
├── contract.yaml      # OpenAPI / Pact / MSW / invariants
└── traceability.md    # AC-ID → test path → implementation path
```

If `spec.md` disagrees with `specs/features/<feature>.md`, the feature spec
wins and this overlay is updated in the same PR.

| Feature | Overlay |
|---|---|
| Gyms | [gyms/](gyms/) |
| Events | [events/](events/) |
| Competitions | [competitions/](competitions/) |
| Stores | [stores/](stores/) |
