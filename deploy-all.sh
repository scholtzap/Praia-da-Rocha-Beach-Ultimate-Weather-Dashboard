#!/bin/bash
# Deploy to all location repositories
# Usage: ./deploy-all.sh "Your commit message"

set -e  # Exit on any error

COMMIT_MSG="${1:-Update configuration and rebuild sites}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Override with MAIN_DIR=/path/to/source if this script lives elsewhere
MAIN_DIR="${MAIN_DIR:-$SCRIPT_DIR}"

echo "🚀 Deploying to all locations..."
echo "📝 Commit message: $COMMIT_MSG"
echo ""

# Deploy to Clifton
echo "📍 Deploying to Clifton..."
cd /tmp/clifton-deploy
cp "$MAIN_DIR/config.yml" .
cp "$MAIN_DIR/script.js" .
cp "$MAIN_DIR/style.css" .
cp "$MAIN_DIR/README.md" .
cp "$MAIN_DIR/DEPLOYMENT.md" .
cp "$MAIN_DIR/MULTI-REPO-WORKFLOW.md" .
cp "$MAIN_DIR/deploy-all.sh" .
cp "$MAIN_DIR/deploy-all.ps1" .
cp -r "$MAIN_DIR/scripts" .
LOCATION=clifton node scripts/build-html.js
git add config.yml script.js style.css README.md DEPLOYMENT.md MULTI-REPO-WORKFLOW.md deploy-all.sh deploy-all.ps1 scripts/ index.html
git commit -m "$COMMIT_MSG" || echo "No changes to commit for Clifton"
git push
echo "✅ Clifton deployed!"
echo ""

# Deploy to Praia
echo "📍 Deploying to Praia..."
cd /tmp/praia-deploy
cp "$MAIN_DIR/config.yml" .
cp "$MAIN_DIR/script.js" .
cp "$MAIN_DIR/style.css" .
cp "$MAIN_DIR/README.md" .
cp "$MAIN_DIR/DEPLOYMENT.md" .
cp "$MAIN_DIR/MULTI-REPO-WORKFLOW.md" .
cp "$MAIN_DIR/deploy-all.sh" .
cp "$MAIN_DIR/deploy-all.ps1" .
cp -r "$MAIN_DIR/scripts" .
LOCATION=praia node scripts/build-html.js
git add config.yml script.js style.css README.md DEPLOYMENT.md MULTI-REPO-WORKFLOW.md deploy-all.sh deploy-all.ps1 scripts/ index.html
git commit -m "$COMMIT_MSG" || echo "No changes to commit for Praia"
git push
echo "✅ Praia deployed!"
echo ""

echo "🎉 All deployments complete!"
