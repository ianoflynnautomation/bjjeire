# Database contract: BjjEvent

**Collection**: `BjjEvent`
**Java**: `com.bjjeire.api.event.BjjEvent`
**Seeder template**: `seeder/data/bjj-events/_template.json`
**API contract**: [../stc/events/contract.yaml](../stc/events/contract.yaml) (routes, filters, write rules, cache)

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `version` | `version` | long | optimistic lock; clients send it back on update |
| `expiresAt` | `expiresAt` | Instant | TTL; real `endDate + 2y`. Open-ended events are not expired |
| `name` | `name` | string | |
| `description` | `description` | string | |
| `types` | `types` | `BjjEventType[]` | |
| `organiser` | `organiser` | `Organizer` | British spelling in JSON |
| `status` | `status` | `EventStatus` | |
| `statusReason` | `statusReason` | string | |
| `socialMedia` | `socialMedia` | `SocialMedia` | |
| `county` | `county` | `County` | |
| `location` | `location` | `Location` | derived `latitude` / `longitude` omitted when the pair is absent |
| `schedule` | `schedule` | `BjjEventSchedule` | missing `endDate` is stored as `9999-12-31T00:00:00Z` and returned as null |
| `pricingOptions` | `pricingOptions` | `PricingModel[]` | |
| `eventUrl` | `eventUrl` | string | |
| `imageUrl` | `imageUrl` | string | |
| `active` | `isActive` | boolean | |
| audit | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` | | |

## `EventStatus`

`Postponed`, `Upcoming`, `RegistrationOpen`, `RegistrationClosed`,
`Ongoing`, `Completed`, `Canceled`.

## Indexes

Startup fails if any of these cannot be built.

- `ix_event_isActive_status_createdAt` on `(isActive, status, createdAt)` — default list order
- `ix_event_county_isActive_status_createdAt` on `(county, isActive, status, createdAt)` — county list order
- `ix_event_isActive_endDate` on `(isActive, schedule.endDate)` — deactivation sweep
- `ix_event_county_isActive` on `(county, isActive)`
- `ttl_event_expiresAt` on `expiresAt` (expire at stored date)
- Retired: `ix_event_county_status_endDate`

## Invariants

- `stampExpiry()` stores a missing `endDate` as the open-ended sentinel and
  sets `expiresAt` from a real `endDate + EXPIRY_GRACE` (2 years). The sentinel
  does not get an `expiresAt`.
- Coordinates `[lng, lat]`. Derived `latitude` / `longitude` are omitted when the pair is absent (same rule as [shared.md](shared.md)).
- A write accepts at most 64 `schedule.sessions` and 16 `pricingOptions`.
