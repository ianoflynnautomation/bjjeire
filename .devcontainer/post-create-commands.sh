#!/bin/bash
set -euo pipefail

echo "==> Resolving Maven dependencies..."
mvn -q -pl src/bjjeire-api dependency:go-offline || true

echo "==> Installing frontend dependencies..."
cd src/bjjeire-app && npm install && cd ../..

echo "==> Dev container setup complete."
