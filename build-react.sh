#!/bin/bash

REACT_APP_DIR="src/bjjeire-app"

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE} Starting React App Build Process    ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

if [ ! -d "$REACT_APP_DIR" ]; then
    echo -e "${RED}[ERROR] React app directory not found at: $REACT_APP_DIR${NC}"
    exit 1
fi

echo "Changing directory to ${BLUE}$REACT_APP_DIR${NC}"
cd "$REACT_APP_DIR" || exit

echo
echo -e "${GREEN}[1/2] Installing npm dependencies...${NC}"
echo "This might take a moment."
npm install

if [ $? -ne 0 ]; then
    echo
    echo -e "${RED}[ERROR] 'npm install' failed. Please check for errors above.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}"


echo
echo -e "${GREEN}[2/2] Building the React application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN} React Build Completed Successfully! ${NC}"
    echo -e "${GREEN}=====================================${NC}"
else
    echo
    echo -e "${RED}=====================================${NC}"
    echo -e "${RED}      React Build FAILED!          ${NC}"
    echo -e "${RED}=====================================${NC}"
    exit 1
fi

cd - > /dev/null
exit 0
