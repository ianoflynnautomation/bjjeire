#!/bin/bash

set -euo pipefail

# --- Configuration Variables ---
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
readonly APP_ROOT_DIR="${SCRIPT_DIR}"
readonly SRC_DIR="${APP_ROOT_DIR}/src"
readonly API_IMAGE_NAME="bjj-api:local"
readonly FRONTEND_IMAGE_NAME="bjj-frontend:local"

echo "--- Starting Simple Minikube Setup ---"

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

# --- Main script execution flow ---
main() {
  check_prerequisites
  start_minikube
  build_and_load_images

  echo "Minikube setup and image loading complete."
  echo "If you have separate K8s manifests for minikube, you can apply them now."
  # Example: kubectl apply -f path/to/your/minikube-manifests/
}

# Call the main function
main
