# Feature: Competitions

**Status**: Living (brownfield)
**Database**: [../database-contracts/competition.md](../database-contracts/competition.md)
**API**: `/api/v1/competition`
**SPA route**: `/competitions`
**Acceptance**: `bjjeire-tests/tests/features/competitions/`

## User Story 1 — Browse competitions (P1)

1. Given available competitions, when a visitor opens Competitions, then the competition list is displayed
2. Given competitions are published, when a client opens the listing, then each published competition is returned with its details
3. Given a competition has finished, when a client opens the listing, then it is not shown
4. Given several competitions are published, when a client opens the listing, then they are ordered by start date

## User Story 2 — Search and page (P1)

1. Given a competition name / part of a name, when a visitor searches, then only that competition is displayed
2. Given the listing spans more than one page, when a visitor moves between pages, then each page shows its own competitions

Search is client-side. There is no county on this aggregate.

## User Story 3 — Empty and error (P2)

Same empty / network / server-error pattern as gyms.

## Requirements

- **FR-001**: `slug` is unique (critical index)
- **FR-002**: Finished competitions are excluded from the listing
- **FR-003**: Default country is Ireland
- **FR-004**: Public reads, authenticated writes

## Success criteria

- **SC-001**: A visitor can isolate a seeded competition with search
- **SC-002**: Listing is ordered by start date and omits finished events
