#!/usr/bin/env bash
#
# claude-md-maintenance.sh
# Stop hook: Reminds Claude to update CLAUDE.md when significant files were modified.
#
# IMPORTANT: This hook is OPT-IN. Create .claude/development-productivity.local.md
# in your project root with 'enabled: true' in YAML frontmatter to activate.
#
# Receives JSON via stdin from Claude Code Stop events.
# Outputs JSON with systemMessage if significant changes detected.
#
# Exit codes:
#   0 - Success (no action needed, or reminder injected)
#   Non-zero - Non-blocking error (hook ignored by Claude Code)
#
# Configuration (.claude/development-productivity.local.md):
#   ---
#   enabled: true
#   ---
#
# Note: .claude/*.local.md files should be added to .gitignore.
#
# Logs: stderr (for debugging — Claude Code captures stderr for internal logging)

set -uo pipefail

# =============================================================================
# READ STDIN: Capture the Stop event JSON before doing anything else
# =============================================================================
INPUT=$(cat)

# =============================================================================
# EXTRACT CWD: Get project directory from stdin JSON
# =============================================================================
# Use grep/sed (no jq dependency) to extract "cwd" field
CWD=$(printf '%s' "$INPUT" | grep -o '"cwd"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"cwd"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/' | head -1)

# Fall back to CLAUDE_PROJECT_DIR if set, then to current directory
if [ -z "$CWD" ]; then
  CWD="${CLAUDE_PROJECT_DIR:-$(pwd)}"
fi

# =============================================================================
# OPT-IN CHECK: Exit immediately if not explicitly enabled via local config
# =============================================================================
CONFIG_FILE="${CWD}/.claude/development-productivity.local.md"

if [ ! -f "$CONFIG_FILE" ]; then
  # Hook disabled by default — config file not found
  exit 0
fi

# Parse YAML frontmatter: extract 'enabled' field between --- delimiters
ENABLED=$(sed -n '/^---$/,/^---$/{/^---$/d; p;}' "$CONFIG_FILE" | grep '^enabled:' | sed 's/^enabled:[[:space:]]*//' | tr -d '[:space:]')

if [ "$ENABLED" != "true" ]; then
  # Hook explicitly disabled or not configured
  exit 0
fi

# =============================================================================
# GIT AVAILABILITY CHECK: Exit silently if git is unavailable or not in a repo
# =============================================================================
if ! command -v git >/dev/null 2>&1; then
  echo "[claude-md-maintenance] git not available — skipping" >&2
  exit 0
fi

# Check we're inside a git repository
if ! git -C "$CWD" rev-parse --git-dir >/dev/null 2>&1; then
  echo "[claude-md-maintenance] Not a git repository: $CWD — skipping" >&2
  exit 0
fi

# =============================================================================
# DETECT CHANGED FILES: Check what changed in this session (staged + unstaged)
# =============================================================================
# Get unstaged and staged changes against HEAD (current session changes)
CHANGED_FILES=$(git -C "$CWD" diff HEAD --name-status 2>/dev/null || true)

# Also include staged-but-not-committed files
STAGED_FILES=$(git -C "$CWD" diff --cached --name-status 2>/dev/null || true)

# Include untracked files from git status
STATUS_FILES=$(git -C "$CWD" status --short 2>/dev/null || true)

# Combine for a complete picture of what changed in this session
ALL_CHANGED="${CHANGED_FILES}"$'\n'"${STAGED_FILES}"$'\n'"${STATUS_FILES}"

# If nothing changed at all, exit silently
if [ -z "$(printf '%s' "$ALL_CHANGED" | tr -d '[:space:]')" ]; then
  echo "[claude-md-maintenance] No changes detected — skipping" >&2
  exit 0
fi

# =============================================================================
# TRIVIALITY HEURISTICS: Skip if changes are documentation-only or too small
# =============================================================================

# Extract just the file paths from git output (strip status chars and spaces)
CHANGED_PATHS=$(printf '%s' "$ALL_CHANGED" | grep -v '^$' | sed 's/^[[:space:]]*\?\?[[:space:]]*//' | sed 's/^[[:space:]]*[A-Z?][[:space:]]*//' | sort -u)

# Check if ALL changed files are .md files (pure documentation change)
NON_MD_FILES=$(printf '%s' "$CHANGED_PATHS" | grep -v '\.md$' | grep -v '^$' || true)
if [ -z "$NON_MD_FILES" ]; then
  echo "[claude-md-maintenance] Only .md files changed — skipping" >&2
  exit 0
fi

# Check if ALL changed files are CLAUDE.md files (already doing maintenance)
NON_CLAUDE_MD_FILES=$(printf '%s' "$CHANGED_PATHS" | grep -v 'CLAUDE\.md$' | grep -v '^$' || true)
if [ -z "$NON_CLAUDE_MD_FILES" ]; then
  echo "[claude-md-maintenance] Only CLAUDE.md files changed — skipping" >&2
  exit 0
fi

# =============================================================================
# NON-TRIVIALITY SIGNALS: Check for meaningful structural changes
# =============================================================================
IS_NON_TRIVIAL=false

# Signal 1: New files added (git status 'A' or '?' untracked)
if printf '%s' "$ALL_CHANGED" | grep -qE '^[[:space:]]*([A?][[:space:]]|\?\?)'; then
  echo "[claude-md-maintenance] Signal: new/untracked files detected" >&2
  IS_NON_TRIVIAL=true
fi

# Signal 2: package.json or project.json modified (structural/dependency changes)
if printf '%s' "$CHANGED_PATHS" | grep -qE '(^|/)package\.json$|(^|/)project\.json$'; then
  echo "[claude-md-maintenance] Signal: package.json/project.json modified" >&2
  IS_NON_TRIVIAL=true
fi

# Signal 3: Significant line count changes (>50 lines)
if [ "$IS_NON_TRIVIAL" = "false" ]; then
  # Get shortstat for line count from working tree changes against HEAD
  SHORTSTAT=$(git -C "$CWD" diff HEAD --shortstat 2>/dev/null || true)
  if [ -n "$SHORTSTAT" ]; then
    # Extract insertions and deletions counts
    INSERTIONS=$(printf '%s' "$SHORTSTAT" | grep -o '[0-9]* insertion' | grep -o '[0-9]*' || echo "0")
    DELETIONS=$(printf '%s' "$SHORTSTAT" | grep -o '[0-9]* deletion' | grep -o '[0-9]*' || echo "0")
    INSERTIONS="${INSERTIONS:-0}"
    DELETIONS="${DELETIONS:-0}"
    TOTAL_LINES=$((INSERTIONS + DELETIONS))
    if [ "$TOTAL_LINES" -gt 50 ]; then
      echo "[claude-md-maintenance] Signal: $TOTAL_LINES lines changed (>50 threshold)" >&2
      IS_NON_TRIVIAL=true
    else
      echo "[claude-md-maintenance] Only $TOTAL_LINES lines changed (<= 50 threshold) — skipping" >&2
    fi
  fi
fi

# =============================================================================
# OUTPUT: Inject systemMessage reminder if changes are non-trivial
# =============================================================================
if [ "$IS_NON_TRIVIAL" = "true" ]; then
  echo "[claude-md-maintenance] Non-trivial changes detected — injecting reminder" >&2
  printf '{"continue": true, "suppressOutput": false, "systemMessage": "CLAUDE.md Maintenance Reminder: Significant file changes were detected in this session (new files, package.json/project.json modifications, or >50 lines changed). Consider running /update-claude-md to keep CLAUDE.md documentation in sync with the codebase changes. Skip this if changes are purely internal/non-structural."}'
fi

exit 0
