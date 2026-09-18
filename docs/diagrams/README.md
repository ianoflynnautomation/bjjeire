# Diagrams

## `architecture.drawio.svg`

The delivery and runtime topology. It is a **dual-format file**: a plain SVG
that GitHub renders inline anywhere it is referenced, carrying the draw.io
model in the root element's `content` attribute so the same file reopens as a
fully editable diagram.

It reads left to right as the **delivery flow** — monorepo → GitHub Actions →
GHCR artifacts → delivery repositories → runtime. The **request path and
external dependencies** are a separate strip along the bottom, because they run
orthogonally to delivery.

**To edit:**

- **VS Code** — install the *Draw.io Integration* extension and open the file;
  it opens as a canvas, not as markup. Saving writes both the picture and the
  model back.
- **Browser** — open [diagrams.net](https://app.diagrams.net/), then
  *File → Open from → Device*. Export with *File → Export as → SVG* and
  **"Include a copy of my diagram"** ticked, or the file stops being editable.

Keep the `.drawio.svg` extension — it is what signals the editable-SVG format
to both tools.

## Conventions

| Element | Meaning |
|---|---|
| Solid blue edge | Builds, publishes, or deploys |
| Dotted grey edge | Configures or gates |
| Dashed amber edge | Supplies secrets or a comparison baseline |
| Dashed purple edge | Advisory analysis — gates nothing |
| Solid green edge | Live request or data path |
| Dashed amber box | Conditional — feature-flagged or environment-specific |

In the bottom strip, Entra ID, Azure Blob, and the OTel collector are drawn
**unconnected on purpose**. They are dependencies of the running application,
not further hops in the request chain.

## Scope

The diagram spans five repositories because a code change here reaches
production through three of them. Only the leftmost two columns are owned by
this repository; the rest is context. See
[../architecture.md](../architecture.md#repository-boundaries).

The Mermaid diagrams in [../ci-cd.md](../ci-cd.md) carry the **job-level** CI
DAGs — this file deliberately summarises each pipeline as one box. Update the
Mermaid for job changes; reach for this file when the shape of delivery changes.
