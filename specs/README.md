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
│   ├── store.md
│   └── tournament.md             # Tournament (slice 1); competitor and registration follow
├── features/                     # visitor-facing feature specs
│   ├── gyms.md
│   ├── events.md
│   ├── competitions.md
│   ├── stores.md
│   └── tournaments.md            # in progress; design record in 001-tournament-registration/
└── stc/                          # Spec-To-Check overlay (GitLab issue ids, contracts, traceability)
    ├── README.md
    ├── gyms/
    ├── events/
    ├── competitions/
    ├── stores/
    └── tournaments/
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
| Acceptance plans and tests, Playwright agents, Zod, page objects | `bjjeire-tests` |
| Flake/heal evidence engine | `atest` (`@aplaytest/*`) |
| In-cluster deploy | `bjjeire-gitops` + `bjjeire-deploy` |

## How agents should use this

1. Read `.specify/memory/constitution.md`.
2. Read the feature spec and database contract for the slice.
3. Read or create `specs/stc/<feature>/` (check catalog + traceability). See [docs/testing-strategy.md](../docs/testing-strategy.md).
4. Follow `.specify/rules/` for the language you are editing.
5. If the wire shape moves, update the contract **in the same PR**.

To build a feature in Claude Code, run `/spec <feature>` and review the result. Then run
`/clear` and `/build-feature <spec path>`, which ends with an independent review by the
read-only `spec-verifier` subagent. This is the default.

For a large change, to a new capability or to one that already has a living file,
design it with Spec Kit (`/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
`/speckit-tasks`). That writes `specs/00N-slug/` with separate `spec.md`, `plan.md` and
`tasks.md`. Then
build it with `/build-feature specs/00N-slug/spec.md`, not `/speckit-implement`. The
build writes the result back into `features/` and `stc/`, and the numbered directory
is kept as the design record.
