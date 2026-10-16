# ADR-0011: The SPA has light, dark, and competition themes

- **Status:** Accepted
- **Date:** 2026-10-16
- **Applies to:** `src/bjjeire-app/src/index.css`, `src/bjjeire-app/src/hooks/useTheme.ts`, layouts, CVA variants in `lib/`
- **Supersedes:** [ADR-0007](0007-dark-theme-only.md)

## Context

ADR-0007 recorded a single dark theme so every colour, snapshot, and contrast
check had one target. The SPA no longer matches that record. `useTheme` cycles
three themes, and `index.css` defines a token block for each.

Light is the bright theme. Dark is the charcoal theme. Competition is the
match-day theme: it keeps the dark surfaces and adds its own edges and focus
colour. The nav control cycles them in that order.

## Decision

The SPA ships three themes: `light`, `dark`, and `competition`.

`useTheme` is the only place that changes the theme. It stores the choice in
`localStorage` under `bjjeire-theme`. With nothing stored, it follows
`prefers-color-scheme`: dark when the system prefers dark, otherwise light.
Competition is never chosen automatically.

On `<html>`:

- `light` sets `color-scheme: light` and sets neither `dark` nor `competition`.
- `dark` sets `color-scheme: dark` and the `dark` class.
- `competition` sets `color-scheme: dark` and both the `dark` and `competition`
  classes, so dark variants still apply and competition variants override them.

Colours come from the semantic tokens in `src/bjjeire-app/src/index.css`
(`:root`, `html.dark`, `html.competition`). A new surface colour is a token
there, or a CVA variant in `src/bjjeire-app/src/lib/`. It is not a one-off hex
or a slate-glass utility.

`PageLayout` stays transparent. The canvas colour and the weave belong to
`body`, not to the page wrapper.

Do not remove a theme from the cycle, and do not add a fourth theme without a
token block, a `useTheme` step, and a revision of this record.

## Consequences

- A component that hardcodes a dark surface looks right in dark and competition
  and wrong in light. The theme control is what reveals it.
- Competition inherits `dark`. A competition-only colour is an
  `html.competition` override. A colour that should differ in both dark themes
  is an `html.dark` value.
- `PageLayout` with a background paints over the canvas token. The page then
  ignores the active theme.
- Snapshots and contrast checks have three targets when a change is
  theme-sensitive. Dark-only coverage will not catch a light-theme regression.
- Removing `light` or `competition` from `CYCLE` leaves the nav control and the
  token blocks lying about a theme the user can no longer reach.

## Alternatives considered

- **Dark only (ADR-0007).** Rejected. The product already ships the cycle, and
  recording a single theme sends later changes back toward deleting light and
  competition.
- **Follow `prefers-color-scheme` and offer no manual cycle.** Rejected.
  Competition is a product theme, not an operating-system preference, and the
  nav control is how a visitor reaches it.
- **Rename `light` to `bright` in code.** Rejected. The bright theme is the
  `light` value already stored in `bjjeire-theme`. Renaming it would discard
  saved choices.
