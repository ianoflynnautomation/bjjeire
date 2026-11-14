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
| `Tournament` | `tournament.Tournament` | `seeder/data-test/tournaments/` only |
| `AuditLog` | `audit.AuditLogEntry` | (runtime) |

In-house tournaments will also add `Competitor`, `TournamentRegistration` and `StripeEvent`
(`specs/001-tournament-registration/data-model.md`); add each row here with the slice that creates it.

Test environments seed from `seeder/data-test/` as well as `seeder/data/`. `Tournament` has no
production seed, so a production seeder run skips it entirely, prune included.

## Invariants

- `_id` is a 24-char hex ObjectId string.
- GeoJSON `coordinates` are `[longitude, latitude]`. Dublin is
  `[-6.26, 53.35]`, never `[53.35, -6.26]`.
- `trialOffer.isAvailable` is a boolean, never `null`.
- Competition `slug` is unique (`ix_competition_slug_unique` is critical).
- Events and competitions stamp `expiresAt` (end date + 2-year grace) for TTL.

## Indexes (source of truth: `MongoIndexInitializer`)

Read `MongoIndexInitializer` for the current list; it is not copied here.

- `ix_competition_slug_unique` is unique and critical.
- `ttl_event_expiresAt` and `ttl_competition_expiresAt` are the TTL indexes.
- There is **no** `2dsphere` and no text index. Do not document or depend on
  one until it is added with a contract update.

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
