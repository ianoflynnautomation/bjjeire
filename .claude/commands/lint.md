---
description: Run every code quality check CI runs, and report errors by tool
allowed-tools: Bash(npm --prefix src/bjjeire-app run *), Bash(npm --prefix src/bjjeire-app exec *), Bash(mvn *)
---

These ran before this prompt was sent.

TypeScript:
!`npm --prefix src/bjjeire-app run typecheck 2>&1 | tail -40`

ESLint (`--fix` is on, so it may rewrite files):
!`npm --prefix src/bjjeire-app run lint 2>&1 | tail -40`

Prettier, as CI's `frontend_lint` checks it:
!`npm --prefix src/bjjeire-app exec -- prettier --check src/bjjeire-app/src 2>&1 | tail -20`

Java gate (Spotless, Checkstyle, Error Prone, compile):
!`mvn -q -pl src/bjjeire-api verify -DskipTests 2>&1 | tail -30`

Report the errors grouped by tool, with `file:line`. If every check passed, say "All checks passed".
Fix nothing unless I ask.
