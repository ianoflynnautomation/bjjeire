#!/bin/bash

set -euo pipefail

echo "--- Running post-create commands for Dev Container ---"

echo "Making ./*.sh scripts executable..."
chmod +x ./*.sh

PROVISIONING_METHOD=${BJJ_PROVISIONING_METHOD:-"helm"}


echo "Selected provisioning method: $PROVISIONING_METHOD"

case "$PROVISIONING_METHOD" in
    "docker-compose")
        echo "Setting up Docker Compose environment..."
        bash "./setup-docker-compose.sh"
        ;;
    "helm")
        echo "Setting up Minikube and deploying via Helm..."
        bash "./setup-minikube.sh"
        echo "Minikube setup complete. Proceeding with Helm deployment..."
        bash "./setup-helm.sh"
        ;;
    *)
        echo "Error: Invalid provisioning method specified: '$PROVISIONING_METHOD'."
        echo "Please set BJJ_PROVISIONING_METHOD to 'docker-compose', or 'helm'."
        exit 1
        ;;
esac

echo "--- Post-create commands finished successfully! ---"
