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
3. Update the living spec in `specs/features/<feature>.md`. If the change is large enough
   to need a plan and a task list, stop and suggest the Spec Kit flow instead
   (`/speckit-specify`), which writes a numbered `specs/00N-slug/` directory with separate
   `spec.md`, `plan.md` and `tasks.md`. That applies to an existing capability too.
   `/build-feature` folds a numbered spec back into the living file, so two specs never
   describe one capability once the change ships.
4. Add the GitLab requirement issues to `specs/stc/<feature>/spec.md`, using
   `.specify/templates/stc-check.template.md` if the overlay is missing. The epic
   stays on the **Requirements** line. A heading cites the issue (`#1001`). Update
   the database contract if the document shape moves.

Describe behaviour, scope and high-level design. Leave out classes, methods and task
lists: the build derives those from the code, and a wrong detail here cascades into it.

Stop after writing. List the open questions and the issue ids. To build, I will run
`/clear`, then `/build-feature <spec path>`.
