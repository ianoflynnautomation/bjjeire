# ADR-0006: Frontend configuration is baked in at image build time

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `src/bjjeire-app/Dockerfile`, `build-push-ghcr.yml`, all `VITE_APP_*` values

## Context

The SPA is a static bundle served by Caddy. It needs the MSAL client ID,
authority, and API scope; the API base URL; a Cloudflare beacon token; and
several content URLs.

A browser bundle has no server-side config step. The values have to be present
when Vite builds, or the application has to fetch them at runtime from an
endpoint that itself needs no configuration.

## Decision

`VITE_APP_*` values are passed as **Docker build arguments** and embedded into
the bundle at image build time. `build-push-ghcr.yml` receives them as secrets
from `ci-main.yml` and passes them to the frontend build:

```
VITE_APP_MSAL_CLIENT_ID   VITE_APP_MSAL_AUTHORITY   VITE_APP_MSAL_API_SCOPE
VITE_APP_CF_BEACON_TOKEN  VITE_APP_URL              VITE_APP_CONTACT_EMAIL
VITE_APP_SOCIAL_INSTAGRAM_URL  VITE_APP_SOCIAL_FACEBOOK_URL  VITE_APP_GITHUB_URL
```

Locally the same values come from `.env`, which Compose passes through as build
arguments.

## Consequences

- The runtime is a plain static file server. No config endpoint, no
  hydration step, no chance of a flash of unconfigured UI.
- **The image is environment-specific.** A frontend image built with dev's MSAL
  client ID cannot be promoted to production. This is the single most important
  consequence and the one that surprises people who expect the usual
  build-once-deploy-anywhere property of container images.
- **Changing a value requires a rebuild**, not a restart or a ConfigMap edit.
- **A stale value ships a broken frontend in a way that looks like an API
  bug.** If the MSAL client ID or API scope is out of date, the SPA acquires a
  token the API will not accept, and catalog requests return 401. The Terraform
  stack writes `VITE_APP_MSAL_*` into this repository's Actions secrets
  precisely so an identity recreate cannot leave them stale — see
  `bjjeire-terraform-azurerm-aks`, `main.github-actions.tf`.
- These values are **not secret** in any meaningful sense — a client ID and an
  authority URL are readable in any browser's network tab. They are stored as
  Actions secrets for convenience of delivery, not confidentiality. Do not
  reason about them as though masking protects anything.
- Anything genuinely sensitive must never become a `VITE_APP_*` variable; it
  would be published in the bundle.

## Alternatives considered

- **Runtime config from `/config.json`.** Makes one image portable across
  environments, which would allow a single promotion path. Costs an extra
  request before the app can boot, a loading state to design, and a file Caddy
  must serve per environment. Worth reconsidering if the frontend ever needs to
  be promoted dev → staging → prod as one artefact.
- **Environment substitution into the bundle at container start.** Common
  (`envsubst` over the built JS), but it mutates a signed artefact at runtime
  and defeats the digest-promotion guarantee in
  [ADR-0004](0004-promote-images-by-digest.md).
- **Serve config from the API.** Adds a hard dependency: the SPA cannot render
  anything, including an error page, until the API answers.
