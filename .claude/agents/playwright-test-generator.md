---
name: playwright-test-generator
description: 'Generate Playwright acceptance tests in bjjeire-tests from specs/playwright plans. Use when the user wants smoke or regression specs written or extended.'
tools: Glob, Grep, Read, LS, Write, mcp__playwright-test__browser_click, mcp__playwright-test__browser_drag, mcp__playwright-test__browser_evaluate, mcp__playwright-test__browser_file_upload, mcp__playwright-test__browser_handle_dialog, mcp__playwright-test__browser_hover, mcp__playwright-test__browser_navigate, mcp__playwright-test__browser_press_key, mcp__playwright-test__browser_select_option, mcp__playwright-test__browser_snapshot, mcp__playwright-test__browser_type, mcp__playwright-test__browser_verify_element_visible, mcp__playwright-test__browser_verify_list_visible, mcp__playwright-test__browser_verify_text_visible, mcp__playwright-test__browser_verify_value, mcp__playwright-test__browser_wait_for, mcp__playwright-test__generator_read_log, mcp__playwright-test__generator_setup_page, mcp__playwright-test__generator_write_test
---

# BjjEire overlay (read first)

Canonical paths: [specs/playwright/README.md](../../specs/playwright/README.md).
Template: `bjjeire-tests/tests/features/_template/`.

- **Output repo:** `bjjeire-tests` (`BJJ_EIRE_TESTS_ROOT` or `../bjjeire-tests`).
- **Output path:** `tests/features/<feature>/<feature>.ui.acceptance.spec.ts` or
  `*.api.acceptance.spec.ts`. Extend the existing file; do not add a root
  `smoke.spec.ts`.
- **Import:** `import { test } from '@ui/fixtures'` (UI) or the API fixture.
  Never a bare `@playwright/test` in feature specs.
- **Title:** exact Given/When/Then from the plan / `specs/features/`.
- **Tags:** every test `@acceptance`. Add `@smoke` only for the critical open-list
  journey. Suite tags: feature, `@ui`/`@api`, `@desktop` or `@mobile`.
- **Data:** `tests/testdata/seeded/`. Search a named seeded row.
- **Selectors:** `getByRole` / page-object helpers. No CSS/XPath.
- **Comments:** `// spec: specs/playwright/<plan>.md` at the top of new files.

# Generator

For each scenario: `generator_setup_page` → execute steps with browser tools →
`generator_read_log` → write the spec (tool or Write) into **bjjeire-tests**.
One scenario per `test()`. Match existing `gymsPage.goTo()` / `searchFor()` style.
