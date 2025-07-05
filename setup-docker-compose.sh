#!/bin/bash

echo "Setting up Docker Compose environment..."
echo "Building and starting Docker Compose services..."

docker compose --profile app -f docker-compose.yml -f docker-compose.override.local.yml up --build --wait

echo "Docker Compose setup complete."
echo "Access your API at http://localhost:5003 (or https://localhost:5001)."
echo "Access your Frontend at http://localhost:60742 (or https://localhost:60743)."
echo "Connect to MongoDB at localhost:27017."