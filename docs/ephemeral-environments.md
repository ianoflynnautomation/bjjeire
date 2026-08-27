# Ephemeral environments (PR and main)

How BJJ Éire stands up short-lived AKS environments for tests. Both paths are
**Flux-owned**: GitHub Actions must not `kubectl apply` `ResourceQuota` (AKS
RBAC Admin cannot write it). CI only **signals** Flux, then waits.

GitOps source: [`bjjeire-gitops`](https://github.com/ianoflynnautomation/bjjeire-gitops)
`kubernetes/apps/base/bjj-eire-preview/`. Reusable workflows:
[`bjjeire-ci-templates`](https://github.com/ianoflynnautomation/bjjeire-ci-templates)
`acceptance-gate.yml` and this repo’s `pr-env-validation.yml`.

```
                    ┌─────────────────────────────────────────┐
                    │ ResourceSet bjj-eire-previews           │
                    │ (flux-system, SA flux-preview)          │
                    │  • Namespace + quota + LimitRange       │
                    │  • ExternalSecrets, HTTPRoutes, netpol  │
                    │  • HelmRelease bjj-eire                 │
                    └──────────────▲──────────────▲───────────┘
                                   │              │
              GitHubPullRequest    │              │  Static
              bjj-eire-prs         │              │  labelled
              label deploy-preview │              │  bjjeire.io/sha-env=true
                                   │              │
                         PR preview│              │ SHA / main
                         pr-<n>    │              │ sha-<run_id>
                         ttl 2h    │              │ ttl 4h
```

One ResourceSet, two input sources (`spec.inputStrategy` Flatten). Templates
use `get inputs "ns" | default (printf "pr-%s" inputs.id)` so PR inputs (no
`ns`) and SHA inputs (`ns: sha-<run_id>`) render the same objects.

## PR preview — `pr-<id>`

**When:** `pr-env-validation.yml` on `pull_request` to `main`, `PR_ENV_ENABLED=true`,
same-repo (not forks), **not Dependabot**, and path filters say a deployable
image changed (`java_api_image` / `frontend` / `seeder`).

**Why not Dependabot:** a Maven/npm bump in the API or app would otherwise
label eight open Dependabot PRs `deploy-preview`. Flux’s `filter.limit` then
installs that many HelmReleases at once and the apps pool cannot schedule them.
Dependabot still gets compose `@smoke` on `ci-pr.yml`. GitOps also sets
`excludeBranch: ^dependabot/` so a leftover label cannot recreate those envs.

**Sequence:**

1. Build `linux/arm64` images tagged `pr-<n>-<headsha>` (`attest: false`).
2. Add GitHub label `deploy-preview`.
3. Flux `ResourceSetInputProvider` `bjj-eire-prs` (`type: GitHubPullRequest`)
   exports `{id, sha, branch, …}` plus defaults `rootDomain`, `ttl: 2h`.
4. ResourceSet renders namespace `pr-<n>`, quota, secrets, HTTPRoutes,
   HelmRelease with image tag `pr-<n>-<sha>`.
5. CI waits until HelmRelease `bjj-eire` exists, then Ready (10m).
6. Playwright `@smoke|@acceptance` uses public HTTPS origins with
   `PIN_CLUSTER_GATEWAY=true` (in-cluster Istio, not Cloudflare Bot Fight).
   API shards override `API_URL` to `http://bjj-api.pr-<n>.svc.cluster.local:8080`.
7. On PR close: remove `deploy-preview`. Flux drops the input and prunes.
   `flux-ephemeral-teardown.yml` deletes the namespace as a backup.

**Hostnames:** `https://pr-<n>.bjjeire.com` and `https://api-pr-<n>.bjjeire.com`.
The Istio Gateway `https-apex-wildcard` only accepts HTTPRoutes from namespaces
labelled `gateway-access: true`. That label is on ResourceSet
`commonMetadata` (and the Namespace template) so it always lands.

## Main / SHA acceptance — `sha-<run_id>`

**When:** `ci-main.yml` job `acceptance_ephemeral`, `ACCEPTANCE_AKS_ENABLED=true`,
after a successful image push, when API/frontend/seeder changed (or a tag).

**Sequence:**

1. `docker-build-push` publishes images tagged with `github.sha`.
2. `acceptance-gate.yml` `mode: ephemeral` applies a **Static**
   `ResourceSetInputProvider` in `flux-system`:

   ```yaml
   metadata:
     name: sha-<run_id>          # DNS-1123, also the namespace
     labels:
       bjjeire.io/sha-env: "true"
     annotations:
       janitor/ttl: "4h"
   spec:
     type: Static
     defaultValues:
       ns: sha-<run_id>
       imageTag: "<github.sha>"
       ttl: "4h"
       clusterDomain: …
       rootDomain: bjjeire.com
   ```

3. Flux picks it up via the ResourceSet selector `bjjeire.io/sha-env=true`.
   `flux-preview` (Cluster Admin-equivalent for these objects) creates the
   namespace, **ResourceQuota**, LimitRange, and HelmRelease. GHA never
   applies quota.
4. Gate waits for HelmRelease Ready, runs `@acceptance`, then teardown
   **deletes the InputProvider first** so Flux prunes instead of recreating
   the namespace.

CI templates v1.6.0+ implement this path. Pin
`acceptance-gate.yml` to that SHA (`# v1.6.0`) before relying on it.

## What Flux creates in every ephemeral namespace

Same chart overlay as `controller/values-ephemeral.yaml` (Mongo without PVC,
no ingress objects — HTTPRoute is native Gateway API):

| Object | Role |
|---|---|
| Namespace | `gateway-access=true`, ambient, PSA baseline, `bjjeire.io/ephemeral=true` |
| ResourceQuota `ephemeral` | 2 CPU / 2Gi request, 0 PVCs |
| LimitRange | Container defaults |
| ExternalSecrets | Mongo password, Entra, GHCR pull, donation |
| HTTPRoute | Frontend + API on `*.bjjeire.com` |
| NetworkPolicy + Istio AuthorizationPolicy / PeerAuthentication | Default deny; allow mesh, ingress, runners |
| HelmRelease `bjj-eire` | Chart from `OCIRepository` in `bjjeire-app` |

## Cleanup

| Mechanism | What it deletes | When |
|---|---|---|
| PR close → unlabel `deploy-preview` | Flux input → prune `pr-<n>` | Immediately after reconcile |
| SHA teardown job | Static InputProvider, then namespace | After green tests (or if `keep-on-failure=false`) |
| Kyverno `ephemeral-sha-input-providers` | Static providers labelled `bjjeire.io/sha-env=true` | `janitor/ttl` (default 4h) |
| Kyverno `ephemeral-env-namespaces` | Namespaces labelled `bjjeire.io/ephemeral=true` except SHA-owned | `janitor/ttl` (default 2h) |

SHA namespaces are excluded from the namespace janitor so Kyverno does not
fight the ResourceSet. Reap the InputProvider instead.

## Capacity rules

- Apps pool is small. GitOps `filter.limit: 3` is the hard cap on concurrent
  **PR** previews. Human feature PRs only.
- Do not raise `limit` without a larger apps / runner pool.
- Main SHA envs are one-at-a-time per workflow run (`sha-<run_id>`).
- Playwright shard defaults assume a D8-class **runner** pool (`max-parallel: 8`);
  that is independent of how many preview namespaces exist.

## Debugging

See [acceptance-ci-debug.md](acceptance-ci-debug.md) for job-level failures.

```bash
kubectl -n flux-system get resourceset bjj-eire-previews
kubectl -n flux-system get resourcesetinputprovider
kubectl get ns -l bjjeire.io/ephemeral=true --show-labels
kubectl -n pr-<n> get helmrelease,httproute,pods
# HTTPRoute Accepted=False + "not allowed by the parent" → missing gateway-access on the namespace
```
