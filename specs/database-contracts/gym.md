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
| `version` | `version` | long | optimistic lock; clients send it back on update |
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

Startup fails if either index cannot be built.

- `ix_gym_status_county_name` on `(status, county, name)` — list filtered by county
- `ix_gym_status_name` on `(status, name)` — list across counties, ordered by name

## List filters

`GET /api/v1/gym?page&pageSize&county=`

Search-by-name is **not** a server filter; the SPA searches the loaded page.

## Cache

Writes must `apiCache.removeByTag(ApiCache.GYMS_TAG)`.

## Invariants

- Coordinates `[lng, lat]`. Derived `latitude` / `longitude` are omitted when the pair is absent.
- Updates require the `version` loaded with the gym. A mismatch is HTTP 409.
- Creates insert. A repeated id is HTTP 409.
- `trialOffer.isAvailable` is boolean
- Deletes / deactivation follow the shared deactivation machinery; expired
  gyms are not TTL'd (no `expiresAt` on this collection)
