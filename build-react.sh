#!/usr/bin/env bash
set -euo pipefail

REACT_APP_DIR="src/bjjeire-app"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

print_header() {
    printf "\n${GREEN}=====================================${NC}\n"
    printf "${GREEN} %s${NC}\n" "$1"
    printf "${GREEN}=====================================${NC}\n\n"
}

print_step() {
    printf "${YELLOW}[%s] %s...${NC}\n" "$1" "$2"
}

print_success() {
    printf "\n${GREEN}=====================================${NC}\n"
    printf "${GREEN} %-37s${NC}\n" "$1"
    printf "${GREEN}=====================================${NC}\n\n"
}

print_error() {
    printf "\n${RED}=====================================${NC}\n"
    printf "${RED} %-37s${NC}\n" "$1"
    printf "${RED}=====================================${NC}\n\n"
}

if [[ ! -d "${REACT_APP_DIR}" ]]; then
    print_error "ERROR: Directory not found: ${REACT_APP_DIR}"
    exit 1
fi

print_header "Starting React Build Process"
printf "Directory: %s\n\n" "${REACT_APP_DIR}"

cd "${REACT_APP_DIR}"

print_step "1/5" "Installing npm dependencies"
npm install

print_step "2/5" "Checking format (Prettier)"
if ! npx prettier --check src/ 2>&1; then
    printf "\n${YELLOW}Auto-fixing format issues...${NC}\n"
    npx prettier --write src/
    printf "${YELLOW}Re-run the script after reviewing the auto-fixed files.${NC}\n"
    print_error "Format check failed — files were auto-fixed, please review and re-run."
    exit 1
fi
printf "${GREEN}Format OK${NC}\n\n"

print_step "3/5" "Running ESLint"
npm run lint
printf "${GREEN}Lint OK${NC}\n\n"

print_step "4/5" "Type checking (tsc --noEmit)"
npm run typecheck
printf "${GREEN}Type check OK${NC}\n\n"

print_step "5/5" "Running tests (vitest)"
npm test

print_success "Build & checks passed successfully!"
