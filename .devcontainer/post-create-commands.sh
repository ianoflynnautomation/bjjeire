#!/usr/bin/env bash
set -euo pipefail

echo "==> Fixing ~/.m2 cache volume ownership..."
sudo chown -R "$(id -u):$(id -g)" "${HOME}/.m2" 2>/dev/null || true

echo "==> Ensuring Maven Wrapper is executable..."
chmod +x ./mvnw || true

echo "==> Warming Maven dependency cache (offline resolve)..."
./mvnw -q -pl src/bjjeire-api dependency:go-offline || true

echo "==> Installing frontend dependencies..."
if [ -f src/bjjeire-app/package-lock.json ]; then
  (cd src/bjjeire-app && npm ci)
else
  (cd src/bjjeire-app && npm install)
fi

echo "==> Toolchain versions:"
java -version || true
./mvnw -version || true
node --version || true

echo "==> Dev container setup complete."
