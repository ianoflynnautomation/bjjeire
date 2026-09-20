# Seed

**Seed test (bjjeire-tests):** `tests/features/gyms/gyms.ui.acceptance.spec.ts`  
**Scenario:** Given available gyms, when a visitor opens Gyms, then the gym list is displayed  
**Tags:** `@smoke` `@acceptance` `@gyms` `@ui` `@desktop`  
**Fixture:** `import { test } from '@ui/fixtures'` → `{ gymsPage }`

Planner: pass this seed into `planner_setup_page` so global setup, feature flags,
and seeded Mongo are the same as CI Compose `@smoke`.

## App under test

| Env | How |
|---|---|
| Local Compose | `docker compose --profile app --profile mongo up -d` — SPA `http://localhost:3000`, API `http://localhost:5003` |
| Minikube port-forward | `BASE_URL=http://127.0.0.1:8080` as in bjjeire-tests `CLAUDE.md` |

Feature flags fail closed. If `/gyms` redirects to About, the flags fetch failed
(often API rate limit on a port-forward). Do not stub flags in production code.

## Data

Use **seeded** names from `bjjeire-tests/tests/testdata/seeded/`, which match
`seeder/data-test/` in this repo. Never assert that a fixture is item 1 of an
unfiltered full-environment list.

## Selectors

`getByRole` / `getByLabel` / `getByText`. Test IDs only from
`src/bjjeire-app/src/constants/*DataTestIds.ts` (mirrored in bjjeire-tests page
constants). No CSS/XPath.
