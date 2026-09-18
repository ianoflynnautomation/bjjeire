# Feature: Events

**Status**: Living (brownfield)
**Database**: [../database-contracts/bjj-event.md](../database-contracts/bjj-event.md)
**API**: `/api/v1/bjjevent`
**SPA route**: `/events`
**Acceptance**: `bjjeire-tests/tests/features/events/`

## User Story 1 — Browse upcoming events (P1)

1. Given available events, when a visitor opens Events, then the event list is displayed
2. Given events are published, when a client opens the listing, then each upcoming event is returned with its details
3. Given an event has finished, when a client opens the listing, then it is not shown
4. Given several events are published, when a client opens the listing, then they are ordered by creation date

## User Story 2 — Search and filter (P1)

1. Given an event name / part of a name, when a visitor searches, then only that event is displayed
2. Given an active search, when the visitor clears it, then events from the full listing are displayed again
3. Given a visitor searches, when results narrow, then the header count reflects the matching events
4. Given events in several counties, when a visitor filters by county, then only events from that county are displayed
5. Given events of several types, when a visitor filters by type, then only events of that type are displayed
6. Given an event has several types, when a client filters by any one of them, then the event is returned

Search is client-side; county and type are server filters.

## User Story 3 — Empty and error (P2)

Same empty / network / server-error pattern as gyms.

## Requirements

- **FR-001**: Listing returns upcoming/active events only
- **FR-002**: `expiresAt` TTL eventually removes documents after `endDate + 2y`
- **FR-003**: Public reads, authenticated writes
- **FR-004**: Organiser field uses British spelling `organiser` on the wire

## Success criteria

- **SC-001**: Finished events do not appear in the listing
- **SC-002**: County and type filters compose with search
