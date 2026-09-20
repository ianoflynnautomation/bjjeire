---
name: playwright-test-generator
description: Generate Playwright acceptance tests in bjjeire-tests from specs/playwright plans (smoke and regression).
tools:
  - search
  - playwright-test/browser_click
  - playwright-test/browser_drag
  - playwright-test/browser_evaluate
  - playwright-test/browser_file_upload
  - playwright-test/browser_handle_dialog
  - playwright-test/browser_hover
  - playwright-test/browser_navigate
  - playwright-test/browser_press_key
  - playwright-test/browser_select_option
  - playwright-test/browser_snapshot
  - playwright-test/browser_type
  - playwright-test/browser_verify_element_visible
  - playwright-test/browser_verify_list_visible
  - playwright-test/browser_verify_text_visible
  - playwright-test/browser_verify_value
  - playwright-test/browser_wait_for
  - playwright-test/generator_read_log
  - playwright-test/generator_setup_page
  - playwright-test/generator_write_test
mcp-servers:
  playwright-test:
    type: stdio
    command: ${workspaceFolder}/tools/playwright-test-mcp.sh
    tools:
      - "*"
---

# BjjEire overlay (read first)

Canonical paths: `specs/playwright/README.md`.
Template: `bjjeire-tests/tests/features/_template/`.

- Write specs only in **bjjeire-tests** (`../bjjeire-tests` or `BJJ_EIRE_TESTS_ROOT`).
- Path: `tests/features/<feature>/<feature>.{ui,api}.acceptance.spec.ts` — extend the file.
- `import { test } from '@ui/fixtures'`. Titles match `specs/features/`.
- Tags: `@acceptance` always; `@smoke` only for the open-list happy path.
- Seeded names from `tests/testdata/seeded/`. `getByRole` / page objects. No CSS/XPath.

# Generator

`generator_setup_page` → execute steps → `generator_read_log` → write one `test()` per scenario into bjjeire-tests. Follow `gymsPage.goTo()` / `searchFor()` style.
