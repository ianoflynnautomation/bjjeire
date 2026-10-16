---
name: react19-concurrent-patterns
description: 'Reference for React 19 concurrent APIs in bjjeire-app - useTransition, useDeferredValue, Suspense, use(), useActionState, useFormStatus, useOptimistic. Use when adding non-blocking updates, deferring expensive renders, handling form submissions, or deciding whether a concurrent API fits a component.'
---

# React 19 Concurrent Patterns

Concurrent APIs available in `src/bjjeire-app` (React 19.2.7). Follow
`.claude/rules/react.md` and `.claude/rules/react-components.md` for component
structure — this skill covers only the concurrent surface.

## Non-Blocking Updates — `useTransition`

Mark a state update as non-urgent so typing and clicks stay responsive:

```tsx
const [isPending, startTransition] = useTransition()

const handleFilterChange = useCallback((next: FilterState): void => {
  startTransition(() => {
    setFilters(next)
  })
}, [])
```

Use `isPending` to drive a loading affordance rather than blocking the input.

## Deferred Rendering — `useDeferredValue`

Let an expensive subtree lag behind a fast-changing input:

```tsx
const deferredQuery = useDeferredValue(query)
const results = useMemo(() => search.filterItems(items, deferredQuery), [items, deferredQuery])
```

Pairs well with the `filteredItems` memo pattern in `rules/react.md`.

## Code Splitting — `Suspense` + `lazy`

```tsx
const GymsPage = lazy(() => import('@/pages/GymsPage'))

<Suspense fallback={<Spinner />}>
  <GymsPage />
</Suspense>
```

## New React 19 APIs

Deep-dive references bundled with this skill:

- `references/react19-use.md` — the `use()` hook for promises and context
- `references/react19-actions.md` — Actions, `useActionState`, `useFormStatus`, `useOptimistic`
- `references/react19-suspense.md` — Suspense for data fetching

**Repo constraint:** data fetching goes through React Query (`usePaginatedQuery`),
not raw Suspense data fetching or `use()` on a fetch promise — see
`rules/react.md`. Read `references/react19-suspense.md` for the general pattern,
but do not introduce it as a fetching strategy here without changing that rule
first.
