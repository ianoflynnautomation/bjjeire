---
emoji: 🗃️
name: schema-drift
description: Check Mongo documents, seeder templates, and API DTOs against database contracts
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    paths:
      - "src/bjjeire-api/src/main/java/com/bjjeire/api/**"
      - "seeder/data/**"
      - "seeder/data-test/**"
      - "specs/database-contracts/**"
      - "src/bjjeire-app/src/types/**"
      - "src/bjjeire-app/pacts/**"
permissions:
  contents: read
  pull-requests: read
  issues: read
  actions: read
engine: claude
strict: true
network:
  allowed: [defaults, github]
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
safe-outputs:
  add-comment:
    max: 1
---

# Schema drift

## Task

Compare the four representations of each changed aggregate in PR
${{ github.event.pull_request.number }}:

| Surface | Path |
|---|---|
| Database contract | `specs/database-contracts/{gym,bjj-event,competition,store,shared}.md` |
| Java `@Document` + DTO + commands | `src/bjjeire-api/src/main/java/com/bjjeire/api/<feature>/` |
| Seeder template | `seeder/data/<entity>/_template.json` |
| Indexes | `src/bjjeire-api/src/main/java/com/bjjeire/api/config/MongoIndexInitializer.java` |

Also read `.specify/rules/mongodb-rules.md` and `specs/database-contracts/shared.md`.

Use `gh` to list the PR files and show the diff. Stay inside this repository.

## Alignment rules

- GeoJSON coordinates are `[longitude, latitude]`. Flag any seeder or DTO
  example that uses lat-first order.
- `trialOffer.isAvailable` is a boolean, never `null`.
- Collection names: `Gym`, `BjjEvent`, `Competition`, `Store`.
- Competition `slug` unique index is critical — do not drop it.
- There is no `2dsphere` index today. Do not report its absence as drift.
- Java field `createdOnUtc` maps to Mongo `createdAt` (and the other audit
  aliases in the contract). That mapping is intentional, not drift.
- DTO-only fields (for example gym `thumbnailUrl`) must be labelled as
  non-stored in the contract if they are not in the seeder template.

## Required effects

Comment when any of the four surfaces disagree on a field name, type, nullability,
enum member, or index. Name the field and the files.

If the wire shape moved, add a follow-up line that Playwright Zod schemas in
`bjjeire-tests/src/api/features/*` must be updated — do not check that repo out
unless the GitHub tool already returns it; a checklist item is enough.

## No-op

Call `noop` when the four surfaces agree, the PR is a draft, or the change does
not touch a document field (for example a service-only refactor).

Do not edit files. Do not approve the PR.
