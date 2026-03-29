---
description: MongoDB security best practices for BjjEire
paths:
  - src/BjjEire.Infrastructure/
  - src/BjjEire.Seeder/
  - docker-compose*.yml
---

# MongoDB Security

## Authentication
- MongoDB runs with `--auth` enabled — never start without authentication (`MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` must be set)
- Connection string format: `mongodb://{user}:{password}@{host}:{port}/{db}?authSource=admin&authMechanism=SCRAM-SHA-256`
- Use `SCRAM-SHA-256` — do not downgrade to `SCRAM-SHA-1` or `MONGODB-CR`
- Connection string is injected via `ConnectionStrings__Mongodb` environment variable — never hardcoded in `appsettings.json`
- Local dev credentials in `.env` (gitignored) — never use `admin/password` in any non-local environment

## Least Privilege
- The API connects with a dedicated application user, not the root `admin` account
- Application user permissions: `readWrite` on the app database only — not `dbAdmin` or `root`
- The seeder should connect with a separate seeder user (or same app user) — never as root
- Do not grant `clusterAdmin`, `dbOwner`, or `userAdmin` to the application user

## Network Exposure
- MongoDB port `27017` must NOT be exposed to the public internet — it is internal to the Docker network (`bjj-network`) only
- In `docker-compose.yml` the MongoDB service has no `ports:` mapping to the host — keep it that way
- Local dev `docker-compose.override.local.yml` may expose port for tooling, but only bind to `127.0.0.1:27017`, not `0.0.0.0:27017`
- In production (VPS/cloud), use a firewall rule to block `27017` from all external sources

## Injection Prevention
- All queries use the C# MongoDB driver with typed LINQ — never use `BsonDocument` with user-supplied strings
- `FilterDefinitionBuilder<T>` with lambda expressions is safe — string-based filters are not
- `UpdateFieldAsync` takes a `Expression<Func<T, TField>>` — never pass user input as a field name
- IDs are always validated as 24-char hex ObjectId strings before use — reject anything else at the controller level

## Data Encryption
- Enable MongoDB TLS for connections in production: add `?tls=true&tlsCAFile=/path/to/ca.pem` to the connection string
- Encrypt sensitive fields at the application layer if storing PII (currently the app stores no PII)
- Atlas or self-hosted: enable encryption at rest if the hosting environment supports it

## Seeder Security
- Seeder is a one-time tool — it should not run in production containers
- Seeder Docker image is separate (`src/BjjEire.Seeder/Dockerfile`) — do not include it in the `app` compose profile
- Seeder reads only from local JSON files — it does not accept external input
- Validate all seeder JSON before running: `isAvailable` must be bool (not null), coordinates must be `[longitude, latitude]` doubles

## Backup & Recovery
- Take a `mongodump` backup before running the seeder against a populated database
- Store backups outside the Docker volume — on the host or in Azure Blob Storage
- Test restore procedure periodically: `mongorestore --drop` to verify backups are valid

## Audit & Monitoring
- Enable MongoDB slow query logging: `operationProfiling.slowOpThresholdMs: 100`
- Log authentication failures — monitor for repeated auth errors which may indicate credential stuffing
- Do not log full query documents in application logs — they may contain sensitive filter values

## Docker-Specific
- MongoDB data volume must be a named volume, not a bind mount to a world-readable path
- Set `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` from Docker secrets or `.env` — never as literal values in `docker-compose.yml`
- Use a specific MongoDB image tag (`mongo:7.0`) — never `mongo:latest` in production
- Run MongoDB container as non-root if the image supports it

## What NOT to Do
- Never disable MongoDB auth (`--noauth`) even in dev Docker environments
- Never expose the admin database or `local` database to the application user
- Never store the connection string in git — not even in test fixtures
- Never use `$where` operator with user-supplied JavaScript — it enables injection
- Never log the full connection string — it contains credentials
