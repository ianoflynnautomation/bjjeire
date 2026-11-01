---
description: React, TypeScript, Vite, and Tailwind conventions for the bjjeire-app SPA
paths:
  - src/bjjeire-app/
---

# React / Frontend Conventions

## Component Patterns
- Named function, no `memo`: `export const ComponentName = function ComponentName(): JSX.Element`. The name is what React DevTools, react-refresh, and test output use. The React Compiler (`reactCompilerPreset()` in `vite.base.config.ts`, including tests via `sharedPlugins()`) memoizes the component
- Do not add `memo`, `useMemo`, or `useCallback` in new code. Existing calls can stay. Add one only when the compiler bails out of that function
- Props interfaces are named `{ComponentName}Props` and defined immediately above the component
- Never use `React.FC` for new components
- Default export pages, named export everything else

## Hooks
- Custom hooks live in `src/hooks/` (shared) or `src/features/{feature}/hooks/` (feature-scoped)
- Event handlers are plain functions. Derived arrays and objects, including `data ?? []` from React Query, are plain expressions. The compiler keeps those references stable
- `useEffect` cleanup functions need explicit return type: `(): (() => void) => { ... }`
- `useSearchParams` requires a Router context — always wrap tests in `MemoryRouter` from `react-router`

## Data Fetching
- `usePaginatedQuery` is the only data fetching hook for paginated list endpoints
- When search is active, fetch full dataset with `pageSize: 200` via `updateFilters`
- `filteredItems` is `search.filterItems(items)` in the component body. The compiler caches it
- Never call `useQuery` directly in pages — wrap in a feature-level hook

## Imports
- `@/` alias maps to `src/` — use for all cross-folder imports
- Same-folder imports stay relative: `./component`, `./utils`
- No `../../..` relative imports anywhere

## Styling
- Tailwind CSS 4. Tokens and the light, dark, and competition values live in `src/index.css`. Use those semantic utilities. Do not add slate glass, raw hex, or a second palette.
- Themes are light (bright), dark, and competition, owned by `useTheme` ([ADR-0011](../../docs/adr/0011-light-dark-competition-themes.md)). Do not remove one, and do not toggle the theme inside a component.
- PageLayout stays transparent.
- Use `cn()` from `@/lib/cn` for conditional class merging

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
