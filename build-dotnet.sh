#!/usr/bin/env bash
set -euo pipefail

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

solution_file=$(find . -maxdepth 1 -name "*.sln" | head -n 1)

if [[ -z "${solution_file}" ]]; then
    print_error "ERROR: No .sln file found."
    exit 1
fi

print_header "Starting .NET Build Process"
printf "Solution: %s\n\n" "${solution_file}"

print_step "1/5" "Checking format (whitespace + style)"
if ! dotnet format "${solution_file}" --verify-no-changes --severity warn 2>&1; then
    printf "\n${YELLOW}Auto-fixing format issues...${NC}\n"
    dotnet format whitespace "${solution_file}"
    printf "${YELLOW}Re-run the script after reviewing the auto-fixed files.${NC}\n"
    print_error "Format check failed — files were auto-fixed, please review and re-run."
    exit 1
fi
printf "${GREEN}Format OK${NC}\n\n"

print_step "2/5" "Cleaning solution"
dotnet clean "${solution_file}" --nologo -v quiet

print_step "3/5" "Restoring NuGet packages"
dotnet restore "${solution_file}" --nologo

print_step "4/5" "Building solution (Release)"
dotnet build "${solution_file}" --no-restore -c Release --nologo

print_step "5/5" "Running unit tests"
dotnet test "${solution_file}" \
    --no-build \
    -c Release \
    --filter "Category!=Integration&Category!=Functional&Category!=Acceptance&Category!=Smoke" \
    --logger "console;verbosity=minimal" \
    --nologo

print_success "Build & checks passed successfully!"
