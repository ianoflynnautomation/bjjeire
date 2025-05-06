#!/bin/bash
set -euo pipefail

CONFIG_TEMPLATE="/venv/etc/patroni.yml.template"
CONFIG_FILE="/venv/etc/patroni.yml"
SOCKET_DIR="/var/run/postgresql"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting entrypoint..."

# Generate Patroni config if template is present
if [ -f "$CONFIG_TEMPLATE" ]; then
    log "Generating config from template..."
    envsubst < "$CONFIG_TEMPLATE" > "$CONFIG_FILE"
    log "Config generated at $CONFIG_FILE"
elif [ -f "$CONFIG_FILE" ]; then
    log "Using existing config at $CONFIG_FILE"
else
    log "ERROR: No Patroni config found. Exiting."
    exit 1
fi

# Ensure PostgreSQL socket directory exists
mkdir -p "$SOCKET_DIR"
chown postgres:postgres "$SOCKET_DIR"
chmod 750 "$SOCKET_DIR"

# Ensure post_init script is executable if present
if [ -f /scripts/post_init.sh ]; then
    chmod +x /scripts/post_init.sh
fi

log "Starting Patroni..."
exec su-exec postgres /venv/bin/patroni "$CONFIG_FILE"

