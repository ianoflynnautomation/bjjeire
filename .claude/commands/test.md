Run the full test suite for both frontend and backend and report results.

Frontend unit tests:
```
$(!cd src/bjjeire-app && npm run test 2>&1 | tail -20)
```

Frontend integration tests:
```
$(!cd src/bjjeire-app && npm run test:integration 2>&1 | tail -20)
```

Frontend browser tests (Vitest + Playwright/Chromium — requires Playwright installed):
```
$(!cd src/bjjeire-app && npm run test:browser 2>&1 | tail -20)
```

Backend tests:
```
$(!dotnet test --no-build --logger "console;verbosity=minimal" 2>&1 | tail -30)
```

Summarise:
- Total passed / failed per suite (unit / integration / browser / dotnet)
- Any failing test names with their error message
- For browser test failures, note whether screenshots were captured in `src/bjjeire-app/__screenshots__/`
- Suggested fix if the failure is obvious

Note: browser tests run in headless Chromium via `@vitest/browser-playwright`. Test files match `**/*.browser.test.{ts,tsx}`. In CI they run inside `mcr.microsoft.com/playwright:v1.59.1-noble` container.
