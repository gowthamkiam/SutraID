#!/usr/bin/env bash
set -euo pipefail

# Helper script for deploying SutraID backend to Railway.
# This script does NOT contain credentials. It assumes:
# - You have the Railway CLI installed: https://railway.app
# - You are already authenticated: `railway login`
# - You have a Railway project created and linked to this repo.

echo ">>> Deploying SutraID backend to Railway..."
echo "Make sure the following environment variables are configured in Railway:"
echo "  - DATABASE_URL"
echo "  - JWT_SECRET"
echo "  - ENCRYPTION_KEY"
echo "  - RESEND_API_KEY (optional)"
echo "  - FRONTEND_URL"
echo "  - MAGIC_LINK_BASE_URL"
echo

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "Running Railway up for backend (apps/backend)..."
echo "You may customize the Railway settings using apps/backend/railway.json and nixpacks.toml."

railway up --service backend

echo ">>> Railway deployment triggered. Check Railway dashboard for status."

