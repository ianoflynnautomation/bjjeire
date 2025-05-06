#!/bin/bash
set -euo pipefail

LOG_FILE="/tmp/post_init.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

exec > >(tee -a "$LOG_FILE") 2>&1

log "Starting post_init.sh..."

log "Checking PostgreSQL connectivity..."
psql -U postgres -d postgres -c "SELECT 1;" || {
    log "❌ Failed to connect to PostgreSQL."
    exit 1
}

log "Ensuring roles 'replicator' and 'grafana' exist..."
psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<'EOSQL'
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'replicator') THEN
        CREATE ROLE replicator WITH LOGIN REPLICATION PASSWORD 'Replicator.12345';
    ELSE
        ALTER ROLE replicator WITH PASSWORD 'Replicator.12345';
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'grafana') THEN
        CREATE ROLE grafana WITH LOGIN PASSWORD 'Postgres.12345';
    ELSE
        ALTER ROLE grafana WITH PASSWORD 'Postgres.12345';
    END IF;
END$$;
EOSQL

log "Checking if 'grafana' database exists..."
if ! psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='grafana'" | grep -q 1; then
    log "Creating 'grafana' database..."
    psql -U postgres -c "CREATE DATABASE grafana OWNER grafana;"
else
    log "Database 'grafana' already exists."
fi

log "Granting privileges to 'grafana' user..."
psql -v ON_ERROR_STOP=1 -U postgres -d grafana <<'EOSQL'
GRANT CONNECT ON DATABASE grafana TO grafana;
GRANT USAGE ON SCHEMA public TO grafana;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO grafana;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO grafana;
EOSQL

log "✅ post_init.sh completed successfully."

