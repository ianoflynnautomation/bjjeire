---
description: Run the frontend and backend test suites and summarise the results
allowed-tools: Bash(npm --prefix src/bjjeire-app run *), Bash(mvn *)
---

These ran before this prompt was sent. Run them in the dev container: on the Mac host a missing
JDK or a Vitest startup error is expected (`AGENTS.md`).

Frontend unit:
!`npm --prefix src/bjjeire-app run test 2>&1 | tail -20`

Frontend integration:
!`npm --prefix src/bjjeire-app run test:integration 2>&1 | tail -20`

Frontend browser (Vitest with Playwright Chromium; needs the browsers installed):
!`npm --prefix src/bjjeire-app run test:browser 2>&1 | tail -20`

Backend unit and integration (Testcontainers; needs Docker):
!`mvn -pl src/bjjeire-api verify 2>&1 | grep -E "Tests run:|BUILD|\[ERROR\]" | tail -30`

Summarise:
- passed and failed per suite (unit, integration, browser, Java);
- each failing test's name and error message;
- for a browser failure, whether a screenshot landed in `src/bjjeire-app/__screenshots__/`;
- the likely fix, only when the cause is clear from the output.

The Playwright image CI uses is pinned in `.claude/rules/github-actions.md`.
