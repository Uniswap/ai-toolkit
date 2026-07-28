#!/usr/bin/env bash
# Script to update CLAUDE.md files based on changed files
# Used by lefthook pre-commit hook

set -euo pipefail

echo "📝 Checking if CLAUDE.md files need updates..."

# Store current staged files
STAGED_FILES=$(git diff --cached --name-only)

# Store current unstaged files
UNSTAGED_FILES=$(git diff --name-only)

if ! command -v claude &> /dev/null; then
  echo "⚠️  Claude CLI not found. Skipping CLAUDE.md updates."
  exit 0
fi

# Run Claude Code to update CLAUDE.md files
echo "🤖 Running /sync-claude-md..."
claude -p "/sync-claude-md"

# Check if any CLAUDE.md files were modified
CHANGED_CLAUDE_FILES=$(git diff --name-only | grep "CLAUDE.md$" || true)

if [ -n "$CHANGED_CLAUDE_FILES" ]; then
  echo "✅ CLAUDE.md files updated, adding to commit:"
  echo "$CHANGED_CLAUDE_FILES"

  # Stage all modified CLAUDE.md files
  git add $CHANGED_CLAUDE_FILES

  echo "✅ CLAUDE.md files staged for commit"
else
  echo "ℹ️  No CLAUDE.md files needed updates"
fi
