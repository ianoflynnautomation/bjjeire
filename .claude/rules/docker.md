---
description: Docker Compose stack, images, and Caddy
paths:
  - docker-compose*.yml
  - src/bjjeire-api/Dockerfile
  - src/bjjeire-api/seeder.Dockerfile
  - src/bjjeire-app/Dockerfile
  - Caddyfile
---

# Docker & Compose

Day-to-day checks run in the dev container (see `AGENTS.md`). The Compose stack is for running the whole application.

## Files
- `docker-compose.yml`: base. Every service is in the `app` profile
- `docker-compose.override.java-local.yml`: builds from source, turns read-only mode and rate limiting off, and adds the `seeder` service (`seed` profile)
- `docker-compose.override.ghcr.yml`: pulls published images from GHCR
- `docker-compose.override.ci.yml`: `linux/amd64`, faster healthchecks, loopback-only ports

The base file gives `api` and `frontend` no image and no build. Always pair it with an override. Commands are in `README.md`:
```bash
docker compose --profile app -f docker-compose.yml -f docker-compose.override.java-local.yml up --build --wait
docker compose --profile seed -f docker-compose.yml -f docker-compose.override.java-local.yml run --rm --build seeder
```

## Services
| Service | Container | Host port | Notes |
|---|---|---|---|
| `api` | `api` | 5003 → 8080 | Spring Boot. Healthcheck `GET /health` |
| `frontend` | `web` | 3000 → 80 | SPA served by Caddy, which proxies `/api/*` to the API |
| `mongodb` | `mongodb` | 127.0.0.1:27017 | `mongo:8.2`, auth on |

- Keep the MongoDB port bound to `127.0.0.1`. Do not publish it on all interfaces
- Keep the MongoDB image on a version tag, never `latest`

## Configuration
- `.env` at the repository root is required and gitignored
- `secrets/mongodb_password.txt` is mounted as the `mongodb_password` Docker secret
- Do not write a credential as a literal in a Compose file. Use `${VAR}` or a secret
- `SEED_DATASET` picks the seed data. The local override defaults to `test` (`seeder/data-test/`)

## Platform
- The base file sets `linux/arm64` for Apple Silicon. The CI override sets `linux/amd64`
- Published images are multi-arch on `main`. Pull request preview images are `linux/amd64` only

## Images
- API and seeder builds are multi-stage: `dependency:go-offline`, then `package`, so a source-only change reuses the Maven layer
- The runtime user is UID 10001. The API image keeps `curl` for the healthcheck
- `VITE_APP_*` values are build arguments of the frontend image (ADR-0006). Changing one means rebuilding the image

## Defaults shared by services
- Resource limits come from the `x-defaults` anchor (0.50 CPU, 512 MB). Change them there
- `api` and `frontend` use the `x-healthcheck-curl` anchor. `mongodb` has its own `mongosh` healthcheck
