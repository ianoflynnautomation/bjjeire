---
name: playwright-agents
description: Run Playwright Test Agents (planner, generator, healer) for BjjEire smoke and regression. Plans live in specs/playwright/; executable tests go to bjjeire-tests. Use when the user asks for Playwright agents, init-agents, smoke/regression plans, or healing acceptance tests.
---

# Playwright Test Agents (BjjEire)

Read [specs/playwright/README.md](../../../specs/playwright/README.md) first.

## Layout

| Artifact | Location |
|---|---|
| Plans | `specs/playwright/` in **this** repo |
| Seed | `specs/playwright/seed.md` → gyms UI smoke in bjjeire-tests |
| Specs | `../bjjeire-tests/tests/features/<feature>/` |
| MCP | `tools/playwright-test-mcp.sh` (cwd = bjjeire-tests) |

If `../bjjeire-tests` is missing, stop and ask for `BJJ_EIRE_TESTS_ROOT`.

## Sequence

1. **Planner** (`.claude/agents/playwright-test-planner.md`) — explore the app, write/update `specs/playwright/smoke.md` or `regression.md`.
2. **Generator** (`.claude/agents/playwright-test-generator.md`) — add `test()` cases in bjjeire-tests using `@ui/fixtures` and seeded data.
3. **Healer** (`.claude/agents/playwright-test-healer.md`) — fix locators/waits in bjjeire-tests only.

Do not add Playwright `*.spec.ts` under `src/bjjeire-app` or a `tests/` tree in this repo.

## Commands (from bjjeire-tests)

```bash
npm run test:smoke
npm run test:acceptance
```

## Guardrails

- Titles match `specs/features/` Given/When/Then.
- `@smoke` only on the critical open-list journey.
- No `test.fixme`, XPath, or `waitForTimeout`.
- Never assert unfiltered page-1 membership against a full environment.
