#!/bin/bash
set -e


log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Executing post_init.sh script..."

# Ensure POSTGRES_USER is set (default to 'postgres' for initialization)
# POSTGRES_USER=${POSTGRES_USER:-postgres}

# Create roles and database using the postgres user
psql -v ON_ERROR_STOP=1 --username "grafana" --dbname "postgres" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'grafana') THEN
            RAISE NOTICE 'Creating role grafana...';
            CREATE ROLE grafana WITH LOGIN PASSWORD 'Postgres.12345' CREATEROLE CREATEDB;
        ELSE
            RAISE NOTICE 'Role grafana already exists.';
            -- Update password in case it was changed
            ALTER ROLE grafana WITH PASSWORD 'Postgres.12345';
        END IF;
    END
    \$\$;

    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
            RAISE NOTICE 'Creating role admin...';
            CREATE ROLE admin WITH LOGIN PASSWORD 'admin' CREATEROLE CREATEDB;
        ELSE
            RAISE NOTICE 'Role admin already exists.';
            ALTER ROLE admin WITH PASSWORD 'admin';
        END IF;
    END
    \$\$;

    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
            RAISE NOTICE 'Creating role replicator...';
            CREATE ROLE replicator WITH LOGIN PASSWORD 'replicator_password' REPLICATION;
        ELSE
            RAISE NOTICE 'Role replicator already exists.';
            ALTER ROLE replicator WITH PASSWORD 'replicator_password';
        END IF;
    END
    \$\$;

    -- Create grafana database if it doesn't exist
    SELECT 'CREATE DATABASE grafana OWNER grafana'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'grafana')\gexec
EOSQL

if [ $? -eq 0 ]; then
    log "Users and database checked/created successfully."
else
    log "Error: Failed to create users or database."
    exit 1
fi

log "post_init.sh script finished."
