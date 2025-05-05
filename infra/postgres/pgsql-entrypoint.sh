#!/bin/bash
set -e

echo "PostgreSQL wait patroni to start"

# Initialize PostgreSQL data directory (if not already initialized)
if [ ! -d "/var/lib/postgresql/data" ]; then
    mkdir -p /var/lib/postgresql/data
    chown postgres:postgres /var/lib/postgresql/data
    su-exec postgres initdb -D /var/lib/postgresql/data --auth-host=scram-sha-256 --auth-local=scram-sha-256
fi

# Start Patroni
exec su-exec postgres /venv/bin/patroni /venv/etc/patroni.yml