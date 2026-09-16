# ADR-0007: The SPA ships a single dark theme

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `src/bjjeire-app/src/` — layouts, CVA variants in `lib/`, snapshot tests

## Context

Supporting light and dark themes means every colour is a token with two values,
every component is reviewed twice, and the visual regression suite doubles —
snapshots, a11y contrast checks, and Playwright screenshot projects all run per
theme.

This is a community directory maintained by one person, with a Playwright suite
that already shards across seven browser projects.

## Decision

Dark theme only. Colours are chosen for a dark surface directly rather than
routed through a light/dark token pair.

**Do not introduce light `PageLayout` backgrounds.** CVA variants in
`src/bjjeire-app/src/lib/` define the palette; a component that needs a new
surface colour adds a variant there rather than a one-off class.

## Consequences

- One visual target. Snapshot and a11y suites stay at their current size, and
  contrast is verified once.
- Design review is a single pass.
- **A light-surface component will look correct in isolation and wrong in the
  app.** Because there is no theme switcher to reveal the mistake, the usual
  symptom is a white card on a dark page that only shows up in a screenshot
  diff.
- Adding light mode later is not a token swap — it is an audit of every
  hardcoded dark-surface colour. The cost of reversing this grows with the
  component count.
- No `prefers-color-scheme` support. Users who prefer light interfaces get dark
  anyway, which is a real accessibility trade-off accepted here.
- Third-party components usually default to light and need explicit styling to
  fit.

## Alternatives considered

- **Light and dark with CSS variables.** The standard approach and not
  difficult to start; the cost is ongoing — every new component, snapshot, and
  contrast check doubles.
- **Light only.** Same saving, and would have been a defensible choice. Dark
  was chosen on aesthetics for the content.
- **Dark now, tokens designed for a later light mode.** Tempting middle ground,
  but token discipline without a second theme to exercise it decays silently —
  the tokens drift into being aliases for specific dark colours.
