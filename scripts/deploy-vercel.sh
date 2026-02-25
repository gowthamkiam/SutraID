#!/usr/bin/env bash
set -euo pipefail

# Helper script for deploying SutraID backend to Vercel.
# This script does NOT contain credentials. It assumes:
# - You have the Vercel CLI installed: npm i -g vercel
# - You are already authenticated: `vercel login`
# - You have a Vercel project created and linked to this repo.

echo ">>> Deploying SutraID backend to Vercel..."
echo "Make sure the following environment variables are configured in Vercel:"
echo "  - DATABASE_URL (pooled connection)"
echo "  - DIRECT_DATABASE_URL (for migrations)"
echo "  - JWT_SECRET"
echo "  - ENCRYPTION_KEY"
echo "  - RESEND_API_KEY"
echo "  - EMAIL_FROM"
echo "  - FRONTEND_URL"
echo "  - BACKEND_URL"
echo "  - MAGIC_LINK_BASE_URL"
echo

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "Step 1: Running database migrations..."
cd apps/backend

# Run migrations using production DATABASE_URL
# Make sure DATABASE_URL is set in your environment or use Vercel CLI to pull it
npx prisma migrate deploy

echo "Step 2: Deploying to Vercel..."
cd ../..

# Deploy to production
vercel --prod

echo ">>> Vercel deployment complete!"
echo "Remember to update NEXT_PUBLIC_API_URL in your frontend .env with the new Vercel URL."
