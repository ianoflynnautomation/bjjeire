# Database contract: BjjEvent

**Collection**: `BjjEvent`
**Java**: `com.bjjeire.api.event.BjjEvent`
**Seeder template**: `seeder/data/bjj-events/_template.json`
**API**: `/api/v1/bjjevent`

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `expiresAt` | `expiresAt` | Instant | TTL; `endDate + 2y` |
| `name` | `name` | string | |
| `description` | `description` | string | |
| `types` | `types` | `BjjEventType[]` | |
| `organiser` | `organiser` | `Organizer` | British spelling in JSON |
| `status` | `status` | `EventStatus` | |
| `statusReason` | `statusReason` | string | |
| `socialMedia` | `socialMedia` | `SocialMedia` | |
| `county` | `county` | `County` | |
| `location` | `location` | `Location` | |
| `schedule` | `schedule` | `BjjEventSchedule` | includes `endDate` |
| `pricingOptions` | `pricingOptions` | `PricingModel[]` | |
| `eventUrl` | `eventUrl` | string | |
| `imageUrl` | `imageUrl` | string | |
| `active` | `isActive` | boolean | |
| audit | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` | | |

## `EventStatus`

`Postponed`, `Upcoming`, `RegistrationOpen`, `RegistrationClosed`,
`Ongoing`, `Completed`, `Canceled`.

## Indexes

- `ix_event_isActive_endDate` on `(isActive, schedule.endDate)`
- `ix_event_county_isActive` on `(county, isActive)`
- `ttl_event_expiresAt` on `expiresAt` (expire at stored date)
- Retired: `ix_event_county_status_endDate`

## Invariants

- `stampExpiry()` sets `expiresAt` from `schedule.endDate + EXPIRY_GRACE`
  (2 years).
- List filters: pagination + county; client-side name search in the SPA.
- Cache tag: `ApiCache.BJJ_EVENTS_TAG`.
