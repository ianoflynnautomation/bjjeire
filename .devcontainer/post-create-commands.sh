#!/bin/bash
set -euo pipefail

echo "==> Restoring .NET packages..."
dotnet restore BjjEire.sln

echo "==> Installing frontend dependencies..."
cd src/bjjeire-app && npm install && cd ../..

echo "==> Dev container setup complete."
