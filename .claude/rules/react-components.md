---
description: Best practices for creating new React components in bjjeire-app
paths:
  - src/bjjeire-app/src/components/
  - src/bjjeire-app/src/features/
  - src/bjjeire-app/src/pages/
---

# React Component Best Practices

## File & Folder Structure
- One component per file. Filename matches the component name in kebab-case: `gym-card.tsx`
- Feature components: `src/features/{feature}/components/{component-name}.tsx`
- Shared UI primitives: `src/components/ui/{category}/{component-name}.tsx`
- Page components: `src/pages/{Name}Page.tsx` — default export, no memo needed

## Component Definition
Always use the memoised named function pattern:
```tsx
export const MyComponent = memo(function MyComponent({
  prop1,
  prop2,
}: MyComponentProps): JSX.Element {
  // ...
})
```
- `memo()` wraps named function — gives automatic `displayName` for React DevTools
- Explicit `): JSX.Element` return type — required by ESLint rules
- Named export (not default) for feature/shared components
- Default export for page components only

## Props Interface
```tsx
interface MyComponentProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  dataTestId?: string   // always add for interactive/testable components
}
```
- Defined immediately above the component, not exported unless consumed outside the file
- Optional props use `?` — never `| undefined` in the interface
- Event handlers typed precisely: `(value: string) => void`, not `Function`

## Hooks Inside Components
- `useCallback` on every function passed as a prop or used in a dependency array
- `useMemo` on every derived array/object — especially `data ?? []` from query results
- `useRef` for DOM element access — never query the DOM directly
- No logic in the render body that could be a hook — extract to custom hook if needed

## Styling
- Tailwind CSS 4 only — no inline styles, no CSS modules
- Use `cn()` from `@/lib/utils` for conditional classes:
  ```tsx
  className={cn('base-classes', condition && 'conditional-class', className)}
  ```
- Accept optional `className` prop on reusable components to allow caller overrides
- Dark theme is always active — use `dark:` variants, never toggle light/dark in components

## Accessibility
- Interactive elements (`button`, `input`, `select`) must have an accessible label (`aria-label` or associated `<label>`)
- Icon-only buttons need `aria-label` + `aria-hidden="true"` on the icon
- Dynamic content that changes without navigation: `aria-live="polite"` + `aria-atomic="true"`
- Loading states: `role="status"`, error states: `role="alert"`
- Use semantic HTML: `<button>` not `<div onClick>`, `<nav>` not `<div role="navigation">`

## CVA (class-variance-authority)
- CVA variant objects must live in `src/lib/` — never co-locate with the component file
- Reason: `react-refresh/only-export-components` lint rule fires if a non-component is exported from a component file
- Import the variant fn into the component: `import { myVariants } from '@/lib/my-variants'`

## Data Test IDs
- Add `dataTestId?: string` prop to every interactive or testable component
- Apply as `data-testid={dataTestId}` on the root element
- Define constants in `src/constants/{feature}DataTestIds.ts` — never use inline strings in tests
- Pass the constant from the page: `dataTestId={GymsPageTestIds.SEARCH}`

## Keyboard & Focus
- `Escape` key should close/clear interactive overlays and search inputs — use `onKeyDown`
- Focus should be managed on modal open/close (`useRef` + `.focus()`)
- Tab order should follow visual reading order — avoid `tabIndex > 0`

## What NOT to Do
- No class components
- No `React.FC` type annotation
- No `any` type — use `unknown` and narrow, or define the type properly
- No hardcoded user-visible strings — all text goes in `src/config/ui-content.ts`
- No direct DOM manipulation (`document.querySelector`, etc.)
- No `useEffect` for data fetching — use React Query via `usePaginatedQuery`
