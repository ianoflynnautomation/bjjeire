Scaffold a new feature following the BjjEire Clean Architecture pattern.

Feature name: $ARGUMENTS

Create the following files:

**Domain** (if new entity needed):
- `src/BjjEire.Domain/Entities/{Feature}.cs`

**Application layer:**
- `src/BjjEire.Application/Features/{Feature}/Queries/Get{Feature}Query.cs`
- `src/BjjEire.Application/Features/{Feature}/Queries/Get{Feature}sQuery.cs`
- `src/BjjEire.Application/Features/{Feature}/Commands/Create{Feature}Command.cs`
- `src/BjjEire.Application/Common/Interfaces/I{Feature}Repository.cs`

**Infrastructure layer:**
- `src/BjjEire.Infrastructure/Features/{Feature}/{Feature}Repository.cs`

**API layer:**
- `src/BjjEire.Api/Controllers/{Feature}Controller.cs`

**Frontend:**
- `src/bjjeire-app/src/features/{feature}/api/get-{feature}s.ts`
- `src/bjjeire-app/src/features/{feature}/hooks/use{Feature}sPage.ts`
- `src/bjjeire-app/src/features/{feature}/components/{feature}-card.tsx`

Follow all existing patterns. Read a similar existing feature (Gyms) for reference before generating.
