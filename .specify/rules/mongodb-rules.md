# MongoDB rules (agents)

Apply when editing domain documents, repositories, seeder JSON, or
`MongoIndexInitializer`. Full narrative: `.claude/rules/mongodb.md`.
Contracts: `specs/database-contracts/`.

## Collections

| Collection | Java type | Seeder dir |
|---|---|---|
| `Gym` | `gym.Gym` | `seeder/data/gyms/` |
| `BjjEvent` | `event.BjjEvent` | `seeder/data/bjj-events/` |
| `Competition` | `competition.Competition` | `seeder/data/competitions/` |
| `Store` | `store.Store` | `seeder/data/stores/` |
| `AuditLog` | `audit.AuditLogEntry` | (runtime) |

Test environments seed from `seeder/data-test/` instead of `seeder/data/`.

## Invariants

- `_id` is a 24-char hex ObjectId string.
- GeoJSON `coordinates` are `[longitude, latitude]`. Dublin is
  `[-6.26, 53.35]`, never `[53.35, -6.26]`.
- `trialOffer.isAvailable` is a boolean, never `null`.
- Competition `slug` is unique (`ix_competition_slug_unique` is critical).
- Events and competitions stamp `expiresAt` (end date + 2-year grace) for TTL.

## Indexes (source of truth: `MongoIndexInitializer`)

- `Gym`: `ix_gym_status_county_name` on `(status, county, name)`
- `BjjEvent`: `ix_event_isActive_endDate`, `ix_event_county_isActive`,
  `ttl_event_expiresAt`
- `Competition`: `ix_competition_isActive_endDate`,
  `ix_competition_slug_unique` (unique, critical), `ttl_competition_expiresAt`
- `Store`: `ix_store_isActive_name`

There is currently **no** `2dsphere` index in `MongoIndexInitializer`. Do not
document or depend on one until it is added with a contract update.

## Writes

- Feature repositories only. Partial `Update().set`. `findAndModify` +
  `returnNew(true)` when the updated doc is returned.
- After any write, `apiCache.removeByTag(...)` for that feature.

## Seeder

- One JSON file per entity. `_template.json` documents the schema.
- Validate with `--spring.profiles.active=seeder --validate` before merging
  data PRs.
- Schema-drift agent compares `_template.json` ↔ Java `@Document` ↔ this
  contract folder.

## Drift

A change to a document field MUST update, in the same PR:

1. Java domain + DTO + command records
2. `seeder/data/<entity>/_template.json` (and data-test if the field is seeded)
3. `specs/database-contracts/<entity>.md`
4. OpenAPI (generated in CI) / SPA types
5. Playwright Zod schemas in `bjjeire-tests` (follow-up PR is acceptable only
   if called out explicitly)
