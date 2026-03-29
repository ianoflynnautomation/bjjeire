---
description: React, TypeScript, Vite, and Tailwind conventions for the bjjeire-app SPA
paths:
  - src/bjjeire-app/
---

# React / Frontend Conventions

## Component Patterns
- Use `memo(function ComponentName())` — gives automatic displayName, required for react-refresh
- Props interfaces are named `{ComponentName}Props` and defined immediately above the component
- Never use `React.FC` for new components
- Default export pages, named export everything else

## Hooks
- Custom hooks live in `src/hooks/` (shared) or `src/features/{feature}/hooks/` (feature-scoped)
- `useCallback` on all event handlers passed as props
- `useMemo` on derived arrays/objects — especially `data ?? []` defaults from React Query
- `useEffect` cleanup functions need explicit return type: `(): (() => void) => { ... }`
- `useSearchParams` requires a Router context — always wrap tests in `MemoryRouter` from `react-router`

## Data Fetching
- `usePaginatedQuery` is the only data fetching hook for paginated list endpoints
- When search is active, fetch full dataset with `pageSize: 200` via `updateFilters`
- `filteredItems = useMemo(() => search.filterItems(items), [search, items])`
- Never call `useQuery` directly in pages — wrap in a feature-level hook

## Imports
- `@/` alias maps to `src/` — use for all cross-folder imports
- Same-folder imports stay relative: `./component`, `./utils`
- No `../../..` relative imports anywhere

## Styling
- Tailwind CSS 4 — dark theme only (`class="dark"` on root)
- Card base: `bg-slate-800/50 backdrop-blur-sm ring-1 ring-white/[0.08]`
- PageLayout is transparent — never add bg colors there
- Irish theme: emerald + orange only, no shamrock emojis
- Use `cn()` from `@/lib/utils` for conditional class merging

## UI Components
- `Button`, `Card`, `CardContent`, `Badge` from `src/components/ui/`
- `buttonVariants` CVA object lives in `src/lib/button-variants.ts` — not co-located with Button component
- CVA variant objects must be in `src/lib/` to satisfy `react-refresh/only-export-components`

## Strings
- All user-visible strings in `src/config/ui-content.ts`
- Content sections: `shared`, `events`, `gyms`
- No hardcoded UI text in components

## Testing
- `renderWithProviders` from `src/testing/render-utils.tsx` wraps tests with QueryClient + MemoryRouter
- `MemoryRouter` imported from `react-router` (not `react-router-dom`)
- Data test IDs defined as constants in `src/constants/*DataTestIds.ts`
- Integration tests mock `api.get` via `vi.mock('@/lib/api-client')`
- Never mock the router — use `MemoryRouter` with `initialEntries`
