#!/bin/bash
set -euo pipefail
# PostToolUse hook: Format, lint, and typecheck files after Write/Edit operations
# Runs prettier, eslint on the specific file, and typecheck on the affected Nx project
#
# This hook receives JSON data via stdin from Claude Code PostToolUse events.
# The JSON contains tool_input with the file path and tool_response with success status.
#
# Logs are written to ~/.claude/logs/post-edit-lint.log for debugging.

# Set up logging
LOG_DIR="${HOME}/.claude/logs"
LOG_FILE="${LOG_DIR}/post-edit-lint.log"
mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Read JSON input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# Check if the tool operation succeeded before processing
TOOL_SUCCESS=$(echo "$INPUT" | jq -r '.tool_response.success // true')
if [ "$TOOL_SUCCESS" != "true" ]; then
  log "Skipping: tool operation failed for $FILE_PATH"
  exit 0
fi

# Exit if no file path provided
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only process TypeScript/JavaScript files
if ! echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  exit 0
fi

# Skip node_modules, dist, .next, etc.
if echo "$FILE_PATH" | grep -qE '(node_modules|dist|\.next|\.expo|coverage|__generated__)'; then
  exit 0
fi

# Get workspace root (where this hook lives)
WORKSPACE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Change to workspace root for nx/prettier to work correctly
cd "$WORKSPACE_ROOT" || exit 0

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Get relative path from workspace root
RELATIVE_PATH="${FILE_PATH#$WORKSPACE_ROOT/}"

# Run prettier on the file (fast, file-based)
if ! npx prettier --write "$FILE_PATH" 2>> "$LOG_FILE"; then
  log "Warning: prettier failed for $FILE_PATH"
fi

# Run eslint on the file (file-based, quick feedback)
if ! npx eslint "$FILE_PATH" --fix --quiet 2>> "$LOG_FILE"; then
  log "Warning: eslint failed for $FILE_PATH"
fi

# Find the Nx project affected by this file and run typecheck
# Only for TypeScript files (not plain JS)
if echo "$FILE_PATH" | grep -qE '\.tsx?$'; then
  # Get the affected project(s) for this specific file
  # Use || true to prevent pipefail from exiting on nx errors
  AFFECTED_PROJECT=$(npx nx show projects --affected --files="$RELATIVE_PATH" 2>> "$LOG_FILE" | head -1 || true)

  if [ -n "$AFFECTED_PROJECT" ]; then
    # Check if the project has a typecheck target
    PROJECT_JSON=$(npx nx show project "$AFFECTED_PROJECT" --json 2>> "$LOG_FILE" || true)
    if echo "$PROJECT_JSON" | grep -q '"typecheck"'; then
      if ! npx nx run "$AFFECTED_PROJECT":typecheck 2>> "$LOG_FILE"; then
        log "Warning: typecheck failed for project $AFFECTED_PROJECT"
      fi
    fi
  fi
fi
