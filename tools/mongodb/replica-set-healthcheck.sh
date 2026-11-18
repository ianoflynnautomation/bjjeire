#!/usr/bin/env bash
# Healthy once this node is the writable primary of replica set rs0. Initiates the set on the first check, so the
# container needs no separate init step. The member host is the compose service name, which the API resolves.
set -euo pipefail

mongosh --quiet \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --eval '
    try {
      rs.status();
    } catch (notInitiated) {
      rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongodb:27017" }] });
    }
    if (!db.hello().isWritablePrimary) { quit(1); }
  '
