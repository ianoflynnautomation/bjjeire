# Spec Kit configuration

Official home for [GitHub Spec Kit](https://github.com/github/spec-kit) in this
repository. The CLI reads **this directory** (`.specify/`), not `.spec-kit/`.

`specify init` was not run against the tree: the Copilot/Claude integrations
overwrite root agent files (`AGENTS.md`, `CLAUDE.md`) that this repo already
owns. The constitution, templates, and rules were adopted in place
(brownfield), which is the documented Spec Kit path for existing projects.

| Path | Role |
|---|---|
| `memory/constitution.md` | Non-negotiable principles (already true of the code) |
| `rules/` | Language digests for agents and gh-aw (long form remains `.claude/rules/`) |
| `templates/` | Spec Kit + Spec2Cloud-flavoured templates |
| `../specs/` | Living specifications |

New numbered features (optional Spec Kit flow):

```
/speckit-specify …
/speckit-plan …
/speckit-tasks …
/speckit-implement
```

Do not install the Spec2Cloud `verify`/`deploy` extension until it is
rewritten for Flux + Mongo. The constitution forbids generating `azure.yaml`
or Cosmos scaffolding.
