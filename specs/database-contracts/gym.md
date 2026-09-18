# Database contract: Gym

**Collection**: `Gym`
**Java**: `com.bjjeire.api.gym.Gym`
**DTO**: `GymDto`
**Seeder template**: `seeder/data/gyms/_template.json`
**API**: `GET/POST /api/v1/gym`, `GET/PUT/DELETE /api/v1/gym/{id}`

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `name` | `name` | string | max 100, required on DTO |
| `description` | `description` | string | max 200 |
| `status` | `status` | `GymStatus` | see enum |
| `county` | `county` | `County` | required |
| `affiliation` | `affiliation` | `{ name, website }` | |
| `trialOffer` | `trialOffer` | `{ isAvailable: boolean, freeClasses, freeDays, notes }` | `isAvailable` never null |
| `location` | `location` | `Location` | GeoJSON point |
| `socialMedia` | `socialMedia` | `SocialMedia` | |
| `offeredClasses` | `offeredClasses` | `ClassCategory[]` | default `[]` |
| `website` | `website` | string | |
| `timetableUrl` | `timetableUrl` | string | |
| `imageUrl` | `imageUrl` | string | |
| `createdOnUtc` | `createdAt` | Instant | |
| `createdBy` | `createdBy` | string | |
| `updatedOnUtc` | `updatedAt` | Instant | |
| `updatedBy` | `updatedBy` | string | |

DTO additionally exposes `thumbnailUrl` (derived / mapped, not a stored field
to invent in seeder JSON unless the mapper says otherwise).

## `GymStatus`

`None`, `Active`, `PendingApproval`, `TemporarilyClosed`,
`PermanentlyClosed`, `OpeningSoon`, `Draft`, `Rejected`.

Wire values are these PascalCase names. UI badges must not assume a different
casing without an explicit mapper.

## Indexes

- `ix_gym_status_county_name` on `(status, county, name)` (non-critical)

## List filters

`GET /api/v1/gym?page&pageSize&county=`

Search-by-name is **not** a server filter; the SPA searches the loaded page.

## Cache

Writes must `apiCache.removeByTag(ApiCache.GYMS_TAG)`.

## Invariants

- Coordinates `[lng, lat]`
- `trialOffer.isAvailable` is boolean
- Deletes / deactivation follow the shared deactivation machinery; expired
  gyms are not TTL'd (no `expiresAt` on this collection)
