---
description: Security rules specific to the bjjeire-app React SPA
paths:
  - src/bjjeire-app/
---

# Frontend Security

## Tokens (MSAL / Entra)
- `msal-config.ts` keeps tokens in `memoryStorage`. Do not move the cache to `localStorage` or `sessionStorage`
- `api-client.ts` loads MSAL only for a write and attaches the Bearer token in the request interceptor. Public reads carry no token
- When silent token acquisition fails, the interceptor throws. Do not change it to send the write unauthenticated
- The only scope requested is `env.MSAL_API_SCOPE`. Do not add `/.default` or wider scopes
- Never log a token. `logger.error` calls log status, URL, and message only; keep it that way

## Requests
- Call the BjjEire API through `api` from `@/lib/api-client`. `fetchJson` from `@/lib/fetch-client` is for public third-party endpoints (the GitHub repo lookup) and attaches no token
- The base URL is `env.API_URL`. Do not build an API URL from user input
- The `?q=` search parameter filters in the browser and is never sent to the API. Keep it that way

## Rendering
- Do not use `dangerouslySetInnerHTML`. There is no sanitizer in the dependencies; adding raw HTML rendering means adding one and getting it reviewed
- Links to URLs that come from the API (gym websites, social media) open with `target="_blank" rel="noopener noreferrer"`
- Navigate with React Router, not `window.location.href = value`

## Scripts and headers
- Caddy serves the SPA (`Caddyfile`). It sets `X-Frame-Options` and `X-Content-Type-Options` and no Content-Security-Policy. The API sets its own CSP in `SecurityHeadersFilter`
- The other edge headers (HSTS, Referrer-Policy, Permissions-Policy) are a Cloudflare transform rule documented in `bjjeire-gitops/.github/cloudflare.md`, not Istio. That runbook leaves CSP out, so the SPA document has none. Code must not rely on one
- Third-party script loading lives in `src/services/` (`cloudflare-analytics.ts`). Do not add a `<script>` tag or an inline handler elsewhere

## Bundle
- Everything under `VITE_APP_*` ships to the browser. No secrets or API keys in the bundle or in `src/config/env.ts` defaults
