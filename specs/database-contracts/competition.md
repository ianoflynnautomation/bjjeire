# Database contract: Competition

**Collection**: `Competition`
**Java**: `com.bjjeire.api.competition.Competition`
**Seeder template**: `seeder/data/competitions/_template.json`
**API**: `/api/v1/competition`

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `expiresAt` | `expiresAt` | Instant | TTL; `endDate + 2y` |
| `slug` | `slug` | string | **unique** |
| `name` | `name` | string | |
| `description` | `description` | string | |
| `organisation` | `organisation` | string | |
| `country` | `country` | string | default `"Ireland"` |
| `websiteUrl` | `websiteUrl` | string | |
| `registrationUrl` | `registrationUrl` | string | |
| `logoUrl` | `logoUrl` | string | |
| `tags` | `tags` | string[] | default `[]` |
| `startDate` | `startDate` | Instant | |
| `endDate` | `endDate` | Instant | missing value stored as `9999-12-31T00:00:00Z` and returned as null |
| `isActive` | `isActive` | boolean | default `true` |
| audit | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` | | |

No `Location` / county on this aggregate today — do not invent them in tests.

## Indexes

Startup fails if any of these cannot be built.

- `ix_competition_isActive_startDate_name` on `(isActive, startDate, name)` — default list order
- `ix_competition_isActive_endDate` on `(isActive, endDate)` — deactivation sweep
- `ix_competition_slug_unique` on `slug` (unique)
- `ttl_competition_expiresAt` on `expiresAt`

## Invariants

- Duplicate slugs must fail fast (unique index build failure stops startup).
- `stampExpiry()` stores a missing `endDate` as the open-ended sentinel and sets
  `expiresAt` from a real `endDate + 2y`. The sentinel does not get an `expiresAt`.
- Cache tag: `ApiCache.COMPETITIONS_TAG`.
