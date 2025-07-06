# bjj-app Kubernetes & Helm Troubleshooting Cheat Sheet

This cheat sheet provides a quick reference for essential Kubernetes and Helm commands, with examples tailored to your `bjj-app` deployment in the `bjj-app` namespace.

---

## Table of Contents
- [Helm Release Management](#helm-release-management)
- [Kubernetes Resource Inspection](#kubernetes-resource-inspection)

---

## Helm Release Management

### List Helm releases
```bash
helm list -n <namespace>
```
**Example:**
```bash
helm list -n bjj-app
```
> Shows all Helm releases in the specified namespace. Look for the STATUS column (e.g., deployed, failed, pending-upgrade).

### View release history
```bash
helm history <release-name> -n <namespace>
```
**Example:**
```bash
helm history bjj-app -n bjj-app
```
> Displays the revision history of a specific Helm release. Useful for identifying failed upgrades and the last successful revision.

### Revert to a previous release
```bash
helm rollback <release-name> <revision-number> -n <namespace>
```
**Example:**
```bash
helm rollback bjj-app 1 -n bjj-app
```
> Reverts the release to a specified previous revision. Use this to recover from a failed upgrade or clear a PENDING state.

### Remove a Helm release
```bash
helm uninstall <release-name> -n <namespace>
```
**Example:**
```bash
helm uninstall bjj-app -n bjj-app
```
> Deletes a Helm release and all Kubernetes resources associated with it. Use with caution, especially if persistent data is involved.

### Deploy or upgrade a Helm chart
```bash
helm upgrade --install <release-name> <chart-path> -n <namespace> --values <values-file.yaml> --create-namespace --debug
```
**Example:**
```bash
helm upgrade --install bjj-app ./bjj-app --namespace bjj-app --values ./bjj-app/values-local.yaml --create-namespace --debug
```
> The primary command to deploy (if not exists) or upgrade an application using a Helm chart. `--debug` provides verbose output, `--values` specifies your custom configuration.

### Render chart templates locally
```bash
helm template <release-name> <chart-path> -n <namespace> -f <values-file.yaml>
```
**Example:**
```bash
helm template bjj-app ./bjj-app -n bjj-app -f ./bjj-app/values-local.yaml
```
> Renders the Kubernetes manifests that Helm would apply, without actually deploying them. Excellent for debugging template issues or verifying the final YAML configuration before deployment.

---

## Kubernetes Resource Inspection

### List pods
```bash
kubectl get pods -n <namespace>
```
**Example (all pods):**
```bash
kubectl get pods -n bjj-app
```
**Example (frontend pods only):**
```bash
kubectl get pods -n bjj-app -l app.kubernetes.io/component=frontend
```
> Shows the status of pods. Look for STATUS (e.g., Running, Pending, CrashLoopBackOff) and READY column (e.g., 1/1).

### Get detailed pod information
```bash
kubectl describe pod <pod-name> -n <namespace>
```
**Example:**
```bash
kubectl describe pod bjj-app-frontend-7644fb5496-wbktc -n bjj-app
```
> Provides a comprehensive view of a pod, including its configuration, mounted volumes, environment variables, and crucial Events at the bottom that explain its lifecycle (e.g., scheduling failures, crash reasons).

### View container logs
```bash
kubectl logs -f <pod-name> -n <namespace> [-c <container-name>] [--previous]
```
**Example (streaming frontend logs):**
```bash
kubectl logs -f bjj-app-frontend-7644fb5496-wbktc -n bjj-app
```
**Example (previous logs after a crash):**
```bash
kubectl logs -f bjj-app-frontend-7644fb5496-wbktc -n bjj-app --previous
```
**Example (specific init container logs):**
```bash
kubectl logs -f bjj-app-frontend-7644fb5496-wbktc -n bjj-app -c wait-for-api-service
```
> Displays the output from your application's containers. Essential for debugging application-specific errors (e.g., NGINX config parsing errors, application startup failures).

### Inspect ConfigMap content
```bash
kubectl get configmap <configmap-name> -n <namespace> -o yaml
```
**Example (NGINX config):**
```bash
kubectl get configmap bjj-app-frontend-nginx-config -n bjj-app -o yaml
```
> Shows the exact content of a ConfigMap as stored in Kubernetes. Crucial for verifying if your configuration changes (like NGINX config) have been applied correctly by Helm.

### Inspect Secret content
```bash
kubectl get secret <secret-name> -n <namespace> -o yaml
```
**Example (TLS secret):**
```bash
kubectl get secret bjj-frontend-tls-secret -n bjj-app -o yaml
```
> Displays the base64-encoded content of a Secret. Be extremely cautious when using this command as it reveals sensitive information. Use it to verify if secrets are correctly mounted or if their values are as expected.

### Force a deployment restart
```bash
kubectl rollout restart deployment <deployment-name> -n <namespace>
```
**Example (frontend deployment):**
```bash
kubectl rollout restart deployment bjj-app-frontend -n bjj-app
```
> Triggers a rolling restart of all pods in a deployment. Useful after updating ConfigMaps or Secrets that are mounted as files, as pods often don't automatically pick up these changes without a restart.

---