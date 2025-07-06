#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN} Starting .NET Build Process         ${NC}"
echo -e "${GREEN}=====================================${NC}"
echo

SOLUTION_FILE=$(find . -maxdepth 1 -name "*.sln" | head -n 1)

if [ -z "$SOLUTION_FILE" ]; then
    echo -e "${RED}[ERROR] No .sln file found in the current directory.${NC}"
    exit 1
fi

echo "Found solution file: $SOLUTION_FILE"
echo

echo "[1/3] Cleaning solution..."
dotnet clean "$SOLUTION_FILE" && \
echo
echo "[2/3] Restoring NuGet packages..." && \
dotnet restore "$SOLUTION_FILE" && \
echo
echo "[3/3] Building solution..." && \
dotnet build "$SOLUTION_FILE" --no-restore

if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN} Build Process Completed Successfully! ${NC}"
    echo -e "${GREEN}=====================================${NC}"
else
    echo
    echo -e "${RED}=====================================${NC}"
    echo -e "${RED}      Build Process FAILED!          ${NC}"
    echo -e "${RED}=====================================${NC}"
    exit 1
fi

exit 0
