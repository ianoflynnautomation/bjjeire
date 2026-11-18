---
description: Spec-driven development, writing and changing specs, requirement issues and traceability
paths:
  - specs/
  - .specify/
  - docs/adr/
---

# Specs

Every behaviour change starts in a spec (constitution principle I). The layout and the
SDLC are in [specs/README.md](../../specs/README.md); the check layers are in
[docs/testing-strategy.md](../../docs/testing-strategy.md). This file holds the rules a
spec edit must follow.

## Which spec
- One capability has one living spec: `specs/features/<feature>.md`. Never keep two specs describing the same behaviour
- A small change updates the living spec (`/spec`). A large one gets a Spec Kit design record `specs/###-slug/` with `spec.md`, `plan.md`, `tasks.md` (`/speckit-specify` … `/speckit-tasks`). Both are then built with `/build-feature`, never `/speckit-implement`
- Once a design record's slice ships, the shipped behaviour moves into the living spec and `specs/stc/<feature>/`. The record's status says which slices are built and points to the living file
- A bug fix that changes no specified behaviour needs no spec change, but its test names the requirement issue it protects. A fix that changes behaviour updates the spec in the same pull request

## Requirement issues
- Each acceptance scenario is one GitLab issue in `bjjeire/requirements`, cited as `` `#NNNN` `` (provisional ids are fine until the issues exist; say so on the **Requirements** line)
- The epic stays on the overlay's **Requirements** line; each scenario heading cites its issue
- Ranges are per epic (`#1xxx` gyms, `#2xxx` events, `#3xxx` competitions, `#4xxx` stores and shop, `#5xxx` BJJ Éire competitions, `#6xxx` merch). Read `specs/stc/README.md` before taking a new range
- Never renumber or reuse an issue. A withdrawn scenario keeps its id with a note

## What a spec says
- Behaviour, scope, edge cases and what "done" looks like, in Given / When / Then
- Not classes, methods or task lists: the build derives those from the code, and a wrong detail in a spec cascades into it. A Spec Kit `plan.md` may name packages and files; `spec.md` does not
- Name the contract a scenario touches: the route, the document (`specs/database-contracts/<entity>.md`), the flag
- Out of scope, assumptions and open questions are explicit sections, not prose buried in a story

## Overlay and traceability (`specs/stc/<feature>/`)
- `spec.md`: one section per requirement issue, with the layer that **Owns** it (T1 unit, T2 IT, T3/T4 SPA, T6 acceptance)
- `contract.yaml`: the served surface. Describe only what exists; planned routes stay in the design record's `contracts/`
- `traceability.md`: one row per issue and layer, naming the real test and implementation paths. Update it in the same change as the test
- Tests carry their issue: `@Tag("#NNNN")` in JUnit, the issue in the Vitest `it` title or a comment, `Covers:` in `bjjeire-tests`

## Decisions
- A change that reverses or extends an ADR, or amends the constitution, needs its own ADR in `docs/adr/` (copy `0000-template.md`, take the next free number), a line in `docs/adr/README.md`, and a row in the `AGENTS.md` table if an agent could plausibly undo it
- A constitution amendment bumps the version and adds a dated amendment note with a migration line
- A claim in an ADR about another repository (`bjjeire-gitops`, `bjjeire-terraform-azurerm-aks`) must be checked there first

## Acceptance coverage
- Visitor-observable scenarios get a planned block in `/workspaces/bjjeire-tests/specs/features/<feature>.md`, in that file's wording. Scenarios only; that repository writes the tests (`/cover-feature`)
