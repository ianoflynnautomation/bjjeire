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
├── spec.md            # GitLab issue ids, Gherkin, owning test tier
├── contract.yaml      # routes, auth, filters, write rules, API and UI invariants
└── traceability.md    # issue → test path → implementation path
```

`contract.yaml` does not repeat the stored document. Fields, enums, indexes and
stored-data rules (coordinate order, `isAvailable`, TTL) are in
`specs/database-contracts/<entity>.md`, which `pointers.database` links to. The
database contract links back for routes and write rules.

Requirement ids are GitLab issues in `bjjeire/requirements`. The numbers in these files are placeholders until the issues exist. Gyms are epic `&1` (`#1001`–`#1016`). Events are `&2` (`#2001`–`#2017`). Competitions are `&3` (`#3001`–`#3005`). Stores are `&4` (`#4001`–`#4004`). Tournaments are `&11` (`#5001`–`#5042`). CI stays on GitHub. The epic stays in the header. A row cites the issue.

If `spec.md` disagrees with `specs/features/<feature>.md`, the feature spec
wins and this overlay is updated in the same PR.

| Feature | Overlay |
|---|---|
| Gyms | [gyms/](gyms/) |
| Events | [events/](events/) |
| Competitions | [competitions/](competitions/) |
| Stores | [stores/](stores/) |
| Tournaments | [tournaments/](tournaments/) (in progress) |
