# ADR-0010: Specs are the living contract; agents run through gh-aw

- **Status:** Accepted
- **Date:** 2026-09-18
- **Applies to:** `specs/`, `.specify/`, `.github/workflows/spec-review.md`,
  `.github/workflows/schema-drift.md`, and the matching overlay in `bjjeire-tests`

## Context

The product already has ADRs, architecture docs, OpenAPI/Pact gates, and a
separate Playwright repo. Agents still had no single place to read "what
this feature must do" or "what a Gym document looks like", and they had no
sandboxed way to comment on drift.

Three upstream toolkits exist: GitHub Spec Kit (`.specify/`), GitHub Agentic
Workflows (Markdown compiled to Actions), and Spec2Cloud (spec → Azure).
Spec2Cloud's default topology (Container Apps, Cosmos, `azd`) is not this
system. The suite is split across `bjjeire-java`, `bjjeire-tests`, and `atest`.

## Decision

- Living specs live in `specs/` (architecture, database contracts, features).
- Spec Kit config lives in `.specify/` (not `.spec-kit/`, which the CLI does
  not read). Constitution captures rules that are already true.
- Agentic workflow **sources** are Markdown with YAML frontmatter. GitHub
  Actions and `gh aw compile` load `.github/workflows/`. `.github/workflows-aw/`
  is the named SDD copy of those sources.
- `spec-review` and `schema-drift` comment via `safe-outputs`; they are not
  added to `pr_complete.needs`. Playwright healing lives in `bjjeire-tests`
  and is driven by atest evidence, not by this repo's unit tests.
- Spec2Cloud is used as a documentation layout and SDLC phrase
  (spec → contract → tests → code → cloud). It does **not** replace Flux or
  MongoDB.

## Consequences

Agents can be pointed at `specs/` + `.specify/memory/constitution.md` instead
of rediscovering package-by-feature and GeoJSON order. A spec-only Markdown
PR still skips `ci-pr.yml` (`paths-ignore: **.md`) but can run `spec-review`.

Cost: two copies of each workflow Markdown (`workflows-aw` and `workflows`)
must stay identical; lock files are generated and must not be hand-edited.
If someone adds `spec-review` to the aggregator, an Anthropic outage becomes a
merge blocker — the same class of failure ADR-0005 forbids for `atest_analyze`.
The workflows use `engine: claude` and `ANTHROPIC_API_KEY`.

## Alternatives considered

- **Monorepo merge** of java + tests + atest. Rejected: three repos, three
  CI identities, existing SHA pins.
- **`.spec-kit/` as the working tree.** Rejected: Spec Kit CLI reads
  `.specify/`.
- **`workflows-aw/` as the only compile input.** Rejected: GitHub Actions
  only runs `.github/workflows/*.yml`; lock files must land there.
- **Full Spec2Cloud preset (`azd` / Bicep / Cosmos).** Rejected: contradicts
  the running AKS + Flux + Mongo topology.
