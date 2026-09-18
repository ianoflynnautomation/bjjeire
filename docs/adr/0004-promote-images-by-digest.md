# ADR-0004: Promote images by digest, never rebuild for a new tag

- **Status:** Accepted
- **Date:** 2026-09-09 (recorded; decision predates this record)
- **Applies to:** `ci-main.yml` (`build_push`, `promote_images`)

## Context

`ci-main.yml` builds images tagged with the commit SHA, runs acceptance tests
against them, and then needs to publish a `:main` tag that downstream Flux
image automation tracks.

The obvious implementation is to build again with the `main` tag. That produces
a *different image* from the one acceptance tested — different build timestamp,
different layer ordering, possibly different transitive dependencies if a base
image moved in between. The thing that was tested is not the thing that ships.

## Decision

`build_push` exports each image's digest as a job output
(`java_api_image_digest`, `frontend_image_digest`, `seeder_image_digest`).
`promote_images` retags that exact digest:

```bash
docker buildx imagetools create --tag "${ref}:main" "${ref}@${digest}"
```

No rebuild, no new layers — `:main` becomes another name for bytes that already
passed.

Promotion is per-image and skips gracefully. An empty or `null` digest means
that image was not built this run, and the job emits a notice instead of
failing:

```bash
if [ -z "${digest}" ] || [ "${digest}" = "null" ]; then
  echo "::notice title=Skip promote::${name} was not built this run"
  return 0
fi
```

So a frontend-only change promotes only the frontend and leaves
`bjjeire-api:main` pointing where it was.

`promote_images` requires `build_push` to have succeeded and
`acceptance_ephemeral` to be `success` **or** `skipped`.

## Consequences

- What ships is bit-for-bit what was tested. Attestations and scan results
  recorded against the digest remain valid for `:main`.
- Promotion is seconds — a registry manifest operation, not a build.
- Multi-arch manifests survive; `imagetools create` copies the index.
- **Accepting `skipped` for acceptance is a real gap.** While
  `ACCEPTANCE_AKS_ENABLED` is not `'true'`, `acceptance_ephemeral` skips and
  images promote to `:main` with no acceptance coverage. That is deliberate —
  the alternative is blocking all delivery while the dev cluster is rebuilt —
  but it means `:main` is only as good as unit, integration, and contract
  checks during that window.
- If `fail-on-flaky` fires, acceptance is `failure`, promotion is skipped, and
  the symptom is **images built and scanned but `:main` unmoved**. Nothing is
  broken; nothing shipped either. See
  [ADR-0005](0005-flake-analysis-is-advisory.md).
- Anyone reintroducing a build step in `promote_images` silently reverts the
  guarantee, and nothing will fail to indicate it.

## Alternatives considered

- **Rebuild with the `main` tag.** One less job and no digest plumbing.
  Rejected: it ships an untested artefact.
- **Tag `:main` at build time, before acceptance.** Removes the promotion step
  entirely, but publishes to the tag Flux tracks before anything has verified
  the build.
- **Cosign-signed promotion with a policy check at deploy.** Stronger, and the
  natural next step if supply-chain requirements tighten. The build already
  produces attestations; the cluster does not yet verify them.
