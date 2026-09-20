# Debugging acceptance CI

How to turn a red GitHub Actions job in the BJJ Éire acceptance pipelines into a
cause, without re-running the whole matrix first.

The Playwright suites live in [`bjjeire-tests`](https://github.com/ianoflynnautomation/bjjeire-tests).
Reusable workflows live in [`bjjeire-ci-templates`](https://github.com/ianoflynnautomation/bjjeire-ci-templates).
Preview environments are created by Flux in [`bjjeire-gitops`](https://github.com/ianoflynnautomation/bjjeire-gitops).
Identities and GitHub OIDC secrets are owned by [`bjjeire-terraform-azurerm-aks`](https://github.com/ianoflynnautomation/bjjeire-terraform-azurerm-aks).

## Which pipeline is this?

| Workflow | File | What it tests | Environment |
|---|---|---|---|
| PR Environment Validation | `.github/workflows/pr-env-validation.yml` | `@smoke\|@acceptance` against `pr-<n>` | Flux preview on AKS |
| CI PR → Compose smoke | `.github/workflows/ci-pr.yml` | `@smoke` | Docker Compose on the runner |
| CI main → AKS ephemeral | `.github/workflows/ci-main.yml` | `@acceptance` | Flux `sha-<run_id>` namespace |
| Acceptance staging | `.github/workflows/acceptance-staging.yml` | `@acceptance` | Long-lived staging |

Job names are nested. `Wait for Flux Preview` is a job in PR Environment Validation.
`Acceptance Tests / api 3/4` is a shard inside `playwright-tests.yml`.
`Acceptance Tests / Report + gate / Result gate` only repeats the shard result
(it is not a new failure).

`fail-fast` is a workflow input. When `false`, one shard dying of infra still
leaves reports from the others. When `true`, GitHub cancels siblings.

## First 60 seconds

1. Open the failed **job**, not just the run. The job name tells you the stage.
2. Jump to the first red step. Ignore `Post job cleanup` and Node 20 deprecation
   notices.
3. Download artifacts from the run:
   - `k8s-diagnostics-pr-<n>` — namespace dump after a preview wait failure
   - `traces-<project>-shard-<n>` — Playwright traces (only on test failure)
   - `blob-report-*` — per-shard Playwright blobs (empty zips mean the runner
     container died before writing the report)
4. Map the error string using the table below. Do not re-run until the cause is
   named; a retry of AADSTS700016 or a STRICT mTLS hang-up will fail the same way.

## Failure catalog

### `AADSTS700016` — application not found

**Where:** `Wait for Flux Preview` → Azure OIDC login / `azure-aks-login`, or
Playwright API setup (`acquireTokenByClientCredential`).

**Meaning:** `AZURE_CLIENT_ID` or `AZURE_TESTS_CLIENT_ID` in GitHub Actions
secrets still points at a **deleted** Entra app / UAMI. Typical after
teardown + provision: Terraform created a new UAMI, GitHub kept the old GUID.

Confirm:

```bash
az identity show -g rg-bjjeire-dev-sdc-01 -n uami-gha-prenv-dev-sdc --query clientId -o tsv
terraform -chdir=/path/to/bjjeire-terraform-azurerm-aks output -raw gha_pr_env_identity_client_id
gh secret list --repo ianoflynnautomation/bjjeire   # UpdatedAt older than the last AKS apply is a smell
```

The federated credential subject for PR jobs is immutable OIDC:

`repo:ianoflynnautomation@<org-id>/bjjeire@<repo-id>:pull_request`

Fix: rewrite the secrets from Terraform outputs (or `terraform apply` with
`TF_VAR_github_token=$(gh auth token)` so `github_actions_secret.oidc` is in
state). `AZURE_CLIENT_ID` must match `uami-gha-prenv-*`. Tests app id is
`bjjeire_tests_client_id`. Then re-run the failed job — do not rebuild images.

The diagnostics step after a failed AKS login is expected to be thin (no
kubeconfig). A ~1 KB `k8s-diagnostics-*.zip` is the login failure, not a
missing preview.

### `AADSTS7000215` — invalid client secret

**Where:** Playwright `api-setup` (`acquireTokenByClientCredential` in
`src/api/support/auth.ts`). Preview wait can be green.

**Meaning:** `AZURE_TESTS_CLIENT_ID` matches the new tests app, but
`AZURE_TESTS_CLIENT_SECRET` is still the password from the **previous**
registration (or you copied the secret *id* instead of the secret *value*).
Same teardown class of bug as 700016.

```bash
terraform -chdir=bjjeire-terraform-azurerm-aks output -raw bjjeire_tests_client_secret \
  | gh secret set AZURE_TESTS_CLIENT_SECRET --repo ianoflynnautomation/bjjeire
```

Also refresh `AZURE_API_SCOPE` (`<api-audience>/.default`) if the API app was
recreated. Re-run the **Acceptance Tests** job only.

If `fail-fast: true` on the caller, one failing API shard cancels every UI
shard — you will not have Firefox/Chromium evidence from that run.

### Preview wait: HelmRelease `bjj-eire` never appears

**Where:** `Wait until HelmRelease exists` / `Wait for HelmRelease Ready`.

**Meaning:** Flux ResourceSet did not materialise `pr-<n>`. Usual causes:

- PR missing the `deploy-preview` label (job `Label deploy-preview` skipped or
  failed)
- `ResourceSetInputProvider/bjj-eire-prs` not exporting this PR
- `flux-preview` ClusterRole missing a verb (was `authorizationpolicies`, later
  `peerauthentications`)
- HelmRelease installed then stuck NotReady (image pull, ExternalSecret, seeder)

```bash
kubectl get resourcesetinputprovider,resourceset -n flux-system
kubectl get ns pr-<n> -o yaml
kubectl get helmrelease,kustomization,externalsecret -n pr-<n>
kubectl get events -n pr-<n> --sort-by=.lastTimestamp | tail
```

The `k8s-diagnostics-pr-<n>` artifact is the same dump if login succeeded.

### `apiRequestContext.fetch: socket hang up` to `bjj-api.pr-N.svc`

**Where:** Playwright API shards. Auth (Entra) already succeeded.

**Meaning:** the in-cluster Service is reachable at L4 but Istio ztunnel RST the
plaintext call. Mesh is STRICT mTLS; ARC runners are **not** in ambient, so
`source.namespaces: ["actions-runner-system"]` does not match.

ztunnel log line:

```text
connection closed due to policy rejection: explicitly denied by: istio-system/istio_converted_static_strict
```

GitOps preview ResourceSet should PERMISSIVE-mTLS port 8080 on `bjj-api` and
allow unauthenticated principals; NetworkPolicy still limits L4 to
`actions-runner-system`. Probe:

```bash
kubectl exec -n actions-runner-system <workflow-pod> -- \
  curl -sS --max-time 8 http://bjj-api.pr-<n>.svc.cluster.local:8080/actuator/health/liveness
```

`200` means mesh is open; hang-up/empty reply means it is not.

### UI cards missing, API tests green

**Where:** `chromium-desktop` / firefox / webkit. `expect(card).toBeVisible()` for
seeded names (`Leinster Community Open Mat`, `Blackwater Valley BJJ`). API shards
against `bjj-api.pr-N.svc` pass.

**Meaning:** the browser is a logged-in SPA. Catalog GETs are `permitAll`, but
Spring still 401s if `Authorization: Bearer` is present and the JWT is for a
**previous** API app. After teardown the frontend image is still baked with
`VITE_APP_MSAL_*` from August-era GitHub secrets; anonymous curl to
`https://pr-N.bjjeire.com/api/v1/gym` returns 200, the same URL with a junk
Bearer returns 401.

Fix: Terraform must write `VITE_APP_MSAL_CLIENT_ID` / `AUTHORITY` / `API_SCOPE`
on the app repo (see `github_actions_secret.oidc`), then **rebuild** the
frontend image. The SPA also skips Bearer on GET so a stale token cannot hide
the public catalog. `fail-fast: true` will cancel the other UI shards so you
only see one browser’s evidence.

### UI 522 / Cloudflare challenge / `html` class empty after reload

**Where:** chromium/firefox/webkit desktop shards.

| Symptom | Cause |
|---|---|
| 522, connection timed out | `pr-N.bjjeire.com` not on the tunnel (missing `*.bjjeire.com` CNAME / ingress) |
| HTML 404 on `dev.bjjeire.com` | Tunnel ingress matched `*.bjjeire.com` **before** `dev.bjjeire.com` |
| `cf-mitigated: challenge`, Turnstile “Verify you are human” | Super Bot Fight on Firefox/WebKit reload. `html dir=ltr lang=en-US` with empty class is the challenge page, not a theme bug |
| Cards missing, API 200 | Seeder still running, or frontend talking to the wrong API origin |

Trace screenshots showing “Performing security verification” are Bot Fight, not
Playwright. Skip Bot Fight for Access service-token traffic or `pr-*.bjjeire.com`.

### Playwright `exit 137` / custom container implementation failed

**Where:** often `webkit-desktop` (sometimes chromium). Tests die in ~1 minute
with no Playwright failure list. Follow-on steps (`upload-artifact`) log
`TypeError: Converting circular structure to JSON`.

**Meaning:** SIGKILL — almost always the node OOM-killed the job container.
ARC runner Helm requests **14Gi** / limits **16Gi**. The runners pool must be
`Standard_D4ds_v5` (16 GiB), not `D2ds_v5` (8 GiB). `fail-fast: true` then
cancels every other shard, so you lose API/UI evidence from the same run.

Blob/trace uploads after 137 are noise; fix the VM size (or drop the memory
request) and re-run.

### Empty / truncated blob zips, merge skipped

**Where:** `Report + gate / Merge reports`.

The Result gate then says `Upstream test job result was 'failure' (0 failed
test(s))` because it could not count from blobs. Root cause is the shard jobs
(ARC “custom container implementation failed” on teardown, or the hang-up
above). Fix the shards; do not debug `merge-reports`.

### `ImageRepository` dry-run / `v1beta2`

**Where:** Flux CLI on the cluster, not GitHub Actions.

The live HelmRelease can be Ready while `kustomization/bjj-eire-image-automation`
is False. Flux 2.9 removed `image.toolkit.fluxcd.io/v1beta2`. Bump those
manifests to `v1`. Unrelated to Playwright.

## Cluster checks that usually pay off

```bash
# Preview exists and is Ready
kubectl get helmrelease,pods -n pr-<n>

# Runners vs mesh
kubectl get ns actions-runner-system pr-<n> \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.labels.istio\.io/dataplane-mode}{"\n"}{end}'
kubectl get authorizationpolicy,peerauthentication,networkpolicy -n pr-<n>

# Tunnel / DNS (UI 522)
# First-match ingress: extra hostnames, then cluster_domain, then *.root
```

## After a teardown + provision

Apply AKS Terraform **then** Flux bootstrap. On dev, `github_manage_actions_oidc`
must be **true** (the default when the variable is omitted). That apply writes
`github_actions_secret.oidc` so `AZURE_CLIENT_ID` and `AZURE_TESTS_CLIENT_SECRET`
match the new UAMI / tests app. Pass `TF_VAR_github_token=$(gh auth token)` until
the GitHub App can write repository Secrets.

A green AKS apply that skipped those resources (the variable set `false`, or a
403 on the GitHub provider) is how 700016 / 7000215 come back. `gh secret set`
is only a bridge until the next apply owns the secret in state.

Re-run only the failed job (`Wait for Flux Preview` or the Playwright shards),
not the image builds.
