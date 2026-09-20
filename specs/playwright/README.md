# Playwright Test Agents

Planner / generator / healer loop for **acceptance** tests
([Playwright Test Agents](https://playwright.dev/docs/test-agents)).

This repository owns **plans**. The Playwright suite lives in
[`bjjeire-tests`](https://github.com/ianoflynnautomation/bjjeire-tests)
(local sibling `../bjjeire-tests`, or `BJJ_EIRE_TESTS_ROOT`). Do not add
`*.spec.ts` Playwright files here — that duplicates T6 and is forbidden by
the [testing strategy](../../docs/testing-strategy.md).

```
bjjeire-java/specs/playwright/     ← plans (this folder)
bjjeire-tests/tests/features/      ← generated / healed specs
bjjeire-tests/src/ui/              ← page objects, fixtures
bjjeire-tests/tests/testdata/      ← seeded DTOs
```

## Loop

1. **Planner** — explore the running app, write or update a plan in this folder.
2. **Generator** — turn a scenario into a spec **in bjjeire-tests**, using
   `@ui/fixtures`, page objects, and seeded data.
3. **Healer** — debug a red spec in bjjeire-tests. Locator/`getByRole` only.
   Never `test.fixme()`, never XPath, never `waitForTimeout()`. If the product
   is wrong, stop; do not weaken the test.

Regenerate upstream agent files after a Playwright bump, then keep the
BjjEire overlay (paths, tags, healer guardrails):

```bash
# from a scratch dir, not this repo root (no playwright.config here)
npx playwright init-agents --loop=claude
npx playwright init-agents --loop=vscode
```

Copy the generated definitions over `.claude/agents/playwright-test-*.md` and
`.github/agents/playwright-test-*.agent.md`, then restore the overlay that
points at this folder and bjjeire-tests.

MCP: `.github/mcp.json` and `.vscode/mcp.json` start
`tools/playwright-test-mcp.sh`, which `cd`s into bjjeire-tests
(`BJJ_EIRE_TESTS_ROOT`, or sibling `../bjjeire-tests`). The script
exits 1 if that checkout is missing.

## Seed

See [seed.md](seed.md). The seed **test** is in bjjeire-tests (Gyms UI smoke).
The planner must load that file, not a seed in this repo.

## Tags (bjjeire-tests)

| Tag | Meaning |
|---|---|
| `@acceptance` | Every test |
| `@smoke` | Critical happy path only (Compose smoke + Firefox/WebKit tax) |
| `@ui` / `@api` / `@snapshot` | Suite kind |
| `@gyms` `@events` `@competitions` `@stores` | Feature |
| `@desktop` / `@mobile` | Viewport family |

## Titles

Playwright `test('…')` titles must match the Given/When/Then lines in
`specs/features/` (this repo) and `bjjeire-tests/specs/features/`.
Do not invent a third wording.
