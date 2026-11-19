#!/usr/bin/env bash
# Starts MongoDB as a single-node replica set (ADR-0017): the API's event publication registry writes in transactions,
# which a standalone server refuses. A replica set with authentication needs a keyfile; one node only talks to itself,
# so a fresh random key on every start is enough. The image's entrypoint drops --replSet for its first-run user setup.
set -euo pipefail

keyfile=/data/configdb/keyfile
head -c 756 /dev/urandom | base64 -w 0 > "$keyfile"
chmod 400 "$keyfile"
chown 999:999 "$keyfile"

exec docker-entrypoint.sh mongod --replSet rs0 --bind_ip_all --keyFile "$keyfile"
