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

# bjj-app Kubernetes & Minikube Troubleshooting Guide

This guide provides troubleshooting, verification, and cleanup instructions for running the BJJ Eire application on Kubernetes/Minikube using the Helm chart in this directory.

---

## Table of Contents
- [Accessing the Application](#accessing-the-application)
- [Verification](#verification)
- [Key Components](#key-components)
- [Troubleshooting](#troubleshooting)
- [Cleanup](#cleanup)

---

## Accessing the Application

Once the `deploy-local.sh` script completes successfully, your application should be accessible via your web browser:

- **Frontend UI:** [https://app.bjj.local](https://app.bjj.local)
- **Backend API:** [https://api.bjj.local](https://api.bjj.local)

To port-forward services for local access:

```bash
kubectl port-forward svc/bjj-app-frontend 8080:80 -n bjj-app
```

For HTTPS:
```bash
kubectl port-forward svc/bjj-app-frontend 8443:443 -n bjj-app
```
Go to:
```
https://localhost:8443
```

---

## Verification

You can verify the deployment status using `kubectl` commands:

- Check Minikube status:
  ```bash
  minikube status
  ```
- Check running pods in the bjj-app namespace:
  ```bash
  kubectl get pods -n bjj-app
  ```
  You should see pods for bjj-api, bjj-frontend, and mongodb in a Running state.
- Check services:
  ```bash
  kubectl get services -n bjj-app
  ```
- Check ingresses:
  ```bash
  kubectl get ingress -n bjj-app
  kubectl get ingress -n ingress-nginx
  ```
- View logs for a specific pod (replace <pod-name> with actual pod name):
  ```bash
  kubectl logs <pod-name> -n bjj-app
  ```

---

## Key Components

### Docker Images
The deployment builds and loads two custom Docker images into your Minikube environment:
- `bjj-api:local`: For the backend API service.
- `bjj-frontend:local`: For the frontend application.

These images are built from Dockerfiles located in the `src` directory.

### Kubernetes Namespace
All application components are deployed into the dedicated `bjj-app` namespace to keep them isolated.

### Kubernetes Secrets
Several Kubernetes secrets are created to securely store sensitive information:
- `bjj-frontend-tls-secret`: TLS certificate and key for the frontend ingress.
- `bjj-api-kestrel-cert-secret`: PFX certificate for the Kestrel server in the API.
- `bjj-api-kestrel-cert-password`: Password for the API Kestrel certificate.
- `bjj-mongodb-root-password`: Root password for the MongoDB database.
- `bjj-tls-secret`: General TLS secret for ingress (might be redundant if `bjj-frontend-tls-secret` is used for both).

> ⚠️ **Security Warning (Local Development Only):**
> The `bjj-api-kestrel-cert-password` and `bjj-mongodb-root-password` secrets are currently created using hardcoded values from files or literals. This approach is **highly discouraged** for production environments. For production, consider using more secure methods like external secret management systems (e.g., Azure Key Vault, HashiCorp Vault) or interactive prompts for sensitive values.

### NGINX Ingress Controller
The NGINX Ingress Controller is installed in the `ingress-nginx` namespace. It manages incoming HTTP/HTTPS traffic and routes it to the correct services within the cluster based on the ingress rules defined in the Helm chart.

---

## Troubleshooting

### Minikube Not Starting
- Ensure Docker is running.
- Try:
  ```bash
  minikube delete --profile minikube
  ```
- Check Minikube logs:
  ```bash
  minikube logs
  ```

### Images Not Found/Loaded
- Ensure `eval "$(minikube docker-env)"` was run correctly (the script handles this).
- Verify the Docker images exist locally:
  ```bash
  docker images | grep bjj
  ```
- Manually load images:
  ```bash
  minikube image load bjj-api:local bjj-frontend:local
  ```

### Application Not Accessible via app.bjj.local
- Confirm Minikube IP:
  ```bash
  minikube ip
  ```
- Check your `/etc/hosts` file for correct entries.
- Verify Ingress status:
  ```bash
  kubectl get ingress -n bjj-app
  ```
- Check NGINX Ingress Controller health:
  ```bash
  kubectl get pods -n ingress-nginx
  ```
- Ensure no other local services are using ports 80/443 that might conflict.

### Pod CrashLoopBackOff/Error
- Check pod logs:
  ```bash
  kubectl logs <pod-name> -n bjj-app
  ```
- Describe the pod for events:
  ```bash
  kubectl describe pod <pod-name> -n bjj-app
  ```
- Common issues include incorrect environment variables, missing secrets, or misconfigured volumes.

### Certificate Errors
- Ensure your local certificates in `certs/local-certs` are valid and correctly referenced in the create_secrets function and `values-local.yaml`.
- Confirm secrets are created:
  ```bash
  kubectl get secrets -n bjj-app
  ```

---

## Cleanup
To stop and remove the Minikube cluster and all deployed resources:

- Delete the Minikube cluster:
  ```bash
  minikube delete --profile minikube
  ```
- Remove host file entries:
  Manually remove the `api.bjj.local` and `app.bjj.local` entries from your `/etc/hosts` file.
  ```bash
  sudo sed -i '' "/api.bjj.local/d" /etc/hosts
  sudo sed -i '' "/app.bjj.local/d" /etc/hosts
  ```