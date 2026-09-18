# Repository overlay — gh-aw (bjjeire-java)

Loaded by the agentic-workflows skill when present. Overrides upstream
defaults where they conflict.

## Engine and writes

- Engine is Claude Code (`engine: claude`). Authenticate with repository
  secret `ANTHROPIC_API_KEY` (or Anthropic WIF). Do not add Copilot or Codex
  secrets to these workflows unless the engine is changed again.
- Agent jobs stay read-only. GitHub writes go through `safe-outputs` only.
- Never `contents: write` on the agent job. Never auto-merge.

## This system is multi-repo

| Repo | Agent may |
|---|---|
| this repo (`bjjeire`) | review specs, Java, React, seeder, OpenAPI |
| `bjjeire-tests` | mention required Playwright/Zod follow-ups; do not edit |
| `bjjeire-gitops` / `bjjeire-deploy` | mention; do not edit |
| `atest` | mention as the Playwright heal engine; do not vendor it here |

`playwright-fix` does not belong in this repository.

## Specs

- Living specs: `specs/`. Constitution: `.specify/memory/constitution.md`.
- Rules: `.specify/rules/`.
- Do not generate Azure Container Apps / Cosmos / `azure.yaml` scaffolding.
  Deploy is Flux. Database is MongoDB on the cluster.

## Compile

Sources are duplicated at `.github/workflows-aw/<id>.md` and
`.github/workflows/<id>.md`. After a frontmatter change:

```sh
gh aw compile spec-review schema-drift
```

Keep the two Markdown copies identical. Lock files are generated.

## CI interaction

Existing `ci-pr.yml` / `ci-main.yml` ignore `**.md`. Agentic workflows must
use their own `on.pull_request.paths` and must not be added to
`pr_complete.needs` unless they become a required check by human decision.
`atest_analyze` stays out of aggregators (ADR-0005).
