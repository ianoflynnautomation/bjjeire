# React + TypeScript rules (agents)

Apply when editing `src/bjjeire-app/`. Full narrative: `.claude/rules/react.md`
and `.claude/rules/testing.md`. ADRs 0006–0008, 0011.

## Structure

- Feature UI: `src/features/{feature}/` (`api/`, `components/`, `hooks/`, `utils/`, `testing/`)
- Pages: `src/pages/{Name}Page.tsx` (default export)
- Shared primitives: `src/components/ui/`
- Cross-folder imports use `@/`. Same-folder stays relative. No `../../..`.

## Components

```tsx
export const MyComponent = function MyComponent({
  prop1,
}: MyComponentProps): JSX.Element {
  // ...
}
```

- Named function, not wrapped in `memo`. The React Compiler memoizes
  components and render values. New `memo`, `useMemo`, or `useCallback` calls
  are a finding unless the compiler bails out of that function. Existing calls
  can stay.
- Handlers are plain functions. `data ?? []` is a plain expression.
- No `React.FC`. No class components. No `any`.
- Props interface `{Name}Props` immediately above the component.
- List pages use their feature hook, built on `useListPage` /
  `usePaginatedQuery`. No `useQuery` in pages.
- HTTP goes through `api` from `@/lib/api-client` with paths from `API_ROUTES`.
- `pageSize` above 100 silently falls back to 20 on the API.

## Strings, IDs, theme

- User-visible copy comes from `uiContent` (`src/config/ui-content.ts`, section
  files in `src/config/content/`).
- Test IDs → `src/constants/*DataTestIds.ts`, passed as `dataTestId`.
- Light, dark and competition themes, applied by `useTheme` (ADR-0011). `PageLayout` stays transparent, with no background of its own.
- Tailwind 4 + `cn()`. CVA objects live in `src/lib/`, never next to the
  component (react-refresh).

## Config and flags

- `VITE_APP_*` is baked at Docker build time. Changing a value requires an
  image rebuild (ADR-0006). Read values from `env` in `@/config/env`.
- `src/types/generated/` is generated. A hand edit is a finding.
- A feature flag changes `features/feature-flags/definitions.ts` and
  `com.bjjeire.api.web.FeatureFlag` together.

## Tests

- File suffix decides the project: `*.unit.test`, `*.integration.test`,
  `*.browser.test`, `*.pact.test`. A bare `*.test.tsx` never runs.
- `renderWithProviders` from `@/testing/render-utils`; pass `featureFlags` for
  a page behind a flag.
- `MemoryRouter` from `react-router` (not `react-router-dom`).
- API responses come from MSW (`@/testing/msw/server`, feature
  `testing/*-test-helpers.tsx`). No `vi.mock('@/lib/api-client')`.
- Data from `src/testing/factories/`, not inline DTO literals.
