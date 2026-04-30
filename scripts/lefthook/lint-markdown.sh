#!/bin/bash
set -uo pipefail

echo "📝 Linting staged markdown files..."

# Get all staged markdown files
STAGED_MD_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep '\.md$' || true)

if [ -z "$STAGED_MD_FILES" ]; then
  echo "ℹ️  No markdown files to lint"
  exit 0
fi

# Lint and fix markdown files (uses .markdownlint-cli2.jsonc config).
# Capture the exit code so we still re-stage auto-fixed content even when
# unfixable errors remain — but bail before re-staging if anything else
# in the pipeline goes sideways.
echo "$STAGED_MD_FILES" | xargs bunx markdownlint-cli2 --fix
MD_EXIT_CODE=$?

# Re-stage any auto-fixed files
echo "$STAGED_MD_FILES" | xargs git add

if [ $MD_EXIT_CODE -ne 0 ]; then
  echo "❌ Markdown linting failed - please review and fix the errors"
  exit $MD_EXIT_CODE
fi

echo "✅ Markdown linting completed"
