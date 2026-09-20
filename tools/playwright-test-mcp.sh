#!/usr/bin/env bash
# Start Playwright Test MCP against bjjeire-tests (not this repo).
# Override the checkout with BJJ_EIRE_TESTS_ROOT.
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
tests_root="${BJJ_EIRE_TESTS_ROOT:-$repo_root/../bjjeire-tests}"

if [[ ! -f "$tests_root/playwright.config.ts" ]]; then
  echo "bjjeire-tests not found at $tests_root" >&2
  echo "Clone it as a sibling of bjjeire-java, or set BJJ_EIRE_TESTS_ROOT." >&2
  exit 1
fi

cd "$tests_root"
exec npx playwright run-test-mcp-server -c playwright.acceptance.config.ts "$@"
