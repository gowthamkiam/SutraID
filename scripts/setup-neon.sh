#!/usr/bin/env bash
set -euo pipefail

# Helper script for provisioning a Neon PostgreSQL database.
# This script does NOT contain credentials. It only prints guidance.
# For full Neon CLI/API usage, see: https://neon.tech/docs

echo ">>> Neon Database Setup (manual steps)"
echo
echo "1. Sign up or log in to Neon: https://neon.tech"
echo "2. Create a new project and database for SutraID."
echo "3. Copy the connection string (include sslmode=require)."
echo "4. Set DATABASE_URL and DIRECT_DATABASE_URL using that connection string."
echo
echo "Example .env entries:"
echo '  DATABASE_URL="postgresql://user:password@your-neon-host.neon.tech/sutraid?sslmode=require"'
echo '  DIRECT_DATABASE_URL="postgresql://user:password@your-neon-host.neon.tech/sutraid?sslmode=require"'
echo
echo "5. Run migrations against Neon from your local machine or CI:"
echo "   cd apps/backend"
echo "   pnpm prisma:migrate:prod"
echo
echo ">>> No changes have been made automatically; follow the steps above."

