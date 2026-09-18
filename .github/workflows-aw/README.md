# GitHub Agentic Workflows (sources)

[gh-aw](https://github.com/github/gh-aw) compiles Markdown with YAML frontmatter into GitHub Actions. The compiler and GitHub Actions both load **`.github/workflows/`**, not this folder.

This folder is the named SDD entrypoint. Each `.md` file here is the same source as its twin under `../workflows/`. Edit one, copy to the other, then:

```sh
gh aw compile spec-review schema-drift
```

Compiled output is `../workflows/<name>.lock.yml` (linguist-generated). Do not hand-edit lock files.

Engine is Claude Code (`engine: claude`). Set repository secret `ANTHROPIC_API_KEY` (Claude OAuth tokens are not supported).

| Workflow | Trigger | Effect |
|---|---|---|
| [spec-review.md](./spec-review.md) | Pull request (code, specs, seeder) | Comment: does the change match the living spec? |
| [schema-drift.md](./schema-drift.md) | Pull request (API, seeder, database contracts) | Comment: Mongo / OpenAPI / seeder / DTO alignment |

Playwright healing lives in **bjjeire-tests** (`.github/workflows-aw/playwright-fix.md`) and is driven by the [atest](https://github.com/ianoflynnautomation) evidence pipeline, not this repo's unit tests.

Agent overlay: [../aw/instructions.md](../aw/instructions.md).
