#!/usr/bin/env bash
# Provisions ephemeral env vars for the smoke-test compose stack.
# Invoked by the reusable playwright-tests workflow before `docker compose up`.
# Exports compose-time env vars through $GITHUB_ENV so they are visible to the
# subsequent `docker compose up --build` step in the same job.
#
# MongoDB password is passed via env only — the CI compose override rewires
# the `mongodb_password` secret to an `environment:` source so no file on
# disk is required.

set -euo pipefail

: "${GITHUB_ENV:?GITHUB_ENV must be set — this script expects to run inside GitHub Actions}"

MONGODB_PASSWORD="$(openssl rand -base64 32 | tr -d '\n')"

cat >> "$GITHUB_ENV" <<EOF
COMPOSE_PROJECT_NAME=bjjeire-smoke
ASPNETCORE_ENVIRONMENT=Test
MONGODB_USER=admin
MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_DB=BjjEireSmoke
MONGODB_PASSWORD=${MONGODB_PASSWORD}
CORS_ORIGINS=http://localhost:3000
CORS_METHODS=GET,HEAD,OPTIONS
CORS_HEADERS=Content-Type,Accept
READONLY_MODE_ENABLED=true
AZURE_AD_TENANT_ID=test-tenant-id
AZURE_AD_CLIENT_ID=test-client-id
AZURE_AD_AUDIENCE=api://test-client-id
OTEL_SERVICE_NAME=BjjEire.Api.Smoke
OTEL_EXPORTER_OTLP_ENDPOINT=
PORT=80
SERVICES_API_HTTP_0=http://api:80
VITE_APP_MSAL_CLIENT_ID=smoke-client-id
VITE_APP_MSAL_AUTHORITY=https://login.microsoftonline.com/smoke-tenant-id
VITE_APP_MSAL_API_SCOPE=api://smoke-client-id/.default
VITE_APP_CF_BEACON_TOKEN=
VITE_APP_APP_URL=http://localhost:3000
EOF

echo "smoke-pre-up: env exported"
