#!/bin/bash

set -euo pipefail

# --- Configuration Variables ---
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly APP_ROOT_DIR="${SCRIPT_DIR}"
readonly CHARTS_DIR="${APP_ROOT_DIR}/charts"
readonly CERTS_DIR="${APP_ROOT_DIR}/certs/local-certs" 
readonly SRC_DIR="${APP_ROOT_DIR}/src"

readonly NAMESPACE="bjj-app"
readonly API_IMAGE_NAME="bjj-api:local"
readonly FRONTEND_IMAGE_NAME="bjj-frontend:local"
readonly INGRESS_NAMESPACE="ingress-nginx"
readonly HELM_CHART_PATH="${CHARTS_DIR}/bjj-app"
readonly HELM_VALUES_FILE="${HELM_CHART_PATH}/values-local.yaml"

echo "--- Starting Kubernetes Deployment Setup ---"

# Function to check if a command exists
command_exists() {
  command -v "$1" &>/dev/null
}

# --- Check for prerequisites ---
check_prerequisites() {
  echo "Checking for necessary tools..."
  if ! command_exists minikube; then
    echo "Error: minikube not found. Please install minikube."
    exit 1
  fi
  if ! command_exists kubectl; then
    echo "Error: kubectl not found. Please install kubectl."
    exit 1
  fi
  if ! command_exists helm; then
    echo "Error: helm not found. Please install helm."
    exit 1
  fi
  if ! command_exists docker; then
    echo "Error: docker not found. Please install docker."
    exit 1
  fi
  echo "All prerequisites found."
}

# --- Start Minikube Cluster ---
start_minikube() {
  echo "--- Minikube Setup ---"
  if ! minikube status --profile minikube &>/dev/null; then
    echo "Minikube not running, starting it with docker driver..."
    minikube start --driver=docker --profile minikube
  else
    echo "Minikube is already running."
  fi

  # Ensure kubectl context is set to minikube
  echo "Setting kubectl context to minikube..."
  kubectl config use-context minikube

  # Point Docker daemon to Minikube's Docker daemon
  echo "Configuring Docker to use Minikube's daemon..."
  eval "$(minikube docker-env)"
}

# --- Build and Load Application Docker Images ---
build_and_load_images() {
  echo "--- Docker Image Management ---"
  echo "Building API Docker image: ${API_IMAGE_NAME}..."
  docker build -t "${API_IMAGE_NAME}" -f "${SRC_DIR}/BjjEire.Api/Dockerfile" "${APP_ROOT_DIR}"

  echo "Building Frontend Docker image: ${FRONTEND_IMAGE_NAME}..."
  docker build -t "${FRONTEND_IMAGE_NAME}" -f "${SRC_DIR}/bjjeire-app/Dockerfile" "${APP_ROOT_DIR}" \
    --build-arg SERVICES_API_HTTP_0=http://api.bjj.local \
    --build-arg SERVICES_API_HTTPS_0=https://api.bjj.local \
    --build-arg PORT=80

  echo "Loading built images into Minikube's Docker daemon..."
  minikube image load "${API_IMAGE_NAME}"
  minikube image load "${FRONTEND_IMAGE_NAME}"
}

# --- Create Kubernetes Namespace ---
ensure_namespace() {
  echo "--- Kubernetes Namespace Setup ---"
  echo "Ensuring namespace '${NAMESPACE}' exists..."
  kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
}

# --- Create Kubernetes Secrets ---
create_secrets() {
  echo "--- Kubernetes Secrets Setup ---"

  # bjj-frontend-tls-secret for Ingress
  echo "Creating/Updating bjj-frontend-tls-secret..."
  kubectl create secret tls bjj-frontend-tls-secret \
    --cert="${CERTS_DIR}/bjj-frontend.crt" \
    --key="${CERTS_DIR}/bjj-frontend.key" \
    --namespace "${NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f -

  # bjj-api-kestrel-cert-secret
  echo "Creating/Updating bjj-api-kestrel-cert-secret..."
  kubectl create secret generic bjj-api-kestrel-cert-secret \
    --from-file=aspnetapp.pfx="${CERTS_DIR}/bjj-api-kestrel.pfx" \
    --namespace "${NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f -

  # bjj-api-kestrel-cert-password
  echo "Creating/Updating bjj-api-kestrel-cert-password..."
  # WARNING: Hardcoding passwords like this is not recommended for production.
  # Consider externalizing this via environment variables or a secure prompt.
  kubectl create secret generic bjj-api-kestrel-cert-password \
    --from-file=cert-password="${CERTS_DIR}/bjj-api-kestrel-password.txt" \
    --namespace "${NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f -

  # bjj-mongodb-root-password secret
  echo "Creating/Updating bjj-mongodb-root-password secret..."
  # WARNING: Hardcoding passwords like this is not recommended for production.
  # Consider externalizing this via environment variables or a secure prompt.
  kubectl create secret generic bjj-mongodb-root-password \
    --from-literal=mongodb-password='securepassword123' \
    --namespace "${NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f -

  # bjj-tls-secret for Ingress (if different from frontend, otherwise might be redundant)
  echo "Creating/Updating bjj-tls-secret..."
  kubectl create secret tls bjj-tls-secret \
    --cert="${CERTS_DIR}/bjj-frontend.crt" \
    --key="${CERTS_DIR}/bjj-frontend.key" \
    --namespace "${NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f -
}

# --- Install NGINX Ingress Controller ---
deploy_ingress_controller() {
  echo "--- NGINX Ingress Controller Setup ---"
  echo "Checking for NGINX Ingress Controller in namespace '${INGRESS_NAMESPACE}'..."

  kubectl create namespace "${INGRESS_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

  echo "Installing/Upgrading NGINX Ingress Controller..."
  helm upgrade --install ingress-nginx ingress-nginx \
    --repo https://kubernetes.github.io/ingress-nginx \
    --namespace "${INGRESS_NAMESPACE}" \
    --set controller.service.type=NodePort \
    --wait
}

# --- Deploy Helm Chart ---
deploy_helm_chart() {
  echo "--- Helm Chart Deployment ---"
  echo "Deploying/Upgrading '${NAMESPACE}' Helm chart from '${HELM_CHART_PATH}'..."

  helm upgrade --install "${NAMESPACE}" "${HELM_CHART_PATH}" --namespace "${NAMESPACE}" --values "${HELM_VALUES_FILE}" --wait
  echo "Helm deployment complete."
}

# --- Update /etc/hosts for local access ---
update_hosts_file() {
  echo "--- Host File Configuration ---"
  local minikube_ip
  minikube_ip=$(minikube ip)
  echo "Minikube IP: ${minikube_ip}"

  local hosts_file="/etc/hosts"
  local api_host="api.bjj.local"
  local app_host="app.bjj.local"

  # Function to add/update host entry idempotently
add_or_update_host() {
  local ip=$1
  local host=$2

  if grep -q "$host" "$hosts_file"; then
    echo "Updating existing $host entry in $hosts_file..."
    sudo sed -i '' "/${host}/d" "$hosts_file"
    echo "$ip $host" | sudo tee -a "$hosts_file" > /dev/null
  else
    echo "Adding $host entry to $hosts_file..."
    echo "$ip $host" | sudo tee -a "$hosts_file" > /dev/null
  fi
}

  add_or_update_host "${minikube_ip}" "${api_host}"
  add_or_update_host "${minikube_ip}" "${app_host}"

  echo "Host file updated. Application should be accessible via Ingress:"
  echo "  - https://app.bjj.local"
  echo "  - https://api.bjj.local"
  echo "Remember to use HTTPS if ssl-redirect is enabled in your Ingress."
}

# --- Main script execution flow ---
main() {
  check_prerequisites
  start_minikube
  build_and_load_images
  ensure_namespace
  create_secrets
  deploy_ingress_controller
  deploy_helm_chart
  update_hosts_file

  echo "--- All deployment steps completed successfully! ---"
}

main
