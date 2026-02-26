#!/bin/bash
set -e

echo "🔍 Generating SBOM for SutraID..."

# Install cyclonedx-npm if not present
if ! command -v cyclonedx-npm &> /dev/null; then
    echo "Installing @cyclonedx/cyclonedx-npm..."
    npm install -g @cyclonedx/cyclonedx-npm
fi

# Generate SBOM for root
echo "📦 Generating root SBOM..."
cyclonedx-npm --output-format JSON --output-file sbom.json

# Generate backend SBOM
echo "📦 Generating backend SBOM..."
cd apps/backend
cyclonedx-npm --output-format JSON --output-file sbom-backend.json
cd ../..

# Generate frontend SBOM
echo "📦 Generating frontend SBOM..."
cd apps/web
cyclonedx-npm --output-format JSON --output-file sbom-web.json
cd ../..

echo "✅ SBOM generation complete:"
echo "   - sbom.json (root)"
echo "   - apps/backend/sbom-backend.json"
echo "   - apps/web/sbom-web.json"
