#!/usr/bin/env bash
#
# Update .env with current Logto M2M credentials from database
#
# Usage: ./scripts/update-logto-credentials.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Update Logto M2M Credentials in .env              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${RED}ERROR: .env file not found${NC}"
  echo "Please create a .env file first (you can copy from .env.example)"
  exit 1
fi

echo -e "${YELLOW}Fetching current Logto M2M credentials from database...${NC}"

# Query the database for M2M application credentials
M2M_DATA=$(docker exec postgres psql -U postgres -d logto_db -P pager=off -t -A -c "
SELECT id, secret 
FROM applications 
WHERE type = 'MachineToMachine' 
AND name = 'm2m-for-sonix-apis'
LIMIT 1;
" 2>/dev/null)

if [ -z "$M2M_DATA" ]; then
  echo -e "${RED}ERROR: M2M application 'm2m-for-sonix-apis' not found in database${NC}"
  echo ""
  echo "This could mean:"
  echo "  1. Logto database is not initialized yet"
  echo "  2. Docker containers are not running (run: npm run docker:up)"
  echo "  3. The M2M application was deleted or renamed"
  echo ""
  echo "To create the M2M application:"
  echo "  1. Visit http://localhost:3001/console"
  echo "  2. Go to Applications → Create Application"
  echo "  3. Choose 'Machine-to-Machine' type"
  echo "  4. Name it 'm2m-for-sonix-apis'"
  echo "  5. Run this script again"
  exit 1
fi

# Parse the data (format: id|secret)
M2M_APP_ID=$(echo "$M2M_DATA" | cut -d'|' -f1 | tr -d ' ')
M2M_APP_SECRET=$(echo "$M2M_DATA" | cut -d'|' -f2 | tr -d ' ')

if [ -z "$M2M_APP_ID" ] || [ -z "$M2M_APP_SECRET" ]; then
  echo -e "${RED}ERROR: Failed to parse M2M credentials from database${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Found M2M application in database${NC}"
echo "  App ID: ${M2M_APP_ID:0:15}..."
echo "  Secret: ${M2M_APP_SECRET:0:20}..."
echo ""

# Backup existing .env
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
cp .env "$BACKUP_FILE"
echo -e "${YELLOW}Backed up .env to ${BACKUP_FILE}${NC}"

# Update or add the credentials
if grep -q "^LOGTO_M2M_APP_ID=" .env; then
  # Update existing credentials
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^LOGTO_M2M_APP_ID=.*|LOGTO_M2M_APP_ID=${M2M_APP_ID}|" .env
    sed -i '' "s|^LOGTO_M2M_APP_SECRET=.*|LOGTO_M2M_APP_SECRET=\"${M2M_APP_SECRET}\"|" .env
  else
    sed -i "s|^LOGTO_M2M_APP_ID=.*|LOGTO_M2M_APP_ID=${M2M_APP_ID}|" .env
    sed -i "s|^LOGTO_M2M_APP_SECRET=.*|LOGTO_M2M_APP_SECRET=\"${M2M_APP_SECRET}\"|" .env
  fi
  echo -e "${GREEN}✓ Updated credentials in .env${NC}"
else
  # Add new credentials (shouldn't happen, but handle it)
  echo "" >> .env
  echo "# Logto M2M Application Credentials for sonix-apis to Logto M2M app" >> .env
  echo "LOGTO_M2M_APP_ID=${M2M_APP_ID}" >> .env
  echo "LOGTO_M2M_APP_SECRET=\"${M2M_APP_SECRET}\"" >> .env
  echo -e "${GREEN}✓ Added credentials to .env${NC}"
fi

echo ""
echo -e "${GREEN}✓ Success! Your .env file now has the current M2M credentials.${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  • Restart your API server: npm run dev:apis"
echo "  • Run seed script: npm run logto:seed"
echo "  • Start all services: npm run dev:all"
echo ""
