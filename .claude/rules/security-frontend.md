---
description: Frontend security best practices for the bjjeire-app React SPA
paths:
  - src/bjjeire-app/
---

# Frontend Security

## Authentication (MSAL / Azure AD)
- Tokens are acquired via `msalInstance.acquireTokenSilent()` in the Axios request interceptor — never store tokens in `localStorage` or `sessionStorage`
- MSAL stores tokens in memory by default — do not change the cache location to `localStorage` (XSS risk)
- Never log or expose access tokens in console output, error messages, or analytics
- If silent token acquisition fails, fail gracefully — do not fall back to sending unauthenticated requests to protected endpoints
- `loginRequest` scopes must be the minimum required — do not request `/.default` or broad permissions

## XSS Prevention
- Never use `dangerouslySetInnerHTML` — if unavoidable, sanitise input with DOMPurify first
- Never construct HTML strings and inject them into the DOM
- All user-supplied data rendered via React JSX is auto-escaped — keep it that way
- Do not use `eval()`, `new Function()`, or dynamic `import()` with user-supplied strings
- External URLs (e.g. gym websites from the API) must be opened with `target="_blank" rel="noopener noreferrer"` to prevent tab-napping

## API Communication
- The `api-client.ts` Axios instance sets `Content-Type: application/json` and attaches Bearer tokens — always use it, never raw `fetch` with manual headers
- API base URL comes from `env.API_URL` (validated at startup via Zod) — never construct API URLs from user input
- Never include secrets, API keys, or internal config in the Vite bundle — use `VITE_` prefixed env vars for public config only
- Do not log full Axios error responses to the console in production — `logger.error` should redact sensitive fields

## Content Security Policy
- The app is served via Nginx — CSP headers are set there, not in React
- Do not add `<script>` tags or inline event handlers that would require `unsafe-inline` in the CSP
- External scripts (e.g. Cloudflare Analytics) must be allowlisted in the Nginx CSP config, not added ad-hoc

## Dependency Security
- Run `npm audit` before merging PRs that add or update dependencies
- `npm audit fix` for dev-only vulnerabilities is safe; production dependency fixes need review
- Do not install packages with `--ignore-scripts` override disabled — check `postinstall` scripts in new deps
- Dependabot alerts in GitHub should be resolved within 7 days for High/Critical severity

## Sensitive Data Handling
- Do not store personally identifiable information (PII) in React state beyond what's needed to render the current view
- Route params and search params (`?q=`) are user-controlled — never pass them unsanitised to `eval`, `innerHTML`, or API endpoints as-is without server-side validation
- The `?q=` search param is used for client-side filtering only — it never reaches the API, so it is low risk; keep it that way

## Third-Party Integrations
- Cloudflare Analytics: script loaded from Cloudflare CDN — verify the src URL is unchanged when updating
- Azure MSAL: pin the `@azure/msal-browser` and `@azure/msal-react` versions — do not use `latest` range
- Google Places: API calls are proxied through the .NET backend — the API key is never exposed to the frontend

## What NOT to Do
- Never commit `.env` files or any file containing real API keys/secrets
- Never disable `eslint-disable` rules related to security without team review
- Never set `crossOrigin="use-credentials"` on image or script tags unless strictly required
- Never use `window.location.href = userSuppliedValue` — use React Router `navigate()` instead
