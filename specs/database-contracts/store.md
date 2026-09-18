# Database contract: Store

**Collection**: `Store`
**Java**: `com.bjjeire.api.store.Store`
**Seeder template**: `seeder/data/stores/_template.json`
**API**: `/api/v1/store`

## Document

| Field | Mongo | Type | Notes |
|---|---|---|---|
| `id` | `_id` | ObjectId string | |
| `name` | `name` | string | |
| `description` | `description` | string | |
| `websiteUrl` | `websiteUrl` | string | |
| `logoUrl` | `logoUrl` | string | |
| `isActive` | `isActive` | boolean | default `true` |
| audit | `createdAt` / `createdBy` / `updatedAt` / `updatedBy` | | |

Stores have no county, location, or status enum.

## Indexes

- `ix_store_isActive_name` on `(isActive, name)`

## Invariants

- Cache tag: `ApiCache.STORES_TAG`.
- List is name-oriented; client-side search in the SPA.
