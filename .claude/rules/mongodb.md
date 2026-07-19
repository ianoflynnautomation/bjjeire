---
description: MongoDB, seeder, and data conventions
paths:
  - src/bjjeire-api/
  - seeder/
---

# MongoDB Conventions

## Connection
- Connection URI via `MONGODB_URI` environment variable (database name via `MONGODB_DATABASE`)
- Format: `mongodb://{user}:{password}@{host}:{port}/{db}?authSource=admin&authMechanism=SCRAM-SHA-256`
- Local dev: set in `docker-compose.override.local.yml` or `.env`

## Document IDs
- All IDs are MongoDB ObjectId strings (24-char hex)
- Generate for seeder: `crypto.randomBytes(12).toString('hex').padStart(24, '0')`

## GeoJSON
- Coordinates stored as `[longitude, latitude]` — GeoJSON order, NOT lat/lon
- Location object: `{ "type": "Point", "coordinates": [lng, lat] }`

## Seeder (`seeder/` data + `com.bjjeire.api.seeder`)
- Data files: one JSON file per entity under `seeder/data/{gyms,bjj-events,competitions,stores}/`
- `_template.json` in each directory documents the schema
- Run seeder: `java -jar target/bjjeire-api-*.jar --spring.profiles.active=seeder` (add `--validate` for a dry run)
- `isAvailable` in `TrialOffer` must be `false` or `true` — never `null` (non-nullable bool)

## Indexes
- Geospatial index on `Location.Coordinates` for proximity queries
- Text index on `Name`, `County` for search
- Compound index on `County` + `IsActive` for filtered list queries

## Repository Pattern
- Spring Data MongoDB repositories per feature (`GymRepository`, `BjjEventRepository`, …) — derived queries or typed `Query`/`Criteria`
- Partial updates use typed `Update().set(field, value)` — avoid full document replace when updating one field
- Use `findAndModify` with `returnNew(true)` when you need the updated doc

## Cache Invalidation
- Tags: `ApiCache.GYMS_TAG`, `ApiCache.BJJ_EVENTS_TAG`, `ApiCache.COMPETITIONS_TAG`, `ApiCache.STORES_TAG`
- Always call `apiCache.removeByTag(tag)` after any write/update
