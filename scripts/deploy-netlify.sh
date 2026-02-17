#!/usr/bin/env bash
set -euo pipefail

# Helper script for building SutraID frontend for Netlify.
# This script does NOT contain credentials. It assumes:
# - You have the Netlify CLI installed: https://docs.netlify.com/cli/get-started/
# - You are already authenticated: `netlify login`
# - You have created or linked a Netlify site.

echo ">>> Building SutraID web app for Netlify..."

cd "$(dirname "${BASH_SOURCE[0]}")/.."
cd apps/web

echo "Ensure NEXT_PUBLIC_API_URL is set in your Netlify environment."
echo "For example: https://your-railway-backend.example.com/api/v1"
echo

pnpm install
pnpm build

echo "You can now use the Netlify CLI or UI to deploy the .next output."
echo "For example:"
echo "  netlify deploy --prod --dir=.next"

