#!/bin/bash
# Vercel Ignore Build Check for Nx Monorepo
#
# This script determines if a Vercel deployment should proceed based on whether
# the specified Nx project is affected by the changes in the current commit.
#
# Exit Codes:
#   0 - Skip build (project not affected)
#   1 - Proceed with build (project is affected or first deployment)
#
# Usage:
#   vercel-ignore-build-check.sh <project-name>
#
# Environment Variables (provided by Vercel):
#   VERCEL_GIT_PREVIOUS_SHA - The previous deployment's commit SHA
#   VERCEL_GIT_COMMIT_SHA   - The current commit SHA

set -e

PROJECT_NAME="${1}"

if [ -z "$PROJECT_NAME" ]; then
  echo "Error: Project name is required"
  echo "Usage: $0 <project-name>"
  exit 1
fi

# Navigate to monorepo root
cd "$(git rev-parse --show-toplevel)"

# If no previous SHA exists (first deployment), always build
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  echo "No previous deployment SHA found (first deployment)"
  echo "→ Proceeding with build"
  exit 1
fi

echo "Checking if '$PROJECT_NAME' is affected by changes..."
echo "Base commit: $VERCEL_GIT_PREVIOUS_SHA"
echo "Head commit: $VERCEL_GIT_COMMIT_SHA"
echo ""

# Get list of affected projects
AFFECTED_PROJECTS=$(npx nx show projects --affected \
  --base="$VERCEL_GIT_PREVIOUS_SHA" \
  --head="$VERCEL_GIT_COMMIT_SHA")

echo "Affected projects:"
echo "$AFFECTED_PROJECTS"
echo ""

# Check if our project is in the affected list
if echo "$AFFECTED_PROJECTS" | grep -q "^${PROJECT_NAME}$"; then
  echo "✓ '$PROJECT_NAME' is affected"
  echo "→ Proceeding with build"
  exit 1
else
  echo "✗ '$PROJECT_NAME' is not affected"
  echo "→ Skipping build"
  exit 0
fi
