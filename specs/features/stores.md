# Feature: Stores

**Status**: Living (brownfield)
**Database**: [../database-contracts/store.md](../database-contracts/store.md)
**API**: `/api/v1/store`
**SPA route**: `/stores`
**Acceptance**: `bjjeire-tests/tests/features/stores/`

## User Story 1 — Browse stores (P1)

1. Given available stores, when a visitor opens Stores, then the store list is displayed
2. Given stores are published, when a client opens the directory, then each published store is returned with its details
3. Given stores are published, when a client opens the directory, then they are ordered by name

## User Story 2 — Search (P1)

1. Given a store name / part of a name, when a visitor searches, then only that store is displayed

Search is client-side. No county filter.

## User Story 3 — Empty and error (P2)

Same empty / network / server-error pattern as gyms.

## Requirements

- **FR-001**: Public `GET /api/v1/store` returns `PagedResponse<StoreDto>`
- **FR-002**: Default order is name
- **FR-003**: Public reads, authenticated writes

## Success criteria

- **SC-001**: A visitor can isolate a seeded store with search
