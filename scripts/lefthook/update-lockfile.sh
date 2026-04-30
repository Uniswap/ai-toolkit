#!/bin/bash
# Update bun.lock to ensure it's always in sync
#
# This script ensures bun.lock stays in sync with package.json and
# node_modules. It runs on every commit to catch any drift.
# If bun.lock is out of date, it will:
# 1. Run bun install to update bun.lock
# 2. Stage the updated bun.lock
#
# Exit Codes:
#   0 - Success (bun.lock is up to date or was updated)
#   1 - Failure (bun install failed)

set -e

echo "Checking if bun.lock needs updating..."

# Save the current hash of bun.lock
LOCKFILE_BEFORE=""
if [ -f "bun.lock" ]; then
  LOCKFILE_BEFORE=$(sha256sum bun.lock 2>/dev/null || shasum -a 256 bun.lock)
fi

# Run bun install to ensure bun.lock is up to date
echo "→ Running bun install to verify bun.lock..."
bun install

# Check if bun.lock changed
LOCKFILE_AFTER=""
if [ -f "bun.lock" ]; then
  LOCKFILE_AFTER=$(sha256sum bun.lock 2>/dev/null || shasum -a 256 bun.lock)
fi

if [ "$LOCKFILE_BEFORE" != "$LOCKFILE_AFTER" ]; then
  echo "✓ bun.lock was updated — preview of changes:"
  git --no-pager diff --stat bun.lock || true
  echo "→ Staging updated bun.lock"
  git add bun.lock
  echo "✓ bun.lock staged for commit"
else
  echo "✓ bun.lock is already up to date"
fi

exit 0
