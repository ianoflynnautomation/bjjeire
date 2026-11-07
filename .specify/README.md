# Spec Kit configuration

Official home for [GitHub Spec Kit](https://github.com/github/spec-kit) in this
repository. The CLI reads **this directory** (`.specify/`), not `.spec-kit/`.

Initialised with the Claude integration (CLI 1.3.2):

```
specify init --here --force --integration claude --non-interactive --ignore-agent-tools
```

The Claude integration writes skills to `.claude/skills/speckit-*`. That path
is a symlink, so they land in `.agents/skills/` with every other skill. It does
not touch `AGENTS.md`, `CLAUDE.md`, or `memory/constitution.md`.

| Path | Owner | Role |
|---|---|---|
| `memory/constitution.md` | us | Non-negotiable principles (already true of the code) |
| `rules/` | us | Language digests for agents and gh-aw (long form remains `.claude/rules/`) |
| `templates/overrides/` | us | Project templates; the resolver uses these before the core ones |
| `templates/ARCHITECTURE_SPEC.template.md`, `FEATURE_SPEC.template.md`, `stc-check.template.md` | us | Spec2Cloud / Spec-To-Check templates (`specs/stc/<feature>/`) |
| `templates/*-template.md` | CLI | Stock core templates; refreshed by `specify init` |
| `scripts/`, `workflows/`, `integrations/`, `integration.json`, `init-options.json` | CLI | Generated; do not hand-edit |
| `../.agents/skills/speckit-*` | CLI | Generated Claude skills; do not hand-edit |
| `../specs/` | us | Living specifications + `specs/stc/` check catalogs |

Change a project template in `templates/overrides/`, never in the core
`templates/*-template.md`. The CLI overwrites the core files, and
`scripts/bash/resolve-template.sh` reads the overrides first.

To upgrade, update the CLI and re-run the `init` command above. Then check
that `git diff` touches only CLI-owned paths.

The default flow is `/spec` → `/clear` → `/build-feature` (see `AGENTS.md`). Use
Spec Kit only to design a large new capability that has no living file:

```
/speckit-specify …
/speckit-clarify        (optional)
/speckit-plan …
/speckit-tasks …
/speckit-analyze        (optional)
/clear
/build-feature specs/###-slug/spec.md
```

Do not use `/speckit-implement`. `/build-feature` keeps the failing-test-first order,
AC-ID traceability and the independent `spec-verifier` review. It then writes the
result back into the living spec.

Do not install the Spec2Cloud `verify`/`deploy` extension until it is
rewritten for Flux + Mongo. The constitution forbids generating `azure.yaml`
or Cosmos scaffolding.
