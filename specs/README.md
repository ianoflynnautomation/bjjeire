# Living specifications

Spec-Driven Development artifacts for BjjEire. Compatible with
[GitHub Spec Kit](https://github.com/github/spec-kit) and the documentation
layout used by [Azure-Samples/Spec2Cloud](https://github.com/Azure-Samples/Spec2Cloud),
adapted to the **actual** stack (AKS + Flux + MongoDB, not Container Apps + Cosmos).

## Layout

```
specs/
├── README.md                     # this file
├── system-architecture.md        # runtime topology + repo boundaries
├── database-contracts/           # Mongo document contracts
│   ├── shared.md
│   ├── gym.md
│   ├── bjj-event.md
│   ├── competition.md
│   └── store.md
└── features/                     # visitor-facing feature specs
    ├── gyms.md
    ├── events.md
    ├── competitions.md
    └── stores.md
```

Process tooling: `.specify/` (constitution, rules, templates).
Agentic PR checks: `.github/workflows-aw/`.

## SDLC

```
constitution → specify → plan → tasks → tests → code → images/contracts → Flux
```

Existing behaviour is reverse-engineered here (brownfield). New work adds a
numbered Spec Kit directory (`specs/00N-slug/`) **or** updates the living
file in `features/` — do not maintain two conflicting specs for the same
capability.

## Multi-repo map

| Concern | System of record |
|---|---|
| Architecture, ADRs, Java, React, Mongo, OpenAPI | this repo |
| Acceptance tests, Playwright Zod, page objects | `bjjeire-tests` |
| Flake/heal evidence engine | `atest` (`@aplaytest/*`) |
| In-cluster deploy | `bjjeire-gitops` + `bjjeire-deploy` |

## How agents should use this

1. Read `.specify/memory/constitution.md`.
2. Read the feature spec and database contract for the slice.
3. Follow `.specify/rules/` for the language you are editing.
4. If the wire shape moves, update the contract **in the same PR**.
