---
description: Review the uncommitted changes against this repository's own rules
allowed-tools: Bash(git diff *), Bash(git status *)
---

For a general correctness review use the built-in `/code-review`. This command checks only
the project rules that tools do not catch.

Changes (working tree and index against `HEAD`):
!`git status --short`
!`git diff HEAD`

Check:
1. **Spec.** Does each behaviour change trace to a requirement issue in `specs/stc/<feature>/spec.md`, with a test tagged with that issue and a row in `traceability.md`? Does the living spec `specs/features/<feature>.md` still describe what the code does?
2. **Package-by-feature (ADR-0001).** Feature code sits in its feature package. Code goes in `common` only when two features use it.
3. **Contracts (ADR-0002).** A renamed DTO, command, response or domain class is a breaking OpenAPI change. A wire or document shape change needs the database contract, the SPA types and the Pact test in the same change.
4. **Flags.** A new flag is in all three places: `web.FeatureFlag`, `application.yml` and `definitions.ts`, failing closed.
5. **Auth.** A new route is placed in `SecurityConfig` on purpose (public, admin, competitor, guest or signed webhook), and an integration test pins it.
6. **SPA.** UI text comes from `config/content/`, test ids from `constants/*DataTestIds.ts`. Components use the `export const Name = function Name()` form. No new `memo`, `useMemo` or `useCallback` without a compiler bail-out.
7. **Data.** No `"isAvailable": null` in seeder JSON. GeoJSON is `[longitude, latitude]`. Mongo queries are typed `Criteria`, never built from strings.
8. **Secrets.** No credential, token or `.env` value in the diff.

Report by severity (Critical, Warning, Suggestion), each finding with `file:line` and a one-line fix.
