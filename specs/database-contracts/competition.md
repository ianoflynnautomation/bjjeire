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
| `endDate` | `endDate` | Instant | |
| `isActive` | `isActive` | boolean | default `true` |
| audit | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` | | |

No `Location` / county on this aggregate today — do not invent them in tests.

## Indexes

- `ix_competition_isActive_endDate` on `(isActive, endDate)`
- `ix_competition_slug_unique` on `slug` (**critical**, unique)
- `ttl_competition_expiresAt` on `expiresAt`

## Invariants

- Duplicate slugs must fail fast (unique index is critical).
- `stampExpiry()` from `endDate + 2y`.
- Cache tag: `ApiCache.COMPETITIONS_TAG`.
