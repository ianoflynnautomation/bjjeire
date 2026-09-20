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
├── features/                     # visitor-facing feature specs
│   ├── gyms.md
│   ├── events.md
│   ├── competitions.md
│   └── stores.md
├── stc/                          # Spec-To-Check overlay (AC-IDs, contracts, traceability)
│   ├── README.md
│   ├── gyms/
│   ├── events/
│   ├── competitions/
│   └── stores/
└── playwright/                   # Playwright Test Agent plans (tests live in bjjeire-tests)
    ├── README.md
    ├── seed.md
    ├── smoke.md
    └── regression.md
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
3. Read or create `specs/stc/<feature>/` (check catalog + traceability). See [docs/testing-strategy.md](../docs/testing-strategy.md).
4. Follow `.specify/rules/` for the language you are editing.
5. If the wire shape moves, update the contract **in the same PR**.
