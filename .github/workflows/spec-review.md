---
emoji: 📋
name: spec-review
description: Evaluate a pull request against the living feature spec and constitution
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    paths:
      - "src/**"
      - "seeder/**"
      - "specs/**"
      - ".specify/**"
      - "docs/adr/**"
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

# Spec review

## Task

Review pull request ${{ github.event.pull_request.number }} against the living
specifications in this repository.

Read, in this order:

1. `.specify/memory/constitution.md`
2. `.github/aw/instructions.md`
3. `specs/README.md`
4. The feature spec and database contract that match the changed files
   (`specs/features/`, `specs/database-contracts/`)
5. The relevant ADR if the PR touches a governed surface (`AGENTS.md` table)
6. `.specify/rules/java-rules.md`, `react-ts-rules.md`, and/or `mongodb-rules.md`
   depending on the paths changed

Use `gh` (gh-proxy) to read the PR title, body, files, and diff.

## Required effects

- If the PR changes visitor-facing behaviour or a document/API shape **without**
  updating the matching spec and/or database contract, comment with the gaps
  and the files that must change.
- If the PR updates a spec in a way the code does not implement, comment with
  the unmatched acceptance scenarios.
- If the PR would break OpenAPI/Pact naming (DTO/command/domain rename) without
  calling that out, comment.
- If the PR tries to introduce Container Apps, Cosmos, `azd`, or a new top-level
  layered Java package, comment that it violates the constitution.

## No-op

Call `noop` with a short reason when:

- The PR is a draft
- Changes are tests-only, formatting, or seeder data that already matches
  `_template.json` and the contract
- Specs and code agree
- Only comments/docs that do not alter behaviour

Do not approve the PR. Do not request changes via a review event — use
`add-comment` only. Do not edit files. Do not mention `bjjeire-tests` code
as something you will patch; list follow-up Zod/Playwright work as a checklist
item instead.

## Comment shape

Use a short markdown comment:

- Verdict: in-spec / spec gap / constitution violation
- Specs read
- Gaps (file + FR/scenario id)
- Follow-ups for `bjjeire-tests` if the wire shape moved
