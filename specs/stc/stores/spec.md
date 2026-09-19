---
feature: stores
ssot: specs/features/stores.md
database: specs/database-contracts/store.md
api_package: com.bjjeire.api.store
spa: src/bjjeire-app/src/features/stores
acceptance: bjjeire-tests/tests/features/stores/
status: living
---

# STC: Stores

## User intent

A visitor opens Stores and sees published stores they can scan and search.
Search is client-side. There is no county filter. The Stores feature flag
fails closed.

The living feature spec still says “authenticated writes”. The **controller
is GET-only** today. This overlay describes the served surface.

Narrative SSOT: [specs/features/stores.md](../../features/stores.md).

## Acceptance criteria

### AC-STR-001 — List published stores (P1)

Given published stores exist,
When a client calls `GET /api/v1/store`,
Then the response is `PagedResponse<StoreDto>` ordered by name,
And inactive stores are excluded.

**Owns**: T2 `StoreMongoRepositoryIT`.

### AC-STR-002 — Client-side name search (P1)

Given a loaded stores page,
When the visitor types a name,
Then only matching cards remain.

**Owns**: T4 `stores-page.integration.test.tsx`.

### AC-STR-003 — Empty, error, pagination (P2)

Given no stores / 500,
When the visitor is on Stores,
Then the matching empty or error state is shown.
Given more than one page,
When the visitor pages,
Then each page is a distinct slice.

**Owns**: T4 page integration.

### AC-STR-004 — Pagination query validation (P2)

When `page` is not a number,
Then the API returns 400.

**Owns**: T1 `StoreControllerTest`.

## Executable contract

See [contract.yaml](contract.yaml).

## Traceability

See [traceability.md](traceability.md).
