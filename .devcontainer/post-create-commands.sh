#!/bin/bash

echo "Running post-create commands..."

chmod +x .devcontainer/*.sh

PROVISIONING_METHOD=${BJJ_PROVISIONING_METHOD:-"helm"}

echo "Provisioning method: $PROVISIONING_METHOD"

case "$PROVISIONING_METHOD" in
    "minikube")
        echo "Setting up Minikube..."
        bash ../setup-minikube.sh
        ;;
    "docker-compose")
        echo "Setting up Docker Compose..."
        bash ../setup-docker-compose.sh
        ;;
    "helm")
        echo "Setting up Helm..."
        bash ../setup-helm.sh
        ;;
    *)
        echo "Invalid provisioning method: $PROVISIONING_METHOD. Please choose 'minikube', 'docker-compose', or 'helm'."
        exit 1
        ;;
esac

echo "Post-create commands finished."