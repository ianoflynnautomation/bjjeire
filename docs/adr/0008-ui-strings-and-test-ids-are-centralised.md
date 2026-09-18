# ADR-0008: User-visible strings and test IDs live in central modules

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `src/bjjeire-app/src/config/ui-content.ts`, `src/bjjeire-app/src/constants/*DataTestIds.ts`

## Context

Acceptance tests for this application live in a **different repository**
(`bjjeire-tests`) and run against built images. When a selector changes here,
nothing in this repository fails — the break surfaces later, in a Playwright
suite, as a timeout on an element that no longer exists.

The same applies to copy: a string inlined in a component is a string a test
may be asserting on, with no reference between them.

## Decision

**All user-visible strings** live in `src/bjjeire-app/src/config/ui-content.ts`.
Components import from it; they do not contain literal copy.

**All data test IDs** come from `src/bjjeire-app/src/constants/*DataTestIds.ts`.
Components reference the constant; tests in both repositories reference the same
name.

Related conventions that exist for the same reason — keeping the contract
between code and tests explicit:

- CVA variants live in `src/bjjeire-app/src/lib/`.
- Cross-folder imports use `@/`; same-folder imports stay relative.
- Components are declared `memo(function ComponentName())`, so the function
  name appears in React DevTools and test output rather than `Anonymous`.

## Consequences

- Changing copy is one file, and the diff shows every affected string.
- A renamed test ID is visible in this repository's diff, which is the cue to
  update `bjjeire-tests` in the same change. It does not *enforce* the update —
  nothing here can — but it makes the omission reviewable.
- Copy is greppable, which is what makes the eventual move to i18n a
  restructure of one module rather than a codebase-wide sweep.
- **The indirection is the cost.** Reading a component no longer tells you what
  it says on screen, and the constant name has to carry that meaning. A badly
  named key is worse than an inline string.
- `ui-content.ts` grows monotonically and needs periodic grouping by feature.
- Inlining "just this one" string is invisible in review until a test breaks in
  another repository. This is the rule most likely to erode quietly.

## Alternatives considered

- **Inline strings, tests select by visible text.** Simplest, and standard
  Testing Library practice. Rejected because the acceptance suite lives in
  another repository and cannot be updated atomically with a copy change.
- **A full i18n library from the start** (`react-i18next`). Gives the same
  centralisation plus pluralisation and interpolation. Rejected as premature
  for a single-locale application; `ui-content.ts` is the shape that makes
  adopting one later straightforward.
- **Generate a shared test-ID package consumed by both repositories.** Would
  turn the convention into a compile-time contract. A real option if selector
  drift keeps causing breakage; it adds a package to publish and version.
