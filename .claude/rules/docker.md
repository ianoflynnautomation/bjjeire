---
description: Docker Compose setup and local development environment
paths:
  - docker-compose*.yml
  - src/bjjeire-api/Dockerfile
  - src/bjjeire-api/seeder.Dockerfile
  - src/bjjeire-app/Dockerfile
  - Caddyfile
---

# Docker & Local Dev

## Compose Profiles
```bash
docker compose --profile app up -d       # API + web frontend
docker compose --profile mongo up -d     # MongoDB only
docker compose --profile app --profile mongo up -d  # everything
```

## Override Files
- `docker-compose.yml` — base config (production-like, no volumes for local)
- `docker-compose.override.local.yml` — local dev overrides (bind mounts, local env vars)
- `docker-compose.override.ghcr.yml` — pulls images from GitHub Container Registry

Apply local overrides:
```bash
docker compose -f docker-compose.yml -f docker-compose.override.local.yml up -d
```

## Key Services
| Service    | Port       | Notes                          |
|------------|------------|--------------------------------|
| api        | 5003 → 8080 | Spring Boot API |
| web        | 3000       | React SPA via Caddy (HTTP only; TLS at Cloudflare) |
| mongodb    | 27017      | MongoDB with auth              |

## Environment Variables
- Sensitive values in `.env` at project root (gitignored)
- `secrets/` directory for cert files (gitignored)
- `certs/` for HTTPS dev certs

## Platform
- Local compose defaults to `linux/arm64` (Apple Silicon). CI override (`docker-compose.override.ci.yml`) uses `linux/amd64`.
- GHCR images on `main` are multi-arch (`linux/amd64,linux/arm64`). PR preview images are `linux/amd64` only.

## API / seeder images
- Multi-stage: `dependency:go-offline` then `package` so source-only changes reuse the Maven cache layer
- Runtime user is UID 10001 (non-root). API healthchecks still use `curl` in the image

## Resource Limits
- Default: 0.50 CPU / 512MB RAM per service
- Adjust in `docker-compose.yml` under `deploy.resources`

## Healthchecks
- All services have healthchecks with `interval: 30s`, `timeout: 10s`, `retries: 3`
- API healthcheck: `GET /health`
