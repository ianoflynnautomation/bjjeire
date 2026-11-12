---
description: MongoDB, seeder, and data conventions, including query safety
paths:
  - src/bjjeire-api/
  - seeder/
---

# MongoDB Conventions

## Connection
- `MONGODB_URI` and `MONGODB_DATABASE` feed `spring.mongodb.uri` and `spring.mongodb.database`. Spring Boot 4 ignores the old `spring.data.mongodb.*` connection keys without an error
- URI format: `mongodb://{user}:{password}@{host}:{port}/{db}?authSource=admin&authMechanism=SCRAM-SHA-256`
- The URI holds credentials. Do not hardcode it, commit it in a fixture, or log it

## Documents
- Collections are `Gym`, `BjjEvent`, `Competition`, `Store`, and `AuditLog`. Each domain class declares the name as `ENTITY_NAME` and uses `@Document(ENTITY_NAME)`
- IDs are 24-char hex ObjectId strings
- GeoJSON coordinates are `[longitude, latitude]`: `{ "type": "Point", "coordinates": [lng, lat] }`. Dublin is `[-6.26, 53.35]`
- Events and competitions stamp `expiresAt` for the TTL indexes

## Indexes
- `config/MongoIndexInitializer` is the only place indexes are declared. Read it before writing a query; do not copy an index list into a rule or spec
- There is no geospatial (`2dsphere`) index and no text index. Do not write a `$near`, `$geoWithin`, or `$text` query without adding the index there and updating `specs/database-contracts/`
- `ix_competition_slug_unique` enforces the unique competition slug

## Queries and writes
- Use Spring Data repositories per feature (`GymRepository`, `BjjEventRepository`, …) with derived queries or typed `Query` / `Criteria`
- Never build a query from concatenated user input, never pass user input as a field name, and never use `$where`
- Partial updates use typed `Update().set(field, value)`. Use `findAndModify` with `returnNew(true)` when the updated document is returned
- After every write, call `apiCache.removeByTag(...)` with the feature's tag (`ApiCache.GYMS_TAG`, `BJJ_EVENTS_TAG`, `COMPETITIONS_TAG`, `STORES_TAG`). The deactivators do this too

## Seeder (`seeder/` data + `com.bjjeire.api.seeder`)
- One JSON file per entity under `seeder/data/{gyms,bjj-events,competitions,stores}/`. `_template.json` in each directory documents the schema
- `seeder/data-test/` is the test dataset. `SEED_DATASET=test` selects it, and the local compose override defaults to it
- Run it with the compose `seed` profile (command in `README.md`), or `java -jar target/bjjeire-api-*.jar --spring.profiles.active=seeder`. Add `--validate` for a dry run
- `TrialOffer.isAvailable` is `true` or `false`, never `null`. The edit hook rejects `null`
- The API caches list responses, so restart it after reseeding

## Changing a document field
Update all of these in the same pull request:

1. The Java domain class, DTO, and command records
2. `seeder/data/<entity>/_template.json`, and `seeder/data-test/` if the field is seeded
3. `specs/database-contracts/<entity>.md`
4. The SPA handwritten types in `src/bjjeire-app/src/types/` (the generated OpenAPI types are rebuilt in CI)
5. The Zod schemas in `bjjeire-tests`, or say in the pull request that they follow separately
