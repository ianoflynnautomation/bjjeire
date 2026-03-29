---
description: .NET Clean Architecture, MediatR, and C# conventions for BjjEire
paths:
  - src/BjjEire.*/
  - tests/BjjEire.*/
---

# .NET Conventions

## Clean Architecture Layer Rules
- **Domain**: no external NuGet dependencies, no infrastructure references
- **Application**: references Domain only; defines interfaces (e.g. `IGymRepository`, `IGooglePlacesPhotoService`)
- **Infrastructure**: implements Application interfaces; references Application + Domain
- **Api**: references Application only; never references Infrastructure directly (DI wires it up)

## Feature Folder Structure
All new features must follow this folder structure — do not add files directly under `Application/` or `Infrastructure/` roots:

```
src/BjjEire.Application/Features/{Feature}/
  Queries/
    Get{Feature}Query.cs          # IRequest<T> + handler in same file
    Get{Feature}sQuery.cs
  Commands/
    Create{Feature}Command.cs
    Update{Feature}Command.cs
    Delete{Feature}Command.cs

src/BjjEire.Infrastructure/Features/{Feature}/
  {Feature}Repository.cs          # implements I{Feature}Repository
  {Feature}ExternalService.cs     # implements I{Feature}ExternalService (if needed)
```

Shared interfaces and constants that span features go in:
```
src/BjjEire.Application/Common/Interfaces/   # I{Name}Repository, I{Name}Service
src/BjjEire.Application/Common/Constants/    # CacheKey, etc.
src/BjjEire.Application/Common/Exceptions/  # domain-specific exceptions
```

Existing features to use as reference: `src/BjjEire.Application/Features/Gyms/`, `src/BjjEire.Application/Features/Events/`

## Naming Conventions
- Queries: `Get{Entity}Query` + `Get{Entity}QueryHandler`
- Commands: `{Verb}{Entity}Command` + `{Verb}{Entity}CommandHandler`
- Repositories: `I{Entity}Repository` (interface in Application), `{Entity}Repository` (impl in Infrastructure)
- External services: `I{Name}Service` in `Application/Common/Interfaces/`, impl in `Infrastructure/Features/{Domain}/`

## MediatR
- All use cases are `sealed record` implementing `IRequest<T>`
- Handlers are `sealed class` implementing `IRequestHandler<TRequest, TResponse>`
- Controllers inject `IMediator` only — no direct service or repository injection in controllers

## Cache
- Cache keys and tags in `BjjEire.Application.Common.Constants.CacheKey`
- Always invalidate by tag after mutations: `await hybridCache.RemoveByTagAsync(CacheKey.GymsTag)`
- Read-through caching goes in query handlers, not repositories

## Repository Pattern
- `UpdateFieldAsync<T>(id, expression, value)` for single-field updates — avoids full document replace
- All async methods accept `CancellationToken`

## Error Handling
- Return `null` from query handlers when entity not found; controller returns `NotFound()`
- Use `FluentValidation` for command validation (registered via `AddValidatorsFromAssembly`)
- Never swallow exceptions — let the global error handler middleware catch unhandled ones

## Testing
- Unit tests mock at the Application boundary (mock `IRepository`, `IService`)
- Integration tests use a real in-memory or test MongoDB — do not mock the database
- Test project names: `BjjEire.{Layer}.UnitTests` / `BjjEire.{Layer}.IntegrationTests`
