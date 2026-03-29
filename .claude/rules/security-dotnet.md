---
description: .NET API security best practices for BjjEire
paths:
  - src/BjjEire.Api/
  - src/BjjEire.Application/
  - src/BjjEire.Infrastructure/
---

# .NET API Security

## Authentication & Authorisation
- All write endpoints (`POST`, `PUT`, `DELETE`) require `[Authorize]` — never skip this on mutation endpoints
- Read endpoints (gym/event lists) are intentionally public — do not add auth there
- Azure AD JWT validation is configured via `AzureAd` config section — `TenantId`, `ClientId`, `Audience` must all be set via environment variables, never hardcoded
- Use `[Authorize(Roles = "Admin")]` or policy-based auth for admin operations — do not rely on client-side role checks alone
- Always validate the `aud` (audience) claim — the `Audience` must match `api://{ClientId}`

## Input Validation
- All commands are validated with FluentValidation before the handler runs — every new command must have a corresponding validator
- Validators are registered via `AddValidatorsFromAssembly` — do not register individually
- Validate string lengths, allowed characters, and range for all user inputs
- Never pass raw query strings or route values directly into MongoDB queries — always map to typed objects first
- `[FromQuery]` and `[FromBody]` model binding provides type safety, but add explicit `[StringLength]` / `[Range]` attributes on DTOs used in public endpoints

## Injection Prevention
- MongoDB queries use the official C# driver with typed LINQ expressions — never build raw query strings with user input
- No SQL in this project — if ever added, use parameterised queries only
- External API calls (Google Places) use `IHttpClientFactory` — never concatenate user input into URLs; use `QueryHelpers.AddQueryString()` for query params
- `UpdateFieldAsync` uses a strongly-typed `Expression<Func<T, TField>>` — never use string field names in MongoDB updates

## Secrets Management
- All secrets via environment variables or Azure Key Vault — never in `appsettings.json`
- `appsettings.json` contains only `REPLACE_WITH_YOUR_*` placeholders — committing real values is a security incident
- `GooglePlaces:ApiKey` and `AzureBlobStorage:ConnectionString` must come from env vars or Key Vault in all non-local environments
- Use `DefaultAzureCredential` (Managed Identity) for Azure Blob in production — not connection strings with account keys
- The `secrets/` directory is gitignored — never add it to `.gitignore` exceptions

## CORS
- Allowed origins configured in `CorsOptions:AllowedOrigins` — do not use wildcard `*` in production
- Production origin: `https://bjjeire.com` only
- Allowed methods: `GET, POST, PUT, DELETE` — do not add `*` or `PATCH` unless needed
- `AllowedHeaders` is explicit — do not use `*`

## Rate Limiting
- `RateLimitOptions` is configured in `appsettings.json`: 5 requests per 10-second window
- Do not disable rate limiting for public endpoints — the gym/event lists are public-facing
- Return `429 Too Many Requests` with a `Retry-After` header — already configured via `RejectionStatusCode: 429`
- Consider tighter limits for any future write/auth endpoints

## HTTPS & Transport
- `AllowedSchemes: ["https"]` in `ServiceDefaults` — HTTP is blocked in production
- HSTS headers must be set — do not remove `UseHsts()` from the middleware pipeline
- Dev certs in `certs/` are gitignored — never commit SSL certificates

## Logging & Error Responses
- Use Serilog — never `Console.WriteLine` for application events
- Do not log request bodies, response bodies, or authentication tokens
- Global exception middleware returns RFC 7807 `ProblemDetails` — do not leak stack traces in production responses
- Set `ASPNETCORE_ENVIRONMENT=Production` in prod — this suppresses detailed error pages automatically
- Sanitise error messages before returning to clients — internal exception messages may contain file paths or query details

## Dependency & Build Security
- `Directory.Packages.props` centralises NuGet versions — always update here, never per-project
- Run `dotnet list package --vulnerable` in CI to detect known CVEs in NuGet dependencies
- Do not use pre-release (`-beta`, `-rc`) NuGet packages in production
- Container images are built with `dotnet publish --configuration Release` — never ship Debug builds

## HTTP Headers
The following security headers should be set in Nginx (or middleware) — verify they are present:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
