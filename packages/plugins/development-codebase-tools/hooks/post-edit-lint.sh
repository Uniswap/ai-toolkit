#!/bin/bash
set -euo pipefail
# PostToolUse hook: Format, lint, and typecheck files after Write/Edit operations
# Runs prettier, eslint on the specific file, and typecheck on the affected Nx project
#
# IMPORTANT: This hook is OPT-IN. Set CLAUDE_POST_EDIT_LINT=1 in your environment to enable.
#
# This hook receives JSON data via stdin from Claude Code PostToolUse events.
# The JSON contains tool_input with the file path and tool_response with success status.
#
# Logs are written to ~/.claude/logs/post-edit-lint.log for debugging.

# =============================================================================
# OPT-IN CHECK: Exit immediately if not explicitly enabled
# =============================================================================
if [ "${CLAUDE_POST_EDIT_LINT:-}" != "1" ]; then
  exit 0
fi

# Set up logging
LOG_DIR="${HOME}/.claude/logs"
LOG_FILE="${LOG_DIR}/post-edit-lint.log"
mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# =============================================================================
# PRETTIER CONFIG DETECTION: Only run Prettier if the project uses it
# =============================================================================
# Walks up from the file's directory looking for Prettier configuration.
# Returns 0 (true) if config found, 1 (false) otherwise.
find_prettier_config() {
  local dir="$1"

  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    # Check for Prettier config files
    if [ -f "$dir/.prettierrc" ] || \
       [ -f "$dir/.prettierrc.json" ] || \
       [ -f "$dir/.prettierrc.yml" ] || \
       [ -f "$dir/.prettierrc.yaml" ] || \
       [ -f "$dir/.prettierrc.js" ] || \
       [ -f "$dir/.prettierrc.cjs" ] || \
       [ -f "$dir/.prettierrc.mjs" ] || \
       [ -f "$dir/prettier.config.js" ] || \
       [ -f "$dir/prettier.config.cjs" ] || \
       [ -f "$dir/prettier.config.mjs" ]; then
      return 0
    fi

    # Check for prettier key in package.json
    if [ -f "$dir/package.json" ]; then
      if grep -q '"prettier"' "$dir/package.json" 2>/dev/null; then
        return 0
      fi
    fi

    dir="$(dirname "$dir")"
  done

  return 1
}

# =============================================================================
# ESLINT CONFIG DETECTION: Only run ESLint if the project uses it
# =============================================================================
find_eslint_config() {
  local dir="$1"

  while [ "$dir" != "/" ] && [ -n "$dir" ]; do
    # Check for ESLint config files
    if [ -f "$dir/.eslintrc" ] || \
       [ -f "$dir/.eslintrc.json" ] || \
       [ -f "$dir/.eslintrc.yml" ] || \
       [ -f "$dir/.eslintrc.yaml" ] || \
       [ -f "$dir/.eslintrc.js" ] || \
       [ -f "$dir/.eslintrc.cjs" ] || \
       [ -f "$dir/eslint.config.js" ] || \
       [ -f "$dir/eslint.config.cjs" ] || \
       [ -f "$dir/eslint.config.mjs" ]; then
      return 0
    fi

    # Check for eslintConfig key in package.json
    if [ -f "$dir/package.json" ]; then
      if grep -q '"eslintConfig"' "$dir/package.json" 2>/dev/null; then
        return 0
      fi
    fi

    dir="$(dirname "$dir")"
  done

  return 1
}

# =============================================================================
# MAIN LOGIC
# =============================================================================

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

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Get the directory containing the file (for config detection)
FILE_DIR="$(dirname "$FILE_PATH")"

# Get workspace root (where this hook lives) - needed for Nx commands
WORKSPACE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Change to the file's directory for correct config resolution
cd "$FILE_DIR" || exit 0

# Get relative path from workspace root (for Nx)
RELATIVE_PATH="${FILE_PATH#$WORKSPACE_ROOT/}"

log "Processing: $FILE_PATH"

# Run prettier only if the project has Prettier configured
if find_prettier_config "$FILE_DIR"; then
  if ! npx prettier --write "$FILE_PATH" 2>> "$LOG_FILE"; then
    log "Warning: prettier failed for $FILE_PATH"
  else
    log "Prettier: formatted $FILE_PATH"
  fi
else
  log "Skipping Prettier: no config found for $FILE_PATH"
fi

# Run eslint only if the project has ESLint configured
if find_eslint_config "$FILE_DIR"; then
  if ! npx eslint "$FILE_PATH" --fix --quiet 2>> "$LOG_FILE"; then
    log "Warning: eslint failed for $FILE_PATH"
  else
    log "ESLint: checked $FILE_PATH"
  fi
else
  log "Skipping ESLint: no config found for $FILE_PATH"
fi

# Find the Nx project affected by this file and run typecheck
# Only for TypeScript files (not plain JS) and only if in an Nx workspace
if echo "$FILE_PATH" | grep -qE '\.tsx?$'; then
  # Change to workspace root for Nx commands
  cd "$WORKSPACE_ROOT" 2>/dev/null || exit 0

  # Check if this is an Nx workspace
  if [ -f "$WORKSPACE_ROOT/nx.json" ]; then
    # Get the affected project(s) for this specific file
    # Use || true to prevent pipefail from exiting on nx errors
    AFFECTED_PROJECT=$(npx nx show projects --affected --files="$RELATIVE_PATH" 2>> "$LOG_FILE" | head -1 || true)

    if [ -n "$AFFECTED_PROJECT" ]; then
      # Check if the project has a typecheck target
      PROJECT_JSON=$(npx nx show project "$AFFECTED_PROJECT" --json 2>> "$LOG_FILE" || true)
      if echo "$PROJECT_JSON" | grep -q '"typecheck"'; then
        if ! npx nx run "$AFFECTED_PROJECT":typecheck 2>> "$LOG_FILE"; then
          log "Warning: typecheck failed for project $AFFECTED_PROJECT"
        else
          log "Typecheck: passed for $AFFECTED_PROJECT"
        fi
      fi
    fi
  fi
fi
