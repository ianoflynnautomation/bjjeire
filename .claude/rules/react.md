---
description: React, TypeScript, Vite, and Tailwind conventions for the bjjeire-app SPA
paths:
  - src/bjjeire-app/
---

# React / Frontend Conventions

## Where things go
- Feature code: `src/features/{feature}/` with `api/`, `components/`, `hooks/`, `utils/`, and `testing/`
- Pages: `src/pages/{Name}Page.tsx`, default export. Everything else is a named export
- Shared UI primitives: `src/components/ui/{category}/`. Shared hooks: `src/hooks/`
- One component per file, kebab-case filename: `gym-card.tsx`
- Cross-folder imports use `@/`. Same-folder imports stay relative. No `../../..`

## Components
```tsx
interface MyComponentProps {
  value: string
  onChange: (value: string) => void
  dataTestId?: string
}

export const MyComponent = function MyComponent({
  value,
  onChange,
  dataTestId,
}: MyComponentProps): JSX.Element {
  // ...
}
```
- Named function, explicit `): JSX.Element` return type (ESLint requires it), props interface `{ComponentName}Props` directly above. No `React.FC`, no `any`
- Do not wrap a component in `memo`, and do not add `useMemo` or `useCallback`. The React Compiler (`reactCompilerPreset()` in `vite.base.config.ts`, also active in tests) memoizes components and render values. Existing calls can stay. Add one only when the compiler bails out of that function
- Event handlers are plain functions. Derived values, including `data ?? []`, are plain expressions
- A `useEffect` that returns a cleanup needs an explicit return type: `(): (() => void) => { ... }`
- Reusable components accept an optional `className` and merge it with `cn()` from `@/lib/cn`

## Data fetching
- A list page calls its feature hook (`useGymsPage`, `useEventsPage`, …). That hook is built on `useListPage`, which wraps `usePaginatedQuery` and owns URL state, search, and pagination. Do not call `useQuery` in a page, and do not fetch in `useEffect`
- HTTP calls live in `src/features/{feature}/api/get-*.ts` and go through `api` from `@/lib/api-client`. Paths come from `API_ROUTES` in `@/config/api-routes`, never a literal
- Search loads one page of `DEFAULT_SEARCH_PAGE_SIZE` (100) and filters it in the browser. 100 is the API maximum; a larger `pageSize` silently falls back to 20

## Types
- Feature code uses the handwritten types in `src/types/*.ts`
- `src/types/generated/` is generated from the OpenAPI document (`npm run gen:api-types`). Do not edit it; the edit hook rejects it. CI uses it to prove the handwritten types still match the API
- `*.contract.ts` files are compile-time checks between the two. A type error there means the handwritten type drifted

## Feature flags
- `src/features/feature-flags/definitions.ts` is the catalogue. Read a flag with `useFeatureFlag`
- Every flag defaults to `false` until the API answers. Adding or removing a flag also changes `com.bjjeire.api.web.FeatureFlag` in the same pull request

## Config
- Read configuration from `env` in `@/config/env`, not `import.meta.env`. A new `VITE_APP_*` variable needs an entry in the Zod schema there, without the prefix
- `VITE_APP_*` values are baked in at image build time (ADR-0006). They are public

## Styling
- Tailwind CSS 4 only. No inline styles, no CSS modules
- Tokens and the light, dark, and competition values live in `src/index.css`. Use those semantic utilities and the `dark:` / `competition:` variants. Do not add raw hex or a second palette
- `useTheme` owns the theme ([ADR-0011](../../docs/adr/0011-light-dark-competition-themes.md)). Do not remove a theme or toggle one inside a component. `PageLayout` stays transparent
- CVA variant objects live in `src/lib/` (`button-variants.ts`), never in the component file. `react-refresh/only-export-components` fails otherwise

## Strings and test IDs
- User-visible text comes from `uiContent` (`@/config/ui-content`). Add copy to the matching section file in `src/config/content/`. No literal UI text in a component
- Interactive or testable components take a `dataTestId` prop and set `data-testid` on the root element. The value is a constant from `src/constants/*DataTestIds.ts`, passed in by the page

## Checks
- Order: `npm run lint`, `npm run typecheck`, `npm test`. `npm run lint` runs ESLint with `--fix`, so it rewrites files
- Run them through the dev container: `devcontainer exec --workspace-folder . npm --prefix src/bjjeire-app run typecheck`
- Tests: see `testing.md` and `src/bjjeire-app/src/testing/README.md`
