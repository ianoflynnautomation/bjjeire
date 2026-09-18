# React + TypeScript rules (agents)

Apply when editing `src/bjjeire-app/`. Full narrative: `.claude/rules/react.md`
and `react-components.md`. ADRs 0006–0008.

## Structure

- Feature UI: `src/features/{feature}/`
- Pages: `src/pages/{Name}Page.tsx` (default export, no `memo`)
- Shared primitives: `src/components/ui/`
- Cross-folder imports use `@/`. Same-folder stays relative. No `../../..`.

## Components

```tsx
export const MyComponent = memo(function MyComponent({
  prop1,
}: MyComponentProps): JSX.Element {
  // ...
})
```

- No `React.FC`. No class components. No `any`.
- Props interface `{Name}Props` immediately above the component.
- `useCallback` on handlers passed as props. `useMemo` on `data ?? []`.
- Paginated lists use `usePaginatedQuery` — do not call `useQuery` in pages.

## Strings, IDs, theme

- User-visible copy → `src/config/ui-content.ts` only.
- Test IDs → `src/constants/*DataTestIds.ts`, passed as `dataTestId`.
- Dark theme only. No light `PageLayout` backgrounds (ADR-0007).
- Tailwind 4 + `cn()`. CVA objects live in `src/lib/`, never next to the
  component (react-refresh).

## Config

- `VITE_APP_*` is baked at Docker build time. Changing a value requires an
  image rebuild (ADR-0006).

## Tests

- `renderWithProviders` from `@/testing/render-utils`.
- `MemoryRouter` from `react-router` (not `react-router-dom`).
- Factories in `src/testing/factories/`; reset ID counters in `beforeEach`.
- Mock `api.get` via `vi.mock('@/lib/api-client')`.
