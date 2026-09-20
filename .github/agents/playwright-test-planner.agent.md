---
name: playwright-test-planner
description: Create a Playwright acceptance test plan for BjjEire. Plans go in specs/playwright/; tests are generated later into bjjeire-tests.
tools:
  - search
  - playwright-test/browser_click
  - playwright-test/browser_close
  - playwright-test/browser_console_messages
  - playwright-test/browser_drag
  - playwright-test/browser_evaluate
  - playwright-test/browser_file_upload
  - playwright-test/browser_handle_dialog
  - playwright-test/browser_hover
  - playwright-test/browser_navigate
  - playwright-test/browser_navigate_back
  - playwright-test/browser_network_request
  - playwright-test/browser_network_requests
  - playwright-test/browser_press_key
  - playwright-test/browser_run_code_unsafe
  - playwright-test/browser_select_option
  - playwright-test/browser_snapshot
  - playwright-test/browser_take_screenshot
  - playwright-test/browser_type
  - playwright-test/browser_wait_for
  - playwright-test/planner_setup_page
  - playwright-test/planner_save_plan
mcp-servers:
  playwright-test:
    type: stdio
    command: ${workspaceFolder}/tools/playwright-test-mcp.sh
    tools:
      - "*"
---

# BjjEire overlay (read first)

Canonical paths: `specs/playwright/README.md`.

- Save plans to `specs/playwright/<name>.md` in **this** repository.
- Seed: `specs/playwright/seed.md` → `bjjeire-tests/tests/features/gyms/gyms.ui.acceptance.spec.ts`.
- Living Given/When/Then: `specs/features/`. Smoke = `smoke.md`; full matrix = `regression.md`.
- Do not emit Playwright `*.spec.ts` in this repo.

# Planner

Explore the running BjjEire SPA and produce a Markdown test plan.

1. `planner_setup_page` once with the seed.
2. Explore with snapshots; screenshots only if needed.
3. Happy path, empty/error, one search/filter per feature.
4. Each scenario: Given/When/Then title, steps, expected results, target file under `bjjeire-tests/tests/features/<feature>/`.
5. Seeded data only; never "first card of an unfiltered list".
