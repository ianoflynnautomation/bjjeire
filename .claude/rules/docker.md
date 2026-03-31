---
description: Docker Compose setup and local development environment
paths:
  - docker-compose*.yml
  - src/BjjEire.Api/Dockerfile
  - src/BjjEire.Seeder/Dockerfile
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
| api        | 5003 (HTTP), 5001 (HTTPS) | ASP.NET Core |
| web        | 3000       | React SPA via Caddy (HTTP only; TLS at Cloudflare) |
| mongodb    | 27017      | MongoDB with auth              |

## Environment Variables
- Sensitive values in `.env` at project root (gitignored)
- `secrets/` directory for cert files (gitignored)
- `certs/` for HTTPS dev certs

## Platform
- All images built for `linux/arm64` (Apple Silicon)
- Change to `linux/amd64` for CI/CD or x86 servers

## Resource Limits
- Default: 0.50 CPU / 512MB RAM per service
- Adjust in `docker-compose.yml` under `deploy.resources`

## Healthchecks
- All services have healthchecks with `interval: 30s`, `timeout: 10s`, `retries: 3`
- API healthcheck: `GET /health`
