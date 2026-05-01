#!/bin/bash
# Update package-lock.json to ensure it's always in sync
#
# This script ensures package-lock.json stays in sync with package.json and
# node_modules. It runs on every commit to catch any drift.
# If package-lock.json is out of date, it will:
# 1. Run npm install to update package-lock.json
# 2. Stage the updated package-lock.json
#
# Exit Codes:
#   0 - Success (package-lock.json is up to date or was updated)
#   1 - Failure (npm install failed)

set -e

echo "Checking if package-lock.json needs updating..."

# Save the current hash of package-lock.json
LOCKFILE_BEFORE=""
if [ -f "package-lock.json" ]; then
  LOCKFILE_BEFORE=$(sha256sum package-lock.json 2>/dev/null || shasum -a 256 package-lock.json)
fi

# Run npm install to ensure package-lock.json is up to date
echo "→ Running npm install to verify package-lock.json..."
npm install --package-lock-only --ignore-scripts

# Check if package-lock.json changed
LOCKFILE_AFTER=""
if [ -f "package-lock.json" ]; then
  LOCKFILE_AFTER=$(sha256sum package-lock.json 2>/dev/null || shasum -a 256 package-lock.json)
fi

if [ "$LOCKFILE_BEFORE" != "$LOCKFILE_AFTER" ]; then
  echo "✓ package-lock.json was updated"
  echo "→ Staging updated package-lock.json"
  git add package-lock.json
  echo "✓ package-lock.json staged for commit"
else
  echo "✓ package-lock.json is already up to date"
fi

exit 0
