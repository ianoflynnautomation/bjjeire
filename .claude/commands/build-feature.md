---
description: Build a reviewed spec with failing tests first, then verify it with an independent reviewer.
argument-hint: <spec path>
---

Build the feature specified in `$ARGUMENTS`. You coordinate the work and write the code
in this session. Delegate only review and QA, because those need fresh context.

1. If the spec is missing or has no requirement issues, stop and suggest `/spec`. If this is the
   default branch, create a feature branch first.
2. Read the spec, its `specs/stc/` overlay and a similar feature (`gym`). For a Spec Kit
   spec (`specs/###-slug/spec.md`), also read `plan.md`, `tasks.md` and any `data-model.md`
   or `contracts/` beside it. Treat the tasks as a checklist, not an order: the issue loop
   below still sets the order. Read the ADR named in `AGENTS.md` for anything you will touch.
3. If the wire or document shape moves, update the contract first (ADR-0002). Fix the SPA
   in the same change.
4. Work through the requirement issues in order: failing test, then code. API first, then SPA.
   Update `specs/stc/<feature>/traceability.md` as you go.
5. Run the verification commands from `AGENTS.md` for what you changed, in the dev
   container (from the Mac, `devcontainer exec --workspace-folder . <command>`). Show the
   commands and their output. Do not report success without them.
6. Run the `spec-verifier` subagent. Pass it the spec path and the full output of
   `git diff $(git merge-base HEAD main)` plus any untracked files. Fix every FAIL and
   rerun it. After two failed rounds on the same issue, stop and ask me.
7. If visitors can see the change, run the `qa-subagent` against the running app. Fix
   what it confirms, or report it to me.
   If you built from a Spec Kit spec, write the shipped behaviour into
   `specs/features/<feature>.md` and the requirement issues into `specs/stc/<feature>/spec.md`. Then set
   the Spec Kit spec's status to `Implemented — living spec: specs/features/<feature>.md`.
   The living file is the spec from then on.

8. If the change needs acceptance coverage, add the scenarios to
   `/workspaces/bjjeire-tests/specs/features/<feature>.md`, which is what that repo's planner
   and `/cover-feature` read. Follow that file's wording, and that repo's `AGENTS.md` and
   `playwright-bdd` skill for titles. Add scenarios only: no tests, and leave existing
   scenarios alone unless the behaviour changed. If the folder is missing, say so and list the
   scenarios instead.

Do not commit, push or merge in either repository unless I ask. Finish with: the requirement-issue
results, the commands you ran, anything unverified, and the scenarios added to `bjjeire-tests`.
To automate them, I run `/cover-feature <feature>` in the `bjjeire-tests` dev container.
