---
description: Build a reviewed spec with failing tests first, then verify it with an independent reviewer.
argument-hint: <spec path>
---

Build the feature specified in `$ARGUMENTS`. You coordinate the work and write the code
in this session. Delegate only review and QA, because those need fresh context.

1. If the spec is missing or has no AC-IDs, stop and suggest `/spec`. If this is the
   default branch, create a feature branch first.
2. Read the spec, its `specs/stc/` overlay and a similar feature (`gym`). Read the ADR
   named in `AGENTS.md` for anything you will touch.
3. If the wire or document shape moves, update the contract first (ADR-0002). Fix the SPA
   in the same change.
4. Work through the AC-IDs in order: failing test, then code. API first, then SPA.
   Update `specs/stc/<feature>/traceability.md` as you go.
5. Run the verification commands from `AGENTS.md` for what you changed, in the dev
   container (from the Mac, `devcontainer exec --workspace-folder . <command>`). Show the
   commands and their output. Do not report success without them.
6. Run the `spec-verifier` subagent. Pass it the spec path and the full output of
   `git diff $(git merge-base HEAD main)` plus any untracked files. Fix every FAIL and
   rerun it. After two failed rounds on the same AC-ID, stop and ask me.
7. If visitors can see the change, run the `qa-subagent` against the running app. Fix
   what it confirms, or report it to me.

Do not commit, push or merge unless I ask. Finish with: the AC-ID results, the commands
you ran, anything unverified, and the scenarios to hand to `bjjeire-tests` (planner, then
generator or api-tester, then reviewer).
