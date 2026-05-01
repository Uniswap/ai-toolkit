#!/bin/bash

echo "📝 Linting staged markdown files..."

# Get all staged markdown files
STAGED_MD_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep '\.md$' || true)

if [ -z "$STAGED_MD_FILES" ]; then
  echo "ℹ️  No markdown files to lint"
  exit 0
fi

# Lint and fix markdown files (uses .markdownlint-cli2.jsonc config)
echo "$STAGED_MD_FILES" | xargs npm exec markdownlint-cli2 -- --fix
MD_EXIT_CODE=$?

# Re-stage any auto-fixed files
echo "$STAGED_MD_FILES" | xargs git add

if [ $MD_EXIT_CODE -ne 0 ]; then
  echo "❌ Markdown linting failed - please review and fix the errors"
  exit $MD_EXIT_CODE
fi

echo "✅ Markdown linting completed"
