---
description: MongoDB, seeder, and data conventions
paths:
  - src/BjjEire.Infrastructure/
  - src/BjjEire.Seeder/
---

# MongoDB Conventions

## Connection
- Connection string via `ConnectionStrings__Mongodb` environment variable
- Format: `mongodb://{user}:{password}@{host}:{port}/{db}?authSource=admin&authMechanism=SCRAM-SHA-256`
- Local dev: set in `docker-compose.override.local.yml` or `.env`

## Document IDs
- All IDs are MongoDB ObjectId strings (24-char hex)
- Generate for seeder: `crypto.randomBytes(12).toString('hex').padStart(24, '0')`

## GeoJSON
- Coordinates stored as `[longitude, latitude]` — GeoJSON order, NOT lat/lon
- Location object: `{ "type": "Point", "coordinates": [lng, lat] }`

## Seeder (`src/BjjEire.Seeder/`)
- Data files in `src/BjjEire.Seeder/data/*.json`
- `gyms.json` — canonical list of all gyms
- `events.json` — canonical list of all events
- Run seeder: `dotnet run --project src/BjjEire.Seeder`
- `isAvailable` in `TrialOffer` must be `false` or `true` — never `null` (non-nullable bool)

## Indexes
- Geospatial index on `Location.Coordinates` for proximity queries
- Text index on `Name`, `County` for search
- Compound index on `County` + `IsActive` for filtered list queries

## Repository Pattern
- `UpdateFieldAsync<T>(id, fieldExpr, value)` for partial updates — avoids full replace
- All methods accept and propagate `CancellationToken`
- Use `FindOneAndUpdateAsync` with `ReturnDocument.After` when you need the updated doc

## Cache Invalidation
- Tag: `CacheKey.GymsTag` / `CacheKey.EventsTag`
- Always call `hybridCache.RemoveByTagAsync(tag)` after any write/update
