---
description: Interview the user, then write or update a feature spec for review.
argument-hint: <feature or idea>
---

Write the spec for `$ARGUMENTS`. Write no code.

1. Read `.specify/memory/constitution.md`, `specs/README.md`, and any existing
   `specs/features/<feature>.md`, `specs/stc/<feature>/` and
   `specs/database-contracts/<entity>.md`.
2. Interview me until you could write the spec. Ask about what the code cannot tell you:
   who it is for, what is out of scope, edge cases, and what "done" looks like. Do not
   ask what you can find by reading the repo.
3. Update the living spec in `specs/features/<feature>.md`. Use a numbered
   `specs/00N-slug/` directory only for a capability with no living file. Never leave two
   specs for one capability.
4. Add AC-IDs to `specs/stc/<feature>/spec.md`, using
   `.specify/templates/stc-check.template.md` if the overlay is missing. Update the
   database contract if the document shape moves.

Describe behaviour, scope and high-level design. Leave out classes, methods and task
lists: the build derives those from the code, and a wrong detail here cascades into it.

Stop after writing. List the open questions and the AC-IDs. To build, I will run
`/clear`, then `/build-feature <spec path>`.
