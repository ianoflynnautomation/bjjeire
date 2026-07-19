# .NET → Java Cutover Checklist

Gated, ordered checklist for switching production from the legacy .NET API image
to the Java API published as `ghcr.io/…/bjjeire-api`. Rollout is owned by GitOps
(Terraform + Flux in `bjjeire-gitops` / `bjjeire-deploy`); CI's job ends at GHCR.
Every phase has a rollback: point the GitOps image ref back at the .NET image and
let Flux reconcile.

## Phase 0 — Entry criteria (done)

- [x] Subsystem parity: event model, cost calculator, validation + error contract,
      indexes/TTL, deactivation + leader election, audit log, seeder, caching,
      pagination links (`mvn verify`: 103 unit + 30 integration tests green).
- [x] `~/bjjeire-tests` acceptance suite green against the Java compose stack.
- [x] Local compose stack verified end-to-end (seed → API → frontend).

## Phase 1 — CI and artifact readiness

- [ ] Push `bjjeire-ci-templates` with `maven-build-test.yml`; re-pin the
      `@main` references in `ci-pr.yml` / `ci-main.yml` to the new commit SHA
      (search for `TODO: re-pin`).
- [ ] Merge the Java CI changes; confirm on a PR touching `src/bjjeire-api/**`
      that `Java Build & Test` runs and `PR Checks Complete` stays green when it
      is skipped on unrelated PRs.
- [ ] Confirm a main-branch run publishes `ghcr.io/<owner>/bjjeire-api`
      with sha/latest tags, cosign signature, SBOM/provenance attestations, and
      a clean (or triaged) Trivy scan.
- [x] `smoke_tests` runs the Java compose stack
      (`docker-compose.override.java-local.yml` + CI override).
- [x] OpenAPI contract generation ported to springdoc: `OpenApiContractIT`
      exports `/v3/api-docs` when `OPENAPI_ARTIFACT_PATH` is set (mirroring the
      .NET `Feature=OpenApi` mechanism); the breaking gate (oasdiff, ref-
      resolving) keeps comparing against the published baseline.
- [x] CI is .NET-free: `dotnet_build_test`, the `bjjeire-api`/NuGet release
      jobs, and the .NET path filters removed; `validate-data` runs the Java
      seeder `--validate` (no DB needed); the release `bjjeire-seeder` image is
      now the Java jar + baked JSON sources (`seeder.Dockerfile`).
- [ ] Watch the first main-branch oasdiff run: the springdoc spec vs the last
      .NET-published baseline may surface generator differences — breaking
      findings there are real signal, not noise, and must be triaged before
      the contract publish proceeds.

## Phase 2 — Staging via GitOps

- [ ] In `bjjeire-deploy` / `bjjeire-gitops`, add a staging overlay pointing the
      api workload at `bjjeire-api` with the Java environment contract:
      - `MONGODB_URI` (replaces `ConnectionStrings__Mongodb`), `MONGODB_DATABASE`
      - `ENTRA_ISSUER_URI`, `ENTRA_AUDIENCE` (replaces `AzureAd__*`)
      - `CORS_ALLOWED_ORIGIN`, `READ_ONLY_MODE_ENABLED`, `RATE_LIMIT_ENABLED`,
        `FEATURE_*`, `DONATION_BITCOIN_ADDRESS`
      - container port **8080** (the .NET image serves on 80); probes on `/health`
        (liveness/readiness also available at `/actuator/health/*`)
      - `OTEL_*` exporter settings (the Java image uses the OTel Spring starter)
- [ ] Let Flux reconcile; verify: `/health` UP with Mongo component, index
      catalog logged at startup (`ttl_event_expiresAt`, unique slug), list +
      by-id endpoints serving real data, absolute pagination links carrying the
      correct external host (confirm forwarded-header handling behind the proxy).
- [ ] Run the acceptance suite against staging.
- [ ] Leave the deactivation scheduler running through at least one interval and
      check the sweep + leader-election logs and the `AuditLog` collection.

## Phase 3 — Production cutover

- [ ] `mongodump` backup, stored outside the Docker volume (per mongodb rules).
- [ ] Confirm the Java app user is `readWrite` on the app DB only (SCRAM-SHA-256).
- [ ] Flip the production GitOps image ref to `bjjeire-api` (digest-pinned);
      Flux reconciles the rollout — no Actions involvement.
- [ ] Post-cutover verification: `/health`, seeded data intact, frontend against
      the live API, error rates/latency vs the .NET baseline, first TTL monitor
      pass does not delete unexpected documents (expiry = endDate + 2y grace).
- [ ] Soak for an agreed window (suggest ≥1 week including one full deactivation
      sweep) with rollback armed (previous .NET image digest kept in the repo).

## Phase 4 — Decommission .NET (only after soak)

- [ ] Relocate survivors out of the BjjEire repo first: `src/bjjeire-app`
      (React SPA), `src/BjjEire.Seeder/data*` (JSON sources — the Java seeder
      reads the same files), `.claude/` rules + `AGENTS.md`, compose Mongo profile.
- [ ] Delete .NET projects, solution, `Directory.*.props`, `build-dotnet.sh`,
      `nuget.config`, `docker-compose.dcproj`, .NET Dockerfiles.
- [ ] Replace tooling: Maven wrapper at repo root, Java `.editorconfig`,
      `.gitignore` (`target/`, `.idea/`, `*.iml`), Spring Boot launch config.
- [ ] Docs sweep: README, CLAUDE.md, AGENTS.md, `.claude/rules/dotnet.md` →
      Java equivalents; update standard-commands sections.
- [ ] Leftover scan: `grep -riE 'dotnet|csproj|nuget|BjjEire\.sln'` across the
      repo, CI templates, and the test repo configs.
- [ ] Verify from a clean clone: `mvn verify` → container build → acceptance
      suite against the running Java API.
- [ ] Archive the .NET BjjEire repo read-only; retire its CI; keep the final
      Mongo backup and last .NET image digest for the retention window.

## Known intentional divergences (reviewed during migration)

- Create endpoints require a client-supplied 24-hex ObjectId (matches .NET
  validation; the old Java behavior of accepting `id: null` was removed).
- Negative caching is absent (Caffeine does not cache null loader results;
  .NET HybridCache caches null by-id lookups). Lenient-side only.
- Free-pricing options accept an *absent* `currency` field (Jackson cannot
  distinguish absent from explicit null; .NET defaults absent to "EUR" and
  then fails Free validation). Lenient-side only.
