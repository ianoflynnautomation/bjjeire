---
description: ASP.NET Core API conventions, endpoints, and middleware
paths:
  - src/BjjEire.Api/
---

# API Conventions

## Controller Pattern
- Inject `IMediator` only — no direct repository or service injection
- Return types: `Ok(result)`, `NotFound()`, `BadRequest(problem)`, `NoContent()`
- All controllers inherit from a base controller with `[ApiController]` + `[Route("api/[controller]")]`
- Endpoint naming: `GET /api/gym`, `GET /api/gym/{id}`, `GET /api/gym/{id}/photo`

## Request/Response
- Queries return DTOs (never domain entities directly)
- Commands accept command objects built from request body/params
- Use `[FromQuery]` for pagination/filter params, `[FromBody]` for write payloads

## Pagination
- All list endpoints accept `page` (1-based) and `pageSize` query params
- Response envelope: `PaginatedResponse<T>` with HATEOAS links (`_links.next`, `_links.prev`)

## CORS
- Allowed origins configured via `CorsOptions__AllowedOrigins` env var
- Dev: `http://localhost:3000`, `https://localhost:3000`

## Auth
- Azure AD authentication via MSAL
- `AzureAd__TenantId` and `AzureAd__ClientId` from env/config
- Public endpoints (events list, gyms list) do not require auth
- Admin endpoints require `Authorization: Bearer {token}`

## Error Handling
- Global exception middleware returns RFC 7807 `ProblemDetails`
- Validation errors return 400 with `errors` dictionary
- Not found returns 404 with descriptive message

## Configuration Hierarchy
1. `appsettings.json` — defaults
2. `appsettings.{Environment}.json` — env-specific
3. Environment variables — override everything (use `__` as separator)
