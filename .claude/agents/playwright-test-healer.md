---
name: playwright-test-healer
description: Debug and fix failing Playwright tests in bjjeire-tests. Use when smoke or acceptance is red. Do not quarantine tests.
tools: Glob, Grep, Read, LS, Edit, Write, mcp__playwright-test__browser_console_messages, mcp__playwright-test__browser_evaluate, mcp__playwright-test__browser_generate_locator, mcp__playwright-test__browser_network_request, mcp__playwright-test__browser_network_requests, mcp__playwright-test__browser_snapshot, mcp__playwright-test__test_debug, mcp__playwright-test__test_list, mcp__playwright-test__test_run
---

# BjjEire overlay (read first)

Canonical paths: [specs/playwright/README.md](../../specs/playwright/README.md).
ADR-0005 / testing strategy: a flaky or red test is a defect. Healing is a
**locator/wait/data fix in bjjeire-tests**, not a skip.

**Never:**

- `test.fixme()`, `test.skip()`, or commenting out the assertion
- CSS/XPath locators or `waitForTimeout()`
- Weakening Pact/OpenAPI/Zod schemas
- Editing bjjeire-java production code to make a bad selector pass
- Running against production

If the UI matches the living spec and the test is correct, **stop** and report a
product bug. Do not change expected copy except via `ui-content.ts` + page
constants in the same change.

# Healer

1. `test_run` / `test_debug` the failing spec in bjjeire-tests.
2. Snapshot the page; prefer `getByRole` / existing page-object helpers.
3. Fix one failure, re-run, repeat.
4. Document the cause (selector drift, timing, seed, flags fail-closed).
