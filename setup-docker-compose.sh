#!/bin/bash

set -euo pipefail

# --- Configuration Variables ---
readonly DOCKER_COMPOSE_FILES="-f docker-compose.yml -f docker-compose.override.local.yml"
readonly DOCKER_COMPOSE_PROFILE="app"

echo "--- Starting Docker Compose Environment Setup ---"

# Function to check if a command exists
command_exists() {
  command -v "$1" &>/dev/null
}

# --- Check for prerequisites ---
check_prerequisites() {
  echo "Checking for necessary tools..."
  if ! command_exists docker; then
    echo "Error: Docker not found. Please install Docker Desktop or Docker Engine."
    exit 1
  fi
  if ! command_exists docker-compose && ! docker compose version &>/dev/null; then
    echo "Error: 'docker compose' (V2) or 'docker-compose' (V1) not found."
    echo "Please ensure Docker Compose is installed and available in your PATH."
    exit 1
  fi
  echo "All prerequisites found."
}

# --- Build and Start Docker Compose Services ---
setup_docker_compose() {
  echo "Building and starting Docker Compose services with profile '${DOCKER_COMPOSE_PROFILE}'..."
  echo "This command will create/recreate services, build images if necessary, and wait for them to be healthy."

  if docker compose version &>/dev/null; then
    docker compose --profile "${DOCKER_COMPOSE_PROFILE}" "${DOCKER_COMPOSE_FILES}" up --build --wait
  elif command_exists docker-compose; then
    docker-compose --profile "${DOCKER_COMPOSE_PROFILE}" "${DOCKER_COMPOSE_FILES}" up --build --wait
  else
    echo "Fatal Error: Neither 'docker compose' nor 'docker-compose' command found."
    exit 1
  fi
}

# --- Main script execution flow ---
main() {
  check_prerequisites
  setup_docker_compose

  echo "--- Docker Compose setup complete! ---"
  echo "You can now access your application components:"
  echo "  - API: http://localhost:5003 (or https://localhost:5001)"
  echo "  - Frontend: http://localhost:60742 (or https://localhost:60743)"
  echo "  - MongoDB: localhost:27017"
  echo ""
  echo "To stop the services, run: docker compose --profile ${DOCKER_COMPOSE_PROFILE} ${DOCKER_COMPOSE_FILES} down"
}

main
