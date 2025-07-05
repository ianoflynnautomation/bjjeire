# .devcontainer/Dockerfile
# This Dockerfile is now very minimal.
# The base image is defined in devcontainer.json, and most tools are added via Features.

FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install MongoDB Shell (mongosh) - useful for interacting with MongoDB
# Keeping this manual as it's a specific tool not typically covered by general features.
# RUN apt-get update && apt-get install -y gnupg \
#     && wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /etc/apt/keyrings/mongodb-archive-keyring.gpg \
#     && chmod go+r /etc/apt/keyrings/mongodb-archive-keyring.gpg \
#     && echo "deb [ arch=amd64,arm64 signed-by=/etc/apt/keyrings/mongodb-archive-keyring.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
#     && apt-get update \
#     && apt-get install -y mongosh \
#     && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set default working directory. This should match your project's root within the container.
WORKDIR /workspaces/BjjEire