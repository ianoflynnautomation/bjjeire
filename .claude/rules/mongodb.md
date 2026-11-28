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
- Collections are `Gym`, `BjjEvent`, `Competition`, `Store`, `BjjEireCompetition`, `Competitor`, `DeletedCompetitor`, `BjjEireCompetitionRegistration`, `StripeEvent`, `Product`, `MerchOrder`, `OrderStripeEvent`, `ShopSettings`, and `AuditLog`. Each domain class declares the name as `ENTITY_NAME` and uses `@Document(ENTITY_NAME)`
- Product photos live in the GridFS bucket `productPhotos`, one file per content, named by its SHA-256 (`product.ProductPhotoStore`). Only that class reads or writes the bucket
- An embedded property named `id` is stored as `_id` (`ProductSize.id` is `sizes._id`). Typed `Criteria` on the entity class map it; a raw array filter must say `_id`
- `event_publication` belongs to Spring Modulith's event publication registry (ADR-0017). Its shape is the library's; feature code never queries it
- MongoDB runs as a single-node replica set (`rs0`) in every environment, because the registry writes in transactions. Compose starts it through `tools/mongodb/`; integration tests use `MongoDBContainer.withReplicaSet()`. UUIDs are encoded `STANDARD` (`MongoConfig`)
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
- After every write, call `apiCache.removeByTag(...)` with the feature's tag (`ApiCache.GYMS_TAG`, `BJJ_EVENTS_TAG`, `COMPETITIONS_TAG`, `STORES_TAG`, `BJJEIRE_COMPETITIONS_TAG`, `MERCH_TAG`). The deactivators do this too

## Seeder (`seeder/` data + `com.bjjeire.api.seeder`)
- One JSON file per entity under `seeder/data/{gyms,bjj-events,competitions,stores}/`. BJJ Éire competitions have a test seed only (`seeder/data-test/bjjeire-competitions/`): the `BjjEireCompetition` collection is skipped, never pruned, outside `SEED_DATASET=test`. The test dataset also seeds one finished competition's sign-ups (`seeder/data-test/bjjeire-competition-registrations/`) and the profile that owns two of its medals (`seeder/data-test/competitors/`); `--prune` never touches those two collections (`SeederCollection.prunable`), because acceptance runs write them through the API. BJJ Éire merch has a test seed only too (`seeder/data-test/products/`), and the seeder loads the photos those products name from `seeder/data-test/product-photos/` into GridFS. `_template.json` in each directory documents the schema
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
