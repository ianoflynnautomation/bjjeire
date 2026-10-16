#!/usr/bin/env bash
# Runs on create and on rebuild (updateContentCommand).
set -euo pipefail

echo "==> Fixing cache volume ownership..."
for dir in \
  "${HOME}/.m2" \
  "${HOME}/.npm" \
  "${HOME}/.claude" \
  "${HOME}/.grok" \
  "${HOME}/.config/gh"
do
  if [ -d "${dir}" ]; then
    sudo chown -R "$(id -u):$(id -g)" "${dir}"
  fi
done

echo "==> Installing ripgrep and jq..."
sudo apt-get update
sudo apt-get install -y --no-install-recommends ripgrep jq

# Native installers write into the vscode home directory. A global npm
# install is root-owned, so `claude update` / `grok update` fail with
# "Insufficient permissions" for the vscode user.
echo "==> Installing Claude Code..."
curl -fsSL https://claude.ai/install.sh | bash

echo "==> Installing Grok Build..."
curl -fsSL https://x.ai/cli/install.sh | bash

export PATH="${HOME}/.local/bin:${HOME}/.grok/bin:${PATH}"

echo "==> Marking the workspace as a safe git directory..."
workspace="${containerWorkspaceFolder:-$(pwd)}"
existing="$(git config --global --get-all safe.directory || true)"
if ! printf '%s\n' "${existing}" | grep -Fxq "${workspace}"; then
  git config --global --add safe.directory "${workspace}"
fi

echo "==> Ensuring Maven Wrapper is executable..."
chmod +x ./mvnw

echo "==> Warming Maven dependency cache..."
./mvnw -q -pl src/bjjeire-api dependency:go-offline

echo "==> Installing frontend dependencies..."
if [ -f src/bjjeire-app/package-lock.json ]; then
  (cd src/bjjeire-app && npm ci)
else
  (cd src/bjjeire-app && npm install)
fi

echo "==> Toolchain versions:"
java -version
./mvnw -version
node --version
claude --version
grok --version
rg --version

echo "==> Dev container setup complete."
echo "    Sign in once: claude    and    grok login"
echo "    Headless: ANTHROPIC_API_KEY and XAI_API_KEY from the host environment."
