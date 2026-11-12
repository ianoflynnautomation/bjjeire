# STC Check Catalog: [FEATURE NAME]

Copy this file to `specs/stc/<feature>/spec.md` and fill it. Behavioural
narrative stays in `specs/features/<feature>.md` — this overlay is IDs,
contracts, and the test map.

Also add `contract.yaml` and `traceability.md` in the same folder.
See `docs/testing-strategy.md` and `specs/stc/gyms/` for a filled example.

A criterion is a GitLab issue in `bjjeire/requirements`. Put the epic on the
**Requirements** line (`&1` for gyms). Headings and traceability rows cite the
issue (`#1001`). Copy the shape from `specs/stc/gyms/`; a new feature takes the
next epic's range from `specs/stc/README.md`. `bjjeire-tests` `Covers:` is the
same issue. CI stays on GitHub.

```markdown
---
feature: [slug]
ssot: specs/features/[slug].md
database: specs/database-contracts/[entity].md
api_package: com.bjjeire.api.[package]
spa: src/bjjeire-app/src/features/[folder]
acceptance: bjjeire-tests/tests/features/[folder]/
status: draft
---

# STC: [FEATURE NAME]

**Requirements**: `bjjeire/requirements` · epic `&<n>`

## User intent

[One paragraph. Who, what, fail-closed flags, auth.]

## Acceptance criteria

### `#1001` — [title] (P1)

Given [state],
When [action],
Then [outcome].

**Owns**: [T1 Java unit | T2 Java IT | T3 SPA unit | T4 SPA integration | T6 Playwright]
**Does not own**: [the layer that must not repeat this matrix]

### `#1002` — [title] (P1)

…

## Executable contract

See `contract.yaml`.

## Traceability

See `traceability.md`. Every requirement issue in this file MUST appear there.
```

## `contract.yaml`

```yaml
feature: [slug]
openapi:
  served: /v3/api-docs
  artifact: ghcr.io/<owner>/bjjeire-openapi-contract
  routes:
    - method: GET
      path: /api/v1/[resource]
      auth: public
      response: PagedResponse<[Dto]>
    - method: POST
      path: /api/v1/[resource]
      auth: bearer
pagination:
  page: 1-based
  pageSize: max 100
filters: {}
# writes: only when the controller maps them (create / update / delete / idempotency_key)
invariants:
  # API and UI behaviour only: listing rules, feature flags, URL state, cache tag.
  # Fields, enums, indexes and stored-data rules belong in the database contract below.
  - feature_flag: [Flag] fail-closed
  - cache_tag: [FEATURE]_TAG invalidated on writes
pointers:
  database: specs/database-contracts/[entity].md
  pact: src/bjjeire-app/src/contracts/pact/[feature].pact.test.ts
  msw: src/bjjeire-app/src/testing/msw/handlers/[feature].ts
  generated_types: src/bjjeire-app/src/types/generated/api.ts
  ui_strings: src/bjjeire-app/src/config/ui-content.ts
  test_ids: src/bjjeire-app/src/constants/[feature]DataTestIds.ts
```

## `traceability.md`

```markdown
# Traceability: [feature]

| Issue | Layer | Test path | Implementation path |
|---|---|---|---|
| `#1001` | IT | `src/bjjeire-api/src/test/java/com/bjjeire/api/[pkg]/[Class]IT.java` | `[Class]` |
| `#1001` | SPA integration | `src/bjjeire-app/src/pages/__tests__/[page].integration.test.tsx` | `[Page]` |
| `#1001` | Acceptance | `bjjeire-tests/tests/features/[folder]/` | running images |
```
